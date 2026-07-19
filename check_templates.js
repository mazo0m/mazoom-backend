require('dotenv').config();
const { ConfigService } = require('@nestjs/config');
const { PrismaService } = require('./dist/src/prisma/prisma.service');

async function main() {
  const config = new ConfigService();
  const prisma = new PrismaService(config);
  await prisma.$connect();
  const templates = await prisma.template.findMany({
    select: {
      id: true,
      title: true,
      titleEn: true,
      category: true,
      isActive: true,
      isPremium: true,
      price: true,
    }
  });
  console.log('TEMPLATES IN DB (Count:', templates.length, '):');
  console.log(JSON.stringify(templates, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
