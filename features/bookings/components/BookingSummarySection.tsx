"use client";

import { CreditCard, Edit3, Lock, ShieldCheck } from "lucide-react";
import { getLocalizedPoojaTitle, type Pooja } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { BookingAddonItem } from "@/lib/storage";
import type { BookingFormData, PackageTier } from "../types/booking.types";

interface BookingSummarySectionProps {
  selectedPooja?: Pooja;
  selectedTier: PackageTier;
  packagePrice: number;
  total: number;
  addonItems: BookingAddonItem[];
  addonTotal: number;
  form: BookingFormData;
  date: string;
  time: string;
  formError: string;
  onProceed: () => void;
  onEditStep: (step: number) => void;
}

export default function BookingSummarySection({
  selectedPooja,
  selectedTier,
  packagePrice,
  total,
  addonItems,
  form,
  date,
  time,
  formError,
  onProceed,
  onEditStep,
}: BookingSummarySectionProps) {
  const { locale, t } = useI18n();

  const getTierLabel = () => {
    if (selectedTier === "single") return locale === "hi" ? "एकल संकल्प" : "Single Devotee";
    if (selectedTier === "couple") return locale === "hi" ? "दंपति संकल्प" : "Couple / Dampati";
    return locale === "hi" ? "परिवार संकल्प" : "Family / Kul Sankalp";
  };

  const poojaTitle = selectedPooja
    ? getLocalizedPoojaTitle(selectedPooja, locale)
    : t("booking.modalTitle");

  // Separate Chadhavas from Other Add-ons
  const chadhavaItems = addonItems.filter(
    (a) =>
      a.itemType === "chadhava" ||
      (!a.itemType &&
        a.category !== "Prasad Seva" &&
        a.category !== "Temple Donation" &&
        a.category !== "Anna Daan" &&
        a.category !== "Sacred Relic")
  );

  const otherAddonItems = addonItems.filter(
    (a) =>
      a.itemType === "addon" ||
      (!a.itemType &&
        (a.category === "Prasad Seva" ||
          a.category === "Temple Donation" ||
          a.category === "Anna Daan" ||
          a.category === "Sacred Relic"))
  );

  const chadhavaSubtotal = chadhavaItems.reduce(
    (sum, a) => sum + a.price * a.quantity,
    0
  );
  const otherAddonSubtotal = otherAddonItems.reduce(
    (sum, a) => sum + a.price * a.quantity,
    0
  );
  const subtotal = packagePrice + chadhavaSubtotal + otherAddonSubtotal;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Clean Order Summary Card */}
      <div className="rounded-2xl border border-saffron-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-ink">
              {locale === "hi" ? "ऑर्डर सारांश" : "ORDER SUMMARY"}
            </h3>
            <p className="text-[11px] text-ink-soft">
              {locale === "hi"
                ? "भुगतान से पहले अपनी पूजा और चढ़ावे की समीक्षा करें"
                : "Review your selection before proceeding to payment"}
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Verified
          </span>
        </div>

        {/* 1. Puja Section */}
        <div className="rounded-xl bg-cream/40 p-3.5 border border-saffron-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-700 block">
                {locale === "hi" ? "पूजा सेवा" : "Puja"}
              </span>
              <h4 className="text-sm font-bold text-ink">{poojaTitle}</h4>
              <p className="text-[11px] text-ink-soft mt-0.5">
                {getTierLabel()} • {date || "Auspicious Date"} • {time || "06:30 PM IST"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-display text-sm font-extrabold text-saffron-900">
                {formatINR(packagePrice)}
              </span>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="block text-[10px] text-saffron-700 hover:underline mt-0.5 ml-auto"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* 2. Chadhava Section */}
        {chadhavaItems.length > 0 && (
          <div className="rounded-xl bg-cream/40 p-3.5 border border-saffron-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-800 flex items-center gap-1">
                <span>🌸</span> {locale === "hi" ? "चढ़ावा" : "Chadhava"}
              </span>
              <button
                type="button"
                onClick={() => onEditStep(3)}
                className="text-[10px] text-saffron-700 hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {chadhavaItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs text-ink">
                  <span>
                    {item.name} <span className="text-ink-soft font-mono">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-saffron-900">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Other Add-ons Section */}
        {otherAddonItems.length > 0 && (
          <div className="rounded-xl bg-cream/40 p-3.5 border border-saffron-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <span>🍯</span> {locale === "hi" ? "अन्य सेवा" : "Other Add-ons"}
              </span>
              <button
                type="button"
                onClick={() => onEditStep(4)}
                className="text-[10px] text-saffron-700 hover:underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-1.5 pt-1">
              {otherAddonItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs text-ink">
                  <span>
                    {item.name} <span className="text-ink-soft font-mono">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-amber-900">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Devotee Details Summary */}
        <div className="flex items-center justify-between rounded-xl bg-saffron-50/50 p-3 border border-saffron-100 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
              {locale === "hi" ? "यजमान" : "Devotee"}
            </span>
            <span className="font-bold text-ink">
              {form.name || "Devotee"} ({form.gotra || "Kashyap"})
            </span>
            <span className="text-ink-soft text-[11px] block mt-0.5">
              +91 {form.phone || "—"} • {form.city || "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="flex items-center gap-1 text-[11px] font-bold text-saffron-700 hover:underline"
          >
            <Edit3 className="h-3 w-3" />
            <span>Edit</span>
          </button>
        </div>

        {/* 5. Financial Totals Breakdown */}
        <div className="border-t border-saffron-200/80 pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-ink-soft">
            <span>{locale === "hi" ? "उप-योग" : "Subtotal"}</span>
            <span className="font-semibold text-ink">{formatINR(subtotal)}</span>
          </div>

          <div className="flex justify-between text-ink-soft">
            <span>{locale === "hi" ? "शुल्क व कर" : "Taxes / Charges"}</span>
            <span className="text-emerald-700 font-semibold">{locale === "hi" ? "सम्मिलित" : "Included"}</span>
          </div>

          <div className="flex justify-between items-baseline border-t border-saffron-200 pt-2.5">
            <span className="text-sm font-extrabold uppercase text-ink">
              {locale === "hi" ? "कुल देय राशि" : "TOTAL PAYABLE"}
            </span>
            <span className="font-display text-xl font-extrabold text-saffron-900">
              {formatINR(total)}
            </span>
          </div>
        </div>

        {formError && (
          <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200 font-medium">
            ⚠️ {formError}
          </div>
        )}

        {/* Payment Options Preview & Proceed Button */}
        <div className="border-t border-saffron-100 pt-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] text-ink-soft px-1">
            <span className="flex items-center gap-1 font-semibold text-ink">
              <CreditCard className="h-3.5 w-3.5 text-saffron-600" />
              <span>Payment Options:</span>
            </span>
            <span>UPI • Cards • NetBanking • Razorpay</span>
          </div>

          <button
            type="button"
            onClick={onProceed}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 via-amber-500 to-saffron-600 py-3 px-6 text-sm font-extrabold text-white shadow-md hover:scale-[1.01] active:scale-98 transition-all"
          >
            <Lock className="h-4 w-4" />
            <span>Proceed to Payment ({formatINR(total)})</span>
          </button>

          <p className="text-center text-[10px] text-ink-soft flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            <span>100% Secure 256-bit encrypted checkout via Razorpay</span>
          </p>
        </div>
      </div>
    </div>
  );
}
