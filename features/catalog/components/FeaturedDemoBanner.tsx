"use client";

import Link from "next/link";
import { useCatalog } from "../hooks/useCatalog";
import { DEMO_POOJA, isDemoSlug, isPoojaActive } from "@/lib/data";
import { PoojaImage } from "@/components/common";

export default function FeaturedDemoBanner() {
  const { poojas, loaded } = useCatalog();

  // Find the configured demo service card from the backend/database store, falling back to static DEMO_POOJA
  const card = (loaded ? poojas.find((p) => isDemoSlug(p.slug)) : null) || DEMO_POOJA;

  // Inactive cards are hidden from the public website
  if (!isPoojaActive(card)) {
    return null;
  }

  const showBadge = card.showBadge !== false;
  const badgeText = card.badge?.trim() || "Live Demo";
  const title = card.title || "Test Demo Pooja (₹1)";
  const description =
    card.description ||
    "Test live booking, sankalp registration, and online payments end-to-end for just ₹1.";
  const ctaText = card.ctaText?.trim() || "Book for ₹1 →";
  const ctaLink = card.ctaLink?.trim() || "/book/demo-pooja";

  return (
    <div className="container-px mx-auto max-w-6xl mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-amber-50 via-saffron-50/60 to-rose-50 border border-amber-200/90 p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center gap-3">
          {card.imageUrl ? (
            <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-saffron-200 shadow-xs bg-slate-900">
              <PoojaImage src={card.imageUrl} alt={title} fallbackSize="sm" />
            </div>
          ) : (
            <span className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-saffron-500 text-white text-xl shadow-xs">
              {card.emoji || "🪔"}
            </span>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-ink">
                {title}
              </h3>
              {showBadge && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs">
                  {badgeText}
                </span>
              )}
            </div>
            <p className="text-xs text-ink-soft line-clamp-2 mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <Link
          href={ctaLink}
          className="btn-primary text-xs shrink-0 whitespace-nowrap shadow-xs hover:shadow-md transition-all"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}
