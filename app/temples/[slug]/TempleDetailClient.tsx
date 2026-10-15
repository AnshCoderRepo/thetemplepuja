"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  HeartHandshake,
  Info,
  Mail,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  getLocalizedPoojaDescription,
  getLocalizedPoojaTitle,
  getLocalizedTempleDescription,
  getLocalizedTempleHistory,
  getLocalizedTempleName,
  getLocalizedTempleSignificance,
  getLocalizedTempleVisitorGuidance,
  getRelatedPoojasForTemple,
  type Pooja,
  type Temple,
} from "@/lib/data";
import { useCatalog } from "@/features/catalog";
import { useI18n } from "@/components/providers";
import { PoojaImage, TempleImage } from "@/components/common";
import { formatINR } from "@/lib/format";

interface TempleDetailClientProps {
  initialTemple: Temple;
  initialPoojas: Pooja[];
}

export default function TempleDetailClient({
  initialTemple,
  initialPoojas,
}: TempleDetailClientProps) {
  const { temples: catalogTemples, poojas: catalogPoojas } = useCatalog();
  const { t, locale } = useI18n();

  // Pick live temple record if updated by admin in real-time, else fallback to initial
  const temple = useMemo(() => {
    if (catalogTemples && catalogTemples.length > 0) {
      const match = catalogTemples.find((t) => t.slug === initialTemple.slug);
      if (match) return match;
    }
    return initialTemple;
  }, [catalogTemples, initialTemple]);

  const allPoojas = useMemo(() => {
    if (catalogPoojas && catalogPoojas.length > 0) return catalogPoojas;
    return initialPoojas;
  }, [catalogPoojas, initialPoojas]);

  const relatedPoojas = useMemo(() => {
    return getRelatedPoojasForTemple(temple, allPoojas);
  }, [temple, allPoojas]);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const displayName = getLocalizedTempleName(temple, locale);
  const displayDesc = getLocalizedTempleDescription(temple, locale);
  const displayHistory = getLocalizedTempleHistory(temple, locale);
  const displaySignificance = getLocalizedTempleSignificance(temple, locale);
  const displayGuidance = getLocalizedTempleVisitorGuidance(temple, locale);

  const allImages = useMemo(() => {
    const list: string[] = [];
    if (temple.image && temple.image.trim()) list.push(temple.image.trim());
    if (temple.gallery && Array.isArray(temple.gallery)) {
      temple.gallery.forEach((img) => {
        if (img && img.trim() && !list.includes(img.trim())) {
          list.push(img.trim());
        }
      });
    }
    return list;
  }, [temple]);

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-saffron-100/90 py-3">
        <div className="container-px mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-ink-soft">
            <Link href="/" className="hover:text-saffron-700 transition-colors">
              {t("service.breadcrumbHome") || "Home"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Link href="/temples" className="hover:text-saffron-700 transition-colors">
              {t("nav.temples") || "Temples"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-ink line-clamp-1">{displayName}</span>
          </nav>
        </div>
      </div>

      <div className="container-px mx-auto max-w-6xl mt-6 sm:mt-8 space-y-8">
        {/* Hero Section Banner */}
        <div className="rounded-3xl border border-saffron-200/90 bg-white overflow-hidden shadow-card">
          <div className="relative h-64 sm:h-96 w-full bg-slate-950 group">
            <TempleImage
              src={temple.image}
              alt={displayName}
              className="h-full w-full"
              imgClassName="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/10 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-saffron-400" />
                <span>{t("temples.verifiedShrine")}</span>
              </div>

              {temple.image && (
                <button
                  type="button"
                  onClick={() => setPreviewImage(temple.image || null)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/20 shadow-xs hover:bg-white/30 transition-all cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View Photo</span>
                </button>
              )}
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-5 left-5 right-5 z-10 space-y-2 pointer-events-auto">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-saffron-500/90 text-white px-2.5 py-0.5 text-xs font-bold shadow-xs">
                  <Flame className="h-3 w-3" />
                  <span>{temple.deity}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/50 text-slate-200 backdrop-blur-xs px-2.5 py-0.5 text-xs font-medium">
                  <MapPin className="h-3 w-3 text-saffron-400" />
                  <span>
                    {temple.city}, {temple.state}
                  </span>
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                {displayName}
              </h1>

              {/* Alternative Language Names */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-amber-200/90">
                {temple.hindiName && locale !== "hi" && <span>हिन्दी: {temple.hindiName}</span>}
                {temple.teluguName && locale !== "te" && <span>తెలుగు: {temple.teluguName}</span>}
                {temple.tamilName && locale !== "ta" && <span>தமிழ்: {temple.tamilName}</span>}
              </div>
            </div>
          </div>

          {/* Quick Highlight Cards Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-saffron-100 bg-cream/40 border-t border-saffron-100">
            {/* 1. Darshan Timings */}
            <div className="p-4 sm:p-5 space-y-1">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-saffron-600" />
                <span>{t("temples.timings")}</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-ink leading-tight">
                {temple.timings || "Open for Morning & Evening Aarti"}
              </p>
            </div>

            {/* 2. Visiting Days */}
            <div className="p-4 sm:p-5 space-y-1">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-saffron-600" />
                <span>{t("temples.openingDays")}</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-ink leading-tight">
                {temple.openingDays || "Open all 7 days"}
              </p>
            </div>

            {/* 3. Primary Deity */}
            <div className="p-4 sm:p-5 space-y-1">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-saffron-600" />
                <span>{t("temples.deity")}</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-ink leading-tight">
                {temple.deity}
              </p>
            </div>

            {/* 4. Directions Link */}
            <div className="p-4 sm:p-5 flex flex-col justify-center">
              {temple.mapUrl ? (
                <a
                  href={temple.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-xs py-2 px-3 shadow-xs transition-colors"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>{t("temples.getDirections")}</span>
                </a>
              ) : (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-saffron-600" />
                    <span>{t("temples.location")}</span>
                  </span>
                  <p className="text-xs font-bold text-ink leading-tight">
                    {temple.city}, {temple.state}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview & Spiritual Description */}
            <section className="rounded-3xl border border-saffron-200/80 bg-white p-6 sm:p-8 shadow-card space-y-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-saffron-600" />
                <span>About {displayName}</span>
              </h2>
              <p className="text-xs sm:text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                {displayDesc}
              </p>
            </section>

            {/* Temple History & Background */}
            {displayHistory && (
              <section className="rounded-3xl border border-saffron-200/80 bg-white p-6 sm:p-8 shadow-card space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-saffron-600" />
                  <span>{t("temples.history")}</span>
                </h2>
                <div className="text-xs sm:text-sm text-ink-soft leading-relaxed whitespace-pre-line bg-amber-50/40 rounded-2xl p-4 sm:p-5 border border-amber-200/60">
                  {displayHistory}
                </div>
              </section>
            )}

            {/* Spiritual Significance & Traditions */}
            {displaySignificance && (
              <section className="rounded-3xl border border-saffron-200/80 bg-white p-6 sm:p-8 shadow-card space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
                  <Flame className="h-5 w-5 text-saffron-600" />
                  <span>{t("temples.significance")}</span>
                </h2>
                <div className="text-xs sm:text-sm text-ink-soft leading-relaxed whitespace-pre-line bg-saffron-50/40 rounded-2xl p-4 sm:p-5 border border-saffron-200/60">
                  {displaySignificance}
                </div>
              </section>
            )}

            {/* Devotee Visitor Guidance & Rules */}
            {displayGuidance && (
              <section className="rounded-3xl border border-saffron-200/80 bg-white p-6 sm:p-8 shadow-card space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
                  <Info className="h-5 w-5 text-saffron-600" />
                  <span>{t("temples.guidance")}</span>
                </h2>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80">
                  {displayGuidance}
                </div>
              </section>
            )}

            {/* Sacred Photo Gallery */}
            {allImages.length > 0 && (
              <section className="rounded-3xl border border-saffron-200/80 bg-white p-6 sm:p-8 shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
                    <Maximize2 className="h-5 w-5 text-saffron-600" />
                    <span>{t("temples.gallery")}</span>
                  </h2>
                  <span className="text-xs font-semibold text-ink-soft">
                    {allImages.length} Photographs
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {allImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPreviewImage(imgUrl)}
                      className="group/img relative h-36 sm:h-44 rounded-2xl overflow-hidden bg-slate-900 border border-saffron-100 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <TempleImage
                        src={imgUrl}
                        alt={`${displayName} - Photo ${idx + 1}`}
                        className="h-full w-full"
                        imgClassName="group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                        <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Column (1/3 width) */}
          <div className="space-y-6">
            {/* Contact & Location Card */}
            <div className="rounded-3xl border border-saffron-200/80 bg-white p-6 shadow-card space-y-4">
              <h3 className="font-display text-base font-bold text-ink pb-2 border-b border-saffron-100 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-saffron-600" />
                <span>Temple Location & Contact</span>
              </h3>

              <div className="space-y-3 text-xs">
                {temple.address && (
                  <div>
                    <span className="font-bold text-ink-soft block uppercase tracking-wider text-[10px]">
                      Full Address
                    </span>
                    <p className="font-medium text-ink mt-0.5">{temple.address}</p>
                    {temple.pincode && (
                      <span className="text-ink-soft text-[11px]">PIN: {temple.pincode}</span>
                    )}
                  </div>
                )}

                {temple.mapUrl && (
                  <div className="pt-1">
                    <a
                      href={temple.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-saffron-300 bg-saffron-50/70 hover:bg-saffron-100 text-saffron-800 font-bold text-xs py-2.5 transition-colors cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5 text-saffron-600" />
                      <span>{t("temples.getDirections")}</span>
                      <ExternalLink className="h-3 w-3 text-saffron-500" />
                    </a>
                  </div>
                )}

                {temple.contactPhone && (
                  <div className="pt-2 border-t border-saffron-100">
                    <span className="font-bold text-ink-soft block uppercase tracking-wider text-[10px]">
                      {t("temples.helpline")}
                    </span>
                    <a
                      href={`tel:${temple.contactPhone}`}
                      className="inline-flex items-center gap-1.5 font-bold text-saffron-700 hover:text-saffron-800 mt-0.5"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{temple.contactPhone}</span>
                    </a>
                  </div>
                )}

                {temple.contactEmail && (
                  <div className="pt-2 border-t border-saffron-100">
                    <span className="font-bold text-ink-soft block uppercase tracking-wider text-[10px]">
                      Email
                    </span>
                    <a
                      href={`mailto:${temple.contactEmail}`}
                      className="inline-flex items-center gap-1.5 font-medium text-saffron-700 hover:text-saffron-800 mt-0.5"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{temple.contactEmail}</span>
                    </a>
                  </div>
                )}

                {temple.officialWebsite && (
                  <div className="pt-2 border-t border-saffron-100">
                    <span className="font-bold text-ink-soft block uppercase tracking-wider text-[10px]">
                      {t("temples.officialWebsite")}
                    </span>
                    <a
                      href={temple.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-saffron-700 hover:text-saffron-800 mt-0.5 break-all"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{temple.officialWebsite.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Sacred Pujas Performed Here Card */}
            <div className="rounded-3xl border border-saffron-200/80 bg-white p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-saffron-100">
                <h3 className="font-display text-base font-bold text-ink flex items-center gap-2">
                  <Flame className="h-4 w-4 text-saffron-600" />
                  <span>{t("temples.relatedPujas")}</span>
                </h3>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {relatedPoojas.length} Available
                </span>
              </div>

              {relatedPoojas.length === 0 ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-ink-soft">
                    Explore all available consecrated rituals in our full Vedic catalog.
                  </p>
                  <Link
                    href="/book"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-saffron-600 text-white font-bold text-xs py-2 px-4 shadow-sm hover:bg-saffron-700 transition-colors"
                  >
                    View All Pujas →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {relatedPoojas.map((puja) => {
                    const pTitle = getLocalizedPoojaTitle(puja, locale);
                    const pDesc = getLocalizedPoojaDescription(puja, locale);

                    return (
                      <div
                        key={puja.slug}
                        className="rounded-2xl border border-saffron-200/80 bg-cream/20 p-3.5 hover:bg-saffron-50/50 transition-all space-y-2.5"
                      >
                        <div className="flex items-start gap-3">
                          <Link
                            href={`/book/${puja.slug}`}
                            aria-label={`${t("temples.bookPuja")}: ${pTitle}`}
                            className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-saffron-200 bg-slate-900 block cursor-pointer transition-transform hover:scale-105"
                          >
                            <PoojaImage
                              src={puja.imageUrl}
                              alt={pTitle}
                              className="h-full w-full"
                              fallbackSize="sm"
                              showBrandText={false}
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-ink line-clamp-1 leading-snug">
                              {pTitle}
                            </h4>
                            <p className="text-[11px] text-ink-soft line-clamp-1 mt-0.5">
                              {pDesc}
                            </p>
                            <span className="text-xs font-extrabold text-saffron-700 block mt-1">
                              {formatINR(puja.price)}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/book/${puja.slug}`}
                          className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-xs py-2 shadow-xs transition-all"
                        >
                          <span>{t("temples.bookPuja")}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Devotee Assurances Box */}
            <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/60 p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Direct Sanctum Coordination</span>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                All rituals are performed directly inside the sacred temple complex by verified local Vedic Pandits. Your Sankalp is recited with your family gotra and names.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Preview Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
            aria-label="Close photo preview"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[85vh] max-w-4xl w-full overflow-hidden rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Temple Full View"
              className="h-auto max-h-[85vh] w-full object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
