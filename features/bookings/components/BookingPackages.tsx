"use client";

import { Check, Sparkles, User, Users, Users2 } from "lucide-react";
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
    description: "Personal name & gotra Vedic sankalp",
    priceMultiplier: 1.0,
    badge: "Personal",
    devoteeLimit: 1,
    features: [
      "1 Devotee Name & Gotra Sankalp",
      "Personalised Vedic Chanting by Purohit",
      "Pooja HD Video Clip on WhatsApp",
      "Digital Receipt & Blessed Prasad",
    ],
  },
  {
    id: "couple",
    title: "Couple / Dampati",
    hindiTitle: "दंपति संकल्प",
    description: "Husband & wife joint name and gotra sankalp",
    priceMultiplier: 1.8,
    badge: "Most Popular",
    devoteeLimit: 2,
    features: [
      "Husband & Wife (2 Names) Joint Sankalp",
      "Prayers for Marital Bliss & Harmony",
      "Complete Sankalp Video Recording",
      "Consecrated Raksha Sutra & Prasad",
    ],
  },
  {
    id: "family",
    title: "Family / Kul Sankalp",
    hindiTitle: "परिवार / कुल संकल्प",
    description: "Complete family (up to 5 members) name-gotra maha pooja",
    priceMultiplier: 2.5,
    badge: "Best Value",
    devoteeLimit: 5,
    features: [
      "Up to 5 Family Member Names in Sankalp",
      "Kul Shuddhi & Universal Family Wellbeing",
      "Full HD Ritual Video Recording",
      "Special Mahaprasad & Blessed Rudraksha Box",
    ],
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
  const { locale, t } = useI18n();

  const getIcon = (id: PackageTier) => {
    switch (id) {
      case "single":
        return <User className="h-5 w-5" />;
      case "couple":
        return <Users className="h-5 w-5" />;
      case "family":
        return <Users2 className="h-5 w-5" />;
    }
  };

  const getLocalizedPackage = (id: PackageTier) => {
    if (locale === "hi") {
      if (id === "single") {
        return {
          title: "एकल संकल्प",
          desc: "व्यक्तिगत नाम एवं गोत्र से विशेष पूजन संकल्प",
          badge: "व्यक्तिगत",
          features: [
            "1 व्यक्ति का नाम व गोत्र संकल्प",
            "पुजारी द्वारा व्यक्तिगत मंत्रोच्चार",
            "व्हाट्सऐप पर पूजा वीडियो क्लिप",
            "डिजिटल रसीद एवं प्रसाद",
          ],
        };
      }
      if (id === "couple") {
        return {
          title: "दंपति संकल्प",
          desc: "पति-पत्नी संयुक्त नाम एवं गोत्र संकल्प",
          badge: "सर्वाधिक लोकप्रिय",
          features: [
            "पति व पत्नी (2 नाम) संयुक्त संकल्प",
            "वैवाहिक सुख एवं गृह शांति हेतु अर्चन",
            "विस्तृत संकल्प वीडियो रिकॉर्डिंग",
            "अभिमंत्रित रक्षा सूत्र व प्रसाद",
          ],
        };
      }
      return {
        title: "परिवार / कुल संकल्प",
        desc: "संपूर्ण परिवार (5 सदस्य तक) के नाम-गोत्र से महापूजा",
        badge: "सर्वोत्तम लाभ",
        features: [
          "परिवार के 5 सदस्यों तक के नाम संकल्प",
          "कुल शुद्धि एवं सर्व कल्याण प्रार्थना",
          "संपूर्ण पूजा की HD वीडियो रिकॉर्डिंग",
          "विशेष महाप्रसाद व रुद्राक्ष बॉक्स",
        ],
      };
    }

    if (locale === "te") {
      if (id === "single") {
        return {
          title: "ఏక సంకల్పం (ఒక్కరు)",
          desc: "వ్యక్తిగత పేరు మరియు గోత్రంతో వైదిక పూజా సంకల్పం",
          badge: "వ్యక్తిగతం",
          features: [
            "1 వ్యక్తి పేరు మరియు గోత్ర సంకల్పం",
            "పండితులచే ప్రత్యేక వేద మంత్రోచ్ఛారణ",
            "వాట్సాప్‌లో పూజా వీడియో క్లిప్",
            "డిజిటల్ రసీదు మరియు పవిత్ర ప్రసాదం",
          ],
        };
      }
      if (id === "couple") {
        return {
          title: "దంపతుల సంకల్పం",
          desc: "భార్యాభర్తల ఉమ్మడి పేరు మరియు గోత్ర సంకల్పం",
          badge: "అత్యంత ప్రజాదరణ",
          features: [
            "భార్యాభర్తలు (2 పేర్లు) ఉమ్మడి సంకల్పం",
            "వైవాహిక ఆనందం మరియు గృహ శాంతి పూజ",
            "పూర్తి సంకల్ప వీడియో రికార్డింగ్",
            "రక్షా సూత్రం మరియు ప్రసాదం",
          ],
        };
      }
      return {
        title: "కుటుంబ సంకల్పం",
        desc: "మొత్తం కుటుంబం (5 గురు వరకు) పేరు-గోత్రాలతో మహా పూజ",
        badge: "ఉత్తమ విలువ",
        features: [
          "కుటుంబంలోని 5 మంది పేర్ల వరకు సంకల్పం",
          "కుల శుద్ధి మరియు సర్వ కల్యాణ ప్రార్థన",
          "పూర్తి పూజ HD వీడియో రికార్డింగ్",
          "ప్రత్యేక మహాప్రసాదం & రుద్రాక్ష బాక్స్",
        ],
      };
    }

    if (locale === "ta") {
      if (id === "single") {
        return {
          title: "தனிநபர் சங்கல்பம்",
          desc: "தனிநபர் பெயர் மற்றும் கோத்ரத்துடன் வேத பூஜை சங்கல்பம்",
          badge: "தனிநபர்",
          features: [
            "1 நபர் பெயர் மற்றும் கோத்ர சங்கல்பம்",
            "வேத பண்டிதரின் தனிப்பட்ட மந்திர உச்சாடனம்",
            "வாட்ஸ்அப்பில் பூஜை வீடியோ பதிவு",
            "டிஜிட்டல் ரசீது மற்றும் புனித பிரசாதம்",
          ],
        };
      }
      if (id === "couple") {
        return {
          title: "தம்பதியர் சங்கல்பம்",
          desc: "கணவன்-மனைவி கூட்டுப் பெயர் மற்றும் கோத்ர சங்கல்பம்",
          badge: "மிகவும் பிரபலம்",
          features: [
            "கணவன் மற்றும் மனைவி (2 பெயர்கள்) கூட்டு சங்கல்பம்",
            "தம்பதியர் மகிழ்ச்சி மற்றும் இல்ல அமைதிக்கான அர்ச்சனை",
            "முழு சங்கல்ப வீடியோ பதிவு",
            "புனித ரக்ஷா சூத்திரம் மற்றும் பிரசாதம்",
          ],
        };
      }
      return {
        title: "குடும்ப சங்கல்பம்",
        desc: "முழுக் குடும்பம் (5 நபர்கள் வரை) பெயர்-கோத்ர மகா பூஜை",
        badge: "சிறந்த மதிப்பு",
        features: [
          "குடும்பத்தின் 5 உறுப்பினர்கள் வரை பெயர் சங்கல்பம்",
          "குல சுத்தி மற்றும் சர்வ மங்கள பிரார்த்தனை",
          "முழு பூஜையின் HD வீடியோ பதிவு",
          "சிறப்பு மகாபிரசாதம் மற்றும் ருத்ராட்ச பெட்டி",
        ],
      };
    }

    // Default English
    if (id === "single") {
      return {
        title: "Single Devotee",
        desc: "Personal name & gotra Vedic sankalp",
        badge: "Personal",
        features: [
          "1 Devotee Name & Gotra Sankalp",
          "Personalised Vedic Chanting by Purohit",
          "Pooja HD Video Clip on WhatsApp",
          "Digital Receipt & Blessed Prasad",
        ],
      };
    }
    if (id === "couple") {
      return {
        title: "Couple / Dampati",
        desc: "Husband & wife joint name and gotra sankalp",
        badge: "Most Popular",
        features: [
          "Husband & Wife (2 Names) Joint Sankalp",
          "Prayers for Marital Bliss & Harmony",
          "Complete Sankalp Video Recording",
          "Consecrated Raksha Sutra & Prasad",
        ],
      };
    }
    return {
      title: "Family / Kul Sankalp",
      desc: "Complete family (up to 5 members) name-gotra maha pooja",
      badge: "Best Value",
      features: [
        "Up to 5 Family Member Names in Sankalp",
        "Kul Shuddhi & Universal Family Wellbeing",
        "Full HD Ritual Video Recording",
        "Special Mahaprasad & Blessed Rudraksha Box",
      ],
    };
  };

  const perSankalpText =
    locale === "hi"
      ? "प्रति संकल्प"
      : locale === "te"
      ? "ప్రతి సంకల్పానికి"
      : locale === "ta"
      ? "ஒரு சங்கல்பத்திற்கு"
      : "Per Sankalp";

  const selectedText =
    locale === "hi"
      ? "✓ चयनित"
      : locale === "te"
      ? "✓ ఎంచుకోబడింది"
      : locale === "ta"
      ? "✓ தேர்ந்தெடுக்கப்பட்டது"
      : "✓ Selected";

  const selectPkgText =
    locale === "hi"
      ? "पैकेज चुनें"
      : locale === "te"
      ? "ప్యాకేజీని ఎంచుకోండి"
      : locale === "ta"
      ? "தொகுப்பைத் தேர்ந்தெடுக்கவும்"
      : "Select Package";

  return (
    <div className="rounded-3xl border border-saffron-100 bg-white p-5 sm:p-7 shadow-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-saffron-700">
            <Sparkles className="h-3 w-3" /> {t("booking.packages.eyebrow")}
          </span>
          <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
            {t("booking.packages.title")}
          </h2>
        </div>
        <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-semibold text-saffron-800 border border-saffron-200">
          {t("booking.packages.available")}
        </span>
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        {POOJA_PACKAGES.map((pkg) => {
          const isSelected = selectedTier === pkg.id;
          const pkgPrice = calculatePackagePrice(basePrice, pkg.id);
          const locPkg = getLocalizedPackage(pkg.id);

          return (
            <div
              key={pkg.id}
              onClick={() => onSelectTier(pkg.id)}
              className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200 ${
                isSelected
                  ? "border-saffron-500 bg-gradient-to-b from-saffron-50/80 to-white shadow-md ring-2 ring-saffron-400 ring-offset-1"
                  : "border-saffron-100 bg-cream/40 hover:border-saffron-300 hover:bg-white hover:shadow-sm"
              }`}
            >
              {locPkg.badge && (
                <span
                  className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-xs ${
                    pkg.id === "couple"
                      ? "bg-gradient-to-r from-saffron-500 to-amber-600 text-white"
                      : pkg.id === "family"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
                      : "bg-saffron-100 text-saffron-900 border border-saffron-200"
                  }`}
                >
                  {locPkg.badge}
                </span>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                      isSelected
                        ? "bg-saffron-500 text-white shadow-xs"
                        : "bg-white text-saffron-700 border border-saffron-200"
                    }`}
                  >
                    {getIcon(pkg.id)}
                  </div>

                  <div className="text-right">
                    <span className="font-display text-xl font-extrabold text-saffron-900">
                      {formatINR(pkgPrice)}
                    </span>
                    <span className="block text-[10px] text-ink-soft">
                      {perSankalpText}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <h3 className="font-display text-base font-bold text-ink">
                    {locPkg.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                    {locPkg.desc}
                  </p>
                </div>

                <div className="mt-3.5 space-y-1.5 border-t border-dashed border-saffron-100 pt-3">
                  {locPkg.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-1.5 text-[11px] text-ink-soft leading-tight"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2">
                <div
                  className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-saffron-500 text-white shadow-xs"
                      : "bg-white border border-saffron-200 text-saffron-800 hover:bg-saffron-50"
                  }`}
                >
                  {isSelected ? selectedText : selectPkgText}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
