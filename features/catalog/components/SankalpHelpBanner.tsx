"use client";

import Link from "next/link";
import { Headphones } from "lucide-react";
import { useI18n } from "@/components/providers";
import { getWhatsAppUrl } from "@/lib/config";

export interface SankalpHelpBannerProps {
  className?: string;
  showExploreButton?: boolean;
  exploreHref?: string;
}

export default function SankalpHelpBanner({
  className = "",
  showExploreButton = true,
  exploreHref = "/book",
}: SankalpHelpBannerProps) {
  const { t } = useI18n();

  const whatsappUrl = getWhatsAppUrl(
    "Namaste, I need help with Sankalp and Puja booking on TemplePujaSewa."
  );

  return (
    <div
      role="region"
      aria-label="Sankalp and Puja Booking Assistance"
      className={`rounded-2xl sm:rounded-3xl border border-amber-200/80 bg-white p-4 sm:p-5 lg:px-6 lg:py-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 text-left transition-all ${className}`}
    >
      {/* Left: Support Icon & Guidance Text */}
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        <div
          aria-hidden="true"
          className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100/80 via-orange-50 to-amber-100/50 text-amber-800 border border-amber-200/70 shadow-2xs"
        >
          <Headphones className="h-6 w-6 sm:h-7 sm:w-7 text-amber-800 stroke-[2.2]" />
        </div>

        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {t("book.sankalpHelpHeading")}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed mt-0.5">
            {t("book.sankalpHelpSubtitle")}
          </p>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto">
        {/* Primary CTA: Talk to an Expert via WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("book.sankalpHelpCta")} - WhatsApp Support`}
          className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-600 hover:to-amber-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold shadow-soft hover:shadow-glow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2"
        >
          <Headphones className="h-4 w-4 shrink-0 stroke-[2.2]" />
          <span>{t("book.sankalpHelpCta")}</span>
        </a>

        {/* Optional Secondary CTA: Explore Pujas */}
        {showExploreButton && (
          <Link
            href={exploreHref}
            aria-label={t("book.sankalpHelpExplore")}
            className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-saffron-300/80 hover:border-saffron-500 bg-white hover:bg-saffron-50/60 text-saffron-950 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2"
          >
            <span className="text-sm select-none" aria-hidden="true">
              🪷
            </span>
            <span>{t("book.sankalpHelpExplore")}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
