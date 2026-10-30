"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Video,
  Phone,
  Camera,
} from "lucide-react";
import { useBookingModal, useI18n } from "@/components/providers";
import { ImagePreviewModal, LanguageToggle, PoojaImage } from "@/components/common";
import { PoojaCatalog, useCatalog } from "@/features/catalog";
import { getCatalogSiteContent } from "@/lib/catalog";
import { SITE_CONFIG } from "@/lib/config";
import {
  DEMO_POOJA,
  SOMESHWAR_POOJA,
  isDemoSlug,
  isPoojaActive,
  getLocalizedPoojaTitle,
  getLocalizedPoojaDescription,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaBestMuhurat,
  getLocalizedPoojaBenefits,
  getPoojaBannerImage,
  getPoojaSchedule,
  getTempleForPooja,
  getLocalizedTempleName,
  isPoojaLiveStreamAvailable,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { trackViewContent, trackBookingStart } from "@/lib/meta-pixel";

function ServiceInner({ service }: { service: string }) {
  const { locale, t } = useI18n();
  const { openBooking } = useBookingModal();

  // Resolve from the backend catalog (falls back to the static list).
  const { poojas, temples, loaded } = useCatalog();
  const normalized = service.toLowerCase().replace(/_/g, "-");
  const isSomeshwar =
    normalized === "someshwar-mahadev-abhisek" ||
    normalized === "someshwar-mahadev-abhishek" ||
    normalized === "someshwar-rudrabhishek";

  const foundInCatalog = loaded
    ? (poojas.find((p) => p.slug === normalized || (isDemoSlug(normalized) && isDemoSlug(p.slug))) ?? (isSomeshwar ? SOMESHWAR_POOJA : null))
    : isSomeshwar
    ? SOMESHWAR_POOJA
    : undefined;
  const pooja =
    foundInCatalog !== undefined && foundInCatalog !== null
      ? foundInCatalog
      : isDemoSlug(normalized)
      ? DEMO_POOJA
      : isSomeshwar
      ? SOMESHWAR_POOJA
      : foundInCatalog;

  const [previewOpen, setPreviewOpen] = useState(false);
  const [isMainCtaInView, setIsMainCtaInView] = useState(true);
  const mainBookingCtaRef = useRef<HTMLDivElement | null>(null);
  const [siteContent, setSiteContent] = useState(() => getCatalogSiteContent());
  const locTitle = pooja ? getLocalizedPoojaTitle(pooja, locale) : "";
  const schedule = pooja ? getPoojaSchedule(pooja) : null;

  useEffect(() => {
    const handleUpdate = () => {
      setSiteContent(getCatalogSiteContent());
    };
    window.addEventListener("catalog-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("catalog-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const element = mainBookingCtaRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMainCtaInView(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.15,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [pooja?.slug]);

  useEffect(() => {
    document.title = locTitle
      ? `${locTitle} | templepujasewa`
      : "Book Pooja Online | templepujasewa";

    if (pooja && isPoojaActive(pooja)) {
      trackViewContent({
        content_name: locTitle || pooja.title,
        content_ids: [pooja.slug],
        content_type: "product",
        value: pooja.price,
        currency: "INR",
      });
    }
  }, [locTitle, pooja]);

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
  const locMuhurat = getLocalizedPoojaBestMuhurat(pooja, locale);
  const locBenefits = getLocalizedPoojaBenefits(pooja, locale);
  const temple = getTempleForPooja(pooja, temples);
  const bannerImage = getPoojaBannerImage(pooja);

  const handleBookNowClick = () => {
    trackBookingStart({
      content_name: locTitle || pooja.title,
      content_ids: [pooja.slug],
      value: pooja.price,
      currency: "INR",
    });
    openBooking(pooja.slug);
  };



  const hasLiveStream = isPoojaLiveStreamAvailable(pooja);
  const isOnline = pooja.online !== false;

  const customAssuranceItems = siteContent?.vedicAssurances?.items;
  const assurances =
    customAssuranceItems && customAssuranceItems.length > 0
      ? customAssuranceItems
          .filter((item) => item.active !== false)
          .map((item) => {
            const locText =
              locale === "hi"
                ? item.hindiTitle || item.title
                : locale === "te"
                ? item.teluguTitle || item.title
                : locale === "ta"
                ? item.tamilTitle || item.title
                : item.title;
            const iconComponent =
              item.icon === "video" || item.icon === "📹"
                ? Video
                : item.icon === "shield" || item.icon === "🛡️"
                ? ShieldCheck
                : CheckCircle2;
            return {
              id: item.id || item.title,
              icon: iconComponent,
              text: locText,
            };
          })
      : [
          {
            id: "purohit",
            icon: ShieldCheck,
            text: t("service.assurance1"),
          },
          {
            id: "sankalp",
            icon: CheckCircle2,
            text: t("service.assurance2"),
          },
          ...(hasLiveStream
            ? [
                {
                  id: "livestream",
                  icon: Video,
                  text: t("service.assurance3"),
                },
              ]
            : isOnline
            ? [
                {
                  id: "recorded",
                  icon: Video,
                  text: t("service.assuranceRecorded"),
                },
              ]
            : [
                {
                  id: "inperson",
                  icon: CheckCircle2,
                  text: t("service.assuranceInPerson"),
                },
              ]),
          {
            id: "prasad",
            icon: CheckCircle2,
            text: t("service.assurance4"),
          },
        ];

  const assurancesHeading =
    siteContent?.vedicAssurances?.heading || t("service.assurancesHeading");

  const renderAssurancesSection = (className = "") => (
    <div
      className={`rounded-3xl border border-saffron-200/90 bg-white p-4 sm:p-5 shadow-card space-y-3 ${className}`}
      aria-label={assurancesHeading}
    >
      <div className="flex items-center justify-between gap-2 border-b border-saffron-100 pb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-900 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-saffron-600 shrink-0" />
          {assurancesHeading}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {t("service.verifiedSevaBadge")}
        </span>
      </div>

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 sm:gap-2.5">
        {assurances.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start gap-2.5 rounded-2xl border border-saffron-100/90 bg-saffron-50/35 p-2.5 sm:p-3 text-xs text-ink transition-colors hover:border-saffron-300 hover:bg-saffron-50/70"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 mt-0.5 shadow-2xs">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold text-ink leading-snug break-words">
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF9] pt-20 pb-28 sm:pt-32 md:pt-40 lg:pt-44 sm:pb-32">
      <div className="container-px mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb Navigation + Global Language Switcher */}
        <div className="flex items-center justify-between gap-3 text-xs text-ink-soft">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-saffron-700 transition-colors">
              {t("service.breadcrumbHome")}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/book" className="hover:text-saffron-700 transition-colors">
              {t("service.breadcrumbPoojas")}
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-semibold text-ink truncate max-w-xs">
              {locTitle}
            </span>
          </nav>
          <LanguageToggle />
        </div>

        {/* Two Column Layout: Banner on Left, Details on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: Banner of the Puja ── */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* Puja Banner Card */}
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] w-full overflow-hidden rounded-3xl border border-saffron-200/90 shadow-card bg-slate-950 group">
              <PoojaImage
                src={bannerImage}
                alt={locTitle}
                fallbackSize="lg"
                onClick={() => {
                  if (bannerImage) setPreviewOpen(true);
                }}
                imgClassName="cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
              />

              {/* Radiant Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />

              {/* Top Badges on Banner */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur border border-white/20">
                  <Sparkles className="h-3 w-3 text-saffron-400" />
                  {locBadge}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/60 hover:bg-black/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur border border-white/25 transition-all shadow-sm cursor-pointer"
                    title={t("service.allPhotos")}
                  >
                    <Camera className="h-3.5 w-3.5 text-amber-300" />
                    <span>{t("service.allPhotos")}</span>
                  </button>
                  {hasLiveStream && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 px-3 py-1 text-[11px] font-bold text-white backdrop-blur shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      {t("service.liveDarshan")}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Info on Banner */}
              <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-lg backdrop-blur border border-white/25">
                    {pooja.emoji || "🪔"}
                  </span>
                  <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                    {pooja.type === "home"
                      ? (locale === "hi" ? "🏡 गृह पूजा • घर पर पुरोहित जी" : "🏡 Home Puja • Devotee's Doorstep")
                      : getLocalizedTempleName(temple, locale)}
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

            {/* Live Ceremony Stream or Calming Pre-Live Notice */}
            {pooja.online !== false && (
              hasLiveStream ? (
                <a
                  href={pooja.liveStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold shadow-lg shadow-red-600/20 hover:scale-[1.01] hover:from-red-500 hover:to-rose-500 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
                    </span>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-rose-200 font-bold">
                        {t("service.liveBroadcastBadge")}
                      </div>
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        {t("service.watchLive")} <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                  <span className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur group-hover:bg-white/30 transition-colors">
                    {t("service.joinLive")}
                  </span>
                </a>
              ) : (
                <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/95 via-saffron-50/60 to-amber-50/90 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-soft">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-lg shadow-xs">
                    🪔
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-950 text-sm">
                      {t("service.preLiveTitle")}
                    </p>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      {t("service.preLiveDesc")}
                    </p>
                  </div>
                </div>
              )
            )}

            {/* Vedic Assurances & Inclusions Section (Desktop: sticky left column) */}
            {renderAssurancesSection("hidden lg:block")}
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
                      {t("service.vedicPurohitVerified")}
                    </span>
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                    {locTitle}
                  </h1>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {t("service.startingDakshina")}
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
                    {t("service.benefitsHeading")}
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

            {/* Vedic Assurances & Inclusions Section (Mobile: directly below primary heading/hero info) */}
            {renderAssurancesSection("block lg:hidden")}

            {/* Scheduled Date, Time & Temple Venue */}
            <div className="rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-saffron-50/60 via-white to-amber-50/40 p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-saffron-900">
                <Calendar className="h-5 w-5 text-saffron-600" />
                <h2 className="font-display text-base sm:text-lg font-bold">
                  {t("service.scheduleHeading")}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date & Time */}
                <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    {t("service.dateMuhuratLabel")}
                  </span>
                  <p className="font-display text-base font-bold text-ink">
                    {schedule ? `${schedule.date} • ${schedule.time}` : locMuhurat}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-saffron-800 font-medium">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-saffron-50 px-2 py-0.5 text-saffron-800 font-semibold border border-saffron-200/60">
                      <Sparkles className="h-3 w-3 text-saffron-600" />
                      <span>{t("service.muhuratPrefix")}: {locMuhurat}</span>
                    </span>
                  </div>
                </div>

                {/* Where / Venue: Devotee Home vs Temple Mandir */}
                {pooja.type === "home" ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block flex items-center gap-1">
                        <span>🏡</span>
                        <span>{locale === "hi" ? "स्थान: यजमान का निवास स्थल" : "Ritual Location: Devotee's Home"}</span>
                      </span>
                      <p className="font-display text-base font-bold text-slate-900 leading-tight mt-1">
                        {locale === "hi" ? "घर पर वैदिक पूजा अनुष्ठान" : "Doorstep Vedic Puja Ceremony"}
                      </p>
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 font-medium mt-1.5">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          {locale === "hi"
                            ? "आचार्य / पुरोहित जी स्वयं पवित्र पूजा सामग्री सहित आपके दिए गए पते पर पधारेंगे।"
                            : "Certified Vedic Panditji arrives in person with sanctified samagri at your provided address."}
                        </span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-blue-100 text-[11px] font-semibold text-blue-800">
                      ✓ {locale === "hi" ? "घर का पूरा पता बुकिंग फॉर्म में दर्ज करें" : "Devotee home address collected during booking"}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        {t("service.templeVenueLabel")}
                      </span>
                      <p className="font-display text-base font-bold text-ink leading-tight mt-0.5">
                        {getLocalizedTempleName(temple, locale)}
                      </p>
                      {temple && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-1">
                          <MapPin className="h-3.5 w-3.5 text-saffron-600 shrink-0" />
                          <span>{temple.city}, {temple.state}</span>
                        </div>
                      )}
                    </div>
                    {temple?.slug && (
                      <div className="pt-1.5 border-t border-saffron-100/80">
                        <Link
                          href={`/temples/${temple.slug}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-700 hover:text-saffron-800 hover:underline transition-colors"
                        >
                          <span>{t("temples.viewDetails")}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pre-Scheduled Muhurat Notice */}
              <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-950">
                <span className="font-bold">🗓️ {t("service.preScheduledNoticePrefix")}</span> {t("service.preScheduledNoticeText")}
              </div>
            </div>

            {/* Standard Online Group Pooja Booking Card */}
            <div
              ref={mainBookingCtaRef}
              id="main-booking-cta-card"
              className="rounded-3xl border border-saffron-200 bg-white p-6 shadow-card space-y-3.5 text-center sm:text-left transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    {t("service.groupDakshinaLabel")}
                  </span>
                  <span className="font-display text-2xl font-extrabold text-saffron-700">
                    {formatINR(pooja.price)}
                  </span>
                </div>

                <button
                  type="button"
                  id="book-now-main-btn"
                  onClick={handleBookNowClick}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3.5 px-8 text-base font-bold text-white shadow-lg shadow-saffron-600/25 transition-all hover:scale-[1.02] hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.98] w-full sm:w-auto"
                >
                  <span>{t("book.bookNow")} — {t("service.from")} {formatINR(pooja.price)}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                {t("service.nextStepHint")}
              </p>
            </div>

            {/* VIP Puja Direct Phone Enquiry Card */}
            <div className="rounded-3xl border border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-white to-amber-50/60 p-5 sm:p-6 shadow-soft space-y-3 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300/60">
                      {t("service.vipBadge")}
                    </span>
                    <span className="text-xs text-amber-800 font-semibold">{t("service.vipCoordination")}</span>
                  </div>
                  <h4 className="font-display text-base font-bold text-ink">
                    {t("service.vipTitle")}
                  </h4>
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {t("service.vipDesc")}
                  </p>
                </div>

                <a
                  href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3.5 text-sm font-bold shadow-md transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  <span>{t("service.vipCallCta")} ({SITE_CONFIG.contact.phoneDisplay})</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Sticky Booking Bar (Scroll-Aware, Appears only when main CTA is out of view) */}
      <aside
        id="book-now-sticky-bar"
        aria-label="Quick Booking"
        aria-hidden={isMainCtaInView}
        className={`fixed bottom-0 inset-x-0 z-40 border-t border-saffron-200/90 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 ease-in-out ${
          isMainCtaInView
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-4">
          {/* Left: Info & Price */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-xl shadow-2xs">
              {pooja.emoji || "🪔"}
            </span>
            <div className="min-w-0">
              <h3 className="hidden sm:block font-display text-xs sm:text-sm font-bold text-ink truncate max-w-xs md:max-w-md">
                {locTitle}
              </h3>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {t("service.startingDakshina")}:
                </span>
                <span className="font-display text-lg sm:text-xl font-extrabold text-saffron-700">
                  {formatINR(pooja.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Primary Book Now CTA */}
          <button
            type="button"
            id="book-now-sticky-btn"
            onClick={handleBookNowClick}
            className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-3.5 sm:px-7 py-2 sm:py-3 text-xs sm:text-base font-bold text-white shadow-md shadow-saffron-600/25 transition-all hover:scale-[1.02] hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.98] shrink-0 touch-manipulation cursor-pointer relative z-10"
          >
            <span>
              {t("book.bookNow")} — {t("service.from")} {formatINR(pooja.price)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          </button>
        </div>
      </aside>

      <ImagePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        imageUrl={bannerImage}
        title={locTitle}
        badge={pooja.type === "home" ? "HOME PUJA" : "GROUP PUJA"}
        photoCount="1/1"
      />
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
