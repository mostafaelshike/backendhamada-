const users = [
  {
    name: 'د. أحمد المهدي (المدير العام)',
    email: 'admin@medicalmarket.com',
    password: 'admin123456',
    role: 'admin',
    phone: '+966 50 111 2222',
    organization: 'إدارة سوق طبي الطبي',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80',
    address: {
      street: 'طريق الملك عبد العزيز',
      city: 'الرياض',
      state: 'الرياض',
      postalCode: '12211',
      country: 'المملكة العربية السعودية'
    }
  },
  {
    name: 'مستشفى الأمل التخصصي - د. سارة العتيبي',
    email: 'user@medicalmarket.com',
    password: 'user123456',
    role: 'user',
    phone: '+966 55 333 4444',
    organization: 'مستشفى الأمل التخصصي',
    avatar: 'https://images.unsplash.com/photo-1594824813583-050212f451f2?auto=format&fit=crop&w=200&q=80',
    address: {
      street: 'حي النخيل، شارع التخصصي',
      city: 'جدة',
      state: 'مكة المكرمة',
      postalCode: '21589',
      country: 'المملكة العربية السعودية'
    }
  }
];

const categories = [
  {
    name: 'أجهزة تشخيصية وفحوصات',
    nameEn: 'Diagnostic & Monitoring Devices',
    code: 'CAT-DIAG-01',
    description: 'شاشات مراقبة العلامات الحيوية، أجهزة تخطيط القلب التشخيصي، وأجهزة قياس الضغط والسكر الرقمية المعتمدة',
    icon: 'bi-heart-pulse',
    displayOrder: 1,
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'مستلزمات سريرية وطوارئ',
    nameEn: 'Clinical & Emergency Supplies',
    code: 'CAT-CLIN-02',
    description: 'سماعات طبية دقيقة، موازين حرارة بالأشعة تحت الحمراء، أجهزة قياس تشبع الأكسجين ونبضات القلب',
    icon: 'bi-capsule',
    displayOrder: 2,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'تجهيزات عيادات وأثاث طبي',
    nameEn: 'Clinic Equipment & Medical Furniture',
    code: 'CAT-FURN-03',
    description: 'أسرة فحص كهربائية وهيدروليكية، كراسي متحركة طبية خفيفة، طاولات ومستلزمات العيادات المتكاملة',
    icon: 'bi-person-wheelchair',
    displayOrder: 3,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'أدوات ومعدات جراحية دقيقة',
    nameEn: 'Surgical Instruments & Sets',
    code: 'CAT-SURG-04',
    description: 'أطقم جراحة متطورة من الستانلس ستيل الألماني عالي الجودة ومقصات وملاقط طبية معقمة',
    icon: 'bi-scissors',
    displayOrder: 4,
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'مستلزمات وقاية وتعقيم طبي',
    nameEn: 'PPE & Sterilization Supplies',
    code: 'CAT-SAFE-05',
    description: 'كمامات جراحية ثلاثية الطبقات، قفازات لاتكس ونيتريل معقمة، مطهرات ومحاليل تعقيم المشافي',
    icon: 'bi-shield-plus',
    displayOrder: 5,
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=500&q=80'
  },
  {
    name: 'أجهزة التنفس والاستنشاق',
    nameEn: 'Respiratory & Nebulizer Devices',
    code: 'CAT-RESP-06',
    description: 'أجهزة استنشاق البخار والنيبولايزر المنزلية والسريرية وأجهزة توليد الأكسجين الطبية المحمولة',
    icon: 'bi-box-seam',
    displayOrder: 6,
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=500&q=80'
  }
];

const brands = [
  {
    name: 'Omron Healthcare',
    nameAr: 'أومرون للرعاية الطبية',
    code: 'OMR-JP',
    country: 'اليابان',
    description: 'العلامة الرائدة عالمياً في تصنيع أجهزة قياس ضغط الدم ومراقبة الصحة المعتمدة سريرياً',
    logo: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=150&q=80',
    website: 'https://www.omron-healthcare.com'
  },
  {
    name: 'Beurer Medical',
    nameAr: 'بويرر الطبية الألمانية',
    code: 'BEU-DE',
    country: 'ألمانيا',
    description: 'خبرة ألمانية عريقة منذ 1919 في ابتكار أجهزة القياس والتشخيص والعلاج الطبي المنزلي',
    logo: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=150&q=80',
    website: 'https://www.beurer.com'
  },
  {
    name: 'Riester Medical',
    nameAr: 'ريستر ميديكال الألمانية',
    code: 'RIE-DE',
    country: 'ألمانيا',
    description: 'أفضل أدوات الفحص السريري والسماعات الطبية التشخيصية ومناظير الفحص الدقيقة',
    logo: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&w=150&q=80',
    website: 'https://www.riester.de'
  },
  {
    name: 'MedTech Pro',
    nameAr: 'ميدتيك برو للحلول الطبية',
    code: 'MTP-US',
    country: 'الولايات المتحدة',
    description: 'حلول متكاملة في كراسي ومعدات الحركة وتجهيزات المستشفيات والعيادات التخصصية',
    logo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=150&q=80',
    website: 'https://www.medtechpro.com'
  },
  {
    name: 'Littmann 3M',
    nameAr: 'ليتمان ثري إم',
    code: 'LIT-US',
    country: 'الولايات المتحدة',
    description: 'السماعات الطبية الأكثر ثقة واعتماداً لدى الأطباء واستشاريي أمراض القلب حول العالم',
    logo: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=150&q=80',
    website: 'https://www.3m.com/littmann'
  }
];

