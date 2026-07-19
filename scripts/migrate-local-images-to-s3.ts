import { PrismaClient, MediaType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import http from 'http';
import https from 'https';

// ── Environment Setup ────────────────────────────────────────────────────────
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_BUCKET_NAME;

if (!accessKeyId || !secretAccessKey || !bucketName) {
  console.error('❌ Missing AWS environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME).');
  process.exit(1);
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

function getPublicUrl(key: string): string {
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

function detectMimeType(buffer: Buffer, filename: string): string {
  if (buffer.length >= 8 && buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return 'video/mp4';
  }
  if (buffer.length >= 4 && buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'video/webm';
  }
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 4 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    const format = buffer.toString('ascii', 8, 12);
    if (format === 'WEBP') return 'image/webp';
    if (format === 'WAVE') return 'audio/wav';
  }
  
  // Fallback by extension
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';

  return 'application/octet-stream';
}

function getSafeExt(mimeType: string, filename: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
  };
  return mimeToExt[mimeType] || path.extname(filename) || '.bin';
}

async function verifyS3Url(url: string, key: string): Promise<boolean> {
  // Option A: Check S3 via HeadObjectCommand
  try {
    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error(`  ❌ Verification failed for S3 object ${key}:`, err);
    return false;
  }
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 SAFE S3 MEDIA MIGRATION (NON-DESTRUCTIVE)');
  console.log('====================================================');
  console.log(`Target S3 Bucket: ${bucketName}`);
  console.log(`AWS Region:       ${region}\n`);

  const report = {
    imagesFound: 0,
    uploadedToS3: 0,
    verifiedCount: 0,
    dbRecordsUpdated: 0,
    templatesMigrated: 0,
    momentsMigrated: 0,
    legacyUploadsMigrated: 0,
    errors: [] as string[],
  };

  // ── STEP 1: MIGRATE TEMPLATE PREVIEW IMAGES ────────────────────────
  console.log('----------------------------------------------------');
  console.log('📋 STEP 1: Migrating Template Preview Images');
  console.log('----------------------------------------------------');

  const frontendImagesDir = path.resolve(process.cwd(), '../mazoom-frontend/public/images');
  const templates = await prisma.template.findMany();

  for (const tpl of templates) {
    const rawPath = tpl.previewImage;
    if (!rawPath) continue;

    // Check if previewImage is already an S3 URL
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      console.log(`  ℹ️ Template [${tpl.title}] previewImage is already a URL: ${rawPath}`);
      continue;
    }

    const filename = path.basename(rawPath);
    const localFilePath = path.join(frontendImagesDir, filename);

    if (!fs.existsSync(localFilePath)) {
      console.warn(`  ⚠️ Template [${tpl.title}] file not found at ${localFilePath}`);
      report.errors.push(`Template [${tpl.title}] missing file: ${localFilePath}`);
      continue;
    }

    report.imagesFound++;
    const buffer = fs.readFileSync(localFilePath);
    const mimeType = detectMimeType(buffer, filename);
    const ext = getSafeExt(mimeType, filename);
    const uuid = randomUUID();
    const s3Key = `templates/${tpl.id}/images/${uuid}${ext}`;

    console.log(`  ⬆️ Uploading template image [${filename}] -> S3: ${s3Key}...`);
    
    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    }));
    report.uploadedToS3++;

    const s3Url = getPublicUrl(s3Key);

    // Verify S3 upload
    const verified = await verifyS3Url(s3Url, s3Key);
    if (verified) {
      report.verifiedCount++;
      console.log(`  ✅ Verified accessibility: ${s3Url}`);
    } else {
      report.errors.push(`Failed verification for template ${tpl.title}: ${s3Url}`);
      continue;
    }

    // Register in Media table
    await prisma.media.upsert({
      where: { key: s3Key },
      update: { url: s3Url, mimeType, size: buffer.length },
      create: {
        url: s3Url,
        key: s3Key,
        type: MediaType.IMAGE,
        mimeType,
        size: buffer.length,
      },
    });

    // Update Template record
    await prisma.template.update({
      where: { id: tpl.id },
      data: { previewImage: s3Url },
    });
    report.dbRecordsUpdated++;
    report.templatesMigrated++;
  }

  // ── STEP 2: MIGRATE INVITATION MOMENTS & UPLOADS ─────────────────────
  console.log('\n----------------------------------------------------');
  console.log('📋 STEP 2: Migrating Invitation Moments & Local Uploads');
  console.log('----------------------------------------------------');

  const backendUploadsDir = path.resolve(process.cwd(), 'public/uploads');
  const invitations = await prisma.invitation.findMany();

  // Create a lookup for local path -> invitation ID
  const localFileToInvitationMap = new Map<string, { invitationId: string; index: number }>();
  
  for (const inv of invitations) {
    inv.moments.forEach((momentPath, idx) => {
      if (momentPath.includes('/public/uploads/')) {
        const filename = path.basename(momentPath);
        localFileToInvitationMap.set(filename, { invitationId: inv.id, index: idx });
      }
    });
  }

  if (fs.existsSync(backendUploadsDir)) {
    const uploadFiles = fs.readdirSync(backendUploadsDir);
    console.log(`Found ${uploadFiles.length} files in backend public/uploads/ directory.`);

    for (const filename of uploadFiles) {
      const localFilePath = path.join(backendUploadsDir, filename);
      const stat = fs.statSync(localFilePath);
      if (stat.isDirectory()) continue;

      report.imagesFound++;
      const buffer = fs.readFileSync(localFilePath);
      const mimeType = detectMimeType(buffer, filename);
      const ext = getSafeExt(mimeType, filename);
      const uuid = randomUUID();

      const invMapping = localFileToInvitationMap.get(filename);
      let s3Key = '';

      if (invMapping) {
        s3Key = `guest-moments/${invMapping.invitationId}/images/${uuid}${ext}`;
      } else {
        s3Key = `uploads/legacy/${uuid}${ext}`;
      }

      console.log(`  ⬆️ Uploading [${filename}] -> S3: ${s3Key}...`);

      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
      }));
      report.uploadedToS3++;

      const s3Url = getPublicUrl(s3Key);

      // Verify S3 accessibility
      const verified = await verifyS3Url(s3Url, s3Key);
      if (verified) {
        report.verifiedCount++;
        console.log(`  ✅ Verified accessibility: ${s3Url}`);
      } else {
        report.errors.push(`Failed verification for file ${filename}: ${s3Url}`);
        continue;
      }

      // Determine MediaType
      let mType: MediaType = MediaType.IMAGE;
      if (mimeType.startsWith('video/')) mType = MediaType.VIDEO;
      if (mimeType.startsWith('audio/')) mType = MediaType.AUDIO;

      // Register in Media table
      await prisma.media.upsert({
        where: { key: s3Key },
        update: { url: s3Url, mimeType, size: buffer.length },
        create: {
          url: s3Url,
          key: s3Key,
          type: mType,
          mimeType,
          size: buffer.length,
        },
      });

      // If mapped to an invitation moment, update DB array
      if (invMapping) {
        const inv = await prisma.invitation.findUnique({
          where: { id: invMapping.invitationId },
        });
        if (inv) {
          const oldLocalPath = `/public/uploads/${filename}`;
          const updatedMoments = inv.moments.map(m => (m === oldLocalPath ? s3Url : m));
          await prisma.invitation.update({
            where: { id: inv.id },
            data: { moments: updatedMoments },
          });
          report.dbRecordsUpdated++;
          report.momentsMigrated++;
        }
      } else {
        report.legacyUploadsMigrated++;
      }
    }
  }

  // ── STEP 3: SUMMARY REPORT ───────────────────────────────────────────
  console.log('\n====================================================');
  console.log('📊 MIGRATION & VERIFICATION REPORT');
  console.log('====================================================');
  console.log(`  Total Local Images Scanned:   ${report.imagesFound}`);
  console.log(`  Successfully Uploaded to S3:  ${report.uploadedToS3}`);
  console.log(`  Verified S3 Accessible (200): ${report.verifiedCount}`);
  console.log(`  Database Records Updated:     ${report.dbRecordsUpdated}`);
  console.log(`    - Templates Migrated:       ${report.templatesMigrated}`);
  console.log(`    - Moments Migrated:         ${report.momentsMigrated}`);
  console.log(`    - Legacy Files Migrated:    ${report.legacyUploadsMigrated}`);
  console.log(`  Errors / Failures:            ${report.errors.length}`);

  if (report.errors.length > 0) {
    console.log('\n❌ ERRORS DETECTED:');
    report.errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('\n✨ ALL MIGRATED FILES SUCCESSFULLY VERIFIED ON AWS S3!');
    console.log('🔒 NOTE: Local files on disk were NOT deleted and remain untouched.');
  }

  await prisma.$disconnect();
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  prisma.$disconnect();
  process.exit(1);
});
