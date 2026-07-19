import * as dotenv from 'dotenv';
dotenv.config();

import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/prisma/prisma.service';

const config = new ConfigService();
const prisma = new PrismaService(config);

const CLOUDFRONT_URL = (process.env.CLOUDFRONT_URL || '').replace(/\/+$/, '');

function convertUrl(url: string): string {
  if (!url || !CLOUDFRONT_URL) return url;
  // Strip any presigned query string parameters (e.g. ?X-Amz-Algorithm=...)
  const cleanUrl = url.split('?')[0];

  if (cleanUrl.includes('.s3.') && cleanUrl.includes('.amazonaws.com/')) {
    const parts = cleanUrl.split('.amazonaws.com/');
    if (parts.length === 2) {
      const key = parts[1].replace(/^\/+/, '');
      return `${CLOUDFRONT_URL}/${key}`;
    }
  }
  return cleanUrl;
}

async function migrate() {
  await prisma.$connect();
  console.log('🚀 Starting Database Migration: S3 URLs -> CloudFront CDN URLs');
  console.log(`CloudFront Base URL: ${CLOUDFRONT_URL}\n`);

  // 1. Migrate Media Table
  const mediaRecords = await prisma.media.findMany();
  let mediaUpdated = 0;
  for (const m of mediaRecords) {
    const newUrl = `${CLOUDFRONT_URL}/${m.key.replace(/^\/+/, '')}`;
    if (m.url !== newUrl) {
      await prisma.media.update({
        where: { id: m.id },
        data: { url: newUrl },
      });
      mediaUpdated++;
    }
  }
  console.log(`✅ Media Table: Updated ${mediaUpdated} / ${mediaRecords.length} records.`);

  // 2. Migrate Templates Table
  const templates = await prisma.template.findMany();
  let templatesUpdated = 0;
  for (const t of templates) {
    const newPreview = convertUrl(t.previewImage);
    if (newPreview !== t.previewImage) {
      await prisma.template.update({
        where: { id: t.id },
        data: { previewImage: newPreview },
      });
      templatesUpdated++;
    }
  }
  console.log(`✅ Templates Table: Updated ${templatesUpdated} / ${templates.length} records.`);

  // 3. Migrate Invitations Table
  const invitations = await prisma.invitation.findMany();
  let invitationsUpdated = 0;
  for (const inv of invitations) {
    const newImages = inv.images.map(convertUrl);
    const newMoments = inv.moments.map(convertUrl);
    const imagesChanged = JSON.stringify(newImages) !== JSON.stringify(inv.images);
    const momentsChanged = JSON.stringify(newMoments) !== JSON.stringify(inv.moments);

    if (imagesChanged || momentsChanged) {
      await prisma.invitation.update({
        where: { id: inv.id },
        data: {
          images: newImages,
          moments: newMoments,
        },
      });
      invitationsUpdated++;
    }
  }
  console.log(`✅ Invitations Table: Updated ${invitationsUpdated} / ${invitations.length} records.`);

  console.log('\n🎉 CloudFront CDN Migration Completed Successfully!');
}

migrate()
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
