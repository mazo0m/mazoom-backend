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
      previewImage: '/images/royal-gold-preview.png',
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

  const template3 = await prisma.template.create({
    data: {
      title: 'Boho Terracotta Wedding',
      description: 'تصميم زفاف بوهيمي دافئ مزين بالزهور المجففة وتدرجات التراكوتا مع مؤثرات تساقط أوراق الشجر وموسيقى خلفية.',
      previewImage: '/images/terracotta-preview.png',
      price: 150.00,
      demoLink: '/invite/terracotta-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'العريس & العروس' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة السمو، الرياض' },
      },
    },
  });

  const template4 = await prisma.template.create({
    data: {
      title: 'Watercolor Lily Wedding',
      description: 'تصميم زفاف ناعم ومميز مستوحى من زهور الزنبق المائية وتدرجات اللافندر مع مؤثرات تساقط البتلات وموسيقى خلفية.',
      previewImage: '/images/lily-preview.png',
      price: 150.00,
      demoLink: '/invite/lily-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'أحمد & سارة' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'حديقة الياسمين، الرياض' },
      },
    },
  });

  const template5 = await prisma.template.create({
    data: {
      title: 'Emerald Luxury Wedding',
      description: 'تصميم زفاف زمردي فاخر باللون الأخضر الداكن والذهبي الكلاسيكي مع مؤثرات تساقط الأوراق الذهبية وموسيقى خلفية متناغمة.',
      previewImage: '/images/emerald-preview.png',
      price: 150.00,
      demoLink: '/invite/emerald-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'العريس & العروس' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة اليمامة، الرياض' },
      },
    },
  });

  const template6 = await prisma.template.create({
    data: {
      title: 'White Gypsophila Wedding',
      titleEn: 'White Gypsophila Wedding',
      titleAr: 'White Gypsophila Wedding',
      description: 'تصميم زفاف أبيض ناصع مزين بزهور الجبسوفيلا البيضاء الناعمة مع خلفية فيديو أنيقة ومؤثرات تساقط الزهور.',
      previewImage: '/images/white-preview.png',
      price: 150.00,
      demoLink: '/invite/white-gypsophila-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'أحمد & سارة' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة السمو، الرياض' },
      },
    },
  });

  const template7 = await prisma.template.create({
    data: {
      title: 'Flow Wedding',
      titleEn: 'Flow Wedding',
      titleAr: 'تصميم انسيابي فاخر',
      description: 'تصميم زفاف انسيابي فاخر مع خلفية فيديو فلو متدفقة ونظام متكامل لتأكيد الحضور.',
      descriptionEn: 'A luxury flowing wedding design with dynamic flow video background and integrated RSVP system.',
      descriptionAr: 'تصميم زفاف انسيابي فاخر مع خلفية فيديو فلو متدفقة ونظام متكامل لتأكيد الحضور.',
      previewImage: '/images/flow-preview.png',
      price: 150.00,
      demoLink: '/invite/flow-demo',
      isPremium: true,
      category: 'Weddings',
      editableFields: {
        eventTitle: { type: 'string', label: 'Event Title', default: 'أحمد & سارة' },
        eventDate: { type: 'date', label: 'Event Date' },
        eventLocation: { type: 'string', label: 'Event Location', default: 'قاعة السمو، الرياض' },
      },
    },
  });

  console.log(`Created templates: "${template1.title}", "${template2.title}", "${template3.title}", "${template4.title}", "${template5.title}", "${template6.title}", and "${template7.title}"`);

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
      eventTitleAr: 'العريس & العروس',
      eventTitleEn: 'Groom & Bride',
      eventLocation: 'قاعة السمو، الرياض',
      eventLocationAr: 'قاعة السمو، الرياض',
      eventLocationEn: 'Al-Sumou Hall, Riyadh',
      eventDate: new Date('2027-03-02T06:21:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح\nوبدعاءٍ صادق أن يتمّ الله لنا ولكم الخير\nنتشرف بدعوتكم لمشاركتنا\nفرحة أبنائنا\n\nفي يومٍ جمع الله فيه القلوب\nوكتب فيه بداية عمرٍ جديد\nوجودكم بيننا شرف\nمشاركتكم لنا تزيد الفرح فرحًا 🤍',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح\nوبدعاءٍ صادق أن يتمّ الله لنا ولكم الخير\nنتشرف بدعوتكم لمشاركتنا\nفرحة أبنائنا\n\nفي يومٍ جمع الله فيه القلوب\nوكتب فيه بداية عمرٍ جديد\nوجودكم بيننا شرف\nمشاركتكم لنا تزيد الفرح فرحًا 🤍',
      welcomeTextEn: 'With hearts full of joy,\nAnd a sincere prayer that Allah completes our happiness,\nWe are honored to invite you to share our children\'s joy\n\nOn a day when Allah united their hearts\nAnd marked the beginning of a new lifetime\nYour presence is our honor,\nAnd your participation doubles our joy 🤍',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 1 مارس', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 1 مارس', textEn: 'Please confirm attendance by March 1st' },
        { text: 'يمنع التصوير منعاً باتاً للحفاظ على الخصوصية', textAr: 'يمنع التصوير منعاً باتاً للحفاظ على الخصوصية', textEn: 'Photography is strictly prohibited for privacy' },
        { text: 'يمنع اصطحاب الأطفال حرصاً على راحتكم', textAr: 'يمنع اصطحاب الأطفال حرصاً على راحتكم', textEn: 'Children are not allowed for your convenience' }
      ],
      eventProgram: [
        { time: '20:00', title: 'استقبال الضيوف', titleAr: 'استقبال الضيوف', titleEn: 'Guest Reception' },
        { time: '21:00', title: 'الزفة والترحيب', titleAr: 'الزفة والترحيب', titleEn: 'Entrance & Welcome' },
        { time: '22:00', title: 'تناول طعام العشاء', titleAr: 'تناول طعام العشاء', titleEn: 'Dinner Banquet' }
      ]
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
      eventTitleAr: 'أحمد & سارة',
      eventTitleEn: 'Ahmed & Sarah',
      eventLocation: 'حديقة الياسمين، الرياض',
      eventLocationAr: 'حديقة الياسمين، الرياض',
      eventLocationEn: 'Jasmine Garden, Riyadh',
      eventDate: new Date('2027-05-15T18:00:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextEn: 'With hearts full of joy and pleasure,\nWe are honored to invite you to share our lifetime joy\nAnd witness our bond of love and loyalty\n\nAt our children\'s wedding ceremony\n\nYour presence delights us and adds beauty and joy to our night 🌿',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textEn: 'Please confirm attendance by May 10th' },
        { text: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textAr: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textEn: 'Please refrain from taking videos to preserve our special moments' },
        { text: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textAr: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textEn: 'This invitation is personal and strictly for cardholders' }
      ],
      eventProgram: [
        { time: '18:00', title: 'وصول المدعوين واستقبالهم', titleAr: 'وصول المدعوين واستقبالهم', titleEn: 'Guest Arrival & Reception' },
        { time: '19:00', title: 'مراسم عقد القران والزفة', titleAr: 'مراسم عقد القران والزفة', titleEn: 'Wedding Ceremony & Entrance' },
        { time: '20:30', title: 'بوفيه العشاء الفاخر', titleAr: 'بوفيه العشاء الفاخر', titleEn: 'Grand Dinner Buffet' }
      ]
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation2.slug}"`);

  // 5a. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (Boho Terracotta)
  console.log('Creating demo invitation mapping for Boho Terracotta...');
  const purchaseRequest3 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template3.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase3 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template3.id,
      purchaseRequestId: purchaseRequest3.id,
      slug: 'terracotta-demo',
    },
  });

  const invitation3 = await prisma.invitation.create({
    data: {
      purchaseId: purchase3.id,
      slug: 'terracotta-demo',
      eventTitle: 'العريس & العروس',
      eventTitleAr: 'العريس & العروس',
      eventTitleEn: 'Groom & Bride',
      eventLocation: 'قاعة السمو، الرياض',
      eventLocationAr: 'قاعة السمو، الرياض',
      eventLocationEn: 'Al-Sumou Hall, Riyadh',
      eventDate: new Date('2027-03-02T06:21:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح\nوبدعاءٍ صادق أن يتمّ الله لنا ولكم الخير\nنتشرف بدعوتكم لمشاركتنا\nفرحة أبنائنا\n\nفي يومٍ جمع الله فيه القلوب\nوكتب فيه بداية عمرٍ جديد\nوجودكم بيننا شرف\nمشاركتكم لنا تزيد الفرح فرحًا 🤍',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح\nوبدعاءٍ صادق أن يتمّ الله لنا ولكم الخير\nنتشرف بدعوتكم لمشاركتنا\nفرحة أبنائنا\n\nفي يومٍ جمع الله فيه القلوب\nوكتب فيه بداية عمرٍ جديد\nوجودكم بيننا شرف\nمشاركتكم لنا تزيد الفرح فرحًا 🤍',
      welcomeTextEn: 'With hearts full of joy,\nAnd a sincere prayer that Allah completes our happiness,\nWe are honored to invite you to share our children\'s joy\n\nOn a day when Allah united their hearts\nAnd marked the beginning of a new lifetime\nYour presence is our honor,\nAnd your participation doubles our joy 🤍',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 1 مارس', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 1 مارس', textEn: 'Please confirm attendance by March 1st' },
        { text: 'يمنع التصوير منعاً باتاً للحفاظ على الخصوصية', textAr: 'يمنع التصوير منعاً باتاً للحفاظ على الخصوصية', textEn: 'Photography is strictly prohibited for privacy' },
        { text: 'يمنع اصطحاب الأطفال حرصاً على راحتكم', textAr: 'يمنع اصطحاب الأطفال حرصاً على راحتكم', textEn: 'Children are not allowed for your convenience' }
      ],
      eventProgram: [
        { time: '20:00', title: 'استقبال الضيوف', titleAr: 'استقبال الضيوف', titleEn: 'Guest Reception' },
        { time: '21:00', title: 'الزفة والترحيب', titleAr: 'الزفة والترحيب', titleEn: 'Entrance & Welcome' },
        { time: '22:00', title: 'تناول طعام العشاء', titleAr: 'تناول طعام العشاء', titleEn: 'Dinner Banquet' }
      ]
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation3.slug}"`);

  // 5b. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (Watercolor Lily)
  console.log('Creating demo invitation mapping for Watercolor Lily...');
  const purchaseRequest4 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template4.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase4 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template4.id,
      purchaseRequestId: purchaseRequest4.id,
      slug: 'lily-demo',
    },
  });

  const invitation4 = await prisma.invitation.create({
    data: {
      purchaseId: purchase4.id,
      slug: 'lily-demo',
      eventTitle: 'أحمد & سارة',
      eventTitleAr: 'أحمد & سارة',
      eventTitleEn: 'Ahmed & Sarah',
      eventLocation: 'حديقة الياسمين، الرياض',
      eventLocationAr: 'حديقة الياسمين، الرياض',
      eventLocationEn: 'Jasmine Garden, Riyadh',
      eventDate: new Date('2027-05-15T18:00:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextEn: 'With hearts full of joy and pleasure,\nWe are honored to invite you to share our lifetime joy\nAnd witness our bond of love and loyalty\n\nAt our children\'s wedding ceremony\n\nYour presence delights us and adds beauty and joy to our night 🌿',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textEn: 'Please confirm attendance by May 10th' },
        { text: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textAr: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textEn: 'Please refrain from taking videos to preserve our special moments' },
        { text: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textAr: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textEn: 'This invitation is personal and strictly for cardholders' }
      ],
      eventProgram: [
        { time: '18:00', title: 'وصول المدعوين واستقبالهم', titleAr: 'وصول المدعوين واستقبالهم', titleEn: 'Guest Arrival & Reception' },
        { time: '19:00', title: 'مراسم عقد القران والزفة', titleAr: 'مراسم عقد القران والزفة', titleEn: 'Wedding Ceremony & Entrance' },
        { time: '20:30', title: 'بوفيه العشاء الفاخر', titleAr: 'بوفيه العشاء الفاخر', titleEn: 'Grand Dinner Buffet' }
      ]
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation4.slug}"`);

  // 5c. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (Emerald Luxury)
  console.log('Creating demo invitation mapping for Emerald Luxury...');
  const purchaseRequest5 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template5.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase5 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template5.id,
      purchaseRequestId: purchaseRequest5.id,
      slug: 'emerald-demo',
    },
  });

  const invitation5 = await prisma.invitation.create({
    data: {
      purchaseId: purchase5.id,
      slug: 'emerald-demo',
      eventTitle: 'أحمد & سارة',
      eventTitleAr: 'أحمد & سارة',
      eventTitleEn: 'Ahmed & Sarah',
      eventLocation: 'قاعة اليمامة، الرياض',
      eventLocationAr: 'قاعة اليمامة، الرياض',
      eventLocationEn: 'Al-Yamama Hall, Riyadh',
      eventDate: new Date('2027-05-15T18:00:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextEn: 'With hearts full of joy and pleasure,\nWe are honored to invite you to share our lifetime joy\nAnd witness our bond of love and loyalty\n\nAt our children\'s wedding ceremony\n\nYour presence delights us and adds beauty and joy to our night 🌿',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textEn: 'Please confirm attendance by May 10th' },
        { text: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textAr: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textEn: 'Please refrain from taking videos to preserve our special moments' },
        { text: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textAr: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textEn: 'This invitation is personal and strictly for cardholders' }
      ],
      eventProgram: [
        { time: '18:00', title: 'وصول المدعوين واستقبالهم', titleAr: 'وصول المدعوين واستقبالهم', titleEn: 'Guest Arrival & Reception' },
        { time: '19:00', title: 'مراسم عقد القران والزفة', titleAr: 'مراسم عقد القران والزفة', titleEn: 'Wedding Ceremony & Entrance' },
        { time: '20:30', title: 'بوفيه العشاء الفاخر', titleAr: 'بوفيه العشاء الفاخر', titleEn: 'Grand Dinner Buffet' }
      ]
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation5.slug}"`);

  // 5d. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (White Gypsophila)
  console.log('Creating demo invitation mapping for White Gypsophila...');
  const purchaseRequest6 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template6.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase6 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template6.id,
      purchaseRequestId: purchaseRequest6.id,
      slug: 'white-gypsophila-demo',
    },
  });

  const invitation6 = await prisma.invitation.create({
    data: {
      purchaseId: purchase6.id,
      slug: 'white-gypsophila-demo',
      eventTitle: 'أحمد & سارة',
      eventTitleAr: 'أحمد & سارة',
      eventTitleEn: 'Ahmed & Sarah',
      eventLocation: 'قاعة السمو، الرياض',
      eventLocationAr: 'قاعة السمو، الرياض',
      eventLocationEn: 'Al-Sumou Hall, Riyadh',
      eventDate: new Date('2027-05-15T18:00:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً 🌿',
      welcomeTextEn: 'With hearts full of joy and pleasure,\nWe are honored to invite you to share our lifetime joy\nAnd witness our bond of love and loyalty\n\nAt our children\'s wedding ceremony\n\nYour presence delights us and adds beauty and joy to our night 🌿',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textEn: 'Please confirm attendance by May 10th' },
        { text: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textAr: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textEn: 'Please refrain from taking videos to preserve our special moments' },
        { text: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textAr: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textEn: 'This invitation is personal and strictly for cardholders' }
      ],
      eventProgram: [
        { time: '18:00', title: 'وصول المدعوين واستقبالهم', titleAr: 'وصول المدعوين واستقبالهم', titleEn: 'Guest Arrival & Reception' },
        { time: '19:00', title: 'مراسم عقد القران والزفة', titleAr: 'مراسم عقد القران والزفة', titleEn: 'Wedding Ceremony & Entrance' },
        { time: '20:30', title: 'بوفيه العشاء الفاخر', titleAr: 'بوفيه العشاء الفاخر', titleEn: 'Grand Dinner Buffet' }
      ]
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation6.slug}"`);

  // 5e. Pre-create Approved Purchase Request, Purchase, and Invitation for Demo slug (Flow)
  console.log('Creating demo invitation mapping for Flow...');
  const purchaseRequest7 = await prisma.purchaseRequest.create({
    data: {
      userId: admin.id,
      templateId: template7.id,
      contactEmail: 'admin@mazoom.app',
      contactPhone: '+966500000001',
      status: 'APPROVED',
    },
  });

  const purchase7 = await prisma.purchase.create({
    data: {
      userId: admin.id,
      templateId: template7.id,
      purchaseRequestId: purchaseRequest7.id,
      slug: 'flow-demo',
    },
  });

  const invitation7 = await prisma.invitation.create({
    data: {
      purchaseId: purchase7.id,
      slug: 'flow-demo',
      eventTitle: 'أحمد & سارة',
      eventTitleAr: 'أحمد & سارة',
      eventTitleEn: 'Ahmed & Sarah',
      eventLocation: 'قاعة السمو، الرياض',
      eventLocationAr: 'قاعة السمو، الرياض',
      eventLocationEn: 'Al-Sumou Hall, Riyadh',
      eventDate: new Date('2027-05-15T18:00:00.000Z'),
      locationUrl: 'https://maps.google.com/?q=24.7136,46.6753',
      welcomeText: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً ✨',
      welcomeTextAr: 'بقلوبٍ يملؤها الفرح والسرور،\nنتشرف بدعوتكم لمشاركتنا فرحة العمر\nوتوثيق عهد الحب والوفاء\n\nفي حفل زفاف أبنائنا\n\nحضوركم يسعدنا ويضفي على ليلتنا بهجة وسروراً ✨',
      welcomeTextEn: 'With hearts full of joy and pleasure,\nWe are honored to invite you to share our lifetime joy\nAnd witness our bond of love and loyalty\n\nAt our children\'s wedding ceremony\n\nYour presence delights us and adds beauty and joy to our night ✨',
      languageMode: 'both',
      images: [],
      musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      contactName: 'أخو العريس',
      contactPhone: '+966500000001',
      allowGuestUploads: true,
      moments: [],
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 10 مايو', textEn: 'Please confirm attendance by May 10th' },
        { text: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textAr: 'نرجو منكم عدم تصوير مقاطع الفيديو لمشاركتنا اللحظات الخاصة بأمان', textEn: 'Please refrain from taking videos to preserve our special moments' },
        { text: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textAr: 'الدعوة شخصية وخاصة لحاملي الدعوة فقط', textEn: 'This invitation is personal and strictly for cardholders' }
      ],
      eventProgram: [
        { time: '18:00', title: 'وصول المدعوين واستقبالهم', titleAr: 'وصول المدعوين واستقبالهم', titleEn: 'Guest Arrival & Reception' },
        { time: '19:00', title: 'مراسم عقد القران والزفة', titleAr: 'مراسم عقد القران والزفة', titleEn: 'Wedding Ceremony & Entrance' },
        { time: '20:30', title: 'بوفيه العشاء الفاخر', titleAr: 'بوفيه العشاء الفاخر', titleEn: 'Grand Dinner Buffet' }
      ]
    },
  });

  console.log(`Demo invitation successfully mapped! URL slug: "${invitation7.slug}"`);

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
      contactPhone: user1.phoneNumber!,
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
      eventTitleAr: 'مضيف الزفاف',
      eventTitleEn: 'Wedding Host',
      eventLocation: 'الرياض',
      eventLocationAr: 'الرياض',
      eventLocationEn: 'Riyadh',
      eventDate: new Date('2027-08-01T19:00:00Z'),
      welcomeText: 'ندعوكم لحفل زفافنا الميمون',
      welcomeTextAr: 'ندعوكم لحفل زفافنا الميمون',
      welcomeTextEn: 'We invite you to our blessed wedding ceremony',
      languageMode: 'both',
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 1 أغسطس', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 1 أغسطس', textEn: 'Please confirm attendance by August 1st' }
      ],
      eventProgram: [
        { time: '19:00', title: 'الاستقبال والترحيب', titleAr: 'الاستقبال والترحيب', titleEn: 'Reception & Welcome' }
      ]
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
      contactPhone: user2.phoneNumber!,
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
      eventTitleAr: 'مضيفة حفلة توديع العزوبية',
      eventTitleEn: 'Bridal Shower Host',
      eventLocation: 'جدة',
      eventLocationAr: 'جدة',
      eventLocationEn: 'Jeddah',
      eventDate: new Date('2027-09-12T17:00:00Z'),
      welcomeText: 'ندعوكم لحفل توديع العزوبية',
      welcomeTextAr: 'ندعوكم لحفل توديع العزوبية',
      welcomeTextEn: 'We invite you to the bridal shower',
      languageMode: 'both',
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 10 سبتمبر', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 10 سبتمبر', textEn: 'Please confirm attendance by September 10th' }
      ],
      eventProgram: [
        { time: '17:00', title: 'بدء الحفل والترحيب بالعروس', titleAr: 'بدء الحفل والترحيب بالعروس', titleEn: 'Ceremony Start & Greeting the Bride' }
      ]
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
      contactPhone: user3.phoneNumber!,
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
      eventTitleAr: 'مضيف ذكرى الزواج',
      eventTitleEn: 'Anniversary Host',
      eventLocation: 'الدمام',
      eventLocationAr: 'الدمام',
      eventLocationEn: 'Dammam',
      eventDate: new Date('2027-10-20T20:00:00Z'),
      welcomeText: 'ندعوكم لحفل ذكرى زواجنا',
      welcomeTextAr: 'ندعوكم لحفل ذكرى زواجنا',
      welcomeTextEn: 'We invite you to our wedding anniversary',
      languageMode: 'both',
      eventDetails: [
        { text: 'الرجاء تأكيد الحضور في موعد أقصاه 15 أكتوبر', textAr: 'الرجاء تأكيد الحضور في موعد أقصاه 15 أكتوبر', textEn: 'Please confirm attendance by October 15th' }
      ],
      eventProgram: [
        { time: '20:00', title: 'الاستقبال وتناول العشاء', titleAr: 'الاستقبال وتناول العشاء', titleEn: 'Reception & Dinner' }
      ]
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
