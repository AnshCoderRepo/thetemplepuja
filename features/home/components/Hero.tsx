"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Star, Sparkles, Clock, Calendar, CheckCircle2, ArrowRight } from "lucide-react";
import { useI18n } from "@/components/providers";
import { useCatalog } from "@/features/catalog";
import { useUpcomingFestivals } from "@/features/festivals";
import {
  getLocalizedFestivalBadge,
  getLocalizedFestivalCountdown,
  getLocalizedFestivalCta,
  getLocalizedFestivalName,
  getLocalizedFestivalSecondaryCta,
  getLocalizedFestivalSubtitle,
  getLocalizedFestivalTitle,
  getLocalizedPoojaTitle,
  getPoojaSchedule,
  isPoojaActive,
  isPoojaInHero,
  isPoojaInHeroCard,
  type FestivalEvent,
  type Pooja,
} from "@/lib/data";

const TICKER_ITEMS_MAP: Record<string, { icon: string; label: string }[]> = {
  hi: [
    { icon: "✨", label: "सिद्ध वैदिक यंत्र" },
    { icon: "🛕", label: "सुरक्षित बुकिंग" },
    { icon: "📹", label: "लाइव पूजा दर्शन" },
    { icon: "📦", label: "प्रसाद होम डिलीवरी" },
    { icon: "👥", label: "लाखों श्रद्धालुओं का विश्वास" },
    { icon: "🪔", label: "प्रामाणिक वैदिक अनुष्ठान" },
  ],
  te: [
    { icon: "✨", label: "పవిత్ర యంత్రం" },
    { icon: "🛕", label: "సురక్షిత బుకింగ్" },
    { icon: "📹", label: "ప్రత్యక్ష పూజ దర్శనం" },
    { icon: "📦", label: "ప్రసాదం హోమ్ డెలివరీ" },
    { icon: "👥", label: "భక్తుల విశ్వాసం" },
    { icon: "🪔", label: "ప్రామాణిక పూజలు" },
  ],
  ta: [
    { icon: "✨", label: "புனித யந்திரம்" },
    { icon: "🛕", label: "பாதுகாப்பான முன்பதிவு" },
    { icon: "📹", label: "நேரலை பூஜை தரிசனம்" },
    { icon: "📦", label: "பிரசாதம் விநியோகம்" },
    { icon: "👥", label: "பக்தர்களின் நம்பிக்கை" },
    { icon: "🪔", label: "வேத முறை பூசைகள்" },
  ],
  en: [
    { icon: "✨", label: "Sacred Yantra" },
    { icon: "🛕", label: "Secure Booking" },
    { icon: "📹", label: "Live Pooja Access" },
    { icon: "📦", label: "Prasad Delivery" },
    { icon: "👥", label: "Trusted by Devotees" },
    { icon: "🪔", label: "Authentic Pooja" },
  ],
};

const STATS_LABELS: Record<string, { devotees: string; pandits: string; temples: string; rating: string }> = {
  hi: {
    devotees: "श्रद्धालु जुड़े",
    pandits: "प्रमाणित पंडित",
    temples: "सहयोगी मंदिर",
    rating: "औसत रेटिंग",
  },
  te: {
    devotees: "సేవలు పొందిన భక్తులు",
    pandits: "ధృవీకరించబడిన పండితులు",
    temples: "భాగస్వామ్య దేవాలయాలు",
    rating: "సగటు రేటింగ్",
  },
  ta: {
    devotees: "பயனடைந்த பக்தர்கள்",
    pandits: "சரிபார்க்கப்பட்ட பண்டிதர்கள்",
    temples: "இணைப்பு கோயில்கள்",
    rating: "சராசரி மதிப்பீடு",
  },
  en: {
    devotees: "Devotees Served",
    pandits: "Verified Pandits",
    temples: "Partner Temples",
    rating: "Average Rating",
  },
};

