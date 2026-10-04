"use client";

import { Minus, Plus, Sparkles } from "lucide-react";
import {
  defaultChadhavaOfferings,
  getLocalizedOfferingCategory,
  getLocalizedOfferingDescription,
  getLocalizedOfferingName,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { BookingAddonItem } from "@/lib/storage";

interface BookingAddonsProps {
  selectedAddons: Record<string, number>;
  onUpdateQty: (id: string, delta: number) => void;
  addonItems: BookingAddonItem[];
  addonTotal: number;
}

export default function BookingAddons({
  selectedAddons,
  onUpdateQty,
  addonItems,
  addonTotal,
}: BookingAddonsProps) {
  const { locale, t } = useI18n();
  const totalCount = addonItems.reduce((acc, a) => acc + a.quantity, 0);

  const subtotalLabel =
    locale === "hi"
      ? "उप-योग"
      : locale === "te"
      ? "మొత్తం"
      : locale === "ta"
      ? "மொத்தம்"
      : "Subtotal";

  const perOfferingLabel =
    locale === "hi"
      ? "प्रति अर्पण"
      : locale === "te"
      ? "ప్రతి సమర్పణకు"
      : locale === "ta"
      ? "ஒரு சமர்ப்பணத்திற்கு"
      : "Per Offering";

  return (
    <div className="rounded-3xl border border-saffron-100 bg-white p-5 sm:p-7 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-saffron-700">
            <Sparkles className="h-3 w-3" /> {t("booking.addons.eyebrow")}
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
            {t("booking.addons.title")}
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            {t("booking.addons.subtitle")}
          </p>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-50 to-amber-50 border border-saffron-200 px-3.5 py-1.5 shadow-xs">
            <span className="text-xs font-bold text-saffron-900">
              {totalCount} {t("booking.addons.added")}
            </span>
            <span className="h-3 w-px bg-saffron-300" />
            <span className="font-display text-xs font-extrabold text-saffron-700">
              +{formatINR(addonTotal)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {defaultChadhavaOfferings.map((offering) => {
          const qty = selectedAddons[offering.id] || 0;
          const isAdded = qty > 0;
          const name = getLocalizedOfferingName(offering, locale);
          const desc = getLocalizedOfferingDescription(offering, locale);
          const category = getLocalizedOfferingCategory(offering, locale);

          return (
            <div
              key={offering.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                isAdded
                  ? "border-saffron-400 bg-gradient-to-b from-saffron-50/60 to-white ring-1 ring-saffron-300 shadow-sm"
                  : "border-saffron-100 bg-cream/30 hover:border-saffron-200 hover:bg-white"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-xs border border-saffron-100">
                    {offering.emoji}
                  </div>
                  <div className="text-right">
                    <span className="font-display text-base font-extrabold text-saffron-900">
                      {formatINR(offering.price)}
                    </span>
                    {category && (
                      <span className="block text-[10px] font-semibold text-ink-soft">
                        {category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5">
                  <h4 className="font-display text-sm font-bold text-ink leading-tight">
                    {name}
                  </h4>
                  <p className="mt-1 text-[11px] text-ink-soft leading-relaxed line-clamp-2">
                    {desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-saffron-100 pt-3">
                <span className="text-[11px] text-ink-soft font-medium">
                  {isAdded ? (
                    <span className="text-emerald-700 font-bold">
                      {subtotalLabel}: {formatINR(offering.price * qty)}
                    </span>
                  ) : (
                    perOfferingLabel
                  )}
                </span>

                <div>
                  {isAdded ? (
                    <div className="flex items-center gap-1.5 rounded-xl bg-white border border-saffron-300 px-2 py-1 shadow-xs">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(offering.id, -1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-saffron-800 hover:bg-saffron-50 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center font-mono text-xs font-extrabold text-ink">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(offering.id, 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-saffron-800 hover:bg-saffron-50 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdateQty(offering.id, 1)}
                      className="inline-flex items-center gap-1 rounded-xl bg-white border border-saffron-300 px-3 py-1.5 text-xs font-bold text-saffron-800 shadow-xs hover:bg-saffron-500 hover:text-white hover:border-saffron-500 transition-all active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t("booking.addons.add")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
