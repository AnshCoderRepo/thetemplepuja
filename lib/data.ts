import { SITE_CONFIG, getWhatsAppUrl } from "./config";

export const stats = [
  { value: "10,847+", label: "Total Bookings", icon: "🪔" },
  { value: "50+", label: "Temples", icon: "🕉️" },
  { value: "200+", label: "Certified Pandits", icon: "🙏" },
  { value: "24/7", label: "Support", icon: "✨" },
];

export const heroCtas = [
  { label: "Book Pooja", href: "/book/form", primary: true },
  { label: "Explore Poojas", href: "#poojas" },
];

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Poojas", href: "#poojas" },
  { label: "Why Us", href: "#why-us" },
  { label: "Reviews", href: "#testimonials" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

// Upcoming events are scheduled relative to today so the feed never shows stale/past dates.
// Each spec lists daysFromToday; getUpcomingEvents() computes real dates, drops any that have
// already passed, and returns them closest-first.

const eventDateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  month: "short",
  day: "numeric",
});

function toISODate(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
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
  /** Total seats for this live event occurrence. When set, availability is
   * derived from confirmed bookings instead of the `seats` label. */
  capacity?: number;
  /** Confirmed seats already taken — attached by the catalog API (server) or
   * the local cache (offline fallback) so the card shows live numbers. */
  bookedSeats?: number;
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
  /** Admin toggle — when false the event is hidden from the site (home page,
   * catalogue) until it is turned back on. Absent on older stored data,
   * which is treated as active. */
  active?: boolean;
  /** Total seats for the live event. When set, availability is computed from
   * confirmed bookings (auto seat release on cancel); when absent the curated
   * `seats` label is shown as-is. */
  capacity?: number;
  /** Confirmed seats already taken for this occurrence — attached by the
   * catalog API (server) or the local cache (offline fallback). */
  bookedSeats?: number;
}

/** True unless the admin explicitly deactivated the event. */
export function isEventActive(e: UpcomingEventSpec): boolean {
  return e.active !== false;
}

/** The events visitors should see — inactive ones are filtered out. */
export function activeEvents(list: UpcomingEventSpec[]): UpcomingEventSpec[] {
  return list.filter(isEventActive);
}

/** True when a pooja has event scheduling fields (shows on the carousel). */
export function isPoojaEvent(p: Pooja): boolean {
  return p.daysFromToday !== undefined && isPoojaActive(p);
}

/** Convert poojas with event scheduling into UpcomingEventSpec[] for the
 *  home page carousel — merges the two systems so admin only manages poojas. */
export function poojasAsEvents(
  poojas: Pooja[],
  bookings: SeatCountingBooking[] = []
): UpcomingEventSpec[] {
  return poojas
    .filter(isPoojaEvent)
    .map((p) => ({
      title: p.title,
      slug: p.slug,
      daysFromToday: p.daysFromToday!,
      time: p.eventTime ?? "",
      seats: p.seats ?? "Open",
      live: p.live ?? false,
      price: `\u20B9${p.price.toLocaleString("en-IN")}`,
      emoji: p.emoji,
      gradient: p.gradient,
      capacity: p.capacity,
      bookedSeats: eventBookedSeats(
        { slug: p.slug, daysFromToday: p.daysFromToday },
        bookings
      ),
    }));
}

export const upcomingEventSpecs: UpcomingEventSpec[] = [
  {
    title: "Hanuman Pooja",
    slug: "hanuman-pooja",
    daysFromToday: 8,
    time: "7:00 PM IST",
    seats: "Only 12 seats left",
    capacity: 20,
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
    capacity: 30,
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
    capacity: 15,
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
    capacity: 10,
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
    capacity: 40,
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
    capacity: 25,
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
        capacity: spec.capacity,
        bookedSeats: spec.bookedSeats,
      };
    })
    .filter((e) => e.dateISO >= todayISO)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

// ===================== DYNAMIC FESTIVALS & SEASONAL EVENTS =====================

export interface FestivalEvent {
  id: string;
  name: string;
  hindiName?: string;
  teluguName?: string;
  tamilName?: string;
  badge?: string;
  hindiBadge?: string;
  teluguBadge?: string;
  tamilBadge?: string;
  heroTitle: string;
  hindiHeroTitle?: string;
  teluguHeroTitle?: string;
  tamilHeroTitle?: string;
  heroSubtitle: string;
  hindiHeroSubtitle?: string;
  teluguHeroSubtitle?: string;
  tamilHeroSubtitle?: string;
  startDate?: string; // ISO date "YYYY-MM-DD"
  endDate?: string; // ISO date "YYYY-MM-DD"
  daysFromToday?: number; // relative offset for automatic seasonal rollover
  durationDays?: number; // length of festival in days (default: 9)
  heroImage?: string;
  mobileHeroImage?: string;
  relatedPoojaSlugs: string[];
  relatedTemples?: string[];
  ctaText?: string;
  hindiCtaText?: string;
  teluguCtaText?: string;
  tamilCtaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  hindiSecondaryCtaText?: string;
  teluguSecondaryCtaText?: string;
  tamilSecondaryCtaText?: string;
  secondaryCtaLink?: string;
  active?: boolean;
  priority?: number; // 1 = highest
}

export interface FestivalStatus {
  isLive: boolean;
  isUpcoming: boolean;
  isEnded: boolean;
  daysUntilStart: number;
  startDateISO: string;
  endDateISO: string;
  formattedDateRange: string;
  countdownText: string;
}

export const defaultFestivals: FestivalEvent[] = [
  {
    id: "navratri-2026",
    name: "Navratri 2026",
    hindiName: "नवरात्रि महापर्व 2026",
    teluguName: "నవరాత్రి మహోత్సవం 2026",
    tamilName: "நவராத்திரி திருவிழா 2026",
    badge: "🪔 UPCOMING FESTIVAL",
    hindiBadge: "🪔 आगामी पावन पर्व",
    teluguBadge: "🪔 రాబోయే పండుగ",
    tamilBadge: "🪔 வரவிருக்கும் திருவிழா",
    heroTitle: "Celebrate Navratri with Divine Pujas",
    hindiHeroTitle: "माँ दुर्गा के दिव्य अनुष्ठानों के साथ नवरात्रि मनाएं",
    teluguHeroTitle: "దివ్య నవరాత్రి పూజలతో అమ్మవారి అనుగ్రహం పొందండి",
    tamilHeroTitle: "புனித நவராத்திரி பூஜைகளுடன் அன்னையின் அருள் பெறுங்கள்",
    heroSubtitle:
      "Book special Navratri & Durga Saptashati Pujas from trusted temples and bring divine blessings to your home.",
    hindiHeroSubtitle:
      "प्रसिद्ध पवित्र मंदिरों से विशेष नवरात्रि एवं दुर्गा सप्तशती पूजा बुक करें और घर लाएं माँ का आशीर्वाद।",
    teluguHeroSubtitle:
      "ప్రసిద్ధ పుణ్యక్షేత్రాల నుండి ప్రత్యేక నవరాత్రి పూజలు బుక్ చేసుకోండి, మీ ఇంటికి అమ్మవారి దీవెనలు పొందండి.",
    tamilHeroSubtitle:
      "புனித கோயில்களில் இருந்து சிறப்பு நவராத்திரி பூஜைகளை பதிவு செய்து உங்கள் இல்லத்தில் தெய்வீக ஆசீர்வாதங்களை பெறுங்கள்.",
    daysFromToday: 7,
    durationDays: 9,
    heroImage: "/festivals/durga-puja.jpg",
    relatedPoojaSlugs: [
      "durga-saptashati-path",
      "navgraha-shanti",
      "lakshmi-pooja",
    ],
    ctaText: "Book Navratri Puja",
    hindiCtaText: "नवरात्रि पूजा बुक करें",
    teluguCtaText: "నవరాత్రి పూజ బుక్ చేయండి",
    tamilCtaText: "நவராத்திரி பூஜை பதிவு செய்க",
    ctaLink: "/book/durga-saptashati-path",
    secondaryCtaText: "Explore All Pujas",
    hindiSecondaryCtaText: "सभी पूजाएं देखें",
    teluguSecondaryCtaText: "అన్ని పూజలు చూడండి",
    tamilSecondaryCtaText: "அனைத்து பூஜைகளையும் காண்க",
    secondaryCtaLink: "#poojas",
    priority: 1,
    active: true,
  },
  {
    id: "diwali-2026",
    name: "Diwali Mahotsav",
    hindiName: "दीपावली महोत्सव",
    teluguName: "దీపావళి మహోత్సవం",
    tamilName: "தீபாவளி திருநாள்",
    badge: "✨ Deepawali Special",
    hindiBadge: "✨ दीपावली महापर्व",
    teluguBadge: "✨ దీపావళి మహోత్సవం",
    tamilBadge: "✨ தீபாவளி திருநாள்",
    heroTitle: "Invite Prosperity with Diwali Lakshmi Pooja",
    hindiHeroTitle: "दीपावली पर महालक्ष्मी पूजा से लाएं सुख-समृद्धि",
    teluguHeroTitle: "దీపావళి లక్ష్మీ పూజతో ఐశ్వర్యం మరియు సంపదను ఆహ్వానించండి",
    tamilHeroTitle: "தீபாவளி லட்சுமி பூஜையுடன் செல்வ வளம் பெறுங்கள்",
    heroSubtitle:
      "Authentic Vedic Lakshmi-Ganesha Pujan and Kuber Havan performed live from sacred Kashi & Ayodhya temples.",
    hindiHeroSubtitle:
      "काशी और अयोध्या के पवित्र धामों से वैदिक लक्ष्मी-गणेश पूजन एवं कुबेर हवन का सीधा प्रसारण।",
    teluguHeroSubtitle:
      "కాశీ మరియు అయోధ్య దివ్య క్షేత్రాల నుండి ప్రత్యక్ష వేద లక్ష్మీ-గణపతి మరియు కుబేర పూజలు.",
    tamilHeroSubtitle:
      "காசி மற்றும் அயோத்தி புனித ஸ்தலங்களில் இருந்து நேரடி வேத லட்சுமி-விநாயகர் பூஜை.",
    daysFromToday: 25,
    durationDays: 5,
    heroImage: "/festivals/diwali.jpg",
    relatedPoojaSlugs: [
      "lakshmi-pooja",
      "satyanarayan-katha",
      "griha-pravesh",
    ],
    ctaText: "Book Diwali Pooja",
    hindiCtaText: "दिवाली पूजा बुक करें",
    teluguCtaText: "దీపావళి పూజ బుక్ చేయండి",
    tamilCtaText: "தீபாவளி பூஜை பதிவு செய்க",
    ctaLink: "/book/lakshmi-pooja",
    secondaryCtaText: "Explore All Pujas",
    hindiSecondaryCtaText: "सभी पूजाएं देखें",
    teluguSecondaryCtaText: "అన్ని పూజలు చూడండి",
    tamilSecondaryCtaText: "அனைத்து பூஜைகளையும் காண்க",
    secondaryCtaLink: "#poojas",
    priority: 2,
    active: true,
  },
  {
    id: "shivratri-special",
    name: "Maha Shivratri Seva",
    hindiName: "महाशिवरात्रि सेवा",
    teluguName: "మహా శివరాత్రి సేవ",
    tamilName: "மகா சிவராத்திரி சேவை",
    badge: "🕉️ Sacred Shiva Aradhana",
    hindiBadge: "🕉️ पावन शिव आराधना",
    teluguBadge: "🕉️ పవిత్ర శివార్చన",
    tamilBadge: "🕉️ புனித சிவ ஆராதனை",
    heroTitle: "Maha Rudrabhishek & Shiva Havan",
    hindiHeroTitle: "महा रुद्राभिषेक एवं विशेष शिव साधना",
    teluguHeroTitle: "మహా రుద్రాభిషేకం మరియు శివ హోమం",
    tamilHeroTitle: "மகா ருத்ராபிஷேகம் மற்றும் சிவ ஹோமம்",
    heroSubtitle:
      "Seek Lord Shiva's divine grace with live Jyotirlinga Abhishek and personalized Vedic sankalpa.",
    hindiHeroSubtitle:
      "ज्योतिर्लिंगों से सीधे रुद्राभिषेक और आपके नाम-गोत्र से वैदिक संकल्प के साथ शिव कृपा पाएं।",
    teluguHeroSubtitle:
      "జ్యోతిర్లింగ క్షేత్రం నుండి లైవ్ అభిషేకం మరియు మీ గోత్ర నామాలతో వేద సంకల్పం.",
    tamilHeroSubtitle:
      "ஜோதிர்லிங்க ஸ்தலத்தில் இருந்து நேரடி ருத்ராபிஷேகம் மற்றும் உங்கள் கோத்ர நாம சங்கல்பம்.",
    daysFromToday: 45,
    durationDays: 3,
    heroImage: "/festivals/shivratri.jpg",
    relatedPoojaSlugs: [
      "rudrabhishek",
      "maha-mrityunjaya-jap",
      "navgraha-shanti",
    ],
    ctaText: "Book Rudrabhishek",
    hindiCtaText: "रुद्राभिषेक बुक करें",
    teluguCtaText: "రుద్రాభిషేకం బుక్ చేయండి",
    tamilCtaText: "ருத்ராபிஷேகம் பதிவு செய்க",
    ctaLink: "/book/rudrabhishek",
    secondaryCtaText: "Explore All Pujas",
    hindiSecondaryCtaText: "सभी पूजाएं देखें",
    teluguSecondaryCtaText: "అన్ని పూజలు చూడండి",
    tamilSecondaryCtaText: "அனைத்து பூஜைகளையும் காண்க",
    secondaryCtaLink: "#poojas",
    priority: 3,
    active: true,
  },
];

export function getFestivalDates(
  fest: FestivalEvent,
  today: Date = new Date()
): { startISO: string; endISO: string; startDate: Date; endDate: Date } {
  if (fest.startDate && fest.endDate) {
    const s = new Date(fest.startDate + "T00:00:00");
    const e = new Date(fest.endDate + "T23:59:59");
    return {
      startISO: toISODate(s),
      endISO: toISODate(e),
      startDate: s,
      endDate: e,
    };
  }

  const offset = fest.daysFromToday ?? 0;
  const duration = fest.durationDays ?? 9;
  const s = addDays(today, offset);
  s.setHours(0, 0, 0, 0);
  const e = addDays(s, Math.max(duration - 1, 0));
  e.setHours(23, 59, 59, 999);
  return {
    startISO: toISODate(s),
    endISO: toISODate(e),
    startDate: s,
    endDate: e,
  };
}

export function getFestivalStatus(
  fest: FestivalEvent,
  today: Date = new Date()
): FestivalStatus {
  const { startISO, endISO, startDate, endDate } = getFestivalDates(fest, today);
  const now = today.getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();

  const isLive = now >= startTime && now <= endTime;
  const isEnded = now > endTime;
  const isUpcoming = now < startTime;

  let daysUntilStart = 0;
  let countdownText = "";

  if (isLive) {
    countdownText = "🔴 Live Festival • Special Pujas Today";
  } else if (isUpcoming) {
    daysUntilStart = Math.max(
      1,
      Math.ceil((startTime - now) / (1000 * 60 * 60 * 24))
    );
    countdownText = `${fest.name} begins in ${daysUntilStart} day${
      daysUntilStart > 1 ? "s" : ""
    }`;
  } else {
    countdownText = "Festival Concluded";
  }

  const sMonth = eventDateFmt.format(startDate);
  const eMonth = eventDateFmt.format(endDate);
  const formattedDateRange = `${sMonth} – ${eMonth}`;

  return {
    isLive,
    isUpcoming,
    isEnded,
    daysUntilStart,
    startDateISO: startISO,
    endDateISO: endISO,
    formattedDateRange,
    countdownText,
  };
}

export function isFestivalActive(f: FestivalEvent): boolean {
  return f.active !== false;
}

export function getUpcomingFestivals(
  today: Date = new Date(),
  festivals: FestivalEvent[] = defaultFestivals
): (FestivalEvent & { status: FestivalStatus })[] {
  return festivals
    .filter(isFestivalActive)
    .map((f) => ({
      ...f,
      status: getFestivalStatus(f, today),
    }))
    .filter((f) => !f.status.isEnded)
    .sort((a, b) => {
      const pA = a.priority ?? 99;
      const pB = b.priority ?? 99;
      if (pA !== pB) return pA - pB;
      return a.status.startDateISO.localeCompare(b.status.startDateISO);
    });
}

export function getLocalizedFestivalTitle(
  fest: FestivalEvent,
  locale?: string
): string {
  if (locale === "hi" && fest.hindiHeroTitle) return fest.hindiHeroTitle;
  if (locale === "te" && fest.teluguHeroTitle) return fest.teluguHeroTitle;
  if (locale === "ta" && fest.tamilHeroTitle) return fest.tamilHeroTitle;
  return fest.heroTitle;
}

export function getLocalizedFestivalSubtitle(
  fest: FestivalEvent,
  locale?: string
): string {
  if (locale === "hi" && fest.hindiHeroSubtitle) return fest.hindiHeroSubtitle;
  if (locale === "te" && fest.teluguHeroSubtitle) return fest.teluguHeroSubtitle;
  if (locale === "ta" && fest.tamilHeroSubtitle) return fest.tamilHeroSubtitle;
  return fest.heroSubtitle;
}

