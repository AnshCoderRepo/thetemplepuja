export const stats = [
  { value: "10,847+", label: "Total Bookings", icon: "🪔" },
  { value: "50+", label: "Pooja Types", icon: "🕉️" },
  { value: "200+", label: "Certified Pandits", icon: "🙏" },
  { value: "24/7", label: "Support", icon: "✨" },
];

export const heroCtas = [
  { label: "Book Pooja", href: "/book/form", primary: true },
  { label: "Explore Events", href: "#events" },
];

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Events", href: "#events" },
  { label: "Why Us", href: "#why-us" },
  { label: "Deals", href: "#deals" },
  { label: "Reviews", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

// Upcoming events are scheduled relative to today so the feed never shows stale/past dates.
// Each spec lists daysFromToday; getUpcomingEvents() computes real dates, drops any that have
// already passed, and returns them closest-first.

const eventDateFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

function toISODate(d: Date): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export interface UpcomingEvent {
  title: string;
  slug: string;
  date: string; // display, e.g. "Tue, Aug 12"
  dateISO: string; // machine-readable, e.g. "2026-08-12"
  time: string;
  seats: string;
  live: boolean;
  price: string;
  emoji: string;
  gradient: string;
}

export interface UpcomingEventSpec {
  title: string;
  slug: string;
  daysFromToday: number;
  time: string;
  seats: string;
  live: boolean;
  price: string;
  emoji: string;
  gradient: string;
}

export const upcomingEventSpecs: UpcomingEventSpec[] = [
  {
    title: "Hanuman Pooja",
    slug: "hanuman-pooja",
    daysFromToday: 8,
    time: "7:00 PM IST",
    seats: "Only 12 seats left",
    live: true,
    price: "₹501",
    emoji: "🐒",
    gradient: "from-orange-400 to-rose-500",
  },
  {
    title: "Satyanarayan Katha",
    slug: "satyanarayan-katha",
    daysFromToday: 10,
    time: "6:30 PM IST",
    seats: "18 spots open",
    live: true,
    price: "₹1,101",
    emoji: "📿",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    title: "Rudrabhishek",
    slug: "rudrabhishek",
    daysFromToday: 12,
    time: "5:00 AM IST",
    seats: "Only 9 seats left",
    live: true,
    price: "₹2,501",
    emoji: "🕉️",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "Griha Pravesh",
    slug: "griha-pravesh",
    daysFromToday: 13,
    time: "10:00 AM IST",
    seats: "5 slots available",
    live: false,
    price: "₹3,501",
    emoji: "🏠",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Shani Dev Pooja",
    slug: "shani-dev-pooja",
    daysFromToday: 14,
    time: "9:00 PM IST",
    seats: "20 spots open",
    live: true,
    price: "₹1,001",
    emoji: "🪐",
    gradient: "from-slate-600 to-gray-900",
  },
  {
    title: "Navgraha Shanti",
    slug: "navgraha-shanti",
    daysFromToday: 18,
    time: "8:00 AM IST",
    seats: "Only 15 seats left",
    live: false,
    price: "₹5,001",
    emoji: "✨",
    gradient: "from-fuchsia-500 to-pink-600",
  },
];

export function getUpcomingEvents(
  today: Date = new Date(),
  specs: UpcomingEventSpec[] = upcomingEventSpecs
): UpcomingEvent[] {
  const todayISO = toISODate(today);
  return specs
    .map((spec) => {
      const d = addDays(today, spec.daysFromToday);
      return {
        title: spec.title,
        slug: spec.slug,
        date: eventDateFmt.format(d),
        dateISO: toISODate(d),
        time: spec.time,
        seats: spec.seats,
        live: spec.live,
        price: spec.price,
        emoji: spec.emoji,
        gradient: spec.gradient,
      };
    })
    .filter((e) => e.dateISO >= todayISO)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}



export const whyUs = [
  {
    icon: "🕉️",
    title: "Vedic Authenticity",
    description:
      "Every ritual strictly follows ancient scriptures by certified pandits with 10+ years experience.",
  },
  {
    icon: "💳",
    title: "Razorpay Secure Pay",
    description:
      "100% secure — UPI, Card, Net Banking. Instant booking confirmation after payment.",
  },
  {
    icon: "📱",
    title: "Instant WhatsApp Alert",
    description:
      "Admin notified on WhatsApp the moment payment is confirmed. Zero delay.",
  },
  {
    icon: "📹",
    title: "Video Recording",
    description:
      "Every pooja is recorded in HD and the recording link is shared with you right after the ritual.",
  },
  {
    icon: "🤖",
    title: "AI Spiritual Guide",
    description:
      "AI assistant recommends the right pooja based on your nakshatra, rashi, and situation 24/7.",
  },
  {
    icon: "📦",
    title: "Home Kit Delivery",
    description:
      "Authentic samagri kits delivered anywhere in India. Blessed by pandits. 2–5 day delivery.",
  },
];

export const deals = [
  {
    badge: "30% OFF",
    title: "First Booking",
    description: "Get 30% instant discount on your very first pooja booking.",
    code: "TEMPLE30",
    icon: "🎉",
    gradient: "from-saffron-500 to-saffron-700",
  },
  {
    badge: "FREE",
    title: "Shubh Muhurat",
    description: "Get a personalised shubh muhurat recommendation with every pooja booking.",
    code: "MUHURAT",
    icon: "🪔",
    gradient: "from-sky-500 to-indigo-700",
  },
  {
    badge: "20% OFF",
    title: "Bundle Deal",
    description: "Book 3 or more poojas and get 20% off on the total.",
    code: "BUNDLE20",
    icon: "🛍️",
    gradient: "from-emerald-500 to-teal-700",
  },
  {
    badge: "FREE",
    title: "Kundli with Pooja",
    description: "Book any pooja above ₹1,500 and get a free kundli reading.",
    code: "TEMPLEKUNDLI",
    icon: "🔮",
    gradient: "from-indigo-500 to-purple-700",
  },
];

export const testimonials = [
  {
    name: "Priya Sharma",
    location: "Mumbai, Maharashtra",
    rating: 5,
    text: "Booked Griha Pravesh pooja for our new home. The pandit ji was extremely knowledgeable and the rituals were performed exactly as per scriptures. The video recording was a blessing for our family abroad!",
    avatar: "PS",
    color: "from-rose-400 to-pink-600",
  },
  {
    name: "Rajesh Kumar",
    location: "New Delhi",
    rating: 5,
    text: "The HD video recording of our pooja was an unforgettable experience. The clarity was excellent and the booking process took less than 2 minutes. Truly blessed!",
    avatar: "RK",
    color: "from-saffron-400 to-orange-600",
  },
  {
    name: "Anita Deshmukh",
    location: "Pune, Maharashtra",
    rating: 5,
    text: "Ordered the Satyanarayan pooja kit — it arrived within 3 days, beautifully packed and blessed. The WhatsApp confirmation and reminders are a very thoughtful touch.",
    avatar: "AD",
    color: "from-emerald-400 to-teal-600",
  },
  {
    name: "Vikram Singh",
    location: "Jaipur, Rajasthan",
    rating: 5,
    text: "Booked Navgraha Shanti for our family — the pandit ji explained every step and the havan was performed flawlessly. The video recording let our relatives abroad join in the blessings.",
    avatar: "VS",
    color: "from-indigo-400 to-purple-600",
  },
];

export const faqs = [
  {
    q: "How do I book a pooja on The Temple Puja?",
    a: "Simply select your pooja, choose a date, fill in your details (name, gotra, city, mobile number), and complete secure payment via UPI, card or net banking. Your booking is confirmed instantly and admin is notified on WhatsApp.",
  },
  {
    q: "Are the pandits certified and experienced?",
    a: "Yes. All our pandits are certified Vedic scholars with 10+ years of experience. Each one is verified through a rigorous background check and regularly reviewed by our devotees.",
  },
  {
    q: "Will I receive a video recording of my pooja?",
    a: "Yes! Every pooja is recorded in HD, and we share the recording link with you right after the ritual — so you and your family can relive the blessings from anywhere, anytime.",
  },
  {
    q: "How long does home delivery of pooja kits take?",
    a: "Pooja kits and sacred items are delivered anywhere in India within 2–5 business days. Every kit is blessed by our pandits before shipping.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI (GPay, PhonePe, Paytm), all debit/credit cards, and net banking — all securely processed through Razorpay with 100% SSL encryption.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. If a pooja cannot be performed due to unforeseen circumstances, we offer a full refund or rescheduling at no extra cost. Donations made towards temple seva are non-refundable.",
  },
];

export const contactInfo = [
  {
    icon: "📱",
    label: "WhatsApp",
    value: "+91 87653 01563",
    href: "https://wa.me/918765301563",
  },
  {
    icon: "📞",
    label: "Phone",
    value: "+91 87653 01563",
    href: "tel:+918765301563",
  },
  {
    icon: "✉️",
    label: "Email",
    value: "supportsatyakarm@gmail.com",
    href: "mailto:supportsatyakarm@gmail.com",
  },
  {
    icon: "📍",
    label: "Address",
    value: "JMD, Pacific Square, Gurgaon Sector 15, India 122001",
    href: undefined,
  },
];

// ===================== POOJA CATALOG =====================

export interface Pooja {
  slug: string;
  title: string;
  hindiTitle: string;
  emoji: string;
  gradient: string;
  price: number;
  duration: string;
  bestMuhurat: string;
  description: string;
  benefits: string[];
  /** Admin toggle — when false the pooja is hidden from the site (booking
   * form, catalogue and detail pages) until it is turned back on. Absent on
   * older stored data, which is treated as active. */
  active?: boolean;
}

/** True unless the admin explicitly deactivated the pooja. */
export function isPoojaActive(p: Pooja): boolean {
  return p.active !== false;
}

/** The poojas visitors should see — inactive ones are filtered out. */
export function activePoojas(list: Pooja[]): Pooja[] {
  return list.filter(isPoojaActive);
}

export const poojas: Pooja[] = [
  {
    slug: "satyanarayan-katha",
    title: "Satyanarayan Katha",
    hindiTitle: "श्री सत्यनारायण कथा",
    emoji: "📿",
    gradient: "from-amber-400 to-orange-600",
    price: 1101,
    duration: "2–3 hours",
    bestMuhurat: "Purnima & Sankranti",
    description:
      "The beloved vow-fulfillment ritual of Lord Vishnu's Satyanarayan form, bringing peace, prosperity and harmony to the whole family.",
    benefits: ["Prosperity & abundance", "Family peace & harmony", "Vow fulfillment", "Blessed prasadam"],
  },
  {
    slug: "rudrabhishek",
    title: "Rudrabhishek",
    hindiTitle: "श्री रुद्राभिषेक",
    emoji: "🕉️",
    gradient: "from-indigo-500 to-purple-600",
    price: 2501,
    duration: "1.5–2 hours",
    bestMuhurat: "Monday & Pradosh",
    description:
      "Sacred abhishek of the Shiva Linga with panchamrit, bilva leaves and Vedic chants — a powerful ritual for protection and inner strength.",
    benefits: ["Divine protection", "Removal of obstacles", "Health & longevity", "Inner strength"],
  },
  {
    slug: "griha-pravesh",
    title: "Griha Pravesh",
    hindiTitle: "गृह प्रवेश",
    emoji: "🏠",
    gradient: "from-emerald-500 to-teal-600",
    price: 3501,
    duration: "2–3 hours",
    bestMuhurat: "Vastu muhurat",
    description:
      "Vedic house-warming ceremony that purifies and energises your new home, invoking Goddess Lakshmi and Vastu Devta for lasting positivity.",
    benefits: ["Positive energies", "Vastu harmony", "A peaceful home", "Blessings of Lakshmi"],
  },
  {
    slug: "shani-dev-pooja",
    title: "Shani Dev Pooja",
    hindiTitle: "शनि देव पूजा",
    emoji: "🪐",
    gradient: "from-slate-600 to-gray-900",
    price: 1001,
    duration: "1.5 hours",
    bestMuhurat: "Saturday",
    description:
      "Special worship of Lord Shani with tail oil, black til and Shani mantra japa to pacify Saturn and bring stability during sade sati.",
    benefits: ["Sade sati relief", "Career stability", "Protection from malefic", "Patience & discipline"],
  },
  {
    slug: "navgraha-shanti",
    title: "Navgraha Shanti",
    hindiTitle: "नवग्रह शांति",
    emoji: "✨",
    gradient: "from-fuchsia-500 to-pink-600",
    price: 5001,
    duration: "3–4 hours",
    bestMuhurat: "Graha shanti muhurat",
    description:
      "A comprehensive ritual pacifying all nine planets with individual homas, dosha remedies and kumbha abhishek for overall well-being.",
    benefits: ["Balances all 9 planets", "Removes doshas", "Overall well-being", "Auspicious beginnings"],
  },
  {
    slug: "hanuman-pooja",
    title: "Hanuman Pooja",
    hindiTitle: "हनुमान पूजा",
    emoji: "🐒",
    gradient: "from-orange-400 to-rose-500",
    price: 501,
    duration: "1 hour",
    bestMuhurat: "Tuesday & Saturday",
    description:
      "Worship of Bajrang Bali with sindoor, chola and Hanuman Chalisa path to fill your life with courage, strength and fearlessness.",
    benefits: ["Courage & strength", "Removal of fear", "Enemy troubles removed", "Speedy justice"],
  },
  {
    slug: "lakshmi-pooja",
    title: "Lakshmi Pooja",
    hindiTitle: "लक्ष्मी पूजा",
    emoji: "🪙",
    gradient: "from-yellow-400 to-amber-600",
    price: 1101,
    duration: "1.5 hours",
    bestMuhurat: "Friday & Diwali",
    description:
      "Invoke Mahalakshmi with lotus offerings, shri yantra pujan and 108 names path to attract wealth, prosperity and financial stability.",
    benefits: ["Wealth & prosperity", "Business growth", "Financial stability", "Blessings of Mahalakshmi"],
  },
  {
    slug: "maha-mrityunjaya-jap",
    title: "Maha Mrityunjaya Jap",
    hindiTitle: "महामृत्युंजय जाप",
    emoji: "🔱",
    gradient: "from-sky-500 to-blue-700",
    price: 2101,
    duration: "2 hours",
    bestMuhurat: "Mahashivratri",
    description:
      "11,000 recitations of the Maha Mrityunjaya mantra with havan — a profound ritual for healing, protection and victory over fear.",
    benefits: ["Health & healing", "Protection from accidents", "Longevity", "Peace of mind"],
  },
  {
    slug: "saraswati-pooja",
    title: "Saraswati Pooja",
    hindiTitle: "सरस्वती पूजा",
    emoji: "📚",
    gradient: "from-rose-400 to-pink-600",
    price: 1501,
    duration: "1.5 hours",
    bestMuhurat: "Vasant Panchami",
    description:
      "Seek the blessings of Goddess Saraswati for students and artists — with aksharabhyas, pustak pujan and Vedic chants for wisdom.",
    benefits: ["Wisdom & knowledge", "Academic success", "Creative inspiration", "Speech clarity"],
  },
  {
    slug: "durga-saptashati-path",
    title: "Durga Saptashati Path",
    hindiTitle: "दुर्गा सप्तशती पाठ",
    emoji: "🗡️",
    gradient: "from-red-500 to-rose-700",
    price: 2501,
    duration: "7 days (1 hour/day)",
    bestMuhurat: "Navratri",
    description:
      "Complete recitation of the 700 verses of Devi Mahatmya over seven days — the ultimate shield against negativity and fear.",
    benefits: ["Removal of negativity", "Divine protection", "Courage in adversity", "Shakti & confidence"],
  },
  {
    slug: "vishwakarma-pooja",
    title: "Vishwakarma Pooja",
    hindiTitle: "विश्वकर्मा पूजा",
    emoji: "⚒️",
    gradient: "from-amber-500 to-yellow-600",
    price: 1001,
    duration: "1 hour",
    bestMuhurat: "Vishwakarma Day",
    description:
      "Worship of the divine architect Vishwakarma for workshops, factories and vehicles — ensuring safety, skill and business growth.",
    benefits: ["Business prosperity", "Machine & vehicle safety", "Success in work", "Skill enhancement"],
  },
  {
    slug: "kuber-pooja",
    title: "Kuber Pooja",
    hindiTitle: "कुबेर पूजा",
    emoji: "💎",
    gradient: "from-emerald-400 to-green-600",
    price: 1101,
    duration: "1.5 hours",
    bestMuhurat: "Dhanteras",
    description:
      "Worship of Lord Kuber with the Kuber Yantra to attract wealth, clear debts and open new doors of financial opportunity.",
    benefits: ["Attract wealth", "Business growth", "Debt relief", "Financial wisdom"],
  },
];

export function getPooja(slug: string): Pooja | undefined {
  return poojas.find((p) => p.slug === slug);
}

// ===================== COUPONS =====================

export type CouponKind = "percent" | "benefit";

export interface Coupon {
  kind: CouponKind;
  label: string;
  description: string;
  /** Percent off — only used when kind === "percent" */
  value?: number;
  /** Only valid for a devotee's very first booking (TEMPLE30) */
  firstBookingOnly?: boolean;
  /** Minimum total bookings (this + past confirmed) needed to use the coupon */
  minBookings?: number;
  /** Minimum pooja price required to use the coupon */
  minAmount?: number;
}

export const coupons: Record<string, Coupon> = {
  TEMPLE30: {
    kind: "percent",
    value: 30,
    label: "30% off your first booking",
    description: "New devotees get 30% off their very first pooja.",
    firstBookingOnly: true,
  },
  BUNDLE20: {
    kind: "percent",
    value: 20,
    label: "20% off when booking 3+ poojas",
    description: "Book three or more poojas and save 20% on this one.",
    minBookings: 3,
  },
  MUHURAT: {
    kind: "benefit",
    label: "Free shubh muhurat guidance",
    description: "Get a personalised shubh muhurat for your pooja — free with every booking.",
  },
  TEMPLEKUNDLI: {
    kind: "benefit",
    label: "Free kundli reading with your pooja",
    description: "Book any pooja above ₹1,500 and get a free kundli reading.",
    minAmount: 1500,
  },
};
