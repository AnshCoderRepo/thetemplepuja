"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useBookingModal, useI18n } from "@/components/providers";
import { PoojaCatalog, useCatalog } from "@/features/catalog";
import {
  isPoojaActive,
  getLocalizedPoojaTitle,
  getLocalizedPoojaDescription,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaDuration,
  getLocalizedPoojaBestMuhurat,
  getLocalizedPoojaBenefits,
  getPoojaBannerImage,
  getPoojaSchedule,
  getTempleForPooja,
} from "@/lib/data";
import { formatINR } from "@/lib/format";

function ServiceInner({ service }: { service: string }) {
  const { locale, t } = useI18n();
  const { openBooking } = useBookingModal();

  // Resolve from the backend catalog (falls back to the static list).
  const { poojas, temples, loaded } = useCatalog();
  const pooja = loaded ? (poojas.find((p) => p.slug === service) ?? null) : undefined;

  const locTitle = pooja ? getLocalizedPoojaTitle(pooja, locale) : "";
  const schedule = pooja ? getPoojaSchedule(pooja) : null;

  useEffect(() => {
    document.title = locTitle
      ? `${locTitle} | templepujasewa`
      : "Book Pooja Online | templepujasewa";
  }, [locTitle]);

  if (pooja === undefined) {
    return (
      <section className="section-pad bg-cream min-h-[50vh] flex items-center justify-center">
        <div className="mx-auto h-64 w-full max-w-3xl animate-pulse rounded-3xl bg-saffron-100/60" />
      </section>
    );
  }

  if (!pooja || !isPoojaActive(pooja)) {
    return (
      <section className="section-pad bg-cream min-h-[50vh] flex items-center justify-center">
        <div className="container-px text-center">
          <span className="text-4xl">🪔</span>
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">
            {t("book.noResults")}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {t("book.noResultsDesc")}
          </p>
          <Link href="/book" className="btn-primary mt-6">
            {t("book.allPoojas")}
          </Link>
          <div className="mt-12">
            <PoojaCatalog />
          </div>
        </div>
      </section>
    );
  }

  const locBadge = getLocalizedPoojaNativeBadge(pooja, locale);
  const locDesc = getLocalizedPoojaDescription(pooja, locale);
  const locDuration = getLocalizedPoojaDuration(pooja, locale);
  const locMuhurat = getLocalizedPoojaBestMuhurat(pooja, locale);
  const locBenefits = getLocalizedPoojaBenefits(pooja, locale);
  const temple = getTempleForPooja(pooja, temples);
  const bannerImage = getPoojaBannerImage(pooja);

  const handleBookNowClick = () => {
    openBooking(pooja.slug);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-6 sm:py-10">
      <div className="container-px mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb Navigation - Simple & clean */}
        <nav className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Link href="/" className="hover:text-saffron-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <Link href="/#poojas" className="hover:text-saffron-700 transition-colors">
            Poojas
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-ink truncate max-w-xs">
            {locTitle}
          </span>
        </nav>

        {/* Two Column Layout: Banner on Left, Details on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: Banner of the Puja ── */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* Puja Banner Card */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-saffron-200/90 shadow-card bg-gradient-to-br from-saffron-950 via-amber-900 to-saffron-900 group">
              {/* Sacred Banner Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerImage}
                alt={locTitle}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Radiant Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

              {/* Top Badges on Banner */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur border border-white/20">
                  <Sparkles className="h-3 w-3 text-saffron-400" />
                  {locBadge}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Live Darshan
                </span>
              </div>

              {/* Bottom Info on Banner */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur border border-white/25">
                    {pooja.emoji || "🪔"}
                  </span>
                  <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                    {temple.name}
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-white drop-shadow-sm leading-tight">
                  {locTitle}
                </h2>
                {schedule && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-100 font-medium pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-amber-300" />
                      <span>{schedule.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-300" />
                      <span>{schedule.time}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sacred Guarantee Points Below Banner */}
            <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 shadow-soft space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-800 block">
                Vedic Assurances & Inclusions
              </span>
              <div className="space-y-2 text-xs font-medium text-ink">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>100% Certified Vedic Purohit from Kashi / Ayodhya</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Personalized Vedic Sankalp with your Name & Gotra</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Private Live Stream Link & Recorded Video on WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Prasad & Consecrated Raksha Sutra Delivery</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Details of the Puja ── */}
          <div className="lg:col-span-7 space-y-5">
            {/* Header / Summary Card */}
            <div className="rounded-3xl border border-saffron-200 bg-white p-6 sm:p-7 shadow-card space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-saffron-50 border border-saffron-200 px-2.5 py-0.5 text-xs font-bold text-saffron-800">
                      <Sparkles className="h-3 w-3 text-saffron-600" />
                      {locBadge}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Vedic Purohit Verified
                    </span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                    {locTitle}
                  </h1>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Starting Dakshina
                  </span>
                  <span className="font-display text-xl sm:text-2xl font-extrabold text-saffron-700">
                    {formatINR(pooja.price)}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-ink-soft">
                {locDesc}
              </p>

              {/* Quick Key Benefits */}
              {locBenefits.length > 0 && (
                <div className="pt-3 border-t border-saffron-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-900 block">
                    Pooja Blessings & Divine Benefits:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {locBenefits.slice(0, 4).map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-medium text-ink">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Scheduled Date, Time & Temple Venue */}
            <div className="rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-saffron-50/60 via-white to-amber-50/40 p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-saffron-900">
                <Calendar className="h-5 w-5 text-saffron-600" />
                <h2 className="font-display text-base sm:text-lg font-bold">
                  Scheduled Date, Time & Temple
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date & Time */}
                <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Scheduled Date & Muhurat
                  </span>
                  <p className="font-display text-base font-bold text-ink">
                    {schedule ? `${schedule.date} • ${schedule.time}` : locMuhurat}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-saffron-800 font-medium">
                    <span>Muhurat: {locMuhurat}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-saffron-600" />
                      <span>{locDuration}</span>
                    </span>
                  </div>
                </div>

                {/* Where / Temple Venue */}
                <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Sacred Temple Venue
                  </span>
                  <p className="font-display text-base font-bold text-ink leading-tight">
                    {temple.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-saffron-600 shrink-0" />
                    <span>{temple.city}, {temple.state}</span>
                  </div>
                </div>
              </div>

              {/* Pre-Scheduled Muhurat Notice */}
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-950">
                <span className="font-bold">🗓️ Pre-Scheduled Muhurat:</span> You do not need to choose any date or time. Our Vedic Pandits perform this sacred ritual at this fixed auspicious day & time.
              </div>
            </div>

            {/* Book Now Card / Trigger */}
            <div className="rounded-3xl border border-saffron-200 bg-white p-6 shadow-card space-y-3.5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Dakshina Starts At
                  </span>
                  <span className="font-display text-2xl font-extrabold text-saffron-700">
                    {formatINR(pooja.price)}
                  </span>
                </div>

                <button
                  type="button"
                  id="book-now-main-btn"
                  onClick={handleBookNowClick}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3.5 px-8 text-base font-bold text-white shadow-lg shadow-saffron-600/25 transition-all hover:scale-[1.02] hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.98]"
                >
                  <span>Book Now — From {formatINR(pooja.price)}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                ⚡ Select Single / Couple / Family in the next step • Live video darshan & sankalp video included
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceClient({ service }: { service: string }) {
  return (
    <Suspense
      fallback={
        <section className="section-pad bg-cream min-h-[50vh] flex items-center justify-center">
          <div className="mx-auto h-64 w-full max-w-3xl animate-pulse rounded-3xl bg-saffron-100/60" />
        </section>
      }
    >
      <ServiceInner service={service} />
    </Suspense>
  );
}
