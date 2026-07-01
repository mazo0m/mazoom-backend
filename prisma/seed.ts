import { PrismaClient, Role } from '@prisma/client';
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

  // 3. Create ONLY the Luxury Wedding Template
  console.log('Creating template...');
  const template = await prisma.template.create({
    data: {
      title: 'Royal Gold Wedding',
      description: 'تصميم زفاف ذهبي فاخر مع مؤثرات تساقط الثلوج وموسيقى خلفية ونظام تأكيد حضور متكامل.',
      previewImage: '/base44.app/api/apps/6966e1f30fa9fbe508239391/files/mp/public/6966e1f30fa9fbe508239391/941a523da_1000046659.png',
      price: 150.00,
      demoLink: '/invite/royal-gold-demo',
      isPremium: true,
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'أيمن & راما' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة السمو، الرياض' },
      },
    },
  });

  console.log(`Created template: "${template.title}"`);

  // 4. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug
  console.log('Creating demo invitation mapping...');
  const purchaseRequest = await prisma.purchaseRequest.create({
    data: {
      userId: client.id,
      templateId: template.id,
      contactEmail: 'client@mazoom.app',
      contactPhone: '+966500000002',
      status: 'APPROVED',
    },
  });

  const purchase = await prisma.purchase.create({
    data: {
      userId: client.id,
      templateId: template.id,
      purchaseRequestId: purchaseRequest.id,
      slug: 'royal-gold-demo',
    },
  });

  const invitation = await prisma.invitation.create({
    data: {
      purchaseId: purchase.id,
      slug: 'royal-gold-demo',
      eventTitle: 'أيمن & راما',
      eventLocation: 'قاعة السمو، الرياض',
      eventDate: new Date('2027-03-02T06:21:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح\nوبدعاءٍ صادق أن يتمّ الله لنا ولكم الخير\nنتشرف بدعوتكم لمشاركتنا\nفرحة أبنائنا\n\nفي يومٍ جمع الله فيه القلوب\nوكتب فيه بداية عمرٍ جديد\nوجودكم بيننا شرف\nومشاركتكم لنا تزيد الفرح فرحًا 🤍',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation.slug}"`);
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
