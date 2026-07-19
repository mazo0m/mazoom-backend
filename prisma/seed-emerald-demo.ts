import { PrismaClient, RequestStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Checking database for template and users...');

  // 1. Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!admin) {
    console.error('❌ No admin user found. Please seed the database first.');
    return;
  }

  // 2. Find the template (by matching English or Arabic title)
  const template = await prisma.template.findFirst({
    where: {
      OR: [
        { title: 'Emerald Luxury Wedding' },
        { titleEn: 'Emerald Luxury Wedding' },
        { title: 'قالب الزمرد الفاخر' },
        { titleAr: 'قالب الزمرد الفاخر' }
      ]
    }
  });

  if (!template) {
    console.error('❌ Template "Emerald Luxury Wedding" / "قالب الزمرد الفاخر" not found in the database.');
    console.log('Please ensure you have saved this template from the Admin Panel first.');
    return;
  }

  console.log(`Found Template: "${template.title}" (ID: ${template.id})`);

  // 3. Create or find Purchase
  let purchase = await prisma.purchase.findUnique({
    where: { slug: 'emerald-demo' },
  });

  if (!purchase) {
    console.log('Creating approved purchase request and purchase record...');
    const request = await prisma.purchaseRequest.create({
      data: {
        userId: admin.id,
        templateId: template.id,
        contactEmail: admin.email,
        contactPhone: admin.phoneNumber || '+966500000001',
        status: RequestStatus.APPROVED,
      },
    });

    purchase = await prisma.purchase.create({
      data: {
        userId: admin.id,
        templateId: template.id,
        purchaseRequestId: request.id,
        slug: 'emerald-demo',
      },
    });
  }

  // 4. Create or find Invitation
  const invitation = await prisma.invitation.findUnique({
    where: { slug: 'emerald-demo' },
  });

  if (!invitation) {
    console.log('Creating demo invitation record...');
    await prisma.invitation.create({
      data: {
        purchaseId: purchase.id,
        slug: 'emerald-demo',
        eventTitle: 'خالد & ريم',
        eventTitleAr: 'خالد & ريم',
        eventTitleEn: 'Khaled & Reem',
        eventLocation: 'قاعة الأوركيد، عمان',
        eventLocationAr: 'قاعة الأوركيد، عمان',
        eventLocationEn: 'Orchid Hall, Amman',
        eventDate: new Date('2027-08-20T19:00:00.000Z'),
        locationUrl: 'https://maps.google.com/?q=31.9539,35.9106',
        welcomeText: 'بقلوبٍ يملؤها الحب والوفاء نتشرف بدعوتكم لحضور حفل زفافنا الفاخر.. حضوركم شرفٌ لنا 💚',
        welcomeTextAr: 'بقلوبٍ يملؤها الحب والوفاء نتشرف بدعوتكم لحضور حفل زفافنا الفاخر.. حضوركم شرفٌ لنا 💚',
        welcomeTextEn: 'With love and joy, we invite you to celebrate our wedding day. Your presence is our honor! 💚',
        images: [],
        musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        contactName: 'العريس',
        contactPhone: '+966500000001',
        allowGuestUploads: true,
      },
    });
    console.log('✅ Demo invitation successfully created with slug "emerald-demo"!');
  } else {
    console.log('ℹ️ Demo invitation already exists for "emerald-demo".');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
