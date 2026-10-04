"use client";

import { Check, User, Users, Users2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { PackageTier, PoojaPackageOption } from "../types/booking.types";

interface BookingPackagesProps {
  basePrice: number;
  selectedTier: PackageTier;
  onSelectTier: (tier: PackageTier) => void;
}

export const POOJA_PACKAGES: PoojaPackageOption[] = [
  {
    id: "single",
    title: "Single Devotee",
    hindiTitle: "एकल संकल्प",
    description: "1 Devotee name & gotra sankalp",
    priceMultiplier: 1.0,
    badge: "Personal",
    devoteeLimit: 1,
    features: ["1 Devotee Sankalp"],
  },
  {
    id: "couple",
    title: "Couple / Dampati",
    hindiTitle: "दंपति संकल्प",
    description: "Husband & wife joint sankalp",
    priceMultiplier: 1.8,
    badge: "Popular",
    devoteeLimit: 2,
    features: ["Husband & Wife Joint Sankalp"],
  },
  {
    id: "family",
    title: "Family / Kul Sankalp",
    hindiTitle: "परिवार / कुल संकल्प",
    description: "Complete family (up to 5 names)",
    priceMultiplier: 2.5,
    badge: "Best Value",
    devoteeLimit: 5,
    features: ["Up to 5 Family Members"],
  },
];

export function calculatePackagePrice(basePrice: number, tier: PackageTier): number {
  const pkg = POOJA_PACKAGES.find((p) => p.id === tier);
  if (!pkg) return basePrice;
  const raw = Math.round(basePrice * pkg.priceMultiplier);
  if (tier === "single") return basePrice;
  return Math.round(raw / 100) * 100 + 1;
}

export default function BookingPackages({
  basePrice,
  selectedTier,
  onSelectTier,
}: BookingPackagesProps) {
  const { locale } = useI18n();

  const getPackageDetails = (id: PackageTier) => {
    if (locale === "hi") {
      if (id === "single") return { title: "एकल संकल्प", subtitle: "1 व्यक्ति का नाम व गोत्र संकल्प" };
      if (id === "couple") return { title: "दंपति संकल्प", subtitle: "पति-पत्नी संयुक्त नाम व गोत्र संकल्प" };
      return { title: "परिवार / कुल संकल्प", subtitle: "परिवार के 5 सदस्यों तक का विशेष संकल्प" };
    }
    if (locale === "te") {
      if (id === "single") return { title: "ఏక సంకల్పం", subtitle: "1 భక్తుని పేరు & గోత్ర సంకల్పం" };
      if (id === "couple") return { title: "దంపతుల సంకల్పం", subtitle: "భార్యాభర్తల సంయుక్త సంకల్పం" };
      return { title: "కుటుంబ సంకల్పం", subtitle: "5 గురు కుటుంబ సభ్యుల వరకు సంకల్పం" };
    }
    if (locale === "ta") {
      if (id === "single") return { title: "தனிநபர் சங்கல்பம்", subtitle: "1 பக்தர் பெயர் & கோத்ர சங்கல்பம்" };
      if (id === "couple") return { title: "தம்பதியர் சங்கல்பம்", subtitle: "கணவன் & மனைவி கூட்டு சங்கல்பம்" };
      return { title: "குடும்ப சங்கல்பம்", subtitle: "5 குடும்ப உறுப்பினர்கள் வரை சங்கல்பம்" };
    }
    if (id === "single") return { title: "Single Devotee", subtitle: "1 Devotee name & gotra sankalp" };
    if (id === "couple") return { title: "Couple / Dampati", subtitle: "Husband & wife joint sankalp" };
    return { title: "Family / Kul Sankalp", subtitle: "Up to 5 family member names" };
  };

  const getIcon = (id: PackageTier) => {
    switch (id) {
      case "single":
        return <User className="h-4 w-4" />;
      case "couple":
        return <Users className="h-4 w-4" />;
      case "family":
        return <Users2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-4 sm:p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">
          {locale === "hi"
            ? "संकल्प पैकेज चुनें"
            : locale === "te"
            ? "సంకల్ప ప్యాకేజీని ఎంచుకోండి"
            : locale === "ta"
            ? "சங்கல்ப தொகுப்பைத் தேர்ந்தெடுக்கவும்"
            : "Select Pooja Package"}
        </h3>
        <span className="text-[11px] text-ink-soft">
          {locale === "hi" ? "यजमान संख्या अनुसार" : "Based on devotee count"}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {POOJA_PACKAGES.map((pkg) => {
          const isSelected = selectedTier === pkg.id;
          const pkgPrice = calculatePackagePrice(basePrice, pkg.id);
          const details = getPackageDetails(pkg.id);

          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelectTier(pkg.id)}
              className={`relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-saffron-500 bg-saffron-50/60 ring-2 ring-saffron-400"
                  : "border-saffron-100 bg-white hover:border-saffron-300 hover:bg-cream/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-saffron-600 text-white"
                        : "bg-saffron-50 text-saffron-700"
                    }`}
                  >
                    {getIcon(pkg.id)}
                  </span>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="mt-2.5">
                  <h4 className="text-xs sm:text-sm font-bold text-ink">
                    {details.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-ink-soft line-clamp-1">
                    {details.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-saffron-100 pt-2 flex items-baseline justify-between">
                <span className="text-[10px] text-ink-soft uppercase tracking-wider">Dakshina</span>
                <span className="font-display text-base font-extrabold text-saffron-900">
                  {formatINR(pkgPrice)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
