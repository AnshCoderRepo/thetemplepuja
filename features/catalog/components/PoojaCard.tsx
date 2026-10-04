"use client";

import { Clock } from "lucide-react";
import type { Pooja } from "@/lib/data";
import {
  getLocalizedPoojaBenefits,
  getLocalizedPoojaDescription,
  getLocalizedPoojaDuration,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaTitle,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n, useBookingModal } from "@/components/providers";

export interface PoojaCardProps {
  pooja: Pooja;
}

export default function PoojaCard({ pooja: p }: PoojaCardProps) {
  const { locale, t } = useI18n();
  const { openBooking } = useBookingModal();

  return (
    <div
      onClick={() => openBooking(p.slug)}
      className="group card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft cursor-pointer transition-all duration-300 hover:border-saffron-300"
    >
      <div
        className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${p.gradient} p-6 text-white overflow-hidden`}
      >
        <span className="text-6xl transition-transform duration-300 group-hover:scale-110">
          {p.emoji}
        </span>
        <span className="absolute top-4 right-4 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
          {getLocalizedPoojaNativeBadge(p, locale)}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-bold text-ink group-hover:text-saffron-800 transition-colors">
              {getLocalizedPoojaTitle(p, locale)}
            </h3>
            <span className="font-display text-base font-extrabold text-saffron-600">
              {formatINR(p.price)}
            </span>
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
              openBooking(p.slug);
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
