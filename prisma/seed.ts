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
  await prisma.testimonial.deleteMany();
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

  // 3. Create the templates
  console.log('Creating templates...');
  const template1 = await prisma.template.create({
    data: {
      title: 'Royal Gold Wedding',
      description: 'تصميم زفاف ذهبي فاخر مع مؤثرات تساقط الثلوج وموسيقى خلفية ونظام تأكيد حضور متكامل.',
      previewImage: '/base44.app/api/apps/6966e1f30fa9fbe508239391/files/mp/public/6966e1f30fa9fbe508239391/941a523da_1000046659.png',
      price: 150.00,
      demoLink: '/invite/royal-gold-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'العريس & العروس' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة السمو، الرياض' },
      },
    },
  });

  const template2 = await prisma.template.create({
    data: {
      title: 'Watercolor Garden Wedding',
      description: 'تصميم زفاف ريفي ساحر مستوحى من الطبيعة مع خلفية فيديو للحديقة الغناء ونظام متكامل لتأكيد الحضور.',
      previewImage: '/images/watercolor-garden-preview.png',
      price: 150.00,
      demoLink: '/invite/garden-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'أحمد & سارة' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'حديقة الياسمين، الرياض' },
      },
    },
  });

  console.log(`Created templates: "${template1.title}" and "${template2.title}"`);

  // 4. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (Royal Gold)
  console.log('Creating demo invitation mapping for Royal Gold...');
  const purchaseRequest1 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template1.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase1 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template1.id,
      purchaseRequestId: purchaseRequest1.id,
      slug: 'royal-gold-demo',
    },
  });

  const invitation1 = await prisma.invitation.create({
    data: {
      purchaseId: purchase1.id,
      slug: 'royal-gold-demo',
      eventTitle: 'العريس & العروس',
      eventLocation: 'قاعة السمو، الرياض',
      eventDate: new Date('2027-03-02T06:21:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح\nوبدعاءٍ صادق أن يتمّ الله لنا ولكم الخير\nنتشرف بدعوتكم لمشاركتنا\nفرحة أبنائنا\n\nفي يومٍ جمع الله فيه القلوب\nوكتب فيه بداية عمرٍ جديد\nوجودكم بيننا شرف\nمشاركتكم لنا تزيد الفرح فرحًا 🤍',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation1.slug}"`);

  // 5. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (Watercolor Garden)
  console.log('Creating demo invitation mapping for Watercolor Garden...');
  const purchaseRequest2 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template2.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase2 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template2.id,
      purchaseRequestId: purchaseRequest2.id,
      slug: 'garden-demo',
    },
  });

  const invitation2 = await prisma.invitation.create({
    data: {
      purchaseId: purchase2.id,
      slug: 'garden-demo',
      eventTitle: 'أحمد & سارة',
      eventLocation: 'حديقة الياسمين، الرياض',
      eventDate: new Date('2027-05-15T18:00:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation2.slug}"`);

  // 6. Seed testimonials
  console.log('Creating testimonial users, purchases, and testimonials...');
  
  const user1 = await prisma.user.create({
    data: {
      email: 'ahmed@alrashid.com',
      passwordHash: clientPasswordHash,
      firstName: 'Ahmed',
      lastName: 'Al-Rashid',
      phoneNumber: '+966500000003',
      role: Role.CLIENT,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'sarah@almansoori.com',
      passwordHash: clientPasswordHash,
      firstName: 'Sarah',
      lastName: 'Al-Mansoori',
      phoneNumber: '+966500000004',
      role: Role.CLIENT,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'khalid@bashir.com',
      passwordHash: clientPasswordHash,
      firstName: 'Khalid',
      lastName: 'Bashir',
      phoneNumber: '+966500000005',
      role: Role.CLIENT,
    },
  });

  // Purchase & testimonial for Ahmed
  const req1 = await prisma.purchaseRequest.create({
    data: {
      userId: user1.id,
      templateId: template2.id,
      contactEmail: user1.email,
      contactPhone: user1.phoneNumber,
      status: 'APPROVED',
    },
  });
  const pur1 = await prisma.purchase.create({
    data: {
      userId: user1.id,
      templateId: template2.id,
      purchaseRequestId: req1.id,
      slug: 'ahmed-garden',
    },
  });
  await prisma.invitation.create({
    data: {
      purchaseId: pur1.id,
      slug: 'ahmed-garden',
      eventTitle: 'Wedding Host',
      eventLocation: 'الرياض',
      eventDate: new Date('2027-08-01T19:00:00Z'),
    }
  });
  await prisma.testimonial.create({
    data: {
      purchaseId: pur1.id,
      rating: 5,
      comment: 'The botanical templates are exceptionally elegant. The guest response tracker made coordinating RSVPs for our wedding completely stress-free.',
    },
  });

  // Purchase & testimonial for Sarah
  const req2 = await prisma.purchaseRequest.create({
    data: {
      userId: user2.id,
      templateId: template1.id,
      contactEmail: user2.email,
      contactPhone: user2.phoneNumber,
      status: 'APPROVED',
    },
  });
  const pur2 = await prisma.purchase.create({
    data: {
      userId: user2.id,
      templateId: template1.id,
      purchaseRequestId: req2.id,
      slug: 'sarah-royal',
    },
  });
  await prisma.invitation.create({
    data: {
      purchaseId: pur2.id,
      slug: 'sarah-royal',
      eventTitle: 'Bridal Shower Host',
      eventLocation: 'جدة',
      eventDate: new Date('2027-09-12T17:00:00Z'),
    }
  });
  await prisma.testimonial.create({
    data: {
      purchaseId: pur2.id,
      rating: 5,
      comment: 'So beautiful and extremely simple to customize. Approved in minutes, editable fields work like magic. The audio music player option was a massive hit!',
    },
  });

  // Purchase & testimonial for Khalid
  const req3 = await prisma.purchaseRequest.create({
    data: {
      userId: user3.id,
      templateId: template2.id,
      contactEmail: user3.email,
      contactPhone: user3.phoneNumber,
      status: 'APPROVED',
    },
  });
  const pur3 = await prisma.purchase.create({
    data: {
      userId: user3.id,
      templateId: template2.id,
      purchaseRequestId: req3.id,
      slug: 'khalid-garden',
    },
  });
  await prisma.invitation.create({
    data: {
      purchaseId: pur3.id,
      slug: 'khalid-garden',
      eventTitle: 'Anniversary Host',
      eventLocation: 'الدمام',
      eventDate: new Date('2027-10-20T20:00:00Z'),
    }
  });
  await prisma.testimonial.create({
    data: {
      purchaseId: pur3.id,
      rating: 5,
      comment: 'The guest RSVP count feature was incredibly helpful. I could see the exact counts and companion details live. Saved hours of phone calls!',
    },
  });

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
