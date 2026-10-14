"use client";

import Image from "next/image";
import { SITE_CONFIG } from "@/lib/config";

export interface PoojaImageFallbackProps {
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
  alt?: string;
  showBrandText?: boolean;
}

export default function PoojaImageFallback({
  size = "md",
  className = "",
  alt,
  showBrandText = true,
}: PoojaImageFallbackProps) {
  const isSm = size === "sm";
  const isLg = size === "lg" || size === "full";

  return (
    <div
      role="img"
      aria-label={alt || `${SITE_CONFIG.brandName} - Sacred Vedic Pooja`}
      className={`relative flex h-full w-full select-none items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50/95 via-orange-50/70 to-amber-100/90 border border-saffron-200/70 ${className}`}
    >
      {/* Sacred Radial Glow Backdrop */}
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.18)_0%,transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Subtle Sacred Geometry Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#ea580c_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Content Layout */}
      {isSm ? (
        /* Small Compact View (for tables or small badges) */
        <div className="relative z-10 flex items-center justify-center gap-1.5 px-2 py-1">
          <span
            className="font-serif font-black text-saffron-600 leading-none select-none text-base"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            ॐ
          </span>
          <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-md bg-white p-0.5 shadow-2xs border border-saffron-200">
            <Image
              src="/logo.jpeg"
              alt={SITE_CONFIG.brandName}
              width={24}
              height={24}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
        </div>
      ) : isLg ? (
        /* Large Hero / Detail View */
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-3 max-w-sm">
          {/* Spiritual Om Symbol with Warm Aura */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-2 rounded-full bg-saffron-200/40 blur-md pointer-events-none" />
            <span
              className="relative font-serif font-black text-5xl sm:text-6xl text-saffron-600 drop-shadow-[0_2px_4px_rgba(234,88,12,0.25)] select-none leading-none"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              ॐ
            </span>
          </div>

          {/* Official TPS Logo */}
          <div className="relative rounded-2xl bg-white p-2 shadow-sm border border-saffron-200/90 shrink-0 transition-transform duration-300 hover:scale-105">
            <Image
              src="/logo.jpeg"
              alt={SITE_CONFIG.brandName}
              width={64}
              height={64}
              className="h-14 w-14 sm:h-16 sm:w-16 object-contain rounded-xl select-none"
              priority
              unoptimized
            />
          </div>

          {/* Brand Tagline */}
          {showBrandText && (
            <div className="space-y-0.5">
              <span className="block font-display text-sm font-extrabold uppercase tracking-widest text-saffron-950">
                {SITE_CONFIG.brandName}
              </span>
              <span className="block text-[11px] font-semibold text-amber-800/80">
                Online Vedic Pooja & Sacred Temple Seva
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Medium / Standard Card View (for PoojaCard, Carousel, etc.) */
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 space-y-2">
          {/* Spiritual Om Emblem + Official Logo row or stacked */}
          <div className="flex items-center justify-center gap-3">
            <span
              className="font-serif font-black text-4xl text-saffron-600 drop-shadow-[0_1px_3px_rgba(234,88,12,0.25)] select-none leading-none"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              ॐ
            </span>
            <div className="h-6 w-px bg-saffron-300/60" aria-hidden="true" />
            <div className="relative rounded-xl bg-white p-1.5 shadow-2xs border border-saffron-200/90 shrink-0">
              <Image
                src="/logo.jpeg"
                alt={SITE_CONFIG.brandName}
                width={48}
                height={48}
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain rounded-lg select-none"
                unoptimized
              />
            </div>
          </div>

          {/* Brand Label */}
          {showBrandText && (
            <div className="space-y-0.5">
              <span className="block font-display text-xs font-bold uppercase tracking-wider text-saffron-900">
                {SITE_CONFIG.brandName}
              </span>
              <span className="block text-[10px] font-medium text-amber-800/80">
                Sacred Vedic Ritual
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