export function getLocalizedFestivalBadge(
  fest: FestivalEvent,
  locale?: string
): string {
  if (locale === "hi" && fest.hindiBadge) return fest.hindiBadge;
  if (locale === "te" && fest.teluguBadge) return fest.teluguBadge;
  if (locale === "ta" && fest.tamilBadge) return fest.tamilBadge;
  return fest.badge || "🪔 UPCOMING FESTIVAL";
}

export function getLocalizedFestivalCta(
  fest: FestivalEvent,
  locale?: string
): string {
  if (locale === "hi" && fest.hindiCtaText) return fest.hindiCtaText;
  if (locale === "te" && fest.teluguCtaText) return fest.teluguCtaText;
  if (locale === "ta" && fest.tamilCtaText) return fest.tamilCtaText;
  return fest.ctaText || "Book Festival Puja";
}

export function getLocalizedFestivalSecondaryCta(
  fest: FestivalEvent,
  locale?: string
): string {
  if (locale === "hi" && fest.hindiSecondaryCtaText) return fest.hindiSecondaryCtaText;
  if (locale === "te" && fest.teluguSecondaryCtaText) return fest.teluguSecondaryCtaText;
  if (locale === "ta" && fest.tamilSecondaryCtaText) return fest.tamilSecondaryCtaText;
  return fest.secondaryCtaText || "Explore All Pujas";
}

export function getLocalizedFestivalName(
  fest: FestivalEvent,
  locale?: string
): string {
  if (locale === "hi" && fest.hindiName) return fest.hindiName;
  if (locale === "te" && fest.teluguName) return fest.teluguName;
  if (locale === "ta" && fest.tamilName) return fest.tamilName;
  return fest.name;
}

export function getLocalizedFestivalCountdown(
  fest: FestivalEvent,
  locale?: string
): string {
  const status =
    (fest as FestivalEvent & { status?: ReturnType<typeof getFestivalStatus> }).status ||
    getFestivalStatus(fest);
  const festName = getLocalizedFestivalName(fest, locale);

  if (status.isLive) {
    if (locale === "hi") return "🔴 पावन पर्व प्रारंभ • आज विशेष पूजाएं";
    if (locale === "te") return "🔴 పవిత్ర పండుగ ప్రత్యక్షం • నేడు ప్రత్యేక పూజలు";
    if (locale === "ta") return "🔴 நேரலை திருவிழா • இன்று சிறப்பு பூஜைகள்";
    return status.countdownText || "🔴 Live Festival • Special Pujas Today";
  }

  if (status.isUpcoming) {
    const d = status.daysUntilStart;
    if (locale === "hi") {
      return d <= 1 ? `${festName} कल से प्रारंभ` : `${festName} ${d} दिनों में प्रारंभ`;
    }
    if (locale === "te") {
      return `${festName} ${d} రోజుల్లో ప్రారంభం`;
    }
    if (locale === "ta") {
      return `${festName} ${d} நாட்களில் தொடங்குகிறது`;
    }
    return `${festName} begins in ${d} day${d > 1 ? "s" : ""}`;
  }

  if (locale === "hi") return "पर्व संपन्न";
  if (locale === "te") return "పండుగ ముగిసింది";
  if (locale === "ta") return "திருவிழா நிறைவடைந்தது";
  return "Festival Concluded";
}

// ===================== EVENT SEAT INVENTORY =====================
// Live events hold a fixed number of seats. A booking made from an event slot
// records which occurrence it took (eventDateISO) and how many seats it holds
// (seatCount). Remaining seats are ALWAYS derived from confirmed bookings — so
// cancelling (or refunding) a booking frees its seat automatically, with no
// separate release step that could drift out of sync.

/** The minimal booking fields the seat counter needs — structural so this
 * module stays free of lib/storage.ts imports (no circular dependency). */
export interface SeatCountingBooking {
  poojaSlug: string;
  eventDateISO?: string;
  seatCount?: number;
  status: string;
}

function specDateISO(spec: { daysFromToday?: number }, today: Date): string | null {
  if (spec.daysFromToday === undefined) return null;
  return toISODate(addDays(today, spec.daysFromToday));
}

/** Confirmed seats taken for one event occurrence (slug + date). Only
 * confirmed/rescheduled bookings hold a seat — cancelled and refunded ones
 * are excluded, which is what releases them automatically. */
export function eventBookedSeats(
  event: { slug: string; dateISO?: string; daysFromToday?: number },
  bookings: SeatCountingBooking[],
  today: Date = new Date()
): number {
  const dateISO = event.dateISO ?? specDateISO(event, today);
  if (!dateISO) return 0;
  return bookings
    .filter((b) => b.status === "confirmed" || b.status === "rescheduled")
    .filter((b) => b.poojaSlug === event.slug && b.eventDateISO === dateISO)
    .reduce((n, b) => n + (b.seatCount ?? 1), 0);
}

/** Attach bookedSeats to a list of event specs so every consumer (catalog
 * API, offline fallback, admin manager) shows the same live availability. */
export function withEventBookedSeats(
  specs: UpcomingEventSpec[],
  bookings: SeatCountingBooking[],
  today: Date = new Date()
): UpcomingEventSpec[] {
  return specs.map((s) => ({
    ...s,
    bookedSeats: eventBookedSeats(s, bookings, today),
  }));
}

/** True when the event has a capacity and every seat is taken. */
export function isEventFull(event: {
  capacity?: number;
  bookedSeats?: number;
  seats?: string;
}): boolean {
  if (event.capacity === undefined) return false;
  return event.capacity - (event.bookedSeats ?? 0) <= 0;
}

/** The seats line for an event card: a live count when capacity is set, else
 * the curated text label (legacy events without capacity). */
export function seatsLabel(event: {
  capacity?: number;
  bookedSeats?: number;
  seats?: string;
}): string {
  if (event.capacity !== undefined) {
    const left = Math.max(event.capacity - (event.bookedSeats ?? 0), 0);
    return left === 0 ? "Fully booked" : `${left} of ${event.capacity} seats left`;
  }
  return event.seats ?? "Open";
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

export interface Testimonial {
  id?: string;
  name: string;
  hindiName?: string;
  teluguName?: string;
  tamilName?: string;
  location: string;
  hindiLocation?: string;
  teluguLocation?: string;
  tamilLocation?: string;
  rating: number;
  text: string;
  hindiText?: string;
  teluguText?: string;
  tamilText?: string;
  avatar: string;
  color: string;
  active?: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: "testi-1",
    name: "Priya Sharma",
    hindiName: "प्रिया शर्मा",
    teluguName: "ప్రియా శర్మ",
    tamilName: "பிரியா சர்மா",
    location: "Mumbai, Maharashtra",
    hindiLocation: "मुंबई, महाराष्ट्र",
    teluguLocation: "ముంబై, మహారాష్ట్ర",
    tamilLocation: "மும்பை, மகாராஷ்டிரா",
    rating: 5,
    text: "Booked Griha Pravesh pooja for our new home. The pandit ji was extremely knowledgeable and the rituals were performed exactly as per scriptures. The video recording was a blessing for our family abroad!",
    hindiText: "हमारे नए घर के लिए गृह प्रवेश पूजा बुक की थी। पंडित जी अत्यंत विद्वान थे और सभी अनुष्ठान शास्त्रों के अनुसार संपन्न कराए गए। विदेश में रह रहे हमारे परिवार के लिए वीडियो रिकॉर्डिंग एक बड़ा आशीर्वाद रही!",
    teluguText: "మా కొత్త ఇంటి కోసం గృహప్రవేశ పూజను బుక్ చేశాము. పండిట్ జీ వేద విధానాల ప్రకారం ఎంతో పవిత్రంగా పూజ జరిపించారు. విదేశాల్లో ఉన్న మా బంధువులకు వీడియో రికార్డింగ్ గొప్ప అనుభూతినిచ్చింది!",
    tamilText: "எங்கள் புதிய இல்லத்திற்கான கிரகப்பிரவேச பூஜையை பதிவு செய்தோம். பண்டிதர் சாஸ்திர முறைப்படி மிகச் சிறப்பாக நடத்தினார். வெளிநாட்டில் உள்ள எங்கள் குடும்பத்திற்கு வீடியோ பதிவு பெரும் வரப்பிரசாதமாக அமைந்தது!",
    avatar: "PS",
    color: "from-rose-400 to-pink-600",
    active: true,
  },
  {
    id: "testi-2",
    name: "Rajesh Kumar",
    hindiName: "राजेश कुमार",
    teluguName: "రాజేష్ కుమార్",
    tamilName: "ராஜேஷ் குமார்",
    location: "New Delhi",
    hindiLocation: "नई दिल्ली",
    teluguLocation: "న్యూఢిల్లీ",
    tamilLocation: "புது தில்லி",
    rating: 5,
    text: "The HD video recording of our pooja was an unforgettable experience. The clarity was excellent and the booking process took less than 2 minutes. Truly blessed!",
    hindiText: "हमारी पूजा की HD वीडियो रिकॉर्डिंग एक अविस्मरणीय अनुभव था। स्पष्टता बहुत बेहतरीन थी और बुकिंग प्रक्रिया में 2 मिनट से भी कम समय लगा। सचमुच प्रभु की कृपा मिली!",
    teluguText: "మా పూజ యొక్క HD వీడియో రికార్డింగ్ అద్భుతమైన అనుభవం. స్పష్టత ఎంతో బాగుంది మరియు బుకింగ్ ప్రక్రియ 2 నిమిషాల్లో పూర్తయింది. నిజంగా దైవానుగ్రహం!",
    tamilText: "எங்கள் பூஜையின் HD வீடியோ பதிவு மறக்க முடியாத அனுபவமாக இருந்தது. தரம் மிகச் சிறப்பாக இருந்தது, 2 நிமிடங்களில் பதிவு முடிந்தது. மெய்யாகவே பாக்கியம் பெற்றோம்!",
    avatar: "RK",
    color: "from-saffron-400 to-orange-600",
    active: true,
  },
  {
    id: "testi-3",
    name: "Anita Deshmukh",
    hindiName: "अनीता देशमुख",
    teluguName: "అనితా దేశ్‌ముఖ్",
    tamilName: "அனிதா தேஷ்முக்",
    location: "Pune, Maharashtra",
    hindiLocation: "पुणे, महाराष्ट्र",
    teluguLocation: "పూణే, మహారాష్ట్ర",
    tamilLocation: "புனே, மகாராஷ்டிரா",
    rating: 5,
    text: "Ordered the Satyanarayan pooja kit — it arrived within 3 days, beautifully packed and blessed. The WhatsApp confirmation and reminders are a very thoughtful touch.",
    hindiText: "सत्यनारायण पूजा किट मंगवाई थी — 3 दिनों के भीतर सुंदर पैकिंग और आशीर्वाद के साथ पहुँच गई। व्हाट्सएप पर पुष्टि और अनुष्ठान के रिमाइंडर बहुत ही सुविधाजनक हैं।",
    teluguText: "సత్యనారాయణ పూజా కిట్ ఆర్డర్ చేశాను — 3 రోజుల్లో పవిత్రంగా ప్యాక్ చేసి అందింది. వాట్సాప్ నిర్ధారణ మరియు రిమైండర్లు ఎంతో ఉపయోగపడ్డాయి.",
    tamilText: "சத்யநாராயண பூஜை கிட் ஆர்டர் செய்தேன் — 3 நாட்களில் அழகாக பேக் செய்யப்பட்டு ஆசீர்வதிக்கப்பட்டு வந்தது. வாட்ஸ்அப் உறுதிப்படுத்தல் மிகவும் பயனுள்ளதாக இருந்தது.",
    avatar: "AD",
    color: "from-emerald-400 to-teal-600",
    active: true,
  },
  {
    id: "testi-4",
    name: "Vikram Singh",
    hindiName: "विक्रम सिंह",
    teluguName: "విక్రమ్ సింగ్",
    tamilName: "விக்ரம் சிங்",
    location: "Jaipur, Rajasthan",
    hindiLocation: "जयपुर, राजस्थान",
    teluguLocation: "జైపూర్, రాజస్థాన్",
    tamilLocation: "ஜெய்ப்பூர், ராஜஸ்தான்",
    rating: 5,
    text: "Booked Navgraha Shanti for our family — the pandit ji explained every step and the havan was performed flawlessly. The video recording let our relatives abroad join in the blessings.",
    hindiText: "हमारे परिवार के लिए नवग्रह शांति पूजा बुक की थी — पंडित जी ने हर चरण को समझाया और हवन विधिपूर्वक संपन्न हुआ। वीडियो रिकॉर्डिंग से विदेश में रह रहे रिश्तेदार भी शामिल हो सके।",
    teluguText: "మా కుటుంబం కోసం నవగ్రహ శాంతి పూజ బుక్ చేశాము — పండిట్ జీ ప్రతి విధిని వివరించారు మరియు హవనం నిష్కళంకముగా జరిగింది. వీడియో రికార్డింగ్ విదేశీ బంధువులకు ఎంతగానో నచ్చింది.",
    tamilText: "எங்கள் குடும்பத்திற்காக நவகிரக சாந்தி பூஜை பதிவு செய்தோம் — பண்டிதர் ஒவ்வொரு படியையும் விளக்கி யாகத்தை சிறப்பாக நடத்தினார். வெளிநாட்டு உறவினர்களும் இதில் பங்கேற்க முடிந்தது.",
    avatar: "VS",
    color: "from-indigo-400 to-purple-600",
    active: true,
  },
];

export function getLocalizedTestimonialText(t: Testimonial, locale?: string): string {
  if (locale === "hi" && t.hindiText) return t.hindiText;
  if (locale === "te" && t.teluguText) return t.teluguText;
  if (locale === "ta" && t.tamilText) return t.tamilText;
  return t.text;
}

export function getLocalizedTestimonialLocation(t: Testimonial, locale?: string): string {
  if (locale === "hi" && t.hindiLocation) return t.hindiLocation;
  if (locale === "te" && t.teluguLocation) return t.teluguLocation;
  if (locale === "ta" && t.tamilLocation) return t.tamilLocation;
  return t.location;
}

export function getLocalizedTestimonialName(t: Testimonial, locale?: string): string {
  if (locale === "hi" && t.hindiName) return t.hindiName;
  if (locale === "te" && t.teluguName) return t.teluguName;
  if (locale === "ta" && t.tamilName) return t.tamilName;
  return t.name;
}

export interface FaqItem {
  id?: string;
  q: string;
  a: string;
  hindiQ?: string;
  hindiA?: string;
  teluguQ?: string;
  teluguA?: string;
  tamilQ?: string;
  tamilA?: string;
  order?: number;
  active?: boolean;
}

