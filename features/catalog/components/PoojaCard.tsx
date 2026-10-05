"use client";

import { useRouter } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import type { Pooja } from "@/lib/data";
import {
  DEFAULT_POOJA_SLUGS,
  getLocalizedPoojaBenefits,
  getLocalizedPoojaDescription,
  getLocalizedPoojaDuration,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaTitle,
  getPoojaSchedule,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";

export interface PoojaCardProps {
  pooja: Pooja;
}

export default function PoojaCard({ pooja: p }: PoojaCardProps) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const schedule = getPoojaSchedule(p);
  const isNewlyAdded = Boolean(p.isNew || !DEFAULT_POOJA_SLUGS.includes(p.slug));

  const handleNavigateToPooja = () => {
    router.push(`/book/${p.slug}`);
  };

  return (
    <div
      onClick={handleNavigateToPooja}
      className="group card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft cursor-pointer transition-all duration-300 hover:border-saffron-300"
    >
      <div
        className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${p.gradient} p-5 text-white overflow-hidden`}
      >
        {/* Date badge on top-left of banner */}
        <span
          suppressHydrationWarning
          className="absolute top-3.5 left-3.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-amber-100 backdrop-blur border border-white/15 flex items-center gap-1"
        >
          <Calendar className="h-3 w-3 text-amber-300" />
          <span suppressHydrationWarning>{schedule.date}</span>
        </span>

        {/* Newly Added badge */}
        {isNewlyAdded && (
          <span className="absolute bottom-3 left-3.5 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white backdrop-blur shadow-xs">
            ✨ New
          </span>
        )}

        <span className="text-5xl transition-transform duration-300 group-hover:scale-110">
          {p.emoji}
        </span>
        <span className="absolute top-3.5 right-3.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
          {getLocalizedPoojaNativeBadge(p, locale)}
        </span>
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

        <div className="mt-6 flex items-center justify-between border-t border-saffron-100/60 pt-4 text-xs">
          <span className="flex items-center gap-1 text-ink-soft">
            <Clock className="h-3.5 w-3.5" />
            {getLocalizedPoojaDuration(p, locale)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToPooja();
            }}
            className="inline-flex items-center gap-1 font-bold text-saffron-600 group-hover:text-saffron-700 hover:underline"
          >
            {t("book.bookNow")} →
          </button>
        </div>
      </div>
    </div>
  );
}
