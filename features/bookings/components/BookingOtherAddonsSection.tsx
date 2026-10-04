"use client";

import { Minus, Plus } from "lucide-react";
import {
  getOtherAddons,
  getLocalizedOfferingName,
  getLocalizedOfferingBadge,
  type ChadhavaOffering,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { BookingAddonItem } from "@/lib/storage";

interface BookingOtherAddonsSectionProps {
  selectedAddons: Record<string, number>;
  onUpdateQty: (id: string, delta: number) => void;
  otherAddonItems: BookingAddonItem[];
  otherAddonTotal: number;
}

export default function BookingOtherAddonsSection({
  selectedAddons,
  onUpdateQty,
  otherAddonItems,
  otherAddonTotal,
}: BookingOtherAddonsSectionProps) {
  const { locale } = useI18n();
  const addons = getOtherAddons();
  const totalCount = otherAddonItems.reduce((acc, a) => acc + a.quantity, 0);

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-4 sm:p-5 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-saffron-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <span>🍯</span>
            <span>
              {locale === "hi"
                ? "अन्य सेवा एवं प्रसाद (वैकल्पिक)"
                : locale === "te"
                ? "ఇతర సేవలు & ప్రసాదం (ఐచ్ఛికం)"
                : locale === "ta"
                ? "பிற சேவைகள் & பிரசாதம் (விருப்பத்தேர்வு)"
                : "Other Add-ons & Seva (Optional)"}
            </span>
          </h3>
          <p className="text-[11px] text-ink-soft">
            {locale === "hi"
              ? "महाप्रसाद, मंदिर गौसेवा दान अथवा अन्नदान जोड़ें।"
              : "Add special Mahaprasad, Gau Seva donation, or Anna Daan to your order."}
          </p>
        </div>

        {totalCount > 0 && (
          <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {totalCount} Added • +{formatINR(otherAddonTotal)}
          </span>
        )}
      </div>

      {/* Grid of Other Addons */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {addons.map((addon: ChadhavaOffering) => {
          const qty = selectedAddons[addon.id] || 0;
          const isAdded = qty > 0;
          const name = getLocalizedOfferingName(addon, locale);
          const badge = getLocalizedOfferingBadge(addon, locale);

          return (
            <div
              key={addon.id}
              className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                isAdded
                  ? "border-amber-400 bg-amber-50/50 shadow-xs"
                  : "border-saffron-100 bg-white hover:border-saffron-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl border border-amber-100">
                  {addon.emoji || "🍯"}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-ink leading-tight truncate">
                      {name}
                    </h4>
                    {badge && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="font-display text-xs font-extrabold text-amber-900 mt-0.5 block">
                    {formatINR(addon.price)}
                  </span>
                </div>
              </div>

              {/* Stepper [- 0 +] */}
              <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-1.5 py-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQty(addon.id, -1)}
                  disabled={qty === 0}
                  className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                    qty > 0
                      ? "text-amber-900 hover:bg-amber-50"
                      : "text-slate-300 cursor-not-allowed"
                  }`}
                  aria-label={`Decrease ${name}`}
                >
                  <Minus className="h-3 w-3" />
                </button>

                <span className="w-5 text-center text-xs font-extrabold text-ink">
                  {qty}
                </span>

                <button
                  type="button"
                  onClick={() => onUpdateQty(addon.id, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded text-amber-900 hover:bg-amber-50 transition-colors"
                  aria-label={`Increase ${name}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