export const faqs: FaqItem[] = [
  {
    q: "How do I book a pooja on templepujasewa?",
    a: "Simply select your pooja, choose a date, fill in your details (name, gotra, city, mobile number), and complete secure payment via UPI, card or net banking. Your booking is confirmed instantly and admin is notified on WhatsApp.",
    hindiQ: "templepujasewa पर पूजा कैसे बुक करें?",
    hindiA: "अपनी मनपसंद पूजा चुनें, शुभ तिथि चुनें, अपने विवरण (नाम, गोत्र, शहर, मोबाइल नंबर) दर्ज करें और UPI, कार्ड या नेट बैंकिंग से सुरक्षित भुगतान करें। आपकी बुकिंग तुरंत कन्फर्म हो जाएगी।",
    teluguQ: "templepujasewa లో పూజ ఎలా బుక్ చేయాలి?",
    teluguA: "మీ పూజను ఎంచుకోండి, తేదీని నిర్ణయించుకోండి, మీ వివరాలు (పేరు, గోత్రం, ఊరు, మొబైల్ నంబర్) నమోదు చేసి UPI లేదా కార్డ్ ద్వారా సురక్షిత చెల్లింపు చేయండి.",
    tamilQ: "templepujasewa-வில் பூஜை எவ்வாறு பதிவு செய்வது?",
    tamilA: "உங்களுக்கு விருப்பமான பூஜையைத் தேர்ந்தெடுத்து, தேதி மற்றும் உங்கள் விவரங்களை (பெயர், கோத்திரம், தொலைபேசி எண்) நிரப்பி UPI அல்லது கார்டு மூலம் பணம் செலுத்துங்கள்.",
  },
  {
    q: "Are the pandits certified and experienced?",
    a: "Yes. All our pandits are certified Vedic scholars with 10+ years of experience. Each one is verified through a rigorous background check and regularly reviewed by our devotees.",
    hindiQ: "क्या पंडित जी प्रमाणित और अनुभवी हैं?",
    hindiA: "हाँ। हमारे सभी पंडित 10+ वर्षों के अनुभव वाले प्रमाणित वैदिक विद्वान हैं। प्रत्येक पंडित का कठोर सत्यापन किया जाता है और वे पारंपरिक गुरुकुल परंपरा से दीक्षित हैं।",
    teluguQ: "పండితులు అనుభవజ్ఞులు మరియు ధృవీకరించబడినవారేనా?",
    teluguA: "అవును. మా పండితులందరూ 10+ సంవత్సరాల అనుభవం ఉన్న ధృవీకరించబడిన వేద పండితులు.",
    tamilQ: "பண்டிதர்கள் அனுபவம் வாய்ந்தவர்களா மற்றும் சான்றளிக்கப்பட்டவர்களா?",
    tamilA: "ஆம். எங்கள் பண்டிதர்கள் அனைவரும் 10+ வருட அனுபவமுள்ள வேத அறிஞர்கள் மற்றும் முழுமையாக சரிபார்க்கப்பட்டவர்கள்.",
  },
  {
    q: "Will I receive a video recording of my pooja?",
    a: "Yes! Every pooja is recorded in HD, and we share the recording link with you right after the ritual — so you and your family can relive the blessings from anywhere, anytime.",
    hindiQ: "क्या मुझे अपनी पूजा की वीडियो रिकॉर्डिंग मिलेगी?",
    hindiA: "हाँ! प्रत्येक पूजा की एचडी (HD) वीडियो रिकॉर्डिंग और लाइव संकल्प दर्शन लिंक अनुष्ठान के तुरंत बाद आपके साथ साझा किया जाता है।",
    teluguQ: "నా పూజ వీడియో రికార్డింగ్ నాకు అందుతుందా?",
    teluguA: "ఖచ్చితంగా! ప్రతి పూజ HD వీడియో రికార్డింగ్ మరియు ప్రత్యక్ష లింక్ పూజ ముగిసిన వెంటనే మీకు పంపబడుతుంది.",
    tamilQ: "எனது பூஜையின் வீடியோ பதிவு எனக்குக் கிடைக்குமா?",
    tamilA: "ஆம்! ஒவ்வொரு பூஜையும் HD தரத்தில் பதிவு செய்யப்பட்டு, வழிபாடு முடிந்தவுடன் அதன் இணைப்பு உங்களுக்கு அனுப்பப்படும்.",
  },
  {
    q: "How long does home delivery of pooja kits take?",
    a: "Pooja kits and sacred items are delivered anywhere in India within 2–5 business days. Every kit is blessed by our pandits before shipping.",
    hindiQ: "पूजा किट और प्रसाद होम डिलीवरी में कितना समय लगता है?",
    hindiA: "पूजा किट और पावन प्रसाद भारत भर में 2 से 5 कार्य दिवसों में आपके घर तक पहुंचा दिया जाता है। प्रत्येक किट को भेजने से पहले पंडित जी द्वारा अभिमंत्रित किया जाता है।",
    teluguQ: "పూజా ప్రసాదం మరియు కిట్ హోమ్ డెలివరీకి ఎంత సమయం పడుతుంది?",
    teluguA: "భారతదేశంలో ఎక్కడికైనా 2-5 పనిదినాల్లో పవిత్ర ప్రసాదం మరియు పూజా సామగ్రి డెలివరీ చేయబడుతుంది.",
    tamilQ: "பூஜை பிரசாதம் மற்றும் பொருட்கள் விநியோகிக்க எவ்வளவு காலம் ஆகும்?",
    tamilA: "புனித பிரசாதம் மற்றும் பூஜை பொருட்கள் 2 முதல் 5 நாட்களுக்குள் உங்கள் இல்லத்திற்கு அனுப்பி வைக்கப்படும்.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept UPI (GPay, PhonePe, Paytm), all debit/credit cards, and net banking — all securely processed through Razorpay with 100% SSL encryption.",
    hindiQ: "भुगतान के कौन से माध्यम स्वीकार्य हैं?",
    hindiA: "हम UPI (GPay, PhonePe, Paytm), सभी डेबिट/क्रेडिट कार्ड, और नेट बैंकिंग स्वीकार करते हैं — सभी 100% सुरक्षित और एन्क्रिप्टेड हैं।",
    teluguQ: "ఏ చెల్లింపు పద్ధతులు అందుబాటులో ఉన్నాయి?",
    teluguA: "మేము UPI (Google Pay, PhonePe, Paytm), డెబిట్/క్రెడిట్ కార్డులు మరియు నెట్ బ్యాంకింగ్‌ను 100% భద్రతతో అంగీకరిస్తాము.",
    tamilQ: "என்னென்ன கட்டண முறைகள் ஏற்றுக்கொள்ளப்படுகின்றன?",
    tamilA: "UPI (GPay, PhonePe, Paytm), டெபிட்/கிரெடிட் கார்டுகள் மற்றும் நெட் பேங்கிங் மூலம் 100% பாதுகாப்பாக செலுத்தலாம்.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes. If a pooja cannot be performed due to unforeseen circumstances, we offer a full refund or rescheduling at no extra cost. Donations made towards temple seva are non-refundable.",
    hindiQ: "क्या रिफंड और रिशेड्यूल की सुविधा उपलब्ध है?",
    hindiA: "हाँ। यदि किसी अपरिहार्य कारण से पूजा संपन्न नहीं हो पाती है, तो हम बिना किसी अतिरिक्त शुल्क के पूरा रिफंड या नई तिथि प्रदान करते हैं।",
    teluguQ: "రీఫండ్ విధానం ఉందా?",
    teluguA: "అవును. అనుకోని కారణాల వల్ల పూజ జరగకపోతే, పూర్తి రీఫండ్ లేదా ఉచితంగా వేరొక రోజుకు మార్చుకునే సదుపాయం కలదు.",
    tamilQ: "பணம் திரும்பப் பெறும் வசதி உள்ளதா?",
    tamilA: "ஆம். எதிர்பாராத காரணங்களால் பூஜை நடைபெறாவிட்டால், முழு தொகையும் திரும்ப வழங்கப்படும் அல்லது மாற்று தேதியில் பூஜை நடத்தப்படும்.",
  },
];

export function getLocalizedFaqQ(faq: FaqItem, locale?: string): string {
  if (locale === "hi" && faq.hindiQ) return faq.hindiQ;
  if (locale === "te" && faq.teluguQ) return faq.teluguQ;
  if (locale === "ta" && faq.tamilQ) return faq.tamilQ;
  return faq.q;
}

export function getLocalizedFaqA(faq: FaqItem, locale?: string): string {
  if (locale === "hi" && faq.hindiA) return faq.hindiA;
  if (locale === "te" && faq.teluguA) return faq.teluguA;
  if (locale === "ta" && faq.tamilA) return faq.tamilA;
  return faq.a;
}

export const contactInfo = [
  {
    icon: "💬",
    label: "WhatsApp Support",
    value: "+91 96210 14155",
    href: getWhatsAppUrl(),
  },
  {
    icon: "📞",
    label: "Pooja Helpline",
    value: "+91 96210 14155",
    href: `tel:${SITE_CONFIG.contact.phoneRaw}`,
  },
  {
    icon: "✉️",
    label: "Email Support",
    value: "infotemplepujasewa@gmail.com",
    href: `mailto:${SITE_CONFIG.contact.email}`,
  },
];

export const socialLinks = [
  {
    name: "Instagram",
    href: SITE_CONFIG.social.instagram,
    handle: "@templepujasewa",
    label: "Follow on Instagram",
  },
  {
    name: "Facebook",
    href: SITE_CONFIG.social.facebook,
    handle: "Temple Puja Sewa",
    label: "Connect on Facebook",
  },
  {
    name: "YouTube",
    href: SITE_CONFIG.social.youtube,
    handle: "@TEMPLEPUJASEWA",
    label: "Subscribe on YouTube",
  },
];

// ===================== POOJA CATALOG =====================

export interface PoojaPackage {
  name: string;
  price: number;
  description?: string;
}

export interface Addon {
  _id: string;
  id: string;
  name: string;
  hindiName?: string;
  teluguName?: string;
  tamilName?: string;
  description: string;
  hindiDescription?: string;
  teluguDescription?: string;
  tamilDescription?: string;
  price: number;
  currency: string;
  active: boolean;
  emoji?: string;
  category?: string;
  hindiCategory?: string;
  teluguCategory?: string;
  tamilCategory?: string;
  image?: string;
  type?: "chadhava" | "addon";
  badge?: string;
  hindiBadge?: string;
  assignedPoojaSlugs?: string[];
  createdAt: string;
  updatedAt: string;
}

