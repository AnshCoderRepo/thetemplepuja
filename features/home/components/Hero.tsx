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
  getLocalizedFestivalCta,
  getLocalizedFestivalSubtitle,
  getLocalizedFestivalTitle,
  getLocalizedPoojaTitle,
  type FestivalEvent,
  type Pooja,
} from "@/lib/data";

const TICKER_ITEMS = [
  { icon: "✨", label: "Sacred Yantra" },
  { icon: "🛕", label: "Secure Booking" },
  { icon: "📹", label: "Live Pooja Access" },
  { icon: "📦", label: "Prasad Delivery" },
  { icon: "👥", label: "Trusted by Devotees" },
  { icon: "🪔", label: "Authentic Pooja" },
  { icon: "🚩", label: "Sacred Tirth Yatra" },
  { icon: "📦", label: "Pooja Kits Delivered" },
];

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

  // Find associated pooja objects for the active festival
  const relatedPoojas: Pooja[] = activeFestival
    ? activeFestival.relatedPoojaSlugs
        .map((slug) => poojas.find((p) => p.slug === slug))
        .filter((p): p is Pooja => Boolean(p))
    : [];

  const handlePrimaryCta = () => {
    if (activeFestival) {
      // If the festival specifies a related pooja or direct slug, navigate to that pooja detail page
      const firstRelated = relatedPoojas[0];
      if (firstRelated) {
        router.push(`/book/${firstRelated.slug}`);
        return;
      }
      if (activeFestival.ctaLink && activeFestival.ctaLink.startsWith("/book/")) {
        router.push(activeFestival.ctaLink);
        return;
      }
    }
    // Fallback: navigate to default pooja detail page
    const defaultPooja = poojas[0];
    if (defaultPooja) {
      router.push(`/book/${defaultPooja.slug}`);
    } else {
      router.push("/book/satyanarayan-katha");
    }
  };

  // Background visual image based on festival or default spiritual temple altar
  const heroBackground =
    activeFestival?.heroImage || "/festivals/ganesha-altar.jpg";

  // Localized texts
  const displayBadge = activeFestival
    ? getLocalizedFestivalBadge(activeFestival, locale)
    : "🪔 60+ Verified Services";

  const displayTitle = activeFestival
    ? getLocalizedFestivalTitle(activeFestival, locale)
    : "Bring the Divine Home";

  const displaySubtitle = activeFestival
    ? getLocalizedFestivalSubtitle(activeFestival, locale)
    : "Verified pandits. Authentic rituals. Trusted by lakhs of devotees across India & worldwide.";

  const displayCta = activeFestival
    ? getLocalizedFestivalCta(activeFestival, locale)
    : "Explore Poojas";

  return (
    <section
      id="home"
      className="relative min-h-[580px] sm:min-h-[640px] md:min-h-[720px] lg:min-h-[760px] w-full overflow-hidden bg-slate-950 text-white pt-24 sm:pt-28 md:pt-32 flex flex-col justify-between"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Dynamic Background Altar & Lighting */}
      <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <Image
          src={heroBackground}
          alt={displayTitle}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-700 opacity-40 scale-105"
        />

        {/* Spiritual Warm Vignette and Glow Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-saffron-600/20 blur-[100px]" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-amber-500/15 blur-[120px]" />

        {/* Floating Sacred Ambience Glyphs */}
        <span className="absolute left-[6%] top-36 animate-float text-3xl sm:text-4xl opacity-20">
          🪔
        </span>
        <span className="absolute right-[8%] top-44 animate-float text-4xl sm:text-5xl opacity-15 [animation-delay:1.5s]">
          🕉️
        </span>
        <span className="absolute bottom-28 left-[12%] animate-float text-2xl sm:text-3xl opacity-15 [animation-delay:3s]">
          🔔
        </span>
      </div>

      {/* Main Hero Content Container */}
      <div className="container-px relative z-10 mx-auto w-full max-w-7xl flex-1 flex flex-col justify-center py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Festival / Event Headline, CTAs, Related Pujas */}
          <div className="lg:col-span-8 flex flex-col items-start text-left">
            {/* Top Pill Badges: Festival Name & Countdown / Live Status */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron-400/40 bg-saffron-950/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-saffron-300 shadow-soft backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-saffron-400 shrink-0" />
                {displayBadge}
              </span>

              {activeFestival?.status && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md transition-colors ${
                    activeFestival.status.isLive
                      ? "border border-emerald-500/50 bg-emerald-950/80 text-emerald-300"
                      : "border border-amber-400/30 bg-amber-950/70 text-amber-200"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  {activeFestival.status.countdownText}
                </span>
              )}
            </div>

            {/* Main Headline */}
            <h1 className="mt-4 sm:mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-6.5xl leading-[1.12]">
              {displayTitle.includes("with") ? (
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
            <p className="mt-3 sm:mt-4 max-w-2xl text-sm sm:text-base md:text-lg leading-relaxed text-slate-300">
              {displaySubtitle}
            </p>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white shadow-lg shadow-saffron-600/30 transition-all duration-300 hover:scale-[1.03] hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.98]"
              >
                <span>{displayCta}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <a
                href="#poojas"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-saffron-400/50 hover:bg-white/10"
              >
                {activeFestival?.secondaryCtaText || "Explore All Pujas"}
              </a>
            </div>

            {/* Associated Pujas Quick Preview Chips */}
            {relatedPoojas.length > 0 && (
              <div className="mt-6 w-full max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-saffron-300/80 mb-2">
                  Special Pujas For {activeFestival?.name || "This Festival"}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {relatedPoojas.map((pooja) => (
                    <button
                      key={pooja.slug}
                      type="button"
                      onClick={() => router.push(`/book/${pooja.slug}`)}
                      className="group inline-flex items-center gap-2 rounded-lg border border-saffron-400/20 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-200 backdrop-blur transition-all hover:border-saffron-400/60 hover:bg-saffron-950/50 hover:text-white"
                    >
                      <span className="text-sm">{pooja.emoji}</span>
                      <span className="font-medium">
                        {getLocalizedPoojaTitle(pooja, locale)}
                      </span>
                      <span className="rounded bg-saffron-500/20 px-1.5 py-0.5 text-[10px] font-bold text-saffron-300 group-hover:bg-saffron-500 group-hover:text-white transition-colors">
                        ₹{pooja.price.toLocaleString("en-IN")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Decorative Sacred Altar & Multi-Slide Indicator */}
          <div className="hidden lg:flex lg:col-span-4 flex-col items-center justify-center relative">
            <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-2xl backdrop-blur-md">
              <div className="relative h-64 w-full overflow-hidden rounded-2xl">
                <Image
                  src={heroBackground}
                  alt={displayTitle}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[11px] font-semibold uppercase text-saffron-300 tracking-wider">
                    {activeFestival ? activeFestival.name : "Vedic Seva"}
                  </span>
                  <h3 className="font-display text-base font-bold text-white line-clamp-1">
                    {displayTitle}
                  </h3>
                  {activeFestival?.status && (
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {activeFestival.status.formattedDateRange}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row & Carousel Indicators */}
        <div className="mt-8 sm:mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-white/10 pt-6">
          {/* 4 Stats counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 md:gap-8 w-full md:w-auto">
            <div className="flex flex-col">
              <div className="font-display text-xl sm:text-2xl font-bold text-saffron-400">
                1.2L+
              </div>
              <div className="text-xs text-slate-400">Devotees Served</div>
            </div>
            <div className="flex flex-col">
              <div className="font-display text-xl sm:text-2xl font-bold text-amber-400">
                182+
              </div>
              <div className="text-xs text-slate-400">Verified Pandits</div>
            </div>
            <div className="flex flex-col">
              <div className="font-display text-xl sm:text-2xl font-bold text-saffron-400">
                151+
              </div>
              <div className="text-xs text-slate-400">Partner Temples</div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-display text-xl sm:text-2xl font-bold text-amber-300">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                4.8
              </div>
              <div className="text-xs text-slate-400">Average Rating</div>
            </div>
          </div>

          {/* Carousel Slide Indicators & Arrows */}
          {hasFestivals && festivals.length > 1 && (
            <div className="flex items-center gap-3 self-center md:self-auto">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous festival slide"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:border-saffron-400 hover:bg-saffron-500/20 active:scale-95"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {festivals.map((fest, idx) => (
                  <button
                    key={fest.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}: ${fest.name}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentIndex === idx
                        ? "w-6 bg-saffron-400"
                        : "w-2 bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next festival slide"
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-all hover:border-saffron-400 hover:bg-saffron-500/20 active:scale-95"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Golden Promotional Ticker Strip */}
      <div className="relative z-20 w-full overflow-hidden bg-gradient-to-r from-amber-500 via-saffron-500 to-amber-500 py-2.5 text-slate-950 shadow-inner">
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
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
