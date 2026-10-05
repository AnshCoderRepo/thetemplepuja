import { SITE_CONFIG, getWhatsAppUrl } from "./config";

export const stats = [
  { value: "10,847+", label: "Total Bookings", icon: "🪔" },
  { value: "50+", label: "Temples", icon: "🕉️" },
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
    secondaryCtaLink: "#poojas",
    priority: 1,
    active: true,
  },
  {
    id: "diwali-2026",
    name: "Diwali Mahotsav",
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
    secondaryCtaLink: "#poojas",
    priority: 2,
    active: true,
  },
  {
    id: "shivratri-special",
    name: "Maha Shivratri Seva",
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
    q: "How do I book a pooja on templepujasewa?",
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
    value: SITE_CONFIG.contact.phoneDisplay,
    href: getWhatsAppUrl(),
  },
  {
    icon: "✉️",
    label: "Email",
    value: SITE_CONFIG.contact.email,
    href: `mailto:${SITE_CONFIG.contact.email}`,
  },
];

// ===================== POOJA CATALOG =====================

export interface PoojaPackage {
  name: string;
  price: number;
  description?: string;
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

export interface Pooja {
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
  /** Primary scheduled date / start date (e.g. "Oct 4, 2026") */
  startDate?: string;
  /** Image URL / Banner */
  imageUrl?: string;
  /** Related Deities (e.g. ["Lord Shiva", "Lord Ganesha"]) */
  deities?: string[];
  /** Associated Temple IDs/Slugs (e.g. ["navagrah-temple", "kashi-vishwanath"]) */
  templeSlugs?: string[];
  /** Chadhava offering tags */
  chadhavaOptions?: string[];
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
export function getPoojaBannerImage(p: { slug?: string; title?: string; imageUrl?: string }): string {
  if (p.imageUrl && p.imageUrl.trim()) {
    return p.imageUrl.trim();
  }
  const s = `${p.slug || ""} ${p.title || ""}`.toLowerCase();
  if (
    s.includes("durga") ||
    s.includes("navratri") ||
    s.includes("saptashati") ||
    s.includes("devi") ||
    s.includes("baglamukhi") ||
    s.includes("kali")
  ) {
    return "/festivals/durga-puja.jpg";
  }
  if (
    s.includes("diwali") ||
    s.includes("deepawali") ||
    s.includes("lakshmi") ||
    s.includes("kuber") ||
    s.includes("satyanarayan") ||
    s.includes("katha") ||
    s.includes("ram") ||
    s.includes("hanuman")
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
    s.includes("somnath")
  ) {
    return "/festivals/shivratri.jpg";
  }
  return "/festivals/ganesha-altar.jpg";
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

/** The poojas visitors should see — inactive ones are filtered out, with the most recent poojas first. */
export function activePoojas(list: Pooja[]): Pooja[] {
  return sortPoojasByRecent(list.filter(isPoojaActive));
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
  slug: string;
  name: string;
  hindiName?: string;
  deity: string;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  description: string;
  image?: string;
  timings?: string;
  active: boolean;
  poojaSlugs?: string[];
}

export function isTempleActive(t: Temple): boolean {
  return t.active !== false;
}

export function activeTemples(list: Temple[]): Temple[] {
  return list.filter(isTempleActive);
}

export function getTempleForPooja(pooja?: Pooja | null): Temple {
  if (!pooja) return defaultTemples[1];
  if (pooja.templeSlugs && pooja.templeSlugs.length > 0) {
    const found = defaultTemples.find((t) => pooja.templeSlugs?.includes(t.slug));
    if (found) return found;
  }
  const match = defaultTemples.find((t) => t.poojaSlugs?.includes(pooja.slug));
  if (match) return match;
  return defaultTemples[1]; // Kashi Vishwanath Temple
}

export const defaultTemples: Temple[] = [
  {
    slug: "navagrah-temple",
    name: "Navagrah Temple",
    hindiName: "नवग्रह मंदिर",
    deity: "Navagraha Devatas",
    city: "Ujjain",
    state: "Madhya Pradesh",
    address: "Triveni Ghat, Ujjain",
    pincode: "456006",
    description:
      "Ancient temple dedicated to the nine planetary deities situated on the banks of Triveni. Famous for Rahu-Ketu and Shani Shanti rituals.",
    image: "/festivals/ganesha-altar.jpg",
    timings: "5:30 AM – 9:00 PM",
    active: true,
    poojaSlugs: ["navgraha-shanti", "shani-dev-pooja"],
  },
  {
    slug: "kashi-vishwanath",
    name: "Kashi Vishwanath Temple",
    hindiName: "काशी विश्वनाथ मंदिर",
    deity: "Lord Shiva",
    city: "Varanasi",
    state: "Uttar Pradesh",
    address: "Lahori Tola, Varanasi",
    pincode: "221001",
    description:
      "One of the most sacred twelve Jyotirlingas, located on the western bank of the holy river Ganga in Kashi.",
    image: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80",
    timings: "3:00 AM – 11:00 PM",
    active: true,
    poojaSlugs: ["rudrabhishek", "maha-mrityunjaya-jap"],
  },
  {
    slug: "mahakaleshwar",
    name: "Mahakaleshwar Jyotirlinga",
    hindiName: "महाकालेश्वर ज्योतिर्लिंग",
    deity: "Lord Shiva (Mahakal)",
    city: "Ujjain",
    state: "Madhya Pradesh",
    address: "Jaisinghpura, Ujjain",
    pincode: "456001",
    description:
      "Dakshinmukhi Jyotirlinga renowned for its sacred Bhasma Aarti and time-transcending blessings of Mahakal.",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80",
    timings: "4:00 AM – 11:00 PM",
    active: true,
    poojaSlugs: ["rudrabhishek", "maha-mrityunjaya-jap"],
  },
  {
    slug: "trimbakeshwar",
    name: "Trimbakeshwar Shiva Temple",
    hindiName: "त्र्यंबकेश्वर ज्योतिर्लिंग",
    deity: "Lord Shiva",
    city: "Nashik",
    state: "Maharashtra",
    address: "Trimbak, Nashik",
    pincode: "422212",
    description:
      "Sacred Jyotirlinga featuring the three-faced lingam embodying Brahma, Vishnu, and Maheshwar near the origin of river Godavari.",
    image: "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
    timings: "5:30 AM – 9:00 PM",
    active: true,
    poojaSlugs: ["rudrabhishek", "navgraha-shanti"],
  },
  {
    slug: "siddhivinayak",
    name: "Shree Siddhivinayak Temple",
    hindiName: "श्री सिद्धिविनायक मंदिर",
    deity: "Lord Ganesha",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Prabhadevi, Mumbai",
    pincode: "400028",
    description:
      "World-renowned shrine of Lord Ganesha fulfilling sincere wishes and granting success in new ventures.",
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80",
    timings: "5:30 AM – 10:00 PM",
    active: true,
    poojaSlugs: ["satyanarayan-katha", "griha-pravesh"],
  },
  {
    slug: "salasar-balaji",
    name: "Salasar Balaji Temple",
    hindiName: "सालासर बालाजी मंदिर",
    deity: "Lord Hanuman",
    city: "Salasar",
    state: "Rajasthan",
    address: "Salasar, Churu District",
    pincode: "331506",
    description:
      "Miraculous swayambhu idol of Lord Hanuman with beard and mustache, attracting millions of devotees for courage and protection.",
    image: "https://images.unsplash.com/photo-1598890777032-bde835ba27c2?auto=format&fit=crop&w=800&q=80",
    timings: "5:00 AM – 10:00 PM",
    active: true,
    poojaSlugs: ["hanuman-pooja"],
  },
];

export function getTemple(slug: string, list: Temple[] = defaultTemples): Temple | undefined {
  return list.find((t) => t.slug === slug);
}
