"use client";

import { Check, Edit3, Lock, ShieldCheck, Sparkles, Video } from "lucide-react";
import { getLocalizedPoojaTitle, type Pooja } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { BookingAddonItem } from "@/lib/storage";
import type { BookingFormData, PackageTier } from "../types/booking.types";
import { formatBookingDate } from "../services/bookingService";

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
  addonTotal,
  form,
  date,
  time,
  formError,
  onProceed,
  onEditStep,
}: BookingSummarySectionProps) {
  const { locale, t } = useI18n();

  const getTierLabel = () => {
    if (locale === "hi") {
      return selectedTier === "single"
        ? "एकल संकल्प"
        : selectedTier === "couple"
        ? "दंपति संकल्प"
        : "परिवार / कुल संकल्प";
    }
    if (locale === "te") {
      return selectedTier === "single"
        ? "ఏక సంకల్పం (ఒక్కరు)"
        : selectedTier === "couple"
        ? "దంపతుల సంకల్పం"
        : "కుటుంబ సంకల్పం";
    }
    if (locale === "ta") {
      return selectedTier === "single"
        ? "தனிநபர் சங்கல்பம்"
        : selectedTier === "couple"
        ? "தம்பதியர் சங்கல்பம்"
        : "குடும்ப சங்கல்பம்";
    }
    return selectedTier === "single"
      ? "Single Devotee"
      : selectedTier === "couple"
      ? "Couple / Dampati"
      : "Family / Kul Sankalp";
  };

  const tierLabel = getTierLabel();
  const poojaTitle = selectedPooja
    ? getLocalizedPoojaTitle(selectedPooja, locale)
    : t("booking.modalTitle");

  const totalIncludesNote =
    locale === "hi"
      ? "सभी पूजन सामग्री, आचार्य दक्षिणा एवं कर सम्मिलित"
      : locale === "te"
      ? "అన్ని పూజా సామాగ్రి, పండిత దక్షిణ మరియు పన్నులు కలిపి"
      : locale === "ta"
      ? "அனைத்து பூஜை பொருட்கள், பண்டித தட்சிணை மற்றும் வரிகள் உட்பட"
      : "Includes all ritual samagri, purohit dakshina & tax";

  const trustBadges = [
    {
      icon: <Video className="h-5 w-5" />,
      bg: "bg-amber-50 text-amber-700",
      title:
        locale === "hi"
          ? "व्हाट्सऐप वीडियो प्रमाण"
          : locale === "te"
          ? "వాట్సాప్ వీడియో రుజువు"
          : locale === "ta"
          ? "வாட்ஸ்அப் வீடியோ பதிவு"
          : "WhatsApp Video Proof",
      desc:
        locale === "hi"
          ? "संकल्प एवं पूजा का वीडियो 48-72 घंटों में आपके व्हाट्सऐप पर भेजा जाएगा।"
          : locale === "te"
          ? "పూజ & సంకల్ప వీడియో 48-72 గంటల్లో మీ వాట్సాప్‌కు పంపబడుతుంది."
          : locale === "ta"
          ? "பூஜை மற்றும் சங்கல்ப வீடியோ 48-72 மணிநேரத்தில் வாட்ஸ்அப்பில் அனுப்பப்படும்."
          : "Puja & sankalp video will be sent to your WhatsApp within 48-72 hours.",
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      bg: "bg-saffron-50 text-saffron-700",
      title:
        locale === "hi"
          ? "प्रमाणित तीर्थ आचार्य"
          : locale === "te"
          ? "సర్టిఫైడ్ వేద పండితులు"
          : locale === "ta"
          ? "சான்றளிக்கப்பட்ட வேத பண்டிதர்கள்"
          : "Certified Vedic Purohits",
      desc:
        locale === "hi"
          ? "शास्त्रोक्त विधि से योग्य एवं अनुभवी आचार्यों द्वारा अनुष्ठान।"
          : locale === "te"
          ? "శాస్త్రోక్తంగా అర్హత కలిగిన అనుభవజ్ఞులైన పండితులచే పూజలు."
          : locale === "ta"
          ? "சாஸ்திர முறைப்படி தகுதி வாய்ந்த பண்டிதர்களால் செய்யப்படும் பூஜைகள்."
          : "Rituals conducted by experienced Vedic Purohits adhering to Shastras.",
    },
    {
      icon: <Check className="h-5 w-5" />,
      bg: "bg-emerald-50 text-emerald-700",
      title:
        locale === "hi"
          ? "अभिमंत्रित प्रसाद"
          : locale === "te"
          ? "పవిత్ర ప్రసాదం"
          : locale === "ta"
          ? "புனித பிரசாதம்"
          : "Sanctified Prasad",
      desc:
        locale === "hi"
          ? "अभिमंत्रित प्रसाद एवं रक्षा सूत्र आपके दिए गए पते पर भेजा जाएगा।"
          : locale === "te"
          ? "పవిత్ర ప్రసాదం మరియు రక్షా సూత్రం మీ చిరునామాకు పంపబడుతుంది."
          : locale === "ta"
          ? "புனித பிரசாதம் மற்றும் ரக்ஷா சூத்திரம் உங்கள் முகவரிக்கு அனுப்பப்படும்."
          : "Consecrated prasad and raksha sutra dispatched to your address.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-saffron-100 bg-white p-5 sm:p-8 shadow-card">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100 pb-4">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-saffron-700">
              <Sparkles className="h-3 w-3" /> {t("booking.summary.eyebrow")}
            </span>
            <h2 className="font-display text-lg sm:text-2xl font-bold text-ink">
              {t("booking.summary.title")}
            </h2>
          </div>
          <span className="text-3xl">🪔</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Order Itemized Summary */}
          <div className="rounded-2xl border border-saffron-200 bg-cream/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-saffron-200 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  {poojaTitle}
                </h3>
                <span className="text-xs font-semibold text-saffron-800">
                  {tierLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:text-saffron-900"
              >
                <Edit3 className="h-3 w-3" /> {t("booking.summary.edit")}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-ink-soft">
                <span>{t("booking.summary.muhuratDate")}:</span>
                <span className="font-bold text-ink">
                  {date ? formatBookingDate(date) : "Today / Auspicious"} {time ? `• ${time}` : ""}
                </span>
              </div>

              <div className="flex items-center justify-between text-ink-soft">
                <span>{t("booking.summary.packageDakshina")}:</span>
                <span className="font-bold text-ink">{formatINR(packagePrice)}</span>
              </div>

              {addonItems.length > 0 && (
                <div className="border-t border-dashed border-saffron-200 pt-2 space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-saffron-900">
                    <span>{t("booking.summary.chadhavaDakshina")} ({addonItems.reduce((acc, a) => acc + a.quantity, 0)}):</span>
                    <span>+{formatINR(addonTotal)}</span>
                  </div>
                  {addonItems.map((a) => (
                    <div key={a.id} className="flex justify-between text-ink-soft pl-2">
                      <span>{a.name} × {a.quantity}</span>
                      <span className="font-medium text-ink">{formatINR(a.price * a.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between border-t border-saffron-300 pt-3 text-sm font-bold text-ink">
                <div>
                  <span className="block text-base font-display">{t("booking.summary.totalDakshina")}</span>
                  <span className="block text-[10px] font-normal text-ink-soft">
                    {totalIncludesNote}
                  </span>
                </div>
                <span className="font-display text-2xl font-extrabold text-saffron-900">
                  {formatINR(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Devotee Sankalp Summary */}
          <div className="rounded-2xl border border-saffron-200 bg-cream/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-saffron-200 pb-3">
              <h3 className="font-display text-base font-bold text-ink flex items-center gap-1.5">
                <span>🕉️</span> {t("booking.summary.devoteeDetailsTitle")}
              </h3>
              <button
                type="button"
                onClick={() => onEditStep(2)}
                className="inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:text-saffron-900"
              >
                <Edit3 className="h-3 w-3" /> {t("booking.summary.edit")}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-soft">{t("booking.devotee.primaryName")}:</span>
                <span className="font-bold text-ink">{form.name || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-ink-soft">{t("booking.devotee.gotra")}:</span>
                <span className="font-bold text-ink">{form.gotra || "Kashyap"}</span>
              </div>

              {selectedTier === "couple" && form.partnerName && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">{t("booking.devotee.partnerName")}:</span>
                  <span className="font-bold text-ink">{form.partnerName}</span>
                </div>
              )}

              {selectedTier === "family" && form.familyMembers.length > 0 && (
                <div className="space-y-1">
                  <span className="text-ink-soft">{t("booking.devotee.familyMembers")}:</span>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {form.familyMembers.map((m, i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-white border border-saffron-200 px-2 py-0.5 text-[11px] font-semibold text-ink"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t border-saffron-200/80 pt-2">
                <span className="text-ink-soft">{t("booking.devotee.phone")}:</span>
                <span className="font-bold text-ink">{form.phone || "—"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-ink-soft">{t("booking.devotee.city")}:</span>
                <span className="font-bold text-ink">{form.city || "—"}</span>
              </div>

              {form.reason && (
                <div className="border-t border-saffron-200/80 pt-2">
                  <span className="text-ink-soft block mb-0.5">{t("booking.devotee.sankalpReason")}:</span>
                  <p className="font-medium text-ink bg-white/80 p-2 rounded-lg border border-saffron-100 text-[11px]">
                    "{form.reason}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {formError && (
          <div className="mt-5 rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-600 border border-red-200">
            ⚠️ {formError}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-saffron-100 pt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{t("checkout.secureNote")}</span>
          </div>

          <button
            type="button"
            onClick={onProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 via-amber-500 to-saffron-600 px-8 py-3.5 text-base font-extrabold text-white shadow-lg shadow-saffron-500/25 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Lock className="h-4 w-4" />
            <span>{t("booking.sticky.payDakshina")} ({formatINR(total)})</span>
          </button>
        </div>
      </div>

      {/* Trust & Reassurance Badges */}
      <div className="grid gap-3.5 sm:grid-cols-3">
        {trustBadges.map((badge, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-saffron-100 bg-white p-4 shadow-xs">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${badge.bg}`}>
              {badge.icon}
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink">{badge.title}</h4>
              <p className="mt-0.5 text-[11px] text-ink-soft leading-tight">
                {badge.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
