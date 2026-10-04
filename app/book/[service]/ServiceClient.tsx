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
  getTempleForPooja,
} from "@/lib/data";
import { formatINR } from "@/lib/format";

function ServiceInner({ service }: { service: string }) {
  const { locale, t } = useI18n();
  const { openBooking } = useBookingModal();

  // Resolve from the backend catalog (falls back to the static list).
  const { poojas, loaded } = useCatalog();
  const pooja = loaded ? (poojas.find((p) => p.slug === service) ?? null) : undefined;

  const locTitle = pooja ? getLocalizedPoojaTitle(pooja, locale) : "";

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
  const temple = getTempleForPooja(pooja);

  const handleBookNowClick = () => {
    openBooking(pooja.slug);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-6 sm:py-10">
      <div className="container-px mx-auto max-w-3xl space-y-6">
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

        {/* 1. What the Puja is (Selected Puja Summary) */}
        <div className="rounded-3xl border border-saffron-200 bg-white p-6 sm:p-8 shadow-card space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-saffron-50 border border-saffron-200 px-2.5 py-0.5 text-xs font-bold text-saffron-800">
                  <Sparkles className="h-3 w-3 text-saffron-600" />
                  {locBadge}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Vedic Purohit
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                {locTitle}
              </h1>
            </div>

            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-saffron-50 text-3xl border border-saffron-200 shadow-xs">
              {pooja.emoji || "🪔"}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-ink-soft">
            {locDesc}
          </p>

          {/* Quick Key Benefits */}
          {locBenefits.length > 0 && (
            <div className="pt-2 border-t border-saffron-100 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-900 block">
                Pooja Blessings & Benefits:
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

        {/* 2. On What Date & Time the Puja is (and Where) */}
        <div className="rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-saffron-50/60 via-white to-amber-50/40 p-6 sm:p-7 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-saffron-900">
            <Calendar className="h-5 w-5 text-saffron-600" />
            <h2 className="font-display text-base sm:text-lg font-bold">
              Scheduled Date, Time & Temple
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date & Time */}
            <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Auspicious Day & Muhurat
              </span>
              <p className="font-display text-base font-bold text-ink">
                {locMuhurat}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-saffron-800 font-medium">
                <Clock className="h-3.5 w-3.5 text-saffron-600" />
                <span>Duration: {locDuration}</span>
              </div>
            </div>

            {/* Where / Temple Venue */}
            <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 space-y-2">
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

          {/* Simple clear note */}
          <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-950">
            <span className="font-bold">🗓️ Pre-Scheduled Muhurat:</span> You do not need to choose any date or time. Our Vedic Pandits perform this sacred ritual at this fixed auspicious day & time.
          </div>
        </div>

        {/* 3. ONLY ONE SINGLE BOOK NOW BUTTON */}
        <div className="rounded-3xl border border-saffron-200 bg-white p-6 shadow-card text-center space-y-3">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3.5 px-6 text-base font-bold text-white shadow-lg shadow-saffron-600/25 transition-all hover:scale-[1.02] hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.98]"
          >
            <span>Book Now — From {formatINR(pooja.price)}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="text-[11px] text-slate-500">
            ⚡ Select Single / Couple / Family in the next step • Live video darshan included
          </p>
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
