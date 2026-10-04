"use client";

import { Minus, Plus } from "lucide-react";
import {
  getChadhavas,
  getLocalizedOfferingName,
  getLocalizedOfferingBadge,
  type ChadhavaOffering,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { BookingAddonItem } from "@/lib/storage";

interface BookingChadhavaSectionProps {
  selectedAddons: Record<string, number>;
  onUpdateQty: (id: string, delta: number) => void;
  chadhavaItems: BookingAddonItem[];
  chadhavaTotal: number;
}

export default function BookingChadhavaSection({
  selectedAddons,
  onUpdateQty,
  chadhavaItems,
  chadhavaTotal,
}: BookingChadhavaSectionProps) {
  const { locale } = useI18n();
  const chadhavas = getChadhavas();
  const totalCount = chadhavaItems.reduce((acc, a) => acc + a.quantity, 0);

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-4 sm:p-5 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-saffron-100 pb-2.5">
        <div>
          <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <span>🌸</span>
            <span>
              {locale === "hi"
                ? "पवित्र चढ़ावा (वैकल्पिक)"
                : locale === "te"
                ? "పవిత్ర చడవా (ఐచ్ఛికం)"
                : locale === "ta"
                ? "புனித காணிக்கை (விருப்பத்தேர்வு)"
                : "Sacred Chadhava (Optional)"}
            </span>
          </h3>
          <p className="text-[11px] text-ink-soft">
            {locale === "hi"
              ? "देव चरणों में अर्पित करने हेतु चढ़ावा चुनें।"
              : "Select sacred offerings to be consecrated during the ritual."}
          </p>
        </div>

        {totalCount > 0 && (
          <span className="text-xs font-bold text-saffron-800 bg-saffron-50 px-2.5 py-1 rounded-full border border-saffron-200">
            {totalCount} Added • +{formatINR(chadhavaTotal)}
          </span>
        )}
      </div>

      {/* Grid of Chadhavas */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {chadhavas.map((chadhava: ChadhavaOffering) => {
          const qty = selectedAddons[chadhava.id] || 0;
          const isAdded = qty > 0;
          const name = getLocalizedOfferingName(chadhava, locale);
          const badge = getLocalizedOfferingBadge(chadhava, locale);

          return (
            <div
              key={chadhava.id}
              className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                isAdded
                  ? "border-saffron-500 bg-saffron-50/50 shadow-xs"
                  : "border-saffron-100 bg-white hover:border-saffron-200"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-xl border border-saffron-100">
                  {chadhava.emoji || "🌸"}
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
                  <span className="font-display text-xs font-extrabold text-saffron-900 mt-0.5 block">
                    {formatINR(chadhava.price)}
                  </span>
                </div>
              </div>

              {/* Stepper [- 0 +] */}
              <div className="flex items-center gap-1.5 rounded-lg border border-saffron-200 bg-white px-1.5 py-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onUpdateQty(chadhava.id, -1)}
                  disabled={qty === 0}
                  className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                    qty > 0
                      ? "text-saffron-900 hover:bg-saffron-50"
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
                  onClick={() => onUpdateQty(chadhava.id, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded text-saffron-900 hover:bg-saffron-50 transition-colors"
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
