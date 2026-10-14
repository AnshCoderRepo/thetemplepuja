"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Maximize2 } from "lucide-react";
import type { Pooja } from "@/lib/data";
import {
  DEFAULT_POOJA_SLUGS,
  getLocalizedPoojaBenefits,
  getLocalizedPoojaDescription,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaTitle,
  getPoojaSchedule,
  getPoojaBannerImage,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import { ImagePreviewModal, PoojaImage } from "@/components/common";

export interface PoojaCardProps {
  pooja: Pooja;
}

export default function PoojaCard({ pooja: p }: PoojaCardProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const schedule = getPoojaSchedule(p);
  const isNewlyAdded = Boolean(p.isNew || !DEFAULT_POOJA_SLUGS.includes(p.slug));
  const bannerImage = p.imageUrl ? p.imageUrl.trim() : getPoojaBannerImage(p);

  const handleNavigateToPooja = () => {
    router.push(`/book/${p.slug}`);
  };

  return (
    <>
      <div
        onClick={handleNavigateToPooja}
        className="group card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft cursor-pointer transition-all duration-300 hover:border-saffron-300"
      >
        <div
          onClick={(e) => {
            if (bannerImage) {
              e.stopPropagation();
              setPreviewOpen(true);
            }
          }}
          className="relative flex h-44 sm:h-48 items-center justify-center bg-slate-950 text-white overflow-hidden"
        >
          <PoojaImage
            src={bannerImage}
            alt={getLocalizedPoojaTitle(p, locale)}
            fallbackSize="md"
            imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Date badge on top-left of banner */}
          <span
            suppressHydrationWarning
            className="absolute top-3 left-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-amber-100 backdrop-blur border border-white/15 flex items-center gap-1"
          >
            <Calendar className="h-3 w-3 text-amber-300" />
            <span suppressHydrationWarning>{schedule.date}</span>
          </span>

          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
            {p.online !== false && (
              <span className="rounded-full bg-rose-600/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur shadow-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live Broadcast
              </span>
            )}
            {isNewlyAdded && (
              <span className="rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur shadow-xs">
                ✨ New
              </span>
            )}
          </div>

          <span className="absolute top-3 right-3 z-10 rounded-full bg-black/50 border border-white/20 px-2.5 py-1 text-[11px] font-bold text-amber-100 backdrop-blur">
            {getLocalizedPoojaNativeBadge(p, locale)}
          </span>

          {bannerImage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewOpen(true);
              }}
              className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/65 hover:bg-black/85 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur border border-white/20 transition-all shadow-sm"
              title="Preview complete image"
              aria-label="Enlarge image preview"
            >
              <Maximize2 className="h-3 w-3 text-amber-300" />
              <span>View</span>
            </button>
          )}
        </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-bold text-ink group-hover:text-saffron-800 transition-colors leading-snug line-clamp-1">
              {getLocalizedPoojaTitle(p, locale)}
            </h3>
            <span className="font-display text-sm font-extrabold text-saffron-600 shrink-0">
              {formatINR(p.price)}
            </span>
          </div>

          {/* Scheduled Date & Time Pill */}
          <div
            suppressHydrationWarning
            className="mt-2.5 mb-2.5 flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-amber-50 via-saffron-50/40 to-amber-50/80 border border-amber-200/80 px-2.5 py-1.5 text-xs text-amber-950 shadow-xs"
          >
            <div className="flex items-center gap-1.5 font-bold text-saffron-900 truncate">
              <Calendar className="h-3.5 w-3.5 text-saffron-600 shrink-0" />
              <span suppressHydrationWarning className="truncate">{schedule.date}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-amber-900 shrink-0">
              <Clock className="h-3.5 w-3.5 text-saffron-600 shrink-0" />
              <span suppressHydrationWarning>{schedule.time}</span>
            </div>
          </div>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
            {getLocalizedPoojaDescription(p, locale)}
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {getLocalizedPoojaBenefits(p, locale)
              .slice(0, 2)
              .map((b) => (
                <span
                  key={b}
                  className="rounded-lg bg-saffron-50 px-2 py-0.5 text-[11px] font-medium text-saffron-800"
                >
                  ✓ {b}
                </span>
              ))}
          </div>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-saffron-100/60 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px] shrink-0">
            🕉️ Authentic Vedic Seva
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToPooja();
            }}
            aria-label={`${t("book.bookNow")}: ${getLocalizedPoojaTitle(p, locale)}`}
            className="group/btn inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 active:from-saffron-700 active:to-saffron-800 text-white font-bold text-xs px-3.5 sm:px-4 py-2 shadow-xs hover:shadow-md hover:shadow-saffron-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2 shrink-0"
          >
            <span>{t("book.bookNow")}</span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 group-hover/btn:translate-x-0.5"
            >
              →
            </span>
          </button>
        </div>
      </div>
    </div>

    {bannerImage && (
        <ImagePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          imageUrl={bannerImage}
          title={getLocalizedPoojaTitle(p, locale)}
          badge={p.type === "home" ? "HOME PUJA" : "GROUP PUJA"}
          photoCount="1/1"
        />
      )}
    </>
  );
}