export default function Hero() {
  const router = useRouter();
  const { festivals, hasFestivals, loaded } = useUpcomingFestivals();
  const { poojas } = useCatalog();
  const { locale, t } = useI18n();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [, startTransition] = useTransition();

  // Reset index if festivals change
  useEffect(() => {
    if (currentIndex >= festivals.length && festivals.length > 0) {
      setCurrentIndex(0);
    }
  }, [festivals.length, currentIndex]);

  // Autoplay carousel every 7 seconds when not paused
  useEffect(() => {
    if (!hasFestivals || festivals.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      startTransition(() => {
        setCurrentIndex((prev) => (prev + 1) % festivals.length);
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [hasFestivals, festivals.length, isPaused]);

  const activeFestival = hasFestivals ? festivals[currentIndex] : null;

  const handlePrev = () => {
    if (!hasFestivals || festivals.length <= 1) return;
    startTransition(() => {
      setCurrentIndex((prev) => (prev === 0 ? festivals.length - 1 : prev - 1));
    });
  };

  const handleNext = () => {
    if (!hasFestivals || festivals.length <= 1) return;
    startTransition(() => {
      setCurrentIndex((prev) => (prev + 1) % festivals.length);
    });
  };

  // Active pujas dynamically filtered by admin display placement settings
  const heroRitualPoojas: Pooja[] = poojas.filter(isPoojaInHero);
  const heroCardPoojas: Pooja[] = poojas.filter(isPoojaInHeroCard);

  const [heroCardIndex, setHeroCardIndex] = useState(0);

  // Reset card index if heroCardPoojas change
  useEffect(() => {
    if (heroCardIndex >= heroCardPoojas.length && heroCardPoojas.length > 0) {
      setHeroCardIndex(0);
    }
  }, [heroCardPoojas.length, heroCardIndex]);

  // Autoplay hero card cycling every 6 seconds if multiple pujas are enabled
  useEffect(() => {
    if (heroCardPoojas.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setHeroCardIndex((prev) => (prev + 1) % heroCardPoojas.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [heroCardPoojas.length, isPaused]);

  const currentHeroCardPooja =
    heroCardPoojas.length > 0
      ? heroCardPoojas[heroCardIndex] || heroCardPoojas[0]
      : null;
  const currentHeroCardSchedule = currentHeroCardPooja
    ? getPoojaSchedule(currentHeroCardPooja)
    : null;

  const handlePrimaryCta = () => {
    if (currentHeroCardPooja) {
      router.push(`/book/${currentHeroCardPooja.slug}`);
      return;
    }
    if (heroRitualPoojas[0]) {
      router.push(`/book/${heroRitualPoojas[0].slug}`);
      return;
    }
    const defaultPooja = poojas.find(isPoojaActive);
    if (defaultPooja) {
      router.push(`/book/${defaultPooja.slug}`);
      return;
    }
    router.push("/book");
  };

  // Background visual image: White Marble Lord Ganesha sanctum as the hero backdrop
  const heroBackground = "/hero-ganesha-marble.jpg";

  const tickerItems = TICKER_ITEMS_MAP[locale] || TICKER_ITEMS_MAP.en;
  const statsLabels = STATS_LABELS[locale] || STATS_LABELS.en;

  // Localized texts with high-quality regional fallbacks
  const fallbackBadge =
    locale === "hi"
      ? "🪔 60+ प्रमाणित वैदिक सेवाएं"
      : locale === "te"
      ? "🪔 60+ ధృవీకరించబడిన సేవలు"
      : locale === "ta"
      ? "🪔 60+ சரிபார்க்கப்பட்ட சேவைகள்"
      : "🪔 60+ Verified Services";

  const fallbackTitle =
    locale === "hi"
      ? "घर पर पाएं प्रभु का पावन आशीर्वाद"
      : locale === "te"
      ? "మీ ఇంటికి దైవిక ఆశీస్సులు"
      : locale === "ta"
      ? "உங்கள் இல்லத்திற்கே இறையருள்"
      : "Bring the Divine Home";

  const fallbackSubtitle =
    locale === "hi"
      ? "प्रमाणित पंडित। वैदिक अनुष्ठान। भारत और दुनिया भर के लाखों श्रद्धालुओं का अटूट विश्वास।"
      : locale === "te"
      ? "ధృవీకరించబడిన పండితులు. ప్రామాణిక పూజలు. భారతదేశం మరియు ప్రపంచవ్యాప్తంగా లక్షలాది భక్తుల నమ్మకం."
      : locale === "ta"
      ? "சரிபார்க்கப்பட்ட பண்டிதர்கள். வேத முறை பூஜைகள். இந்தியா மற்றும் உலகெங்கிலும் உள்ள லட்சக்கணக்கான பக்தர்களின் நம்பிக்கை."
      : "Verified pandits. Authentic rituals. Trusted by lakhs of devotees across India & worldwide.";

  const fallbackCta =
    locale === "hi"
      ? "पूजाएं देखें"
      : locale === "te"
      ? "పూజలను అన్వేషించండి"
      : locale === "ta"
      ? "பூஜைகளை ஆராயுங்கள்"
      : "Explore Poojas";

  const fallbackSecondaryCta =
    locale === "hi"
      ? "सभी पूजाएं देखें"
      : locale === "te"
      ? "అన్ని పూజలను చూడండి"
      : locale === "ta"
      ? "அனைத்து பூஜைகளையும் காண்க"
      : "Explore All Pujas";

  const displayBadge = activeFestival
    ? getLocalizedFestivalBadge(activeFestival, locale)
    : fallbackBadge;

  const displayTitle = activeFestival
    ? getLocalizedFestivalTitle(activeFestival, locale)
    : fallbackTitle;

  const displaySubtitle = activeFestival
    ? getLocalizedFestivalSubtitle(activeFestival, locale)
    : fallbackSubtitle;

  const displayCta = activeFestival
    ? getLocalizedFestivalCta(activeFestival, locale)
    : fallbackCta;

  const displaySecondaryCta = activeFestival
    ? getLocalizedFestivalSecondaryCta(activeFestival, locale)
    : fallbackSecondaryCta;

  return (
    <section
      id="home"
      className="relative h-screen max-h-screen md:h-[100dvh] w-full overflow-hidden bg-stone-950 text-white pt-20 sm:pt-24 lg:pt-26 flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sacred Lord Ganesha Hero Background - Fully Clear Across Entire Width */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <Image
          src={heroBackground}
          alt="Lord Ganesha - TemplePujaSewa"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_28%] transition-transform duration-700 scale-100 opacity-95"
        />

        {/* Uniform subtle warm spiritual scrim across entire canvas */}
        <div className="absolute inset-0 bg-stone-950/25" />

        {/* Soft top vignette for transparent navbar clarity */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-stone-950/85 via-stone-950/30 to-transparent" />

        {/* Soft bottom vignette for stats & ticker transition */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-stone-950/85 via-stone-950/40 to-transparent" />

        {/* Soft golden halo glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 lg:h-80 lg:w-80 rounded-full bg-amber-500/15 blur-[100px] pointer-events-none" />
      </div>

      {/* Main Hero Content Container */}
      <div className="container-px relative z-10 mx-auto w-full max-w-7xl flex-1 flex flex-col justify-center py-1 sm:pt-8 md:pt-10 pb-2 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* Left Column: Glassmorphic Devotional Card */}
          <div className="lg:col-span-6 xl:col-span-5 mt-12 flex flex-col items-start text-left bg-stone-950/50 sm:bg-stone-950/40 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-amber-300/20 p-4 sm:p-5 lg:p-6 shadow-2xl">
            {/* Top Pill Badges: Festival Name & Countdown / Live Status */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron-400/40 bg-saffron-950/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron-300 shadow-soft backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-saffron-400 shrink-0" />
                {displayBadge}
              </span>

              {activeFestival && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md transition-colors ${
                    activeFestival.status?.isLive
                      ? "border border-emerald-500/50 bg-emerald-950/80 text-emerald-300"
                      : "border border-amber-400/30 bg-amber-950/70 text-amber-200"
                  }`}
                >
                  <Clock className="h-3 w-3 shrink-0" />
                  {getLocalizedFestivalCountdown(activeFestival, locale)}
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1 className="mt-2 sm:mt-2.5 font-display text-2xl sm:text-3xl md:text-3.5xl lg:text-4xl xl:text-4.5xl font-bold tracking-tight text-white leading-[1.14]">
              {displayTitle.includes(":") ? (
                <>
                  <span>{displayTitle.split(":")[0]}:</span>
                  <span className="block bg-gradient-to-r from-saffron-400 via-amber-200 to-saffron-300 bg-clip-text text-transparent">
                    {displayTitle.split(":")[1]}
                  </span>
                </>
              ) : displayTitle.includes("with") ? (
                <>
                  {displayTitle.split("with")[0]}
                  <span className="block bg-gradient-to-r from-saffron-400 via-amber-200 to-saffron-300 bg-clip-text text-transparent">
                    with {displayTitle.split("with")[1]}
                  </span>
                </>
              ) : displayTitle.includes("Home") ? (
                <>
                  Bring the{" "}
                  <span className="bg-gradient-to-r from-saffron-400 via-amber-200 to-saffron-300 bg-clip-text text-transparent">
                    Divine Home
                  </span>
                </>
              ) : (
                <span className="bg-gradient-to-r from-white via-amber-100 to-saffron-200 bg-clip-text text-transparent">
                  {displayTitle}
                </span>
              )}
            </h1>

            {/* Subtitle / Description */}
            <p className="mt-1.5 sm:mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2">
              {displaySubtitle}
            </p>

            {/* Action Buttons */}
            <div className="mt-3 sm:mt-3.5 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-saffron-600/30 transition-all duration-300 hover:scale-[1.03] hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.98]"
              >
                <span>{displayCta}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <a
                href="#poojas"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-saffron-400/50 hover:bg-white/10"
              >
                {displaySecondaryCta}
              </a>
            </div>
            {/* Featured Sacred Rituals Dynamic Chips */}
            {heroRitualPoojas.length > 0 && (
              <div className="mt-2.5 w-full max-w-2xl">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-saffron-300/90 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-saffron-400" />
                  <span>
                    {locale === "hi"
                      ? "विशेष वैदिक अनुष्ठान:"
                      : locale === "te"
                      ? "ప్రత్యేక వేద పూజలు:"
                      : locale === "ta"
                      ? "சிறப்பு வேத சடங்குகள்:"
                      : "Featured Sacred Rituals:"}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 max-w-full max-h-24 sm:max-h-32 overflow-y-auto no-scrollbar">
                  {heroRitualPoojas.map((pooja) => (
                    <button
                      key={pooja.slug}
                      type="button"
                      onClick={() => router.push(`/book/${pooja.slug}`)}
                      className="group flex items-center gap-2 rounded-xl border border-saffron-400/25 bg-slate-900/85 px-3 py-1.5 text-xs text-slate-200 backdrop-blur-md transition-all duration-300 hover:border-saffron-400/70 hover:bg-saffron-950/70 hover:shadow-glow text-left cursor-pointer shrink-0"
                    >
                      <span className="text-sm">{pooja.emoji || "🪔"}</span>
                      <span className="font-bold text-white group-hover:text-amber-200 transition-colors truncate max-w-[200px] sm:max-w-none">
                        {getLocalizedPoojaTitle(pooja, locale)}
                      </span>
                      <span className="rounded-md bg-saffron-500/20 px-1.5 py-0.5 text-[10px] font-bold text-saffron-300 group-hover:bg-saffron-500 group-hover:text-white transition-colors shrink-0">
                        ₹{pooja.price.toLocaleString("en-IN")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Elevating Lord Ganesha */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-end items-end relative min-h-[380px] pointer-events-none py-2">
            {/* Bottom-Right Auspicious Blessings Card */}
            {currentHeroCardPooja && (
              <div
                onClick={() => router.push(`/book/${currentHeroCardPooja.slug}`)}
                className="pointer-events-auto w-full max-w-xs rounded-2xl border border-amber-400/25 bg-gradient-to-b from-stone-900/85 to-stone-950/95 p-3.5 shadow-2xl backdrop-blur-md cursor-pointer group transition-all duration-300 hover:border-saffron-400/60 hover:shadow-glow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-300 truncate">
                      {currentHeroCardPooja.badge ||
                        (activeFestival
                          ? getLocalizedFestivalName(activeFestival, locale)
                          : locale === "hi"
                          ? "प्रथम पूज्य सेवा"
                          : locale === "te"
                          ? "ప్రథమ పూజ్య సేవ"
                          : locale === "ta"
                          ? "முதன்மை பூஜை சேவை"
                          : "Pratham Pujya Seva")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {heroCardPoojas.length > 1 && (
                      <div
                        className="flex items-center gap-1 mr-1 text-[10px] text-amber-300/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroCardIndex((prev) =>
                              prev === 0 ? heroCardPoojas.length - 1 : prev - 1
                            );
                          }}
                          className="h-4 w-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          title="Previous featured puja"
                        >
                          ‹
                        </button>
                        <span>
                          {heroCardIndex + 1}/{heroCardPoojas.length}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHeroCardIndex((prev) =>
                              (prev + 1) % heroCardPoojas.length
                            );
                          }}
                          className="h-4 w-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          title="Next featured puja"
                        >
                          ›
                        </button>
                      </div>
                    )}
                    <span className="rounded-full bg-saffron-500/90 px-2 py-0.5 text-[10px] font-extrabold text-white">
                      ₹{currentHeroCardPooja.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <h3 className="mt-1.5 font-display text-sm font-bold text-white line-clamp-1 group-hover:text-amber-200 transition-colors">
                  {getLocalizedPoojaTitle(currentHeroCardPooja, locale)}
                </h3>

                {currentHeroCardSchedule ? (
                  <div
                    suppressHydrationWarning
                    className="mt-2 flex items-center justify-between text-[11px] text-amber-200/90 border-t border-white/10 pt-2"
                  >
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3 text-amber-400 shrink-0" />
                      <span suppressHydrationWarning>{currentHeroCardSchedule.date}</span>
                    </span>
                    <span className="text-xs text-saffron-400 group-hover:translate-x-0.5 transition-transform font-bold flex items-center gap-0.5">
                      {locale === "hi" ? "बुक करें" : locale === "te" ? "బుక్ చేయండి" : locale === "ta" ? "பதிவு செய்க" : "Book"}{" "}
                      <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-between text-[11px] text-amber-200/90 border-t border-white/10 pt-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Sparkles className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>
                        {locale === "hi"
                          ? "लाइव वीडियो व संकल्प"
                          : locale === "te"
                          ? "లైవ్ వీడియో & సంకల్పం"
                          : locale === "ta"
                          ? "நேரலை வீடியோ & சங்கல்பம்"
                          : "Live Video & Sankalp"}
                      </span>
                    </span>
                    <span className="text-xs text-saffron-400 group-hover:translate-x-0.5 transition-transform font-bold flex items-center gap-0.5">
                      {locale === "hi" ? "बुक करें" : locale === "te" ? "బుక్ చేయండి" : locale === "ta" ? "பதிவு செய்க" : "Book"}{" "}
                      <ArrowRight className="h-3 w-3 inline" />
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Row & Carousel Indicators */}
        <div className="mt-auto pt-2.5 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 shrink-0">
          {/* 4 Stats counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 md:gap-8 w-full md:w-auto">
            <div className="flex flex-col">
              <div className="font-display text-base sm:text-lg lg:text-xl font-bold text-saffron-400">
                1.2L+
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">{statsLabels.devotees}</div>
            </div>
            <div className="flex flex-col">
              <div className="font-display text-base sm:text-lg lg:text-xl font-bold text-amber-400">
                182+
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">{statsLabels.pandits}</div>
            </div>
            <div className="flex flex-col">
              <div className="font-display text-base sm:text-lg lg:text-xl font-bold text-saffron-400">
                151+
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">{statsLabels.temples}</div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-display text-base sm:text-lg lg:text-xl font-bold text-amber-300">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                4.8
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">{statsLabels.rating}</div>
            </div>
          </div>

          {/* Carousel Slide Indicators & Arrows */}
          {hasFestivals && festivals.length > 1 && (
            <div className="flex items-center gap-2 self-center md:self-auto">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous festival slide"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:border-saffron-400 hover:bg-saffron-500/20 active:scale-95"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-1.5">
                {festivals.map((fest, idx) => (
                  <button
                    key={fest.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}: ${fest.name}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                      ? "w-5 bg-saffron-400"
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next festival slide"
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:border-saffron-400 hover:bg-saffron-500/20 active:scale-95"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Golden Promotional Ticker Strip */}
      <div className="relative z-20 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-500 py-1.5 sm:py-2 text-slate-950 shadow-inner shrink-0">
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
          {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold tracking-wide text-slate-950 shrink-0"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              <span className="opacity-40 ml-4">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
