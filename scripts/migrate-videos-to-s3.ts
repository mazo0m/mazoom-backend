import { PrismaClient, MediaType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !bucketName) {
  console.error('❌ Missing AWS credentials in .env');
  process.exit(1);
}

const s3Client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

async function verifyS3Url(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (err) {
    console.error(`  ❌ S3 HeadObject failed for key ${key}:`, err);
    return false;
  }
}

async function runVideoMigration() {
  console.log('====================================================');
  console.log('🎬 MIGRATING TEMPLATE BACKGROUND VIDEOS TO AWS S3');
  console.log('====================================================\n');

  const videosDir = path.resolve(process.cwd(), '../mazoom-frontend/public/videos1');

  if (!fs.existsSync(videosDir)) {
    console.error(`❌ Videos directory not found at: ${videosDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.mp4') || f.endsWith('.webm'));
  console.log(`Found ${files.length} video files in ${videosDir}\n`);

  const urlMap: Record<string, string> = {};

  for (const filename of files) {
    const filePath = path.join(videosDir, filename);
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename);
    const sanitizedName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const s3Key = `templates/videos/${sanitizedName}_${randomUUID().slice(0, 8)}${ext}`;

    console.log(`⬆️ Uploading video [${filename}] (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) -> S3: ${s3Key}...`);

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: filename.endsWith('.webm') ? 'video/webm' : 'video/mp4',
    }));

    const s3Url = getPublicUrl(s3Key);
    const verified = await verifyS3Url(s3Key);

    if (verified) {
      console.log(`  ✅ Verified accessibility on S3: ${s3Url}\n`);
      urlMap[filename] = s3Url;

      // Register in Media DB table
      await prisma.media.upsert({
        where: { key: s3Key },
        update: { url: s3Url, mimeType: 'video/mp4', size: buffer.length },
        create: {
          url: s3Url,
          key: s3Key,
          type: MediaType.VIDEO,
          mimeType: filename.endsWith('.webm') ? 'video/webm' : 'video/mp4',
          size: buffer.length,
        },
      });
    } else {
      console.error(`  ❌ Failed verification for video: ${filename}\n`);
    }
  }

  console.log('====================================================');
  console.log('📊 VIDEO MIGRATION MAP');
  console.log('====================================================');
  console.log(JSON.stringify(urlMap, null, 2));

  await prisma.$disconnect();
}

runVideoMigration().catch(err => {
  console.error('Fatal video migration error:', err);
  prisma.$disconnect();
  process.exit(1);
});
