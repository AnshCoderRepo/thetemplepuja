"use client";

import { ChevronRight, Lock, Sparkles } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { PackageTier } from "../types/booking.types";

interface BookingStickyBarProps {
  currentStep: number;
  total: number;
  selectedTier: PackageTier;
  addonCount: number;
  onNext: () => void;
  isLoading?: boolean;
}

export default function BookingStickyBar({
  currentStep,
  total,
  selectedTier,
  addonCount,
  onNext,
  isLoading = false,
}: BookingStickyBarProps) {
  const { t } = useI18n();

  const tierName =
    selectedTier === "single"
      ? t("booking.packages.single.title")
      : selectedTier === "couple"
      ? t("booking.packages.couple.title")
      : t("booking.packages.family.title");

  return (
    <aside className="fixed bottom-0 inset-x-0 z-40 border-t border-saffron-200/80 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(36,18,51,0.12)] backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-saffron-800">
            <Sparkles className="h-3 w-3 text-saffron-600 shrink-0" />
            <span className="truncate">{tierName}</span>
            {addonCount > 0 && (
              <span className="rounded-full bg-saffron-100 px-1.5 py-0.2 text-[10px] text-saffron-900 font-extrabold shrink-0">
                +{addonCount} {t("booking.sticky.offeringsCount")}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">
              {t("booking.sticky.totalLabel")}:
            </span>
            <span className="font-display text-xl sm:text-2xl font-extrabold text-saffron-900">
              {formatINR(total)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNext}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 via-amber-500 to-saffron-600 px-5 sm:px-8 py-3 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-saffron-500/30 transition-all hover:scale-[1.02] hover:shadow-saffron-500/40 active:scale-95 disabled:opacity-50"
          >
            {currentStep === 1 ? (
              <>
                <span>Next: Devotee Details</span>
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </>
            ) : currentStep === 2 ? (
              <>
                <span>Next: Select Chadhava</span>
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </>
            ) : currentStep === 3 ? (
              <>
                <span>Next: Other Add-ons</span>
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </>
            ) : currentStep === 4 ? (
              <>
                <span>Next: Final Order Summary</span>
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Proceed to Payment ({formatINR(total)})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

