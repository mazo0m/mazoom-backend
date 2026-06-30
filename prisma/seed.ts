import { PrismaClient, Role, RsvpAttendance } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed process...');

  // 1. Clean database
  console.log('Cleaning old database entries...');
  await prisma.rSVP.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create default Admin & Client
  console.log('Creating users...');
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('adminpassword', saltRounds);
  const clientPasswordHash = await bcrypt.hash('clientpassword', saltRounds);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mazoom.app',
      passwordHash: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'Mazoom',
      phoneNumber: '+966500000001',
      role: Role.ADMIN,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: 'client@mazoom.app',
      passwordHash: clientPasswordHash,
      firstName: 'Client',
      lastName: 'Mazoom',
      phoneNumber: '+966500000002',
      role: Role.CLIENT,
    },
  });

  console.log(`Created admin: ${admin.email}`);
  console.log(`Created client: ${client.email}`);

  // 3. Create default Templates
  console.log('Creating templates...');
  const template1 = await prisma.template.create({
    data: {
      title: 'Royal Gold Wedding',
      description: 'A luxurious gold-themed wedding invitation template with elegant animations.',
      previewImage: 'https://cdn.mazoom.app/templates/royal-gold.jpg',
      price: 149.99,
      demoLink: 'https://demo.mazoom.app/royal-gold',
      isPremium: true,
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'حفل زفاف أحمد وسارة' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة الروابي - الرياض' },
      },
    },
  });

  const template2 = await prisma.template.create({
    data: {
      title: 'Elegant Rose',
      description: 'A romantic floral design perfect for weddings and anniversaries.',
      previewImage: 'https://cdn.mazoom.app/templates/elegant-rose.jpg',
      price: 99.99,
      demoLink: 'https://demo.mazoom.app/elegant-rose',
      isPremium: false,
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'حفل زفاف خالد وفاطمة' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة الأوركيد - جدة' },
      },
    },
  });

  console.log(`Created templates: "${template1.title}" and "${template2.title}"`);
  console.log('Seed process completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
