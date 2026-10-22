// Type definitions and safe default configurations for the Website Content Management System (CMS).

export interface TickerItem {
  icon: string;
  label: string;
  hindiLabel?: string;
  teluguLabel?: string;
  tamilLabel?: string;
}

export interface AnnouncementStripConfig {
  enabled?: boolean;
  items?: TickerItem[];
}

export interface HeroContentConfig {
  badgeText?: string;
  hindiBadgeText?: string;
  teluguBadgeText?: string;
  tamilBadgeText?: string;
  title?: string;
  hindiTitle?: string;
  teluguTitle?: string;
  tamilTitle?: string;
  titleHighlight?: string;
  hindiTitleHighlight?: string;
  teluguTitleHighlight?: string;
  tamilTitleHighlight?: string;
  subtitle?: string;
  hindiSubtitle?: string;
  teluguSubtitle?: string;
  tamilSubtitle?: string;
  ctaText?: string;
  hindiCtaText?: string;
  teluguCtaText?: string;
  tamilCtaText?: string;
  ctaLink?: string;
  featuredPujaSlug?: string;
  featuredPujaCardSlug?: string;
}

export interface VedicAssuranceItem {
  id?: string;
  icon?: string;
  title: string;
  description?: string;
  hindiTitle?: string;
  hindiDescription?: string;
  teluguTitle?: string;
  teluguDescription?: string;
  tamilTitle?: string;
  tamilDescription?: string;
  active?: boolean;
}

export interface VedicAssurancesConfig {
  heading?: string;
  hindiHeading?: string;
  teluguHeading?: string;
  tamilHeading?: string;
  subheading?: string;
  hindiSubheading?: string;
  teluguSubheading?: string;
  tamilSubheading?: string;
  items?: VedicAssuranceItem[];
}

export interface FooterContentConfig {
  aboutText?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  address?: string;
  copyrightText?: string;
}

export interface SiteContent {
  announcementStrip?: AnnouncementStripConfig;
  hero?: HeroContentConfig;
  vedicAssurances?: VedicAssurancesConfig;
  footer?: FooterContentConfig;
}

