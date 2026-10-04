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
  const { locale } = useI18n();

  const steps = [
    {
      number: 1,
      title:
        locale === "hi"
          ? "पूजा"
          : locale === "te"
          ? "పూజ"
          : locale === "ta"
          ? "பூஜை"
          : "Puja",
    },
    {
      number: 2,
      title:
        locale === "hi"
          ? "विवरण"
          : locale === "te"
          ? "వివరాలు"
          : locale === "ta"
          ? "விவரங்கள்"
          : "Details",
    },
    {
      number: 3,
      title:
        locale === "hi"
          ? "चढ़ावा"
          : locale === "te"
          ? "చడవా"
          : locale === "ta"
          ? "காணிக்கை"
          : "Chadhava",
    },
    {
      number: 4,
      title:
        locale === "hi"
          ? "अन्य सेवा"
          : locale === "te"
          ? "ఇతర సేవలు"
          : locale === "ta"
          ? "பிற சேவைகள்"
          : "Add-ons",
    },
    {
      number: 5,
      title:
        locale === "hi"
          ? "सारांश"
          : locale === "te"
          ? "సారాంశం"
          : locale === "ta"
          ? "சுருக்கம்"
          : "Summary",
    },
  ];

  return (
    <div className="rounded-2xl border border-saffron-200/80 bg-white/95 px-3 py-2.5 sm:px-4 sm:py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = step.number < currentStep;
          const isActive = step.number === currentStep;
          const isClickable = step.number <= maxStepUnlocked;

          return (
            <div key={step.number} className="flex flex-1 items-center min-w-0">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step.number)}
                disabled={!isClickable}
                className={`flex items-center gap-1.5 sm:gap-2 text-left transition-all ${
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                }`}
              >
                <div
                  className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isActive
                      ? "bg-saffron-600 text-white shadow-xs"
                      : "border border-saffron-200 bg-cream text-ink-soft"
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3 stroke-[3]" /> : step.number}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-bold truncate ${
                    isActive
                      ? "text-saffron-900"
                      : isCompleted
                      ? "text-emerald-700"
                      : "text-ink-soft"
                  }`}
                >
                  {step.title}
                </span>
              </button>

              {idx < steps.length - 1 && (
                <div className="mx-1 sm:mx-2 flex-1">
                  <div
                    className={`h-0.5 w-full rounded-full transition-all ${
                      currentStep > step.number ? "bg-emerald-500" : "bg-saffron-100"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