export function chadhavaToDefaultAddon(c: ChadhavaOffering): Addon {
  return {
    _id: c.id,
    id: c.id,
    name: c.name,
    hindiName: c.hindiName,
    teluguName: c.teluguName,
    tamilName: c.tamilName,
    description: c.description,
    hindiDescription: c.hindiDescription,
    teluguDescription: c.teluguDescription,
    tamilDescription: c.tamilDescription,
    price: c.price,
    currency: "INR",
    active: true,
    emoji: c.emoji || "🌸",
    category: c.category || (c.type === "addon" ? "Other Add-on" : "Chadhava Seva"),
    hindiCategory: c.hindiCategory,
    teluguCategory: c.teluguCategory,
    tamilCategory: c.tamilCategory,
    image: c.image,
    type: c.type || "chadhava",
    badge: c.badge,
    hindiBadge: c.hindiBadge,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export interface ChadhavaOffering {
  id: string;
  name: string;
  hindiName?: string;
  teluguName?: string;
  tamilName?: string;
  description: string;
  hindiDescription?: string;
  teluguDescription?: string;
  tamilDescription?: string;
  price: number;
  emoji: string;
  category?: string;
  hindiCategory?: string;
  teluguCategory?: string;
  tamilCategory?: string;
  image?: string;
  type?: "chadhava" | "addon";
  badge?: string;
  hindiBadge?: string;
  teluguBadge?: string;
  tamilBadge?: string;
}

export const defaultChadhavaOfferings: ChadhavaOffering[] = [
  // ── 1. Sacred Chadhavas ──
  {
    id: "kumkum",
    name: "Kumkum",
    hindiName: "पवित्र कुमकुम एवं रोली",
    teluguName: "పవిత్ర కుంకుమ",
    tamilName: "புனித குங்குமம்",
    description: "Auspicious purified vermilion and fragrant sacred roli consecrated at the deity feet.",
    hindiDescription: "संकल्प सिद्धि हेतु देव चरणों में अर्पित पवित्र सिंदूर, रोली एवं अक्षत अर्पण।",
    teluguDescription: "సంకల్ప సమయంలో దేవుని పాదాల వద్ద సమర్పించబడే పవిత్రమైన కుంకుమ.",
    tamilDescription: "சங்கல்பத்தின் போது இறைவனின் திருப்பாதங்களில் சமர்ப்பிக்கப்படும் புனித குங்குமம்.",
    price: 151,
    emoji: "🔴",
    category: "Special Chadhava",
    hindiCategory: "विशेष चढ़ावा",
    teluguCategory: "ప్రత్యేక సమర్పణ",
    tamilCategory: "சிறப்பு காணிக்கை",
    badge: "Special Chadhava",
    hindiBadge: "विशेष चढ़ावा",
    teluguBadge: "ప్రత్యేక సమర్పణ",
    tamilBadge: "சிறப்பு காணிக்கை",
    type: "chadhava",
  },
  {
    id: "chunri",
    name: "Chunri",
    hindiName: "माता की चुनरी एवं वस्त्र",
    teluguName: "అమ్మవారి పవిత్ర చున్రీ",
    tamilName: "அன்னையின் புனித சுனரி ஆடை",
    description: "Traditional embroidered sacred red chunri and holy vastra offered with your sankalpa.",
    hindiDescription: "माता रानी को अखंड सौभाग्य व कृपा हेतु अर्पित की जाने वाली पवित्र गोटेदार लाल चुनरी।",
    teluguDescription: "అమ్మవారికి సమర్పించే పవిత్రమైన ఎరుపు చున్రీ మరియు వస్త్రం.",
    tamilDescription: "அம்மனுக்கு பக்தியுடன் சமர்ப்பிக்கப்படும் புனித சிவப்பு சுனரி ஆடை.",
    price: 251,
    emoji: "🧣",
    category: "Vastra Chadhava",
    hindiCategory: "वस्त्र चढ़ावा",
    teluguCategory: "వస్త్ర సమర్పణ",
    tamilCategory: "ஆடை காணிக்கை",
    badge: "Special Chadhava",
    hindiBadge: "विशेष चढ़ावा",
    teluguBadge: "ప్రత్యేక సమర్పణ",
    tamilBadge: "சிறப்பு காணிக்கை",
    type: "chadhava",
  },
  {
    id: "nariyal",
    name: "Nariyal",
    hindiName: "श्रीफल एवं पवित्र नारियल",
    teluguName: "శ్రీఫలం / పవిత్ర కొబ్బరికాయ",
    tamilName: "புனித தேங்காய் (ஸ்ரீபலம்)",
    description: "Consecrated auspicious coconut wrapped in sacred mauli thread for sankalp fulfillment.",
    hindiDescription: "मनोकामना पूर्ति एवं विघ्न निवारण हेतु मौली धागे से लिपटा पावन श्रीफल व नारियल अर्पण।",
    teluguDescription: "కోరికల నెరవేర్పు మరియు సంకల్ప సిద్ధి కోసం సమర్పించే పవిత్ర కొబ్బరికాయ.",
    tamilDescription: "சங்கல்பம் நிறைவேற மௌலி கயிறு சுற்றப்பட்ட புனித ஸ்ரீபலம் தேங்காய்.",
    price: 351,
    emoji: "🥥",
    category: "Shriphal Chadhava",
    hindiCategory: "श्रीफल चढ़ावा",
    teluguCategory: "శ్రీఫల సమర్పణ",
    tamilCategory: "ஸ்ரீபல காணிக்கை",
    badge: "Special Chadhava",
    hindiBadge: "विशेष चढ़ावा",
    teluguBadge: "ప్రత్యేక సమర్పణ",
    tamilBadge: "சிறப்பு காணிக்கை",
    type: "chadhava",
  },
  {
    id: "flower-chadhava",
    name: "Pushpa Mala & Flower Chadhava",
    hindiName: "पुष्प माला एवं पुष्प अर्पण",
    teluguName: "పుష్పమాల & పూల సమర్పణ",
    tamilName: "மலர் மாலை & பூ சமர்ப்பணம்",
    description: "Sacred fresh garland and fragrant flower basket offered at deity feet during sankalp.",
    hindiDescription: "संकल्प के समय देव चरणों में अर्पित की जाने वाली ताज़ी पुष्प माला एवं सुगंधित पुष्प टोकरी।",
    teluguDescription: "సంకల్ప సమయంలో దేవుని పాదాల వద్ద సమర్పించబడే పవిత్రమైన పూలమాల మరియు సుగంధ పుష్పాలు.",
    tamilDescription: "சங்கல்பத்தின் போது இறைவனின் திருப்பாதங்களில் சமர்ப்பிக்கப்படும் புனித மலர் மாலை மற்றும் நறுமண மலர்கள்.",
    price: 151,
    emoji: "🌸",
    category: "Pushpa Seva",
    hindiCategory: "पुष्प सेवा",
    teluguCategory: "పుష్ప సేవ",
    tamilCategory: "மலர் சேவை",
    badge: "Auspicious",
    hindiBadge: "पावन अर्पण",
    type: "chadhava",
  },
  {
    id: "panchamrit-abhishek",
    name: "Panchamrit Abhishek Offering",
    hindiName: "पंचामृत अभिषेक अर्पण",
    teluguName: "పంచామృత అభిషేక సమర్పణ",
    tamilName: "பஞ்சாமிர்த அபிஷேக சமர்ப்பணம்",
    description: "Pure cow milk, honey, ghee, curd and sugar offering for divine abhishek bath.",
    hindiDescription: "शुद्ध गाय का दूध, शहद, घी, दही एवं शक्कर से निर्मित दिव्य पंचामृत अभिषेक अर्पण।",
    teluguDescription: "ఆవు పాలు, తేనె, నెయ్యి, పెరుగు మరియు చక్కెరతో తయారు చేసిన పవిత్ర పంచామృతం.",
    tamilDescription: "தூய பசுவின் பால், தேன், நெய், தயிர் மற்றும் சர்க்கரை கலந்த புனித பஞ்சாமிர்தம்.",
    price: 351,
    emoji: "🥛",
    category: "Abhishek Seva",
    hindiCategory: "अभिषेक सेवा",
    teluguCategory: "అభిషేక సేవ",
    tamilCategory: "அபிஷேக சேவை",
    badge: "Abhishek Special",
    hindiBadge: "अभिषेक अर्पण",
    type: "chadhava",
  },
  {
    id: "sindoor-chola",
    name: "Sindoor & Hanuman Chola Seva",
    hindiName: "सिंदूर एवं चोला सेवा",
    teluguName: "సిందూరం & హనుమాన్ చోళా సేవ",
    tamilName: "சிந்தூரம் & அனுமன் சோழா சேவை",
    description: "Sacred orange sindoor paste, silver leaf and red chola offered to Bajrangbali for protection.",
    hindiDescription: "बजरंगबली को रक्षा व संकट निवारण हेतु अर्पित पवित्र सिंदूर, चांदी का वर्क एवं लाल चोला।",
    teluguDescription: "రక్షణ మరియు విజయాల కోసం బజరంగ్ బలికి సమర్పించే పవిత్ర సిందూరం మరియు చోళా.",
    tamilDescription: "பாதுகாப்பு மற்றும் நன்மைகளுக்காக அனுமனுக்கு சமர்ப்பிக்கப்படும் சிந்தூரம் மற்றும் ஆடை.",
    price: 201,
    emoji: "🚩",
    category: "Chola Seva",
    hindiCategory: "चोला सेवा",
    teluguCategory: "చోళా సేవ",
    tamilCategory: "ஆடை சேவை",
    badge: "Chola Arpan",
    hindiBadge: "चोला अर्पण",
    type: "chadhava",
  },

  // ── 2. Other Add-ons ──
  {
    id: "special-prasad",
    name: "Prasad (Special Temple Prasadam)",
    hindiName: "विशेष महाप्रसाद",
    teluguName: "ప్రత్యేక ఆలయ ప్రసాదం",
    tamilName: "சிறப்பு கோயில் பிரசாதம்",
    description: "Sanctified dry fruit & sweet prasad energised with mantras and sent with divine blessings.",
    hindiDescription: "मंत्रों से अभिमंत्रित सूखे मेवे एवं मिष्ठान का दिव्य महाप्रसाद जो आपके घर भेजा जाता है।",
    teluguDescription: "మంత్రాలతో పవిత్రీకరించబడిన డ్రై ఫ్రూట్ మరియు మధురమైన దివ్య మహాప్రసాదం.",
    tamilDescription: "மந்திரங்களால் புனிதப்படுத்தப்பட்ட உலர் பழங்கள் மற்றும் இனிப்பு பிரசாதம்.",
    price: 201,
    emoji: "🍯",
    category: "Prasad Seva",
    hindiCategory: "प्रसाद सेवा",
    teluguCategory: "ప్రసాద సేవ",
    tamilCategory: "பிரசாத சேவை",
    badge: "Sanctified Prasad",
    hindiBadge: "अभिमंत्रित प्रसाद",
    type: "addon",
  },
  {
    id: "temple-donation",
    name: "Donation (Gau Seva & Mandir Daan)",
    hindiName: "मंदिर एवं गौ सेवा दान",
    teluguName: "గోసేవ మరియు ఆలయ విరాళం",
    tamilName: "கோ சேவை மற்றும் கோயில் நன்கொடை",
    description: "Sacred charitable donation for temple gaushala fodder, upkeep and Vedic vidyarthi seva in your gotra.",
    hindiDescription: "मंदिर गौशाला, नित्य पूजा व्यवस्था एवं वेद शिक्षार्थियों की सेवा हेतु पवित्र दान संकल्प।",
    teluguDescription: "ఆలయ నిర్వహణ మరియు గోసేవ కోసం మీ గోత్ర నామాలతో పవిత్ర విరాళ సమర్పణ.",
    tamilDescription: "கோயில் நல்வாழ்வு மற்றும் கோ சேவைக்காக உங்கள் கோத்ர நாமத்தில் செய்யப்படும் புனித நன்கொடை.",
    price: 500,
    emoji: "🙏",
    category: "Temple Donation",
    hindiCategory: "मंदिर दान",
    teluguCategory: "ఆలయ విరాళం",
    tamilCategory: "கோயில் நன்கொடை",
    badge: "Punya Daan",
    hindiBadge: "पुण्य दान",
    type: "addon",
  },
  {
    id: "bhojan-brahmins",
    name: "Bhojan Seva for Brahmins",
    hindiName: "ब्राह्मण भोजन सेवा",
    teluguName: "బ్రాహ్మణ భోజన సేవ",
    tamilName: "பிராமணர் அன்னதான சேவை",
    description: "Sattvic feast offering served to Vedic brahmins and temple devotees in your gotra's name.",
    hindiDescription: "आपके गोत्र व नाम से वैदिक ब्राह्मणों एवं मंदिर के भक्तों को कराया जाने वाला सात्विक भोजन।",
    teluguDescription: "మీ గోత్రం మరియు పేరుతో వేద బ్రాహ్మణులకు సమర్పించబడే సాత్విక భోజన సేవ.",
    tamilDescription: "உங்கள் கோத்ரம் மற்றும் பெயரில் வேத பிராமணர்களுக்கு வழங்கப்படும் சாத்வீக அன்னதானம்.",
    price: 501,
    emoji: "🍲",
    category: "Anna Daan",
    hindiCategory: "अन्न दान",
    teluguCategory: "అన్నదానం",
    tamilCategory: "அன்னதானம்",
    badge: "Anna Daan",
    hindiBadge: "अन्न दान",
    type: "addon",
  },
  {
    id: "rudraksha-offering",
    name: "Blessed Rudraksha Mala Arpan",
    hindiName: "अभिमंत्रित रुद्राक्ष अर्पण",
    teluguName: "పవిత్ర రుద్రాక్ష మాల సమర్పణ",
    tamilName: "புனித ருத்ராட்ச மாலை சமர்ப்பணம்",
    description: "5-Mukhi certified Rudraksha touch-energised on the Shiva lingam during abhishek.",
    hindiDescription: "अभिषेक के समय शिवलिंग पर स्पर्श कर अभिमंत्रित 5-मुखी प्रामाणिक रुद्राक्ष माला।",
    teluguDescription: "అభిషేక సమయంలో శివలింగాన్ని తాకించి పవిత్రీకరించిన 5-ముఖాల రుద్రాక్ష.",
    tamilDescription: "அபிஷேகத்தின் போது சிவலிங்கத்தில் வைத்து புனிதப்படுத்தப்பட்ட 5-முக ருத்ராட்சம்.",
    price: 251,
    emoji: "📿",
    category: "Sacred Relic",
    hindiCategory: "पवित्र उपहार",
    teluguCategory: "పవిత్ర వస్తువు",
    tamilCategory: "புனித பொருள்",
    badge: "Sacred Relic",
    hindiBadge: "पवित्र उपहार",
    type: "addon",
  },
];

export function getChadhavas(): ChadhavaOffering[] {
  return defaultChadhavaOfferings.filter((c) => c.type === "chadhava" || !c.type);
}

export function getOtherAddons(): ChadhavaOffering[] {
  return defaultChadhavaOfferings.filter((c) => c.type === "addon");
}

export function getLocalizedOfferingBadge(offering: ChadhavaOffering, locale?: string): string {
  if (locale === "hi" && offering.hindiBadge) return offering.hindiBadge;
  if (locale === "te" && offering.teluguBadge) return offering.teluguBadge;
  if (locale === "ta" && offering.tamilBadge) return offering.tamilBadge;
  return offering.badge || "";
}

export function getChadhavaOffering(id: string): ChadhavaOffering | undefined {
  return defaultChadhavaOfferings.find((c) => c.id === id);
}

export function getLocalizedOfferingName(offering: ChadhavaOffering, locale?: string): string {
  if (locale === "hi" && offering.hindiName) return offering.hindiName;
  if (locale === "te" && offering.teluguName) return offering.teluguName;
  if (locale === "ta" && offering.tamilName) return offering.tamilName;
  return offering.name;
}

export function getLocalizedOfferingDescription(offering: ChadhavaOffering, locale?: string): string {
  if (locale === "hi" && offering.hindiDescription) return offering.hindiDescription;
  if (locale === "te" && offering.teluguDescription) return offering.teluguDescription;
  if (locale === "ta" && offering.tamilDescription) return offering.tamilDescription;
  return offering.description;
}

export function getLocalizedOfferingCategory(offering: ChadhavaOffering, locale?: string): string {
  if (locale === "hi" && offering.hindiCategory) return offering.hindiCategory;
  if (locale === "te" && offering.teluguCategory) return offering.teluguCategory;
  if (locale === "ta" && offering.tamilCategory) return offering.tamilCategory;
  return offering.category || "";
}

export const defaultAddons: Addon[] = defaultChadhavaOfferings.map(chadhavaToDefaultAddon);

export function getAssignedAddonsForPooja(pooja?: Pooja | null, allAddons?: Addon[]): Addon[] {
  if (!pooja) return [];
  const pool = allAddons && allAddons.length > 0 ? allAddons : defaultAddons;
  const assignedIds = new Set(pooja.assignedAddonIds || []);
  const hasExplicitAssignedList = Array.isArray(pooja.assignedAddonIds);

  return pool.filter((a) => {
    if (a.active === false) return false;

    // Check if explicitly assigned to this pooja by ID
    if (assignedIds.has(a._id) || assignedIds.has(a.id)) {
      return true;
    }

    // Check if addon explicitly assigns this pooja slug
    if (Array.isArray(a.assignedPoojaSlugs) && a.assignedPoojaSlugs.includes(pooja.slug)) {
      return true;
    }

    // Legacy fallback only if pooja has no explicit assignedAddonIds array and addon has no assignedPoojaSlugs
    if (!hasExplicitAssignedList && (!a.assignedPoojaSlugs || a.assignedPoojaSlugs.length === 0)) {
      if (Array.isArray(pooja.chadhavaOptions) && pooja.chadhavaOptions.length > 0) {
        const legacySet = new Set(pooja.chadhavaOptions.map((s) => s.trim().toLowerCase()));
        return (
          legacySet.has(a.name.toLowerCase()) ||
          legacySet.has(a.id.toLowerCase()) ||
          legacySet.has((a._id || "").toLowerCase())
        );
      }
    }

    return false;
  });
}

export function getLocalizedAddonName(addon: Addon, locale?: string): string {
  if (locale === "hi" && addon.hindiName) return addon.hindiName;
  if (locale === "te" && addon.teluguName) return addon.teluguName;
  if (locale === "ta" && addon.tamilName) return addon.tamilName;
  return addon.name;
}

export function getLocalizedAddonDescription(addon: Addon, locale?: string): string {
  if (locale === "hi" && addon.hindiDescription) return addon.hindiDescription;
  if (locale === "te" && addon.teluguDescription) return addon.teluguDescription;
  if (locale === "ta" && addon.tamilDescription) return addon.tamilDescription;
  return addon.description;
}

export function getLocalizedAddonCategory(addon: Addon, locale?: string): string {
  if (locale === "hi" && addon.hindiCategory) return addon.hindiCategory;
  if (locale === "te" && addon.teluguCategory) return addon.teluguCategory;
  if (locale === "ta" && addon.tamilCategory) return addon.tamilCategory;
  return addon.category || "";
}

export interface Pooja {
  id?: string;
  _id?: string;
  slug: string;
  title: string;
  hindiTitle: string;
  teluguTitle?: string;
  tamilTitle?: string;
  emoji: string;
  gradient: string;
  price: number;
  duration: string;
  hindiDuration?: string;
  teluguDuration?: string;
  tamilDuration?: string;
  bestMuhurat: string;
  hindiBestMuhurat?: string;
  teluguBestMuhurat?: string;
  tamilBestMuhurat?: string;
  description: string;
  hindiDescription?: string;
  teluguDescription?: string;
  tamilDescription?: string;
  benefits: string[];
  hindiBenefits?: string[];
  teluguBenefits?: string[];
  tamilBenefits?: string[];
  /** Admin toggle — when false the pooja is hidden from the site (booking
   * form, catalogue and detail pages) until it is turned back on. Absent on
   * older stored data, which is treated as active. */
  active?: boolean;

  /** Category classification (e.g. Rashifal Pooja, Dosha Nivaran, Festival Special) */
  category?: string;
  /** Ritual type: 'temple' (performed at temple) or 'home' (performed at home) */
  type?: "temple" | "home";
  /** Format: true if livestreamed/online participation is available */
  online?: boolean;
  /** Live platform link (e.g. YouTube Live, Zoom, Google Meet) */
  liveStreamUrl?: string;
  /** Primary scheduled date / start date (e.g. "Oct 4, 2026") */
  startDate?: string;
  /** Image URL / Banner */
  imageUrl?: string;
  /** Related Deities (e.g. ["Lord Shiva", "Lord Ganesha"]) */
  deities?: string[];
  /** Primary assigned temple stable ID (MongoDB _id or id) */
  templeId?: string;
  /** Primary assigned temple slug */
  templeSlug?: string;
  /** Resolved temple name for instant display / denormalization */
  templeName?: string;
  /** Associated Temple IDs/Slugs (e.g. ["navagrah-temple", "kashi-vishwanath"]) */
  templeSlugs?: string[];
  /** Chadhava offering tags */
  chadhavaOptions?: string[];
  /** Specific assigned Add-on IDs for this puja */
  assignedAddonIds?: string[];
  /** Multi-tier packages */
  packages?: PoojaPackage[];

  // ── Event scheduling (optional) ──
  daysFromToday?: number;
  eventTime?: string;
  seats?: string;
  capacity?: number;
  live?: boolean;
  bookedSeats?: number;

  // ── Recency & Creation (optional) ──
  createdAt?: string;
  isNew?: boolean;

  // ── Service Card Customization (Admin Editable) ──
  /** Custom badge text (e.g. "DEMO", "Live Demo", "Special Seva", "Most Popular") */
  badge?: string;
  /** Badge visibility toggle — when false, the badge is hidden */
  showBadge?: boolean;
  /** Display order priority for custom ranking in catalog */
  displayOrder?: number;
  /** Custom CTA button label (defaults to "Book Now") */
  ctaText?: string;
  /** Custom CTA button URL/link (defaults to /book/[slug]) */
  ctaLink?: string;

  // ── Puja Display Placement System (Admin Controlled) ──
  /** Show in Hero Section (Featured Sacred Rituals) */
  showInHero?: boolean;
  /** Show in Hero Featured Puja Card (right-side booking card) */
  showInHeroCard?: boolean;
  /** Show in Puja Catalog (defaults to true for legacy records) */
  showInCatalog?: boolean;
}

/** Get localized title for a pooja based on active locale */
export function getLocalizedPoojaTitle(p: Pooja, locale?: string): string {
  if (locale === "hi" && p.hindiTitle) return p.hindiTitle;
  if (locale === "te" && p.teluguTitle) return p.teluguTitle;
  if (locale === "ta" && p.tamilTitle) return p.tamilTitle;
  return p.title;
}

/** Get secondary/native script badge for a pooja based on active locale */
export function getLocalizedPoojaNativeBadge(p: Pooja, locale?: string): string {
  if (locale === "hi") return p.hindiTitle || p.title;
  if (locale === "te") return p.teluguTitle || p.title;
  if (locale === "ta") return p.tamilTitle || p.title;
  return p.title;
}

/** Get localized description for a pooja based on active locale */
export function getLocalizedPoojaDescription(p: Pooja, locale?: string): string {
  if (locale === "hi" && p.hindiDescription) return p.hindiDescription;
  if (locale === "te" && p.teluguDescription) return p.teluguDescription;
  if (locale === "ta" && p.tamilDescription) return p.tamilDescription;
  return p.description;
}

/** Get visual banner image URL for a pooja */
export function getPoojaBannerImage(p: {
  slug?: string;
  title?: string;
  hindiTitle?: string;
  imageUrl?: string;
  image?: string;
  bannerImage?: string;
  photo?: string;
  deities?: string[];
}): string {
  const explicitImage = p.imageUrl || (p as { image?: string }).image || (p as { bannerImage?: string }).bannerImage || (p as { photo?: string }).photo;
  if (explicitImage && typeof explicitImage === "string" && explicitImage.trim()) {
    return explicitImage.trim();
  }
  const s = `${p.slug || ""} ${p.title || ""} ${p.hindiTitle || ""} ${(p.deities || []).join(" ")}`.toLowerCase();
  if (
    s.includes("durga") ||
    s.includes("navratri") ||
    s.includes("saptashati") ||
    s.includes("devi") ||
    s.includes("baglamukhi") ||
    s.includes("kali") ||
    s.includes("jwala") ||
    s.includes("दुर्गा") ||
    s.includes("काली") ||
    s.includes("सप्तशती")
  ) {
    return "/sample-puja.jpg";
  }
  if (
    s.includes("diwali") ||
    s.includes("deepawali") ||
    s.includes("lakshmi") ||
    s.includes("kuber") ||
    s.includes("satyanarayan") ||
    s.includes("katha") ||
    s.includes("ram") ||
    s.includes("hanuman") ||
    s.includes("दीपावली") ||
    s.includes("दिवाली") ||
    s.includes("लक्ष्मी") ||
    s.includes("कुबेर") ||
    s.includes("सत्यनारायण") ||
    s.includes("हनुमान")
  ) {
    return "/festivals/diwali.jpg";
  }
  if (
    s.includes("shiva") ||
    s.includes("rudra") ||
    s.includes("rudrabhishek") ||
    s.includes("shivratri") ||
    s.includes("mrityunjaya") ||
    s.includes("kaal-sarp") ||
    s.includes("mahakaleshwar") ||
    s.includes("somnath") ||
    s.includes("someshwar") ||
    s.includes("indreshwar") ||
    s.includes("शिव") ||
    s.includes("रुद्र") ||
    s.includes("महादेव") ||
    s.includes("सोमेश्वर") ||
    s.includes("अभिषेक")
  ) {
    return "/festivals/shivratri.jpg";
  }
  if (
    s.includes("ganesha") ||
    s.includes("ganesh") ||
    s.includes("गणेश") ||
    s.includes("विनायक")
  ) {
    return "/festivals/ganesha-altar.jpg";
  }
  return "";
}

/** Get localized benefits for a pooja based on active locale */
export function getLocalizedPoojaBenefits(p: Pooja, locale?: string): string[] {
  if (locale === "hi" && p.hindiBenefits && p.hindiBenefits.length > 0) return p.hindiBenefits;
  if (locale === "te" && p.teluguBenefits && p.teluguBenefits.length > 0) return p.teluguBenefits;
  if (locale === "ta" && p.tamilBenefits && p.tamilBenefits.length > 0) return p.tamilBenefits;
  return p.benefits;
}

/** Get localized best muhurat for a pooja based on active locale */
export function getLocalizedPoojaBestMuhurat(p: Pooja, locale?: string): string {
  if (locale === "hi" && p.hindiBestMuhurat) return p.hindiBestMuhurat;
  if (locale === "te" && p.teluguBestMuhurat) return p.teluguBestMuhurat;
  if (locale === "ta" && p.tamilBestMuhurat) return p.tamilBestMuhurat;
  return p.bestMuhurat;
}

/** Get localized duration for a pooja based on active locale */
export function getLocalizedPoojaDuration(p: Pooja, locale?: string): string {
  if (locale === "hi" && p.hindiDuration) return p.hindiDuration;
  if (locale === "te" && p.teluguDuration) return p.teluguDuration;
  if (locale === "ta" && p.tamilDuration) return p.tamilDuration;
  return p.duration;
}

/**
 * Determines whether a genuine live stream is configured and available for a pooja.
 * Returns true only when:
 * 1. Online format is enabled (p.online !== false).
 * 2. Live streaming is not explicitly disabled (p.live !== false).
 * 3. A valid, non-empty HTTP/HTTPS stream URL is present.
 */
export function isPoojaLiveStreamAvailable(p?: Pooja | null): boolean {
  if (!p) return false;
  if (p.online === false || p.live === false) return false;
  const rawUrl = p.liveStreamUrl?.trim();
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Resolves the scheduled auspicious Date and Time for a pooja.
 * Guaranteed to return an authentic, formatted date and time for all poojas,
 * whether they have explicit dates or are newly added.
 */
export function getPoojaSchedule(
  p: Pooja,
  today: Date = new Date()
): {
  date: string;
  time: string;
  dateISO: string;
  fullSchedule: string;
} {
  // 1. Time resolution
  const spec = upcomingEventSpecs.find((s) => s.slug === p.slug);
  let time = (p.eventTime || spec?.time || "").trim();
  if (!time) {
    if (p.bestMuhurat?.toLowerCase().includes("morning")) {
      time = "08:00 AM IST";
    } else if (
      p.bestMuhurat?.toLowerCase().includes("evening") ||
      p.bestMuhurat?.toLowerCase().includes("pradosh") ||
      p.bestMuhurat?.toLowerCase().includes("shani")
    ) {
      time = "06:30 PM IST";
    } else {
      time = "07:00 AM IST";
    }
  }

  // 2. Date resolution
  if (p.startDate && p.startDate.trim()) {
    const trimmed = p.startDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parsed = new Date(trimmed + "T00:00:00");
      if (!isNaN(parsed.getTime())) {
        const formatted = eventDateFmt.format(parsed);
        return {
          date: formatted,
          time,
          dateISO: trimmed,
          fullSchedule: `${formatted} • ${time}`,
        };
      }
    }
    return {
      date: trimmed,
      time,
      dateISO: trimmed,
      fullSchedule: `${trimmed} • ${time}`,
    };
  }

  const days =
    p.daysFromToday !== undefined
      ? p.daysFromToday
      : spec?.daysFromToday !== undefined
      ? spec.daysFromToday
      : (Math.abs(
          p.slug
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        ) % 14) + 4;

  const scheduledDate = addDays(today, days);
  const formattedDate = eventDateFmt.format(scheduledDate);
  const dateISO = toISODate(scheduledDate);

  return {
    date: formattedDate,
    time,
    dateISO,
    fullSchedule: `${formattedDate} • ${time}`,
  };
}

export const DEFAULT_POOJA_SLUGS: readonly string[] = [
  "satyanarayan-katha",
  "rudrabhishek",
  "griha-pravesh",
  "shani-dev-pooja",
  "navgraha-shanti",
  "hanuman-pooja",
  "lakshmi-pooja",
  "maha-mrityunjaya-jap",
  "saraswati-pooja",
  "durga-saptashati-path",
  "vishwakarma-pooja",
  "kuber-pooja",
];

/**
 * Sorts poojas so that the most recently added poojas always appear first.
 * Respects explicit `createdAt` timestamps, `isNew` flags, and prioritizes
 * any newly added poojas (e.g. ~35 upcoming poojas) ahead of older entries.
 */
export function sortPoojasByRecent(list: Pooja[]): Pooja[] {
  return [...list].sort((a, b) => {
    // 0. Explicit displayOrder ranking (lower number = higher priority)
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
    } else if (a.displayOrder !== undefined) {
      return -1;
    } else if (b.displayOrder !== undefined) {
      return 1;
    }

    // 1. Explicit isNew flag
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;

    // 2. Explicit createdAt timestamps (ISO format)
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (a.createdAt && !b.createdAt) return -1;
    if (!a.createdAt && b.createdAt) return 1;

    // 3. New poojas added beyond the initial 12 baseline appear first
    const aIsDefault = DEFAULT_POOJA_SLUGS.includes(a.slug);
    const bIsDefault = DEFAULT_POOJA_SLUGS.includes(b.slug);

    if (!aIsDefault && bIsDefault) return -1; // a is newly added -> goes first
    if (aIsDefault && !bIsDefault) return 1;  // b is newly added -> goes first

    if (!aIsDefault && !bIsDefault) {
      // Both are newly added: reverse index order (last appended is newest)
      return list.indexOf(b) - list.indexOf(a);
    }

    // Both are defaults: preserve original baseline order
    return DEFAULT_POOJA_SLUGS.indexOf(a.slug) - DEFAULT_POOJA_SLUGS.indexOf(b.slug);
  });
}

/** True unless the admin explicitly deactivated the pooja. */
export function isPoojaActive(p: Pooja): boolean {
  return p.active !== false;
}

/** True if pooja is active and configured to show in Hero Sacred Rituals */
export function isPoojaInHero(p: Pooja): boolean {
  if (!isPoojaActive(p)) return false;
  if (p.showInHero !== undefined) return Boolean(p.showInHero);
  // Safe default for legacy records: preserve existing featured sacred rituals
  return p.slug === "satyanarayan-katha" || p.slug === "rudrabhishek";
}

/** True if pooja is active and configured to show in Hero Featured Puja Card */
export function isPoojaInHeroCard(p: Pooja): boolean {
  if (!isPoojaActive(p)) return false;
  if (p.showInHeroCard !== undefined) return Boolean(p.showInHeroCard);
  // Safe default for legacy records: preserve existing hero right-side card
  return p.slug === "satyanarayan-katha";
}

/** True if pooja is active and configured to show in Puja Catalog (safe default true) */
export function isPoojaInCatalog(p: Pooja): boolean {
  return isPoojaActive(p) && p.showInCatalog !== false;
}

/** The active poojas for the public Puja Catalog */
export function catalogPoojas(list: Pooja[]): Pooja[] {
  return sortPoojasByRecent(list.filter(isPoojaInCatalog));
}

/** The poojas visitors should see — inactive ones are filtered out, with the most recent poojas first. */
export function activePoojas(list: Pooja[]): Pooja[] {
  return sortPoojasByRecent(list.filter(isPoojaActive));
}

export const DEMO_POOJA: Pooja = {
  slug: "demo-pooja",
  title: "Test Demo Pooja (₹1)",
  hindiTitle: "टेस्ट डेमो पूजा (₹1)",
  teluguTitle: "టెస్ట్ డెమో పూజ (₹1)",
  tamilTitle: "டெஸ்ட் டெமோ பூஜை (₹1)",
  emoji: "🪔",
  gradient: "from-amber-500 via-orange-500 to-rose-500",
  price: 1,
  duration: "5–10 mins",
  daysFromToday: 0,
  eventTime: "Live Today (Instant)",
  bestMuhurat: "Sarva Muhurat (Anytime)",
  hindiBestMuhurat: "सर्व मुहूर्त (किसी भी समय)",
  teluguBestMuhurat: "సర్వ ముహూర్తం",
  tamilBestMuhurat: "சர்வ முகூர்த்தம்",
  category: "Special Seva",
  type: "temple",
  online: true,
  imageUrl: "/festivals/ganesha-altar.jpg",
  deities: ["Lord Ganesha", "Lord Shiva"],
  description:
    "A quick ₹1 test demo pooja designed to test live sankalp booking, instant receipt generation, UPI QR code & Razorpay payment flows end-to-end.",
  hindiDescription:
    "लाइव संकल्प बुकिंग, त्वरित रसीद, यूपीआई क्यूआर और रेज़रपे पेमेंट की सम्पूर्ण प्रक्रिया की जांच के लिए विशेष ₹1 डेमो पूजा।",
  teluguDescription:
    "ఆన్‌లైన్ సంకల్ప బుకింగ్, తక్షణ రశీదు మరియు పేమెంట్ గేట్‌వేను పరీక్షించడానికి ప్రత్యేక ₹1 టెస్ట్ పూజ.",
  tamilDescription:
    "நேரலை சங்கல்ப முன்பதிவு, உடனடி ரசீது மற்றும் கட்டண முறைகளை சோதிக்க சிறப்பு ₹1 டெஸ்ட் பூஜை.",
  benefits: [
    "Real ₹1 gateway & UPI test",
    "Instant booking confirmation & receipt",
    "Devotee dashboard access",
    "WhatsApp & SMS status updates",
  ],
  hindiBenefits: [
    "वास्तविक ₹1 गेटवे व UPI टेस्ट",
    "त्वरित बुकिंग पुष्टि व डिजिटल रसीद",
    "भक्त डैशबोर्ड तक सीधी पहुंच",
    "व्हाट्सएप और एसएमएस स्थिति अपडेट",
  ],
  teluguBenefits: [
    "నిజమైన ₹1 గేట్‌వే & UPI పరీక్ష",
    "తక్షణ బుకింగ్ నిర్ధారణ & రసీదు",
    "భక్తుల డాష్‌బోర్డ్ యాక్సెస్",
    "వాట్సాప్ అప్‌డేట్‌లు",
  ],
  tamilBenefits: [
    "உண்மையான ₹1 கட்டண சோதனை",
    "உடனடி முன்பதிவு உறுதி & ரசீது",
    "பக்தர் போர்டல் அணுகல்",
    "வாட்ஸ்அப் அறிவிப்புகள்",
  ],
  isNew: true,
  createdAt: "2026-10-13T12:00:00.000Z",
  seats: "Live Demo",
  capacity: 100,
  live: true,
  assignedAddonIds: ["kumkum", "special-prasad", "panchamrit-abhishek"],
  packages: [
    { name: "Single Devotee", price: 1, description: "1 Devotee Name & Gotra Sankalp (₹1)" },
    { name: "Couple / Dampati", price: 1, description: "Husband & Wife Joint Sankalp (₹1)" },
    { name: "Family / Kul Sankalp", price: 1, description: "Complete Family Sankalp (₹1)" },
  ],
  badge: "DEMO",
  showBadge: true,
  displayOrder: 1,
  ctaText: "Book for ₹1 →",
  ctaLink: "/book/demo-pooja",
  active: true,
  showInHero: false,
  showInHeroCard: false,
  showInCatalog: true,
};

export const DEMO_POOJA_SLUGS = [
  "demo-pooja",
  "demo-puja",
  "test-demo-pooja",
  "test-demo-puja",
  "test-pooja",
  "test-puja",
  "test-pooja-1-rupee",
  "demo",
] as const;

export function isDemoSlug(slug?: string | null): boolean {
  if (!slug) return false;
  const s = slug.toLowerCase().replace(/_/g, "-");
  return (DEMO_POOJA_SLUGS as readonly string[]).includes(s);
}

export const poojas: Pooja[] = [
  {
    slug: "satyanarayan-katha",
    title: "Satyanarayan Katha",
    hindiTitle: "श्री सत्यनारायण कथा",
    teluguTitle: "శ్రీ సత్యనారాయణ కథ",
    tamilTitle: "ஸ்ரீ சத்யநாராயண கதை",
    emoji: "📿",
    gradient: "from-amber-400 to-orange-600",
    price: 1101,
    duration: "2–3 hours",
    daysFromToday: 10,
    eventTime: "6:30 PM IST",
    bestMuhurat: "Purnima & Sankranti",
    category: "Family & Home",
    type: "temple",
    online: true,
    deities: ["Lord Vishnu", "Lord Satyanarayan"],
    assignedAddonIds: ["kumkum", "special-prasad", "panchamrit-abhishek"],
    showInHero: true,
    showInHeroCard: true,
    showInCatalog: true,
    description:
      "The beloved vow-fulfillment ritual of Lord Vishnu's Satyanarayan form, bringing peace, prosperity and harmony to the whole family.",
    hindiDescription:
      "भगवान विष्णु के सत्यनारायण रूप का संकल्प पूर्ति अनुष्ठान, जो पूरे परिवार में सुख, शांति और समृद्धि लाता है।",
    teluguDescription:
      "కుటుంబంలో శాంతి, శ్రేయస్సు మరియు సామరస్యాన్ని తీసుకువచ్చే శ్రీ మహావిష్ణువు సత్యనారాయణ రూప పవిత్ర వ్రత పూజ.",
    tamilDescription:
      "குடும்பத்தில் அமைதி, செழிப்பு மற்றும் ஒற்றுமையைத் தரும் ஸ்ரீ மகாவிஷ்ணுவின் சத்யநாராயண விரத பூஜை.",
    benefits: ["Prosperity & abundance", "Family peace & harmony", "Vow fulfillment", "Blessed prasadam"],
    hindiBenefits: ["सुख और समृद्धि", "पारिवारिक शांति और सद्भाव", "मनोकामना पूर्ति", "पवित्र प्रसाद आशीर्वाद"],
    teluguBenefits: ["శ్రేయస్సు మరియు సమృద్ధి", "కుటుంబ శాంతి మరియు సామరస్యం", "సంకల్ప సిద్ధి", "పవిత్ర ప్రసాదం"],
    tamilBenefits: ["செல்வம் மற்றும் வளம்", "குடும்ப அமைதி", "பிரார்த்தனை நிறைவேற்றம்", "புனித பிரசாதம்"],
  },
  {
    slug: "rudrabhishek",
    title: "Rudrabhishek",
    hindiTitle: "श्री रुद्राभिषेक",
    teluguTitle: "శ్రీ రుద్రాభిషేకం",
    tamilTitle: "ஸ்ரீ ருத்ராபிஷேகம்",
    emoji: "🕉️",
    gradient: "from-indigo-500 to-purple-600",
    price: 2501,
    duration: "1.5–2 hours",
    daysFromToday: 12,
    eventTime: "5:00 AM IST",
    bestMuhurat: "Monday & Pradosh",
    category: "Dosha Nivaran",
    type: "temple",
    online: true,
    deities: ["Lord Shiva"],
    assignedAddonIds: ["panchamrit-abhishek", "bilva-patra", "special-prasad"],
    showInHero: true,
    showInHeroCard: false,
    showInCatalog: true,
    description:
      "Sacred abhishek of the Shiva Linga with panchamrit, bilva leaves and Vedic chants — a powerful ritual for protection and inner strength.",
    hindiDescription:
      "पंचामृत, बिल्वपत्र और वैदिक मंत्रों के साथ शिवलिंग का पवित्र अभिषेक — सुरक्षा, स्वास्थ्य और आत्मबल का अनुष्ठान।",
    teluguDescription:
      "పంచామృతం, బిల్వపత్రాలు మరియు వేద మంత్రాలతో శివలింగానికి పవిత్ర అభిషేకం — రక్షణ, ఆరోగ్యం మరియు అంతర్గత బలం కోసం.",
    tamilDescription:
      "பஞ்சாமிர்தம், வில்வ இலைகள் மற்றும் வேத மந்திரங்களுடன் சிவலிங்கத்திற்கு செய்யப்படும் புனித அபிஷேகம்.",
    benefits: ["Divine protection", "Removal of obstacles", "Health & longevity", "Inner strength"],
    hindiBenefits: ["दिव्य सुरक्षा", "बाधाओं का निवारण", "आरोग्य और दीर्घायु", "आत्मिक शक्ति"],
    teluguBenefits: ["దైవిక రక్షణ", "విఘ్న నివారణ", "ఆరోగ్యం మరియు దీర్ఘాయువు", "ఆత్మబలం"],
    tamilBenefits: ["தெய்வீக பாதுகாப்பு", "தடைகள் நீங்குதல்", "ஆரோக்கியம் மற்றும் நீண்ட ஆயுள்", "மனோபலம்"],
  },
  {
    slug: "griha-pravesh",
    title: "Griha Pravesh",
    hindiTitle: "गृह प्रवेश",
    teluguTitle: "గృహ ప్రవేశం",
    tamilTitle: "கிரகப் பிரவேசம்",
    emoji: "🏠",
    gradient: "from-emerald-500 to-teal-600",
    price: 3501,
    duration: "2–3 hours",
    daysFromToday: 13,
    eventTime: "10:00 AM IST",
    bestMuhurat: "Vastu muhurat",
    category: "Family & Home",
    type: "home",
    online: false,
    deities: ["Lord Ganesha", "Goddess Lakshmi"],
    description:
      "Vedic house-warming ceremony that purifies and energises your new home, invoking Goddess Lakshmi and Vastu Devta for lasting positivity.",
    hindiDescription:
      "वैदिक गृहप्रवेश अनुष्ठान जो आपके नए घर को शुद्ध और सकारात्मक ऊर्जा से भरता है, देवी लक्ष्मी और वास्तु देवता का आशीर्वाद दिलाता है।",
    teluguDescription:
      "లక్ష్మీ దేవి మరియు వాస్తు దేవతలను ఆహ్వానిస్తూ కొత్త ఇంటిని పవిత్రం చేసే మరియు పాజిటివ్ ఎనర్జీ నింపే వైదిక గృహ ప్రవేశ పూజ.",
    tamilDescription:
      "லக்ஷ்மி தேவி மற்றும் வாஸ்து தேவதையை வரவேற்று புதிய வீட்டைப் புனிதப்படுத்தும் மங்களகரமான கிரகப்பிரவேச பூஜை.",
    benefits: ["Positive energies", "Vastu harmony", "A peaceful home", "Blessings of Lakshmi"],
    hindiBenefits: ["सकारात्मक ऊर्जा", "वास्तु दोष शांति", "सुखमय गृह", "माँ लक्ष्मी का आशीर्वाद"],
    teluguBenefits: ["సానుకూల శక్తులు", "వాస్తు శాంతి", "శాంతియుత గృహం", "మహాలక్ష్మి అనుగ్రహం"],
    tamilBenefits: ["நேர்மறை ஆற்றல்", "வாஸ்து சாந்தி", "அமைதியான இல்லம்", "லட்சுமி கடாட்சம்"],
  },
  {
    slug: "shani-dev-pooja",
    title: "Shani Dev Pooja",
    hindiTitle: "शनि देव पूजा",
    teluguTitle: "శని దేవుని పూజ",
    tamilTitle: "சனி பகவான் பூஜை",
    emoji: "🪐",
    gradient: "from-slate-600 to-gray-900",
    price: 1001,
    duration: "1.5 hours",
    daysFromToday: 14,
    eventTime: "9:00 PM IST",
    bestMuhurat: "Saturday",
    category: "Dosha Nivaran",
    type: "temple",
    online: true,
    deities: ["Lord Shani"],
    description:
      "Special worship of Lord Shani with tail oil, black til and Shani mantra japa to pacify Saturn and bring stability during sade sati.",
    hindiDescription:
      "सरसों के तेल, काले तिल और शनि मंत्र जाप के साथ भगवान शनि की विशेष पूजा, जो साढ़े साती में राहत और जीवन में स्थिरता लाती है।",
    teluguDescription:
      "ఏలినాటి శని ప్రభావం తగ్గించడానికి మరియు జీవితంలో స్థిరత్వం కోసం నువ్వుల నూనె మరియు మంత్ర జపంతో శని పూజ.",
    tamilDescription:
      "ஏழரை சனியின் தாக்கத்தைக் குறைக்கவும், வாழ்க்கையில் ஸ்திரத்தன்மை பெறவும் செய்யப்படும் சனி பகவான் வழிபாடு.",
    benefits: ["Sade sati relief", "Career stability", "Protection from malefic", "Patience & discipline"],
    hindiBenefits: ["साढ़े साती में शांति", "करियर में स्थिरता", "अशुभ प्रभावों से रक्षा", "धैर्य व एकाग्रता"],
    teluguBenefits: ["శని దోష నివారణ", "ఉద్యోగ స్థిరత్వం", "గ్రహ పీడల నుండి రక్షణ", "క్రమశిక్షణ"],
    tamilBenefits: ["சனி தோஷ நிவாரணம்", "தொழில் ஸ்திரத்தன்மை", "தீய பார்வையில் இருந்து பாதுகாப்பு", "பொறுமை"],
  },
  {
    slug: "navgraha-shanti",
    title: "Navgraha Shanti",
    hindiTitle: "नवग्रह शांति",
    teluguTitle: "నవగ్రహ శాంతి",
    tamilTitle: "நவக்கிரக சாந்தி",
    emoji: "✨",
    gradient: "from-fuchsia-500 to-pink-600",
    price: 5001,
    duration: "3–4 hours",
    daysFromToday: 18,
    eventTime: "8:00 AM IST",
    bestMuhurat: "Graha shanti muhurat",
    category: "Rashifal Pooja",
    type: "temple",
    online: true,
    deities: ["Navgraha Devtas"],
    description:
      "A comprehensive ritual pacifying all nine planets with individual homas, dosha remedies and kumbha abhishek for overall well-being.",
    hindiDescription:
      "सभी नौ ग्रहों की शांति के लिए व्यक्तिगत हवन, दोष निवारण और कुंभ अभिषेक के साथ एक समग्र वैदिक अनुष्ठान।",
    teluguDescription:
      "సమగ్ర శ్రేయస్సు మరియు గ్రహ దోష నివారణ కోసం తొమ్మిది గ్రహాలకు చేసే సమగ్ర వైదిక హోమం మరియు అభిషేకం.",
    tamilDescription:
      "அனைத்து ஒன்பது கிரகங்களின் தோஷங்களை நீக்கி நல்வாழ்வு பெற செய்யப்படும் முழுமையான நவகிரக சாந்தி ஹோமம்.",
    benefits: ["Balances all 9 planets", "Removes doshas", "Overall well-being", "Auspicious beginnings"],
    hindiBenefits: ["सभी 9 ग्रहों का संतुलन", "दोषों का समूल निवारण", "समग्र कल्याण", "शुभ कार्यों की शुरुआत"],
    teluguBenefits: ["నవగ్రహాల సమతుల్యత", "సకల గ్రహ దోష నివారణ", "సర్వతోముఖాభివృద్ధి", "శుభారంభం"],
    tamilBenefits: ["ஒன்பது கிரகங்களின் சமநிலை", "தோஷ நிவர்த்தி", "முழுமையான நல்வாழ்வு", "சுப ஆரம்பம்"],
  },
  {
    slug: "hanuman-pooja",
    title: "Hanuman Pooja",
    hindiTitle: "हनुमान पूजा",
    teluguTitle: "హనుమాన్ పూజ",
    tamilTitle: "ஹனுமான் பூஜை",
    emoji: "🐒",
    gradient: "from-orange-400 to-rose-500",
    price: 501,
    duration: "1 hour",
    daysFromToday: 8,
    eventTime: "7:00 PM IST",
    bestMuhurat: "Tuesday & Saturday",
    category: "Health & Healing",
    type: "temple",
    online: true,
    deities: ["Lord Hanuman"],
    description:
      "Worship of Bajrang Bali with sindoor, chola and Hanuman Chalisa path to fill your life with courage, strength and fearlessness.",
    hindiDescription:
      "सिंदूर, चोला और हनुमान चालीसा पाठ के साथ बजरंगबली की पूजा, जो आपके जीवन को साहस, शक्ति और भयमुक्ति से भर देती है।",
    teluguDescription:
      "ధైర్యం, బలం మరియు భయ నివారణ కోసం సింధూరం మరియు హనుమాన్ చాలీసా పఠనంతో భజరంగబలి పూజ.",
    tamilDescription:
      "தைரியம், பலம் மற்றும் பயமின்மை பெற சிந்தூரம் மற்றும் ஹனுமான் சாலிசா பாராயணத்துடன் செய்யப்படும் வழிபாடு.",
    benefits: ["Courage & strength", "Removal of fear", "Enemy troubles removed", "Speedy justice"],
    hindiBenefits: ["साहस और बल", "भय और संकट निवारण", "शत्रु बाधा शांति", "शीघ्र न्याय व सफलता"],
    teluguBenefits: ["ధైర్యం మరియు బలం", "భయ నివారణ", "శత్రు పీడల నివారణ", "త్వరిత విజయం"],
    tamilBenefits: ["தைரியம் மற்றும் பலம்", "பயமின்மை", "எதிரி தொல்லைகள் நீங்குதல்", "வெற்றி"],
  },
  {
    slug: "lakshmi-pooja",
    title: "Lakshmi Pooja",
    hindiTitle: "लक्ष्मी पूजा",
    teluguTitle: "లక్ష్మీ పూజ",
    tamilTitle: "லட்சுமி பூஜை",
    emoji: "🪙",
    gradient: "from-yellow-400 to-amber-600",
    price: 1101,
    duration: "1.5 hours",
    daysFromToday: 9,
    eventTime: "6:00 PM IST",
    bestMuhurat: "Friday & Diwali",
    category: "Wealth & Prosperity",
    type: "temple",
    online: true,
    deities: ["Goddess Lakshmi"],
    description:
      "Invoke Mahalakshmi with lotus offerings, shri yantra pujan and 108 names path to attract wealth, prosperity and financial stability.",
    hindiDescription:
      "कमल पुष्प, श्री यंत्र पूजन और 108 नामावली पाठ के साथ महालक्ष्मी का आह्वान, जो धन, समृद्धि और वित्तीय स्थिरता लाता है।",
    teluguDescription:
      "సంపద, ఐశ్వర్యం మరియు వ్యాపార వృద్ధి కోసం కమల పుష్పాలు మరియు శ్రీ సూక్త పఠనంతో మహాలక్ష్మి పూజ.",
    tamilDescription:
      "செல்வம், வளம் மற்றும் தொழில் வளர்ச்சிக்காக தாமரை மலர்கள் மற்றும் ஸ்ரீ சூக்தத்துடன் செய்யப்படும் மகாலட்சுமி பூஜை.",
    benefits: ["Wealth & prosperity", "Business growth", "Financial stability", "Blessings of Mahalakshmi"],
    hindiBenefits: ["धन व समृद्धि", "व्यापार में वृद्धि", "वित्तीय स्थिरता", "महालक्ष्मी की कृपा"],
    teluguBenefits: ["ధన ధాన్య వృద్ధి", "వ్యాపార పురోగతి", "ఆర్థిక స్థిరత్వం", "మహాలక్ష్మి కృపాకటాక్షం"],
    tamilBenefits: ["தன தானிய விருத்தி", "வியாபார வளர்ச்சி", "பொருளாதார ஸ்திரத்தன்மை", "மகாலட்சுமி அருள்"],
  },
  {
    slug: "maha-mrityunjaya-jap",
    title: "Maha Mrityunjaya Jap",
    hindiTitle: "महामृत्युंजय जाप",
    teluguTitle: "మహా మృత్యుంజయ జపం",
    tamilTitle: "மகா மிருத்யுஞ்சய ஜெபம்",
    emoji: "🔱",
    gradient: "from-sky-500 to-blue-700",
    price: 2101,
    duration: "2 hours",
    daysFromToday: 11,
    eventTime: "6:00 AM IST",
    bestMuhurat: "Mahashivratri",
    category: "Health & Healing",
    type: "temple",
    online: true,
    deities: ["Lord Shiva"],
    description:
      "11,000 recitations of the Maha Mrityunjaya mantra with havan — a profound ritual for healing, protection and victory over fear.",
    hindiDescription:
      "हवन के साथ महामृत्युंजय मंत्र के 11,000 जाप — स्वास्थ्य लाभ, सुरक्षा और भय पर विजय के लिए एक शक्तिशाली अनुष्ठान।",
    teluguDescription:
      "ఆరోగ్యం, ఆయుష్షు మరియు అకాల భయాల నివారణ కోసం 11,000 సార్లు మహా మృత్యుంజయ మంత్ర జపం మరియు హవనం.",
    tamilDescription:
      "உடல்நலம், நீண்ட ஆயுள் மற்றும் பயத்திலிருந்து விடுபட 11,000 முறை செய்யப்படும் மகா மிருத்யுஞ்சய மந்திர ஜெபம்.",
    benefits: ["Health & healing", "Protection from accidents", "Longevity", "Peace of mind"],
    hindiBenefits: ["आरोग्य व स्वास्थ्य लाभ", "दुर्घटनाओं से रक्षा", "दीर्घायु वरदान", "मानसिक शांति"],
    teluguBenefits: ["ఆరోగ్యం మరియు స్వస్థత", "ప్రమాదాల నుండి రక్షణ", "దీర్ఘాయుష్షు", "ప్రశాంతత"],
    tamilBenefits: ["உடல்நலம் மற்றும் நிவாரணம்", "விபத்துக்களில் இருந்து பாதுகாப்பு", "நீண்ட ஆயுள்", "மன அமைதி"],
  },
  {
    slug: "saraswati-pooja",
    title: "Saraswati Pooja",
    hindiTitle: "सरस्वती पूजा",
    teluguTitle: "సరస్వతీ పూజ",
    tamilTitle: "சரஸ்வதி பூஜை",
    emoji: "📚",
    gradient: "from-rose-400 to-pink-600",
    price: 1501,
    duration: "1.5 hours",
    daysFromToday: 15,
    eventTime: "8:30 AM IST",
    bestMuhurat: "Vasant Panchami",
    category: "Festival Special",
    type: "temple",
    online: true,
    deities: ["Goddess Saraswati"],
    description:
      "Seek the blessings of Goddess Saraswati for students and artists — with aksharabhyas, pustak pujan and Vedic chants for wisdom.",
    hindiDescription:
      "विद्यार्थियों और कलाकारों के लिए माँ सरस्वती का आशीर्वाद — ज्ञान, एकाग्रता और वाक-सिद्धि के लिए वैदिक पूजन।",
    teluguDescription:
      "విద్యార్థులు మరియు కళాకారుల జ్ఞానం, విద్యా విజయం మరియు వాక్శుద్ధి కోసం జ్ఞాన సరస్వతి పూజ.",
    tamilDescription:
      "மாணவர்கள் மற்றும் கலைஞர்களின் ஞானம், கல்வி வெற்றி மற்றும் கலைத்திறனுக்காக செய்யப்படும் சரஸ்வதி பூஜை.",
    benefits: ["Wisdom & knowledge", "Academic success", "Creative inspiration", "Speech clarity"],
    hindiBenefits: ["बुद्धि व विद्या", "शिक्षा में सफलता", "सृजनात्मक प्रेरणा", "वाक्-सिद्धि"],
    teluguBenefits: ["జ్ఞానం మరియు విద్య", "విద్యా రంగంలో విజయం", "సృజనాత్మకత", "వాక్శుద్ధి"],
    tamilBenefits: ["ஞானம் மற்றும் கல்வி", "தேர்வுகளில் வெற்றி", "கலை ஆர்வம்", "பேச்சாற்றல்"],
  },
  {
    slug: "durga-saptashati-path",
    title: "Durga Saptashati Path",
    hindiTitle: "दुर्गा सप्तशती पाठ",
    teluguTitle: "దుర్గా సప్తశతి పారాయణం",
    tamilTitle: "துர்கா சப்தசதி பாராயணம்",
    emoji: "🗡️",
    gradient: "from-red-500 to-rose-700",
    price: 2501,
    duration: "7 days (1 hour/day)",
    daysFromToday: 16,
    eventTime: "7:30 AM IST",
    bestMuhurat: "Navratri",
    category: "Festival Special",
    type: "temple",
    online: true,
    imageUrl: "/sample-puja.jpg",
    deities: ["Maa Durga"],
    description:
      "Complete recitation of the 700 verses of Devi Mahatmya over seven days — the ultimate shield against negativity and fear.",
    hindiDescription:
      "सात दिनों में देवी माहात्म्य के 700 श्लोकों का संपूर्ण पाठ — नकारात्मकता से रक्षा और आत्मविश्वास का सर्वोच्च कवच।",
    teluguDescription:
      "దుష్ట శక్తులు మరియు ప్రతికూలతల నుండి రక్షణ కోసం దేవి మాహాత్మ్యంలోని 700 శ్లోకాల సంపూర్ణ పారాయణం.",
    tamilDescription:
      "எதிர்மறை சக்திகளில் இருந்து பாதுகாப்பு மற்றும் தைரியம் பெற தேவி மகாத்மியத்தின் 700 சுலோகங்களின் முழுமையான பாராயணம்.",
    benefits: ["Removal of negativity", "Divine protection", "Courage in adversity", "Shakti & confidence"],
    hindiBenefits: ["नकारात्मकता का नाश", "दैवीय रक्षा कवच", "विपत्तियों में धैर्य", "शक्ति व आत्मविश्वास"],
    teluguBenefits: ["ప్రతికూలతల తొలగింపు", "దైవిక రక్షణ", "కష్టాలలో ధైర్యం", "శక్తి మరియు ఆత్మవిశ్వాసం"],
    tamilBenefits: ["எதிர்மறை நீங்குதல்", "தெய்வீக கவசம்", "துணிச்சல்", "சக்தி மற்றும் தன்னம்பிக்கை"],
  },
  {
    slug: "vishwakarma-pooja",
    title: "Vishwakarma Pooja",
    hindiTitle: "विश्वकर्मा पूजा",
    teluguTitle: "విశ్వకర్మ పూజ",
    tamilTitle: "விஸ்வகர்மா பூஜை",
    emoji: "⚒️",
    gradient: "from-amber-500 to-yellow-600",
    price: 1001,
    duration: "1 hour",
    daysFromToday: 17,
    eventTime: "9:30 AM IST",
    bestMuhurat: "Vishwakarma Day",
    category: "Wealth & Prosperity",
    type: "temple",
    online: true,
    deities: ["Lord Vishwakarma"],
    description:
      "Worship of the divine architect Vishwakarma for workshops, factories and vehicles — ensuring safety, skill and business growth.",
    hindiDescription:
      "कारखानों, कार्यशालाओं और वाहनों के लिए भगवान विश्वकर्मा की पूजा — सुरक्षा, कुशलता और व्यापार वृद्धि का आशीर्वाद।",
    teluguDescription:
      "కర్మాగారాలు, పనిముట్లు మరియు వాహనాల భద్రత మరియు వ్యాపార అభివృద్ధి కోసం దేవ శిల్పి విశ్వకర్మ పూజ.",
    tamilDescription:
      "தொழிற்சாலைகள், கருவிகள் மற்றும் வாகனங்களின் பாதுகாப்பு மற்றும் தொழில் வளர்ச்சிக்காக செய்யப்படும் விஸ்வகர்மா வழிபாடு.",
    benefits: ["Business prosperity", "Machine & vehicle safety", "Success in work", "Skill enhancement"],
    hindiBenefits: ["व्यापारिक उन्नति", "मशीनों व वाहनों की सुरक्षा", "कार्यसिद्धि", "कौशल विकास"],
    teluguBenefits: ["వ్యాపార అభివృద్ధి", "యంత్రాలు & వాహనాల రక్షణ", "కార్య విజయం", "నైపుణ్యాభివృద్ధి"],
    tamilBenefits: ["தொழில் வெற்றி", "இயந்திரங்கள் மற்றும் வாகன பாதுகாப்பு", "வேலையில் வெற்றி", "திறன் மேம்பாடு"],
  },
  {
    slug: "kuber-pooja",
    title: "Kuber Pooja",
    hindiTitle: "कुबेर पूजा",
    teluguTitle: "కుబేర పూజ",
    tamilTitle: "குபேர பூஜை",
    emoji: "💎",
    gradient: "from-emerald-400 to-green-600",
    price: 1101,
    duration: "1.5 hours",
    daysFromToday: 19,
    eventTime: "7:00 PM IST",
    bestMuhurat: "Dhanteras",
    category: "Wealth & Prosperity",
    type: "temple",
    online: true,
    deities: ["Lord Kuber"],
    description:
      "Worship of Lord Kuber with the Kuber Yantra to attract wealth, clear debts and open new doors of financial opportunity.",
    hindiDescription:
      "कुबेर यंत्र के साथ भगवान कुबेर की विशेष पूजा — धन आकर्षण, ऋण मुक्ति और नए आर्थिक अवसरों के द्वार खोलने के लिए।",
    teluguDescription:
      "ఆర్థిక అవకాశాలు, ధన లాభం మరియు రుణ విముక్తి కోసం కుబేర యంత్ర సహిత విశేష ధనదా పూజ.",
    tamilDescription:
      "நிதி வளர்ச்சி, கடன் நிவாரணம் மற்றும் புதிய வாய்ப்புகளை ஈர்க்க குபேர எந்திரத்துடன் செய்யப்படும் பூஜை.",
    benefits: ["Attract wealth", "Business growth", "Debt relief", "Financial wisdom"],
    hindiBenefits: ["धन का आकर्षण", "व्यापारिक लाभ", "ऋण से मुक्ति", "आर्थिक सद्बुद्धि"],
    teluguBenefits: ["ధన లాభం", "వ్యాపార వృద్ధి", "రుణ విముక్తి", "ఆర్థిక జ్ఞానం"],
    tamilBenefits: ["தன வரவு", "வியாபார முன்னேற்றம்", "கடன் விடுதலை", "பொருளாதார ஞானம்"],
  },
];

export const SOMESHWAR_POOJA: Pooja = {
  id: "someshwar-mahadev-abhisek",
  slug: "someshwar-mahadev-abhisek",
  title: "Someshwar Mahadev Abhisek",
  hindiTitle: "सोमेश्वर महादेव अभिषेक",
  teluguTitle: "శ్రీ సోమేశ్వర మహాదేవ అభిషేకం",
  tamilTitle: "ஸ்ரீ சோமேஸ்வரர் மகாதேவ் அபிஷேகம்",
  emoji: "🕉️",
  gradient: "from-indigo-600 via-purple-600 to-amber-600",
  price: 1101,
  duration: "1.5–2 hours",
  daysFromToday: 7,
  eventTime: "7:00 AM IST",
  bestMuhurat: "Monday & Pradosh Kaal",
  category: "Abhishek",
  type: "temple",
  online: true,
  deities: ["Lord Shiva", "Someshwar Mahadev"],
  assignedAddonIds: ["panchamrit-abhishek", "bilva-patra", "special-prasad"],
  showInHero: false,
  showInHeroCard: false,
  showInCatalog: true,
  description:
    "Auspicious Maha Abhishek of Bhagwan Someshwar Mahadev with sacred Ganga jal, Panchamrit, fragrant chandan, and bilva leaves, accompanied by Vedic Rudra Sukta chants for peace, health, and divine protection.",
  hindiDescription:
    "भगवान सोमेश्वर महादेव का पवित्र गंगाजल, पंचामृत, सुगंधित चंदन और बिल्वपत्रों से महाभिषेक, वेदोक्त रुद्र सूक्त मंत्रों के साथ — समस्त बाधाओं से मुक्ति, आरोग्य और शिव कृपा हेतु।",
  teluguDescription:
    "భగవాన్ సోమేశ్వర మహాదేవునికి పవిత్ర గంగాజలం, పంచామృతం, సుగంధ చందనం మరియు బిల్వపత్రాలతో వేదోక్త రుద్ర సూక్త మంత్రాలతో మహాభిషేకం.",
  tamilDescription:
    "பகவான் சோமேஸ்வரர் மகாதேவருக்கு புனித கங்கா தீர்த்தம், பஞ்சாமிர்தம், சந்தனம் மற்றும் வில்வ இலைகளுடன் வேத முறைப்படி செய்யப்படும் மகா அபிஷேகம்.",
  benefits: [
    "Removal of planetary afflictions and doshas",
    "Spiritual purification and peace of mind",
    "Health, vitality, and longevity",
    "Divine grace and blessing of Lord Shiva",
  ],
  hindiBenefits: [
    "समस्त ग्रह दोषों एवं व्याधियों से मुक्ति",
    "आत्मिक शांति एवं आध्यात्मिक उन्नति",
    "आरोग्य, दीर्घायु एवं रक्षा कवच",
    "भगवान शिव की असीम कृपा और आशीर्वाद",
  ],
  teluguBenefits: [
    "గ్రహ దోషాలు మరియు వ్యాధుల నివారణ",
    "ఆధ్యాత్మిక శాంతి మరియు మానసిక ప్రశాంతత",
    "ఆరోగ్యం మరియు దీర్ఘాయువు",
    "శివానుగ్రహం మరియు రక్ష",
  ],
  tamilBenefits: [
    "கிரக தோஷங்கள் நீங்குதல்",
    "மன அமைதி மற்றும் ஆன்மீக வளர்ச்சி",
    "ஆரோக்கியம் மற்றும் நீண்ட ஆயுள்",
    "சிவபெருமானின் திவ்ய அருள்",
  ],
};

export function getPooja(slug: string): Pooja | undefined {
  if (
    slug === "someshwar-mahadev-abhisek" ||
    slug === "someshwar-mahadev-abhishek" ||
    slug === "someshwar-rudrabhishek"
  ) {
    return SOMESHWAR_POOJA;
  }
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
  /** Whether the coupon is active and can be used at checkout. Default is true unless explicitly false. */
  active?: boolean;
  /** Alias for active flag */
  isActive?: boolean;
}

/** True unless the admin explicitly deactivated the coupon. Existing coupons remain active by default. */
export function isCouponActive(c?: Coupon | null): boolean {
  if (!c) return false;
  if (c.active !== undefined) return c.active !== false;
  if (c.isActive !== undefined) return c.isActive !== false;
  return true;
}

/** Returns only active coupons from a coupon map. */
export function activeCoupons(map: Record<string, Coupon>): Record<string, Coupon> {
  const result: Record<string, Coupon> = {};
  for (const [code, c] of Object.entries(map)) {
    if (isCouponActive(c)) {
      result[code] = c;
    }
  }
  return result;
}

// ===================== POOJA DATES =====================
// Admin-managed recurring dates when pujas are conducted.
// Each entry specifies a day-of-month and time — the booking flow
// computes actual dates for the next few months from these.

export interface PoojaDate {
  id: string;          // unique key, e.g. "8th-7pm"
  dayOfMonth: number;  // 1-31
  time: string;        // display, e.g. "7:00 PM IST"
  active: boolean;     // admin toggle
}

export const defaultPoojaDates: PoojaDate[] = [];

/** Compute upcoming actual dates from a list of PoojaDate rules.
 *  Returns dates for the current and next 2 months, sorted ascending,
 *  filtering out past dates and past day-of-month in the current month. */
export function computeUpcomingDates(
  rules: PoojaDate[],
  today: Date = new Date()
): { id: string; dateISO: string; dateDisplay: string; time: string }[] {
  const active = rules.filter((r) => r.active);
  if (active.length === 0) return [];

  const result: { id: string; dateISO: string; dateDisplay: string; time: string }[] = [];
  const todayISO = today.toISOString().slice(0, 10);

  // Check 3 months: current + next 2
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();

    for (const rule of active) {
      // Clamp day to month length (e.g. Feb 30 → Feb 28)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const day = Math.min(rule.dayOfMonth, daysInMonth);
      const d = new Date(year, month, day);
      const iso = d.toISOString().slice(0, 10);

      // Skip past dates
      if (iso < todayISO) continue;

      const display = d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      result.push({
        id: `${rule.id}-${iso}`,
        dateISO: iso,
        dateDisplay: display,
        time: rule.time,
      });
    }
  }

  return result.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
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

// ===================== TEMPLE MANAGEMENT =====================

export interface Temple {
  _id?: string;
  id?: string;
  slug: string;
  name: string;
  hindiName?: string;
  teluguName?: string;
  tamilName?: string;
  deity: string;
  deities?: string[];
  city: string;
  state: string;
  country?: string;
  address?: string;
  pincode?: string;
  mapUrl?: string;
  description: string;
  hindiDescription?: string;
  teluguDescription?: string;
  tamilDescription?: string;
  history?: string;
  hindiHistory?: string;
  significance?: string;
  hindiSignificance?: string;
  image?: string;
  gallery?: string[];
  timings?: string;
  openingDays?: string;
  officialWebsite?: string;
  contactPhone?: string;
  contactEmail?: string;
  visitorGuidance?: string;
  hindiVisitorGuidance?: string;
  active: boolean;
  poojaSlugs?: string[];
  seoTitle?: string;
  seoDescription?: string;
}

export function isTempleActive(t: Temple): boolean {
  return t.active !== false;
}

export function activeTemples(list: Temple[]): Temple[] {
  return list.filter(isTempleActive);
}

/**
 * Resolve the associated Temple for a pooja without falling back to a default.
 * Returns null if no temple is assigned or found.
 */
export function resolvePoojaTemple(
  pooja?: Pooja | null,
  templesList?: Temple[]
): Temple | null {
  if (!pooja) return null;
  const pool = templesList && templesList.length > 0 ? templesList : defaultTemples;

  // 1. Check explicit templeId (MongoDB _id, id, or slug)
  if (pooja.templeId && pooja.templeId !== "none") {
    const idStr = String(pooja.templeId).trim();
    const found = pool.find((t) => {
      const tid = t._id ? String(t._id) : "";
      return (
        (tid && tid === idStr) ||
        (t.id && String(t.id) === idStr) ||
        t.slug === idStr
      );
    });
    if (found) return found;
  }

  // If templeId is explicitly set to empty or "none", it was intentionally unassigned
  if (pooja.templeId === "" || pooja.templeId === "none") {
    return null;
  }

  // 2. Check explicit templeSlug
  if (pooja.templeSlug) {
    const found = pool.find((t) => t.slug === pooja.templeSlug);
    if (found) return found;
  }

  // 3. Check templeSlugs array
  if (pooja.templeSlugs && pooja.templeSlugs.length > 0) {
    const found = pool.find((t) => {
      const tid = t._id ? String(t._id) : "";
      return (
        pooja.templeSlugs!.includes(t.slug) ||
        (tid && pooja.templeSlugs!.includes(tid)) ||
        (t.id && pooja.templeSlugs!.includes(String(t.id)))
      );
    });
    if (found) return found;
  }

  // If pooja was saved with an empty templeSlugs array and templeId wasn't specified,
  // do not associate any temple.
  if (Array.isArray(pooja.templeSlugs) && pooja.templeSlugs.length === 0) {
    return null;
  }

  // 4. Reverse lookup from temple.poojaSlugs (only for legacy seed poojas where neither templeId nor templeSlugs was set)
  if (pooja.slug) {
    const match = pool.find((t) => t.poojaSlugs?.includes(pooja.slug));
    if (match) return match;
  }

  return null;
}

export function getTempleForPooja(
  pooja?: Pooja | null,
  templesList?: Temple[]
): Temple {
  const pool = templesList && templesList.length > 0 ? templesList : defaultTemples;
  const fallback = pool.find((t) => t.slug === "kashi-vishwanath") || pool[0] || defaultTemples[1];
  if (!pooja) return fallback;
  const resolved = resolvePoojaTemple(pooja, pool);
  if (resolved) return resolved;
  return fallback;
}

/** Get localized temple name based on active locale (supports English, Hindi, Telugu, Tamil) */
export function getLocalizedTempleName(t?: Temple | null, locale?: string): string {
  if (!t) return "";
  if (locale === "hi" && t.hindiName) return t.hindiName;
  if (locale === "te" && t.teluguName) return t.teluguName;
  if (locale === "ta" && t.tamilName) return t.tamilName;
  return t.name;
}

/** Get localized description for a temple */
export function getLocalizedTempleDescription(t?: Temple | null, locale?: string): string {
  if (!t) return "";
  if (locale === "hi" && t.hindiDescription) return t.hindiDescription;
  if (locale === "te" && t.teluguDescription) return t.teluguDescription;
  if (locale === "ta" && t.tamilDescription) return t.tamilDescription;
  return t.description;
}

/** Get localized history and background for a temple */
export function getLocalizedTempleHistory(t?: Temple | null, locale?: string): string {
  if (!t) return "";
  if (locale === "hi" && t.hindiHistory) return t.hindiHistory;
  return t.history || "";
}

/** Get localized spiritual significance for a temple */
export function getLocalizedTempleSignificance(t?: Temple | null, locale?: string): string {
  if (!t) return "";
  if (locale === "hi" && t.hindiSignificance) return t.hindiSignificance;
  return t.significance || "";
}

/** Get localized visitor guidance for a temple */
export function getLocalizedTempleVisitorGuidance(t?: Temple | null, locale?: string): string {
  if (!t) return "";
  if (locale === "hi" && t.hindiVisitorGuidance) return t.hindiVisitorGuidance;
  return t.visitorGuidance || "";
}

/** Get all poojas associated with a temple */
export function getRelatedPoojasForTemple(temple: Temple, allPoojas: Pooja[]): Pooja[] {
  const slugs = new Set(temple.poojaSlugs || []);
  return allPoojas.filter(
    (p) => slugs.has(p.slug) || (p.templeSlugs && p.templeSlugs.includes(temple.slug))
  );
}

export const defaultTemples: Temple[] = [
  {
    slug: "kashi-vishwanath",
    name: "Kashi Vishwanath Temple",
    hindiName: "काशी विश्वनाथ मंदिर",
    teluguName: "కాశీ విశ్వనాథ ఆలయం",
    tamilName: "காசி விஸ்வநாதர் கோயில்",
    deity: "Lord Shiva (Vishveshwara)",
    deities: ["Lord Shiva", "Maa Annapurna", "Kaal Bhairav"],
    city: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    address: "Lahori Tola, Varanasi, Uttar Pradesh",
    pincode: "221001",
    mapUrl: "https://maps.google.com/?q=Kashi+Vishwanath+Temple+Varanasi",
    description:
      "One of the most sacred twelve Jyotirlingas, situated on the western bank of the sacred river Ganga in the eternal city of Varanasi.",
    hindiDescription:
      "द्वादश ज्योतिर्लिंगों में से एक अत्यंत पावन ज्योतिर्लिंग, जो मोक्षदायिनी माँ गंगा के पावन तट पर काशी की पावन धरा पर सुशोभित है।",
    history:
      "Kashi Vishwanath is mentioned extensively in the Skanda Purana (Kashi Khanda). It stands in the spiritual capital of India, continuously worshipped for millennia. The temple was reconstructed by Maharani Ahilyabai Holkar of Indore in 1780 and has recently been expanded into the magnificent Kashi Vishwanath Dham corridor.",
    hindiHistory:
      "स्कंद पुराण के काशी खंड में इस पावन तीर्थ का विशद वर्णन है। महारानी अहिल्याबाई होल्कर ने 1780 में इस भव्य मंदिर का जीर्णोद्धार करवाया था। यह सनातन धर्म की सबसे प्राचीन और जीवंत आध्यात्मिक ऊर्जा का केंद्र है।",
    significance:
      "Believed to be the place where Lord Shiva whispers the Taraka Mantra into the ears of departing souls, bestowing instant Moksha (liberation). Performing Rudrabhishek and archana here removes past karma and brings supreme spiritual awakening.",
    hindiSignificance:
      "मान्यता है कि काशी में देहत्याग करने वाले जीवों को स्वयं देवाधिदेव महादेव तारक मंत्र देकर मोक्ष प्रदान करते हैं। यहाँ रुद्राभिषेक करवाने से जन्म-जन्मांतर के पापों का क्षय और अखंड सुख-शांति की प्राप्ति होती है।",
    image: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80",
      "/festivals/shivratri.jpg",
      "/sample-puja.jpg",
    ],
    timings: "3:00 AM – 11:00 PM (Mangala Aarti at 3:00 AM, Shringar at 9:00 PM)",
    openingDays: "Open all 7 days year-round",
    officialWebsite: "https://shrikashivishwanath.org",
    contactPhone: "+91 542 2392629",
    contactEmail: "helpdesk@shrikashivishwanath.org",
    visitorGuidance:
      "Traditional Indian attire recommended. Devotees are requested to leave mobile phones and electronic devices in designated locker facilities at the Dham entrance. Wheelchair assistance is available at Gate 4.",
    hindiVisitorGuidance:
      "पारंपरिक सात्विक वेशभूषा अनुशंसित है। मोबाइल फोन और इलेक्ट्रॉनिक उपकरण मुख्य द्वार के लॉकर में जमा करवाने होते हैं। गेट नं. 4 पर वरिष्ठ नागरिकों के लिए व्हीलचेयर सुविधा उपलब्ध है।",
    active: true,
    poojaSlugs: ["rudrabhishek", "maha-mrityunjaya-jap"],
    seoTitle: "Kashi Vishwanath Temple, Varanasi — Divine History, Timings & Sacred Poojas",
    seoDescription:
      "Explore Kashi Vishwanath Jyotirlinga in Varanasi. Discover ancient temple lore, daily darshan timings, sacred traditions, and book authentic Vedic Rudrabhishek rituals online.",
  },
  {
    slug: "mahakaleshwar",
    name: "Mahakaleshwar Jyotirlinga",
    hindiName: "महाकालेश्वर ज्योतिर्लिंग",
    teluguName: "మహాకాళేశ్వర్ జ్యోతిర్లింగం",
    tamilName: "மகாகாளேஸ்வரர் ஜோதிர்லிங்கம்",
    deity: "Lord Shiva (Mahakal)",
    deities: ["Lord Mahakal", "Goddess Parvati", "Lord Ganesha", "Lord Kartikeya"],
    city: "Ujjain",
    state: "Madhya Pradesh",
    country: "India",
    address: "Jaisinghpura, Ujjain, Madhya Pradesh",
    pincode: "456001",
    mapUrl: "https://maps.google.com/?q=Mahakaleshwar+Temple+Ujjain",
    description:
      "The only Dakshinmukhi (south-facing) Jyotirlinga in the world, renowned for its sacred Bhasma Aarti and time-transcending divine power.",
    hindiDescription:
      "विश्व का एकमात्र दक्षिणमुखी ज्योतिर्लिंग, जहाँ प्रातःकाल होने वाली दिव्य भस्म आरती और महाकाल का आशीर्वाद अकाल मृत्यु के भय को मिटाता है।",
    history:
      "Located in the ancient holy city of Avantika (Ujjain), Mahakaleshwar temple has been sanctified by sages and described by Kalidasa in Meghaduta. The presiding deity Mahakal transcends time itself (Kaal). Reconstructed in the 18th century by the Scindias, it now features the grand Shri Mahakal Lok corridor.",
    hindiHistory:
      "प्राचीन अवंतिकापुरी (उज्जैन) में स्थित यह पावन धाम महाकवि कालिदास के मेघदूत से लेकर स्कंद पुराण के अवंती खंड तक महिमामंडित है। महाकाल स्वयं काल के स्वामी हैं। हाल ही में निर्मित श्री महाकाल लोक कॉरिडोर इस तीर्थ की दिव्यता को और भव्य रूप देता है।",
    significance:
      "Worshipping Mahakaleshwar protects against untimely demise (Akaal Mrityu) and grants fearless life. The south-facing idol emits unique cosmic energy favorable for tantric and Vedic transcendence.",
    hindiSignificance:
      "महाकालेश्वर के दर्शन और अभिषेक से अकाल मृत्यु का भय समाप्त हो जाता है। 'अकाल मृत्यु वो मरे जो काम करे चांडाल का, काल उसका क्या करे जो भक्त हो महाकाल का।' यहाँ का रुद्राभिषेक जीवन में समस्त संकटों का नाश करता है।",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
      "/festivals/shivratri.jpg",
    ],
    timings: "4:00 AM – 11:00 PM (Bhasma Aarti at 4:00 AM, Sandhya Aarti at 7:00 PM)",
    openingDays: "Open all 7 days year-round",
    officialWebsite: "https://shrimahakaleshwar.com",
    contactPhone: "+91 734 2550563",
    visitorGuidance:
      "Dhoti-Kurta for men and Saree/Salwar for women is mandatory for Garbhagriha entry and Bhasma Aarti. Advance reservation is recommended for morning Bhasma Aarti.",
    hindiVisitorGuidance:
      "गर्भगृह प्रवेश एवं भस्म आरती हेतु पुरुषों के लिए धोती-कुर्ता तथा महिलाओं के लिए साड़ी अनिवार्य है। भस्म आरती दर्शन हेतु पूर्व अनुमति या ऑनलाइन स्लॉट बुकिंग अनुशंसित है।",
    active: true,
    poojaSlugs: ["rudrabhishek", "maha-mrityunjaya-jap"],
    seoTitle: "Mahakaleshwar Jyotirlinga, Ujjain — Bhasma Aarti, History & Online Poojas",
    seoDescription:
      "Complete guide to Mahakaleshwar Temple Ujjain. Timings, Bhasma Aarti details, history, significance, and booking of Vedic pujas and Rudrabhishek.",
  },
  {
    slug: "trimbakeshwar",
    name: "Trimbakeshwar Shiva Temple",
    hindiName: "त्र्यंबकेश्वर ज्योतिर्लिंग",
    teluguName: "త్ర్యంబకేశ్వర ఆలయం",
    tamilName: "திரிம்பகேஸ்வரர் கோயில்",
    deity: "Lord Shiva (Trimbak)",
    deities: ["Lord Brahma", "Lord Vishnu", "Lord Shiva"],
    city: "Nashik",
    state: "Maharashtra",
    country: "India",
    address: "Trimbak, Nashik District, Maharashtra",
    pincode: "422212",
    mapUrl: "https://maps.google.com/?q=Trimbakeshwar+Shiva+Temple+Nashik",
    description:
      "Sacred Jyotirlinga uniquely featuring a three-faced lingam embodying Brahma, Vishnu, and Maheshwar, near the sacred origin of river Godavari.",
    hindiDescription:
      "पवित्र गोदावरी के उद्गम स्थल ब्रह्मगिरि पर्वत की तलहटी में स्थित पावन ज्योतिर्लिंग, जहाँ त्रिदेव (ब्रह्मा, विष्णु, महेश) एक साथ लिंग रूप में विराजित हैं।",
    history:
      "Built by Peshwa Balaji Baji Rao (Nana Saheb) in the 18th century using basalt black stone, Trimbakeshwar has immense Vedic significance. Sage Gautama performed penance here, and the sacred river Godavari (Gautami Ganga) descended upon earth at this consecrated site.",
    hindiHistory:
      "पेशवा बालाजी बाजीराव ने काले पत्थरों से इस भव्य नागर शैली के मंदिर का निर्माण करवाया था। महर्षि गौतम की तपस्या से प्रसन्न होकर भगवान शिव ने यहाँ गोदावरी नदी को प्रकट किया था।",
    significance:
      "Trimbakeshwar is the paramount shrine for mitigating ancestral karmas, Pitra Dosha, and Kaal Sarp Dosha. Because all three supreme deities reside together in the lingam, rituals performed here grant triple divine grace.",
    hindiSignificance:
      "यह तीर्थ कालसर्प दोष निवारण, नारायण नागबलि और पितृदोष शांति के लिए संपूर्ण भारत में सर्वोपरि माना गया है। त्रिदेवों की उपस्थिति से समस्त ग्रह जनित कष्ट दूर होते हैं।",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
      "/festivals/shivratri.jpg",
    ],
    timings: "5:30 AM – 9:00 PM",
    openingDays: "Open all 7 days year-round",
    officialWebsite: "https://trimbakeshwartrust.com",
    contactPhone: "+91 2594 233215",
    visitorGuidance:
      "Devotees should wear traditional attire. Special Abhishek rituals take place in the morning hours between 6:00 AM and 11:30 AM.",
    hindiVisitorGuidance:
      "पारंपरिक परिधान अनुशंसित। विशेष अभिषेक और पूजा प्रातः 6:00 से 11:30 बजे के मध्य संपन्न की जाती है।",
    active: true,
    poojaSlugs: ["rudrabhishek", "navgraha-shanti"],
    seoTitle: "Trimbakeshwar Jyotirlinga Nashik — History, Kaal Sarp Rituals & Timings",
    seoDescription:
      "Learn about Trimbakeshwar Temple in Nashik, Maharashtra. Ancient history, Godavari origin, darshan timings, and book authenticated Vedic pujas.",
  },
  {
    slug: "siddhivinayak",
    name: "Shree Siddhivinayak Temple",
    hindiName: "श्री सिद्धिविनायक मंदिर",
    teluguName: "శ్రీ సిద్ధివినాయక ఆలయం",
    tamilName: "ஸ்ரீ சித்திவிநாயகர் கோயில்",
    deity: "Lord Ganesha (Siddhivinayak)",
    deities: ["Lord Ganesha", "Riddhi", "Siddhi"],
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    address: "SK Bole Marg, Prabhadevi, Mumbai, Maharashtra",
    pincode: "400028",
    mapUrl: "https://maps.google.com/?q=Siddhivinayak+Temple+Mumbai",
    description:
      "World-renowned shrine of Lord Ganesha in Mumbai, beloved for fulfilling sincere wishes (Navas) and blessing devotees with success, intellect, and prosperity.",
    hindiDescription:
      "मुंबई का विश्वप्रसिद्ध गणेश मंदिर, जहाँ दाहिनी सूंड वाले सिद्धिविनायक भक्तों की समस्त मनोकामनाएँ पूर्ण करते हैं और शुभ कार्यों में सिद्धि प्रदान करते हैं।",
    history:
      "Originally consecrated on 19 November 1801 by Laxman Vithu and Deubai Patil. Over the centuries it has grown into one of India's richest and most beloved shrines, visited by millions from all walks of life.",
    hindiHistory:
      "इस पावन मंदिर का निर्माण 19 नवंबर 1801 को लक्ष्मण विठू और देउबाई पाटिल द्वारा कराया गया था। सिद्धिविनायक की यह पावन प्रतिमा स्वयंभू और जाग्रत मानी जाती है।",
    significance:
      "Lord Ganesha here has his trunk tilted to the right (Navasacha Ganapati), which requires authentic, strict Vedic devotion. Prayers offered here grant immediate obstacle clearance and success in business, education, and career.",
    hindiSignificance:
      "दाहिनी सूंड वाले श्री गणेश 'सिद्धि' प्रदान करने वाले जाग्रत देव हैं। यहाँ की गई पूजा-अर्चना से व्यापार, नौकरी, अध्ययन और वैवाहिक जीवन की हर बाधा दूर हो जाती है।",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
      "/festivals/ganesha-altar.jpg",
    ],
    timings: "5:30 AM – 10:00 PM (Special Tuesday Darshan from 3:15 AM)",
    openingDays: "Open all 7 days; Tuesday is especially auspicious",
    officialWebsite: "https://siddhivinayak.org",
    contactPhone: "+91 22 24223206",
    visitorGuidance:
      "Tuesdays witness massive footfall, so early morning darshan is recommended. Free shoe keeping and cloakroom facilities are available.",
    hindiVisitorGuidance:
      "मंगलवार को विशेष भीड़ रहती है, अतः प्रातः काल दर्शन सुविधाजनक रहता है। जूता घर और प्रसादम काउंटर मंदिर परिसर में उपलब्ध हैं।",
    active: true,
    poojaSlugs: ["satyanarayan-katha", "griha-pravesh"],
    seoTitle: "Shree Siddhivinayak Temple Mumbai — Darshan Timings, History & Sevas",
    seoDescription:
      "Visit Shree Siddhivinayak Ganapati Temple in Prabhadevi, Mumbai. Check daily aarti timings, history, significance, and book online personalized poojas.",
  },
  {
    slug: "salasar-balaji",
    name: "Salasar Balaji Temple",
    hindiName: "सालासर बालाजी मंदिर",
    teluguName: "సాలాసర్ బాలాజీ ఆలయం",
    tamilName: "சாலாசர் பாலாஜி கோயில்",
    deity: "Lord Hanuman (Balaji)",
    deities: ["Lord Hanuman", "Lord Rama", "Maa Sita"],
    city: "Salasar",
    state: "Rajasthan",
    country: "India",
    address: "Salasar, Churu District, Rajasthan",
    pincode: "331506",
    mapUrl: "https://maps.google.com/?q=Salasar+Balaji+Temple+Rajasthan",
    description:
      "Miraculous swayambhu shrine of Lord Hanuman featuring a unique beard and mustache idol, renowned for granting profound spiritual protection, courage, and health.",
    hindiDescription:
      "राजस्थान के चूरू जिले में स्थित भगवान हनुमान का दिव्य चमत्कारी धाम, जहाँ दाढ़ी-मूंछ वाले बालरूप श्री हनुमान जी भक्तों की मनोकामना पूर्ण करते हैं।",
    history:
      "The swayambhu idol of Balaji was found on Shravan Shukla Navami in 1754 by a farmer while ploughing his field in Asota village. Devotee Mohandas Ji Maharaj established the shrine in Salasar, which has since become a prime pilgrimage center.",
    hindiHistory:
      "संवत 1811 (1754 ई.) में आसोटा गांव में हल जोतते समय एक किसान को यह पावन मूर्ति मिली थी। भक्त शिरोमणि मोहनदास जी महाराज ने सालासर में इस दिव्य धाम की स्थापना की।",
    significance:
      "Known for granting miraculous relief from physical ailments, negative energies, and legal/financial hardships. The sacred Akhand Jyoti (eternal flame) has been continuously burning for over two centuries.",
    hindiSignificance:
      "यहाँ प्रज्वलित अखंड धूणा और अखंड ज्योति 250 से अधिक वर्षों से जल रही है। नारियल बांधने की प्रथा (मनौती) और चूरमा भोग अर्पण करने से हर विपदा टल जाती है।",
    image: "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=800&q=80",
      "/festivals/diwali.jpg",
    ],
    timings: "5:00 AM – 10:00 PM (Mangala Aarti at 5:00 AM, Shayan Aarti at 10:00 PM)",
    openingDays: "Open all 7 days year-round; Tuesday and Saturday are peak days",
    officialWebsite: "https://salasarbalaji.org",
    contactPhone: "+91 1568 252204",
    visitorGuidance:
      "Devotees commonly offer Savamani (Churma prasad) and tie coconuts with moli for wish fulfillment. Comfortable modest clothing is advised.",
    hindiVisitorGuidance:
      "सवामणी प्रसाद और लाल चुनरी के साथ नारियल बांधने की प्राचीन परंपरा है। मंगलवार और पूर्णिमा पर श्रद्धालुओं की अधिक संख्या रहती है।",
    active: true,
    poojaSlugs: ["hanuman-pooja"],
    seoTitle: "Salasar Balaji Temple, Rajasthan — History, Timings & Hanuman Pooja",
    seoDescription:
      "Explore the holy shrine of Salasar Balaji in Rajasthan. Discover its miraculous history, daily timings, Akhand Jyoti significance, and book dedicated Hanuman poojas.",
  },
  {
    slug: "navagrah-temple",
    name: "Navagrah Temple",
    hindiName: "नवग्रह मंदिर",
    teluguName: "నవగ్రహ ఆలయం",
    tamilName: "நவகிரக கோயில்",
    deity: "Navagraha Devatas",
    deities: ["Surya", "Chandra", "Mangala", "Budha", "Brihaspati", "Shukra", "Shani", "Rahu", "Ketu"],
    city: "Ujjain",
    state: "Madhya Pradesh",
    country: "India",
    address: "Triveni Ghat, Ujjain, Madhya Pradesh",
    pincode: "456006",
    mapUrl: "https://maps.google.com/?q=Navagrah+Temple+Triveni+Sangam+Ujjain",
    description:
      "Ancient temple dedicated to the nine celestial planetary deities situated at the confluence of the sacred Triveni Ghat in Ujjain. World-renowned for astrological pacification rituals.",
    hindiDescription:
      "उज्जैन में त्रिवेणी संगम के पावन तट पर स्थित नवग्रह मंदिर, जहाँ नवग्रह शांति, शनि दोष निवारण और राहु-केतु शांति पूजा का विशेष फल प्राप्त होता है।",
    history:
      "Ujjain has been the astrological prime meridian of ancient India. This revered temple on the banks of Triveni River was established hundreds of years ago by Vedic astrologers and royal patrons to balance planetary forces.",
    hindiHistory:
      "उज्जैन को प्राचीन काल से ही भारत की खगोलीय एवं ज्योतिषीय राजधानी माना गया है। त्रिवेणी संगम पर स्थित यह सिद्ध पीठ नवग्रहों की ऊर्जा को संतुलित करने हेतु स्थापित किया गया था।",
    significance:
      "Performing Navagraha Shanti and Shani Telabhishek here neutralizes planetary afflictions (Kundli doshas), promotes good health, and restores balance and prosperity to family life.",
    hindiSignificance:
      "कुंडली के नवग्रह दोष, शनि की साढ़ेसाती व ढैय्या तथा राहु-केतु के दुष्प्रभावों की शांति के लिए यहाँ का अभिषेक व हवन अत्यंत प्रभावशाली है।",
    image: "/festivals/ganesha-altar.jpg",
    gallery: [
      "/festivals/ganesha-altar.jpg",
      "/festivals/shivratri.jpg",
    ],
    timings: "5:30 AM – 9:00 PM",
    openingDays: "Open all 7 days; Saturdays and Amavasya are highly auspicious",
    officialWebsite: "https://ujjaintourism.in/navagrah-temple",
    contactPhone: "+91 734 2511224",
    visitorGuidance:
      "Devotees participating in planetary rituals should bring mustard oil and black sesame for Shani Dev archana. Pandits are available for individual sankalp.",
    hindiVisitorGuidance:
      "शनिवार को शनि देव हेतु सरसों का तेल और काले तिल अर्पण करने का विशेष विधान है। पंडित जी से संकल्प करवाकर पूजा संपन्न कराई जाती है।",
    active: true,
    poojaSlugs: ["navgraha-shanti", "shani-dev-pooja"],
    seoTitle: "Navagrah Temple, Ujjain — Planetary Dosha Shanti & Darshan Timings",
    seoDescription:
      "Discover the ancient Navagrah Temple on Triveni Ghat in Ujjain. Information on all 9 planetary deities, timings, significance, and booking of Navagraha Shanti poojas.",
  },
];

export function getTemple(slug: string, list: Temple[] = defaultTemples): Temple | undefined {
  return list.find((t) => t.slug === slug);
}