export const DEFAULT_VEDIC_ASSURANCES: VedicAssuranceItem[] = [
  {
    id: "purohit-1",
    icon: "🪔",
    title: "100% Certified Vedic Purohit from Kashi / Ayodhya",
    description: "Every ritual is performed strictly per Shastra vidhi by initiated scholars.",
    hindiTitle: "काशी / अयोध्या के 100% प्रमाणित वैदिक पुरोहित",
    hindiDescription: "प्रत्येक अनुष्ठान शास्त्रोक्त विधि द्वारा दीक्षा प्राप्त विद्वानों द्वारा संपन्न किया जाता है।",
    teluguTitle: "కాశీ / అయోధ్య నుండి 100% ధృవీకరించబడిన వేద పురోహితులు",
    tamilTitle: "காசி / அயோத்தியின் 100% சான்றளிக்கப்பட்ட வேத பண்டிதர்கள்",
    active: true,
  },
  {
    id: "sankalp-2",
    icon: "📜",
    title: "Personalized Vedic Sankalp with your Name & Gotra",
    description: "Sacred chanting invoking blessings for your specific kul-gotra and family members.",
    hindiTitle: "आपके नाम और गोत्र के साथ व्यक्तिगत वैदिक संकल्प",
    hindiDescription: "आपके कुल-गोत्र और परिवार के कल्याण हेतु विशेष वैदिक संकल्प मंत्रोच्चार।",
    teluguTitle: "మీ పేరు మరియు గోత్రంతో వ్యక్తిగతీకరించిన వేద సంకల్పం",
    tamilTitle: "உங்கள் பெயர் மற்றும் கோத்திரத்துடன் தனிப்பயனாக்கப்பட்ட வேத சங்கல்பம்",
    active: true,
  },
  {
    id: "sanctuary-3",
    icon: "🛕",
    title: "Direct In-Person Participation at Temple Sanctuary",
    description: "Holy darshan and live participation arrangement directly within sacred premises.",
    hindiTitle: "पवित्र मंदिर गर्भगृह में प्रत्यक्ष सहभागिता",
    hindiDescription: "पवित्र मंदिर परिसर में दर्शन और पूजा में प्रत्यक्ष भागीदारी की व्यवस्था।",
    teluguTitle: "దేవాలయ ప్రాంగణంలో ప్రత్యక్ష పూజా భాగస్వామ్యం",
    tamilTitle: "புனித கோயில் கருவறையில் நேரடி வழிபாடு",
    active: true,
  },
  {
    id: "prasad-4",
    icon: "📦",
    title: "Prasad & Consecrated Raksha Sutra Delivery",
    description: "Blessed temple prasad, vibhuti and sacred thread delivered to your doorstep.",
    hindiTitle: "अभिमंत्रित प्रसाद और रक्षा सूत्र की होम डिलीवरी",
    hindiDescription: "मंदिर का पावन प्रसाद, भस्म और रक्षा सूत्र सुरक्षित आपके घर पहुंचाया जाता है।",
    teluguTitle: "పవిత్ర ప్రసాదం మరియు రక్షా సూత్రం హోమ్ డెలివరీ",
    tamilTitle: "அருள் பெற்ற பிரசாதம் மற்றும் ரக்ஷா சூத்திரம் இல்லம் தேடி",
    active: true,
  },
  {
    id: "verified-5",
    icon: "🛡️",
    title: "Verified Seva Guarantee",
    description: "Complete transparency with verified receipt, video recording and devotee assistance.",
    hindiTitle: "सत्यापित सेवा गारंटी",
    hindiDescription: "सत्यापित रसीद, एचडी वीडियो रिकॉर्डिंग और संपूर्ण पारदर्शिता के साथ सेवा।",
    teluguTitle: "ధృవీకరించబడిన సేవా హామీ",
    tamilTitle: "சரிபார்க்கப்பட்ட சேவை உத்தரவாதம்",
    active: true,
  },
];

