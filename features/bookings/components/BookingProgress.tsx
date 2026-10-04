"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/components/providers";

interface BookingProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxStepUnlocked: number;
}

export default function BookingProgress({
  currentStep,
  onStepClick,
  maxStepUnlocked,
}: BookingProgressProps) {
  const { t } = useI18n();

  const steps = [
    {
      number: 1,
      title: t("booking.step1.title"),
      subtitle: t("booking.step1.subtitle"),
    },
    {
      number: 2,
      title: t("booking.step2.title"),
      subtitle: t("booking.step2.subtitle"),
    },
    {
      number: 3,
      title: t("booking.step3.title"),
      subtitle: t("booking.step3.subtitle"),
    },
  ];

  return (
    <div className="rounded-2xl border border-saffron-200/80 bg-white/95 p-3.5 sm:p-5 shadow-soft backdrop-blur-md">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isClickable = step.number <= maxStepUnlocked;

          return (
            <div key={step.number} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={`flex items-center gap-2.5 sm:gap-3 text-left transition-all ${
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                }`}
              >
                <div
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl font-display text-xs sm:text-sm font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-xs"
                      : isActive
                      ? "bg-gradient-to-br from-saffron-500 to-amber-600 text-white shadow-md shadow-saffron-500/25 ring-2 ring-saffron-300 ring-offset-2"
                      : "border border-saffron-200 bg-cream text-ink-soft"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" /> : step.number}
                </div>
                <div className="hidden sm:block">
                  <span
                    className={`block text-xs font-bold leading-tight ${
                      isActive
                        ? "text-saffron-900"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-ink-soft"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span className="block text-[11px] text-ink-soft/70">
                    {step.subtitle}
                  </span>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className="mx-2 sm:mx-4 flex-1">
                  <div
                    className={`h-1 w-full rounded-full transition-all ${
                      currentStep > step.number
                        ? "bg-emerald-500"
                        : "bg-saffron-100"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2.5 flex justify-between sm:hidden border-t border-saffron-100 pt-2 text-[11px] font-bold">
        <span className="text-saffron-900">
          {t("booking.stepProgress")} {currentStep}: {steps[currentStep - 1]?.title}
        </span>
        <span className="text-ink-soft font-normal">
          {currentStep}/3 {t("booking.completed")}
        </span>
      </div>
    </div>
  );
}