const sampleProducts = [
  {
    sku: 'OMR-M3-BP',
    name: 'جهاز قياس ضغط الدم الرقمي الأوتوماتيكي Omron M3 Comfort',
    categoryCode: 'CAT-DIAG-01',
    brandCode: 'OMR-JP',
    price: 185,
    oldPrice: 230,
    costPrice: 120,
    stock: 45,
    minStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=600&q=80',
    badge: 'الأكثر طلباً',
    badgePrice: 'وفر 20%',
    rating: 5,
    reviewsCount: 49,
    isFeatured: true,
    medicalCode: 'SFDA-MD-2024-892',
    sfdaApproved: true,
    warranty: 'ضمان 3 سنوات من الوكيل المعتمد',
    originCountry: 'اليابان',
    description: 'جهاز قياس ضغط الدم عالي الدقة مزود بسوار Intelli Wrap بتقنية 360 درجة لضمان قراءات دقيقة في أي موضع حول الذراع، مع كشف عدم انتظام ضربات القلب ومؤشر ارتفاع ضغط الدم.',
    specifications: [
      { key: 'نوع الشاشة', value: 'شاشة LCD رقمية واضحة' },
      { key: 'سعة الذاكرة', value: 'ذاكرة تتسع لـ 60 قراءة لمستخدمين اثنين' },
      { key: 'نطاق القياس', value: 'الضغط: 0 إلى 299 ملم زئبق، النبض: 40 إلى 180 نبضة/د' },
      { key: 'مصدر الطاقة', value: '4 بطاريات AA 1.5V أو محول تيار متردد' }
    ],
    tags: ['ضغط الدم', 'أومرون', 'تشخيص', 'منزلي']
  },
  {
    sku: 'BEU-FT90',
    name: 'جهاز قياس حرارة طبي بالأشعة تحت الحمراء للجبهة Beurer FT 90',
    categoryCode: 'CAT-CLIN-02',
    brandCode: 'BEU-DE',
    price: 95,
    oldPrice: 130,
    costPrice: 60,
    stock: 60,
    minStockAlert: 15,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    badge: 'توصيل فوري',
    badgePrice: 'وفر 27%',
    rating: 5,
    reviewsCount: 34,
    isFeatured: true,
    medicalCode: 'SFDA-MD-2023-410',
    sfdaApproved: true,
    warranty: 'ضمان سنتين ألماني',
    originCountry: 'ألمانيا',
    description: 'مقياس حرارة لا تلامسي متطور يقيس درجة حرارة الجسم وسطح الأشياء والسوائل في ثوانٍ معدودة عبر الأشعة تحت الحمراء مع إنذار ضوئي وصوتي عند ارتفاع الحرارة.',
    specifications: [
      { key: 'المسافة المطلوبة', value: '2 إلى 3 سم بدون ملامسة' },
      { key: 'زمن القياس', value: 'أقل من ثانيتين' },
      { key: 'دقة القياس', value: '± 0.2 درجة مئوية' },
      { key: 'سعة التخزين', value: '60 سجل قياس مع التاريخ والوقت' }
    ],
    tags: ['حرارة', 'ترمومتر', 'بويرر', 'أطفال']
  },
  {
    sku: 'MTP-WC120',
    name: 'كرسي متحرك طبي خفيف الوزن قابل للطي من الألومنيوم MedTech Pro',
    categoryCode: 'CAT-FURN-03',
    brandCode: 'MTP-US',
    price: 680,
    oldPrice: 850,
    costPrice: 450,
    stock: 22,
    minStockAlert: 5,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    badge: 'شحن مجاني',
    badgePrice: 'وفر 20%',
    rating: 5,
    reviewsCount: 23,
    isFeatured: true,
    medicalCode: 'SFDA-MD-2024-118',
    sfdaApproved: true,
    warranty: 'ضمان سنتين على الهيكل',
    originCountry: 'الولايات المتحدة',
    description: 'كرسي متحرك فائق الجودة وخفيف الوزن مصنوع من سبائك الألومنيوم المقاومة للصدأ، مزود بفرامل يد للمرافق ومكابح للعجلات ومساند أقدام قابلة للتعديل والفك.',
    specifications: [
      { key: 'أقصى وزن للمستخدم', value: '130 كجم' },
      { key: 'وزن الكرسي الإجمالي', value: '11.5 كجم' },
      { key: 'عرض المقعد', value: '46 سم' },
      { key: 'نوع العجلات', value: 'عجلات صلبة مانعة للانزلاق ومقاومة للثقب' }
    ],
    tags: ['كرسي متحرك', 'كبار السن', 'معينات حركة']
  },
  {
    sku: 'LIT-CLS3-ST',
    name: 'سماعة طبية تشخيصية احترافية 3M Littmann Classic III',
    categoryCode: 'CAT-CLIN-02',
    brandCode: 'LIT-US',
    price: 380,
    oldPrice: 450,
    costPrice: 260,
    stock: 35,
    minStockAlert: 8,
    image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?auto=format&fit=crop&w=600&q=80',
    badge: 'الأعلى تقييماً',
    badgePrice: 'وفر 16%',
    rating: 5,
    reviewsCount: 88,
    isFeatured: true,
    medicalCode: 'SFDA-MD-2022-773',
    sfdaApproved: true,
    warranty: 'ضمان 5 سنوات من الشركة المصنعة',
    originCountry: 'الولايات المتحدة',
    description: 'المعيار الذهبي للأطباء والطلاب والممرضين، حساسية صوتية عالية لاستماع دقيق للأصوات القلبية والرئوية والوعائية.',
    specifications: [
      { key: 'المادة', value: 'ستانلس ستيل وسبائك الألومنيوم' },
      { key: 'طول الأنبوب', value: '69 سم' },
      { key: 'قطر الحجاب الحاجز', value: '4.3 سم للكبار / 3.3 سم للأطفال' }
    ],
    tags: ['سماعة', 'ليتمان', 'أطباء', 'تشخيص']
  },
  {
    sku: 'OMR-NE-C28',
    name: 'جهاز استنشاق البخار والنيبولايزر الضاغط Omron CompAir NE-C28P',
    categoryCode: 'CAT-RESP-06',
    brandCode: 'OMR-JP',
    price: 240,
    oldPrice: 300,
    costPrice: 160,
    stock: 28,
    minStockAlert: 6,
    image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?auto=format&fit=crop&w=600&q=80',
    badge: 'كفاءة عالية',
    badgePrice: 'وفر 20%',
    rating: 5,
    reviewsCount: 42,
    isFeatured: true,
    medicalCode: 'SFDA-MD-2023-902',
    sfdaApproved: true,
    warranty: 'ضمان 3 سنوات',
    originCountry: 'اليابان',
    description: 'جهاز استنشاق رذاذي طبي عالي الكفاءة مخصص لعلاج الربو والتهاب الشعب الهوائية وأمراض الجهاز التنفسي لدى الكبار والأطفال.',
    specifications: [
      { key: 'معدل التبخير', value: '0.5 مل / دقيقة' },
      { key: 'حجم الجسيمات', value: '3.0 ميكرومتر' },
      { key: 'سعة حجرة الدواء', value: 'من 2 إلى 10 مل' }
    ],
    tags: ['نيبولايزر', 'بخار', 'تنفس', 'أومرون']
  },
  {
    sku: 'BEU-GL50-EVO',
    name: 'جهاز قياس نسبة السكر في الدم المتكامل Beurer GL 50 evo 3-in-1',
    categoryCode: 'CAT-DIAG-01',
    brandCode: 'BEU-DE',
    price: 110,
    oldPrice: 145,
    costPrice: 70,
    stock: 50,
    minStockAlert: 10,
    image: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?auto=format&fit=crop&w=600&q=80',
    badge: '3 في 1 مبتكر',
    badgePrice: 'وفر 24%',
    rating: 5,
    reviewsCount: 31,
    isFeatured: true,
    medicalCode: 'SFDA-MD-2023-311',
    sfdaApproved: true,
    warranty: 'ضمان سنتين',
    originCountry: 'ألمانيا',
    description: 'جهاز مبتكر يدمج أداة الوخز ومحول الـ USB ومقياس السكر في جهاز واحد فائق الأناقة مع ذاكرة ذكية وتطبيق متوافق.',
    specifications: [
      { key: 'حجم عينة الدم', value: '0.6 ميكرولتر' },
      { key: 'مدة الاختبار', value: '5 ثوان فقط' },
      { key: 'سعة الذاكرة', value: '480 قياس مع التاريخ والوقت' }
    ],
    tags: ['سكر', 'جلوكوز', 'بويرر', 'تحليل دم']
  }
];

module.exports = {
  users,
  categories,
  brands,
  sampleProducts
};