export const DEFAULT_SITE_CONTENT: SiteContent = {
  announcementStrip: {
    enabled: true,
    items: [
      { icon: "🙏", label: "Authentic Vedic Puja Services", hindiLabel: "प्रामाणिक वैदिक पूजा सेवाएं", teluguLabel: "ప్రామాణిక వేద పూజా సేవలు", tamilLabel: "வேத முறை பூசை சேவைகள்" },
      { icon: "🪔", label: "Book Verified Panditji", hindiLabel: "प्रमाणित पंडित जी बुक करें", teluguLabel: "ధృవీకరించబడిన పండితుల బుకింగ్", tamilLabel: "அங்கீகரிக்கப்பட்ட பண்டிதர் முன்பதிவு" },
      { icon: "📅", label: "Convenient Online Puja Booking", hindiLabel: "सुगम ऑनलाइन पूजा बुकिंग", teluguLabel: "సులభమైన ఆన్‌లైన్ పూజా బుకింగ్", tamilLabel: "எளிய ஆன்லைன் பூசை முன்பதிவு" },
      { icon: "🔔", label: "Live Puja Access", hindiLabel: "लाइव पूजा दर्शन", teluguLabel: "లైవ్ పూజా దర్శనం", tamilLabel: "நேரலை பூசை தரிசனம்" },
      { icon: "🛕", label: "Explore Sacred Temples", hindiLabel: "पवित्र मंदिर दर्शन", teluguLabel: "పవిత్ర దేవాలయాలు", tamilLabel: "புனித திருத்தலங்கள்" },
      { icon: "📦", label: "Prasad Delivery", hindiLabel: "प्रसाद होम डिलीवरी", teluguLabel: "ప్రసాదం డెలివరీ", tamilLabel: "பிரசாதம் விநியோகம்" },
      { icon: "📞", label: "Booking Assistance", hindiLabel: "बुकिंग सहायता", teluguLabel: "బుకింగ్ సహాయం", tamilLabel: "முன்பதிவு உதவி" },
    ],
  },
  hero: {
    badgeText: "Authentic Vedic Seva",
    hindiBadgeText: "प्रामाणिक वैदिक सेवा",
    teluguBadgeText: "ప్రామాణిక వేద సేవ",
    tamilBadgeText: "வேத முறை பூசை சேவைகள்",
    title: "Book Authentic Temple Pujas",
    hindiTitle: "प्रामाणिक मंदिर पूजा बुक करें",
    teluguTitle: "ప్రామాణిక ఆలయ పూజలను బుక్ చేయండి",
    tamilTitle: "அங்கீகரிக்கப்பட்ட கோயில் பூஜைகளை பதிவு செய்யுங்கள்",
    titleHighlight: "Online with Verified Pandits",
    hindiTitleHighlight: "प्रमाणित पंडितों के साथ ऑनलाइन",
    teluguTitleHighlight: "ధృవీకరించబడిన పండితులతో ఆన్‌లైన్",
    tamilTitleHighlight: "சான்றளிக்கப்பட்ட பண்டிதர்களுடன் ஆன்லைனில்",
    subtitle: "Experience divine blessings from renowned holy temples of India from the comfort of your home.",
    hindiSubtitle: "अपने घर बैठे भारत के प्रसिद्ध पावन मंदिरों से दिव्य आशीर्वाद प्राप्त करें।",
    teluguSubtitle: "మీ ఇంటి వద్ద నుండే భారతదేశంలోని ప్రసిద్ధ పవిత్ర ఆలయాల నుండి దైవిక ఆశీస్సులను పొందండి.",
    tamilSubtitle: "உங்கள் வீட்டிலிருந்தே இந்தியாவின் புகழ்பெற்ற புனித கோயில்களின் தெய்வீக அருளைப் பெறுங்கள்.",
    ctaText: "Book Puja Now",
    hindiCtaText: "पूजाएं देखें",
    teluguCtaText: "పూజలను అన్వేషించండి",
    tamilCtaText: "பூஜைகளை ஆராயுங்கள்",
    ctaLink: "/#poojas",
    featuredPujaSlug: "satyanarayan-katha",
    featuredPujaCardSlug: "satyanarayan-katha",
  },
  vedicAssurances: {
    heading: "Vedic Assurances & Inclusions",
    hindiHeading: "वैदिक आश्वासन एवं सुविधाएं",
    teluguHeading: "వేద హామీలు మరియు ప్రత్యేకతలు",
    tamilHeading: "வேத உத்தரவாதங்கள் & சிறப்பம்சங்கள்",
    subheading: "Sacred guarantees that ensure every puja is conducted with utmost Vedic sanctity.",
    hindiSubheading: "पवित्र वैदिक मर्यादा और शास्त्रोक्त शुद्धता के साथ पूजा संपन्न करने की पावन गारंटी।",
    teluguSubheading: "ప్రతి పూజ సంపూర్ణ వేద పద్ధతిలో నిర్వహించబడుతుందని పవిత్రమైన హామీ.",
    tamilSubheading: "ஒவ்வொரு பூஜையும் உன்னதமான வேத தூய்மையுடன் நடத்தப்படுவதற்கான புனித உத்தரவாதம்.",
    items: DEFAULT_VEDIC_ASSURANCES,
  },
  footer: {
    aboutText: "TemplePujaSewa is India's leading authentic Vedic puja booking platform connecting devotees worldwide with sacred temples and verified scholars.",
    tagline: "Connecting Devotees to Divine Blessings Worldwide",
    phone: "+91 9988776655",
    email: "infotemplepujasewa@gmail.com",
    whatsappNumber: "+91 9988776655",
    address: "Kashi Sanctuary, Varanasi, Uttar Pradesh, India",
  },
};
