"use client";

import { CalendarDays, Heart, Home, Plus, Sparkles, Trash2, User, Users } from "lucide-react";
import { activePoojas, getLocalizedPoojaTitle, type Pooja } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { BookingFormData } from "../types/booking.types";
import { formatBookingDate } from "../services/bookingService";

const inputCls =
  "w-full rounded-xl border border-saffron-200 bg-cream/50 px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/50 focus:border-saffron-500 focus:bg-white focus:ring-2 focus:ring-saffron-200";

interface BookingDevoteeDetailsProps {
  form: BookingFormData;
  onFormChange: React.Dispatch<React.SetStateAction<BookingFormData>>;
  prayerSlug: string;
  onPrayerSlugChange: (slug: string) => void;
  catalogPoojas: Pooja[];
  fromEvent: boolean;
  date: string;
  initialTime?: string | null;
  phoneValid: boolean;
}

export default function BookingDevoteeDetails({
  form,
  onFormChange,
  prayerSlug,
  onPrayerSlugChange,
  catalogPoojas,
  fromEvent,
  date,
  initialTime,
  phoneValid,
}: BookingDevoteeDetailsProps) {
  const { locale, t } = useI18n();

  const getSankalpReasons = () => {
    if (locale === "hi") {
      return [
        { id: "peace", label: "🕊️ पितृ शांति एवं मोक्ष", text: "पितरों की शांति, पिंडदान एवं पारिवारिक आशीर्वाद हेतु" },
        { id: "prosperity", label: "🏡 सुख, शांति एवं समृद्धि", text: "पारिवारिक सुख-शांति, सौहार्द एवं आर्थिक समृद्धि हेतु" },
        { id: "health", label: "🌿 उत्तम स्वास्थ्य एवं दीर्घायु", text: "उत्तम स्वास्थ्य, रोग मुक्ति एवं परिवार की दीर्घायु हेतु" },
        { id: "career", label: "💼 व्यापार एवं कार्य सिद्धि", text: "व्यापार में सफलता, आजीविका वृद्धि एवं विघ्न निवारण हेतु" },
        { id: "marriage", label: "💍 शीघ्र विवाह एवं वैवाहिक सुख", text: "शीघ्र विवाह, उत्तम जीवनसाथी एवं दांपत्य सुख हेतु" },
        { id: "protection", label: "🛡️ नजर दोष एवं संकट निवारण", text: "नकारात्मक ऊर्जा, ग्रह दोष एवं संकटों से रक्षा हेतु" },
      ];
    }
    if (locale === "te") {
      return [
        { id: "peace", label: "🕊️ పితృ శాంతి & మోక్షం", text: "పితృ దేవతల శాంతి, పిండ ప్రదానం మరియు కుటుంబ ఆశీర్వాదం కోసం" },
        { id: "prosperity", label: "🏡 సుఖం, శాంతి & శ్రేయస్సు", text: "కుటుంబంలో సామరస్యం, శాంతి మరియు ఆర్థిక శ్రేయస్సు కోసం" },
        { id: "health", label: "🌿 ఆరోగ్యం & దీర్ఘాయుష్షు", text: "మంచి ఆరోగ్యం, వ్యాధుల నివారణ మరియు దీర్ఘాయుష్షు కోసం" },
        { id: "career", label: "💼 వ్యాపారం & కార్య సిద్ధి", text: "వ్యాపార అభివృద్ధి, కెరీర్ విజయం మరియు ఆటంకాల నివారణ కోసం" },
        { id: "marriage", label: "💍 వివాహం & దాంపత్య సుఖం", text: "త్వరిత వివాహం మరియు వైవాహిక ఆనందం కోసం" },
        { id: "protection", label: "🛡️ గ్రహ దోష నివారణ", text: "నకారాత్మక శక్తులు మరియు గ్రహ దోషాల నుండి రక్షణ కోసం" },
      ];
    }
    if (locale === "ta") {
      return [
        { id: "peace", label: "🕊️ பித்ரு சாந்தி & மோட்சம்", text: "முன்னோர்களின் சாந்தி, பிண்ட தானம் மற்றும் குடும்ப ஆசீர்வாதம்" },
        { id: "prosperity", label: "🏡 மகிழ்ச்சி, அமைதி & வளம்", text: "குடும்ப ஒற்றுமை, அமைதி மற்றும் பொருளாதார வளம்" },
        { id: "health", label: "🌿 நல்வாழ்வு & நீண்ட ஆயுள்", text: "நல்ல ஆரோக்கியம், நோய் நிவாரணம் மற்றும் நீண்ட ஆயுள்" },
        { id: "career", label: "💼 தொழில் & காரிய சித்தி", text: "தொழில் வெற்றி, வேலைவாய்ப்பு மற்றும் தடைகள் நீங்குதல்" },
        { id: "marriage", label: "💍 திருமண வரம் & குடும்ப ஒற்றுமை", text: "விரைவான திருமணம் மற்றும் தம்பதியர் மகிழ்ச்சி" },
        { id: "protection", label: "🛡️ கிரக தோஷ நிவர்த்தி", text: "எதிர்மறை ஆற்றல்கள் மற்றும் கிரக தோஷங்களிலிருந்து பாதுகாப்பு" },
      ];
    }
    return [
      { id: "peace", label: "🕊️ Ancestral Peace & Moksha", text: "Ancestral peace, Pind Daan and family blessings" },
      { id: "prosperity", label: "🏡 Family Harmony & Wealth", text: "Family harmony, peace and financial prosperity" },
      { id: "health", label: "🌿 Good Health & Longevity", text: "Good health, recovery and longevity for family" },
      { id: "career", label: "💼 Business & Career Success", text: "Career growth, success in business and removal of obstacles" },
      { id: "marriage", label: "💍 Marital Bliss & Harmony", text: "Marital bliss, auspicious match and relationship harmony" },
      { id: "protection", label: "🛡️ Planetary Protection", text: "Protection from negative energies and planetary obstacles" },
    ];
  };

  const sankalpReasons = getSankalpReasons();

  const handleAddFamilyMember = () => {
    if (form.familyMembers.length >= 5) return;
    onFormChange((prev) => ({
      ...prev,
      familyMembers: [...prev.familyMembers, ""],
    }));
  };

  const handleUpdateFamilyMember = (index: number, val: string) => {
    onFormChange((prev) => {
      const updated = [...prev.familyMembers];
      updated[index] = val;
      return { ...prev, familyMembers: updated };
    });
  };

  const handleRemoveFamilyMember = (index: number) => {
    onFormChange((prev) => {
      const updated = prev.familyMembers.filter((_, i) => i !== index);
      return { ...prev, familyMembers: updated };
    });
  };

  const handleSelectDefaultGotra = () => {
    const defaultGotraName =
      locale === "hi"
        ? "काश्यप"
        : locale === "te"
        ? "కాశ్యప"
        : locale === "ta"
        ? "காஷ்யப"
        : "Kashyap";

    onFormChange((prev) => ({
      ...prev,
      gotra: defaultGotraName,
    }));
  };

  const handleSelectReason = (reasonText: string) => {
    onFormChange((prev) => ({
      ...prev,
      reason: reasonText,
    }));
  };

  const selectedPoojaLabel =
    locale === "hi"
      ? "चयनित पवित्र पूजा"
      : locale === "te"
      ? "ఎంచుకున్న పవిత్ర పూజ"
      : locale === "ta"
      ? "தேர்ந்தெடுக்கப்பட்ட புனித பூஜை"
      : "Selected Sacred Pooja";

  const primaryDevoteeSectionLabel =
    locale === "hi"
      ? "मुख्य यजमान विवरण"
      : locale === "te"
      ? "ముఖ్య యజమాని వివరాలు"
      : locale === "ta"
      ? "முதன்மை பக்தர் விவரங்கள்"
      : "Primary Devotee Details";

  const partnerSectionLabel =
    locale === "hi"
      ? "जीवनसाथी का नाम"
      : locale === "te"
      ? "జీవిత భాగస్వామి పేరు"
      : locale === "ta"
      ? "வாழ்க்கைத் துணையின் பெயர்"
      : "Partner / Spouse Name";

  const familySectionLabel =
    locale === "hi"
      ? "परिवार के अन्य सदस्य (अधिकतम 5)"
      : locale === "te"
      ? "కుటుంబంలోని ఇతర సభ్యులు (గరిష్టంగా 5)"
      : locale === "ta"
      ? "குடும்ப உறுப்பினர்கள் (அதிகபட்சம் 5)"
      : "Family Members (Up to 5 Names)";

  const contactSectionLabel =
    locale === "hi"
      ? "संपर्क एवं प्रसाद वितरण विवरण"
      : locale === "te"
      ? "సంప్రదింపు మరియు ప్రసాద డెలివరీ వివరాలు"
      : locale === "ta"
      ? "தொடர்பு மற்றும் பிரசாத முகவரி விவரங்கள்"
      : "Contact & Prasad Delivery Details";

  const emailNote =
    locale === "hi"
      ? "डिजिटल रसीद एवं लॉगिन क्रेडेंशियल हेतु"
      : locale === "te"
      ? "డిజిటల్ రసీదు మరియు లాగిన్ వివరాల కోసం"
      : locale === "ta"
      ? "டிஜிட்டல் ரசீது மற்றும் உள்நுழைவு விவரங்களுக்கு"
      : "For digital receipt and login credentials";

  return (
    <div className="rounded-3xl border border-saffron-100 bg-white p-5 sm:p-8 shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-saffron-700">
            <Sparkles className="h-3 w-3" /> {t("booking.devotee.eyebrow")}
          </span>
          <h2 className="font-display text-lg sm:text-2xl font-bold text-ink">
            {t("booking.devotee.title")}
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            {t("booking.devotee.subtitle")}
          </p>
        </div>
        <span className="text-3xl">🕉️</span>
      </div>

      <div className="space-y-5">
        {/* Pooja Selected Bar */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            {selectedPoojaLabel}
          </label>
          <select
            value={prayerSlug}
            onChange={(e) => onPrayerSlugChange(e.target.value)}
            disabled={fromEvent}
            className={inputCls}
          >
            {activePoojas(catalogPoojas).map((p) => (
              <option key={p.slug} value={p.slug}>
                {getLocalizedPoojaTitle(p, locale)} — {formatINR(p.price)}
              </option>
            ))}
          </select>
        </div>

        {fromEvent && date && (
          <div className="rounded-2xl bg-saffron-50/80 border border-saffron-200 p-3.5 flex items-center gap-2.5 text-xs text-saffron-900 font-semibold">
            <CalendarDays className="h-4 w-4 shrink-0 text-saffron-600" />
            <span>
              {t("booking.summary.muhuratDate")}: {formatBookingDate(date)} {initialTime ? `• ${initialTime}` : ""}
            </span>
          </div>
        )}

        {/* Primary Devotee Details */}
        <div className="rounded-2xl border border-saffron-100 bg-cream/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-900 border-b border-saffron-100 pb-2">
            <User className="h-4 w-4 text-saffron-600" />
            <span>{primaryDevoteeSectionLabel}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t("booking.devotee.primaryName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder={t("booking.devotee.primaryNamePlaceholder")}
                className={inputCls}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink">
                  {t("booking.devotee.gotra")} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleSelectDefaultGotra}
                  className="text-[11px] font-bold text-saffron-700 hover:text-saffron-900 underline transition-colors"
                >
                  {t("booking.devotee.kashyapHelper")}
                </button>
              </div>
              <input
                type="text"
                required
                value={form.gotra}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    gotra: e.target.value,
                  }))
                }
                placeholder={t("booking.devotee.gotraPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Couple Partner Input */}
        {form.packageTier === "couple" && (
          <div className="rounded-2xl border border-saffron-200 bg-gradient-to-b from-saffron-50/50 to-white p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-900 border-b border-saffron-100 pb-2">
              <Heart className="h-4 w-4 text-rose-500" />
              <span>{partnerSectionLabel}</span>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t("booking.devotee.partnerName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.partnerName || ""}
                onChange={(e) =>
                  onFormChange((prev) => ({
                    ...prev,
                    partnerName: e.target.value,
                  }))
                }
                placeholder={t("booking.devotee.partnerNamePlaceholder")}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Family Members Dynamic Inputs */}
        {form.packageTier === "family" && (
          <div className="rounded-2xl border border-saffron-200 bg-gradient-to-b from-saffron-50/50 to-white p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-900">
                <Users className="h-4 w-4 text-saffron-700" />
                <span>{familySectionLabel}</span>
              </div>
              <span className="text-[11px] font-semibold text-ink-soft">
                {form.familyMembers.length}/5 {t("booking.addons.added")}
              </span>
            </div>

            <div className="space-y-2.5">
              {form.familyMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-saffron-100 text-xs font-bold text-saffron-800">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => handleUpdateFamilyMember(index, e.target.value)}
                    placeholder={`${t("booking.devotee.memberPlaceholder")} #${index + 1}`}
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFamilyMember(index)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {form.familyMembers.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-saffron-300 bg-white px-3.5 py-2 text-xs font-bold text-saffron-800 hover:border-saffron-500 hover:bg-saffron-50 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("booking.devotee.addMember")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contact & Prasad Delivery Address */}
        <div className="rounded-2xl border border-saffron-100 bg-cream/30 p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-saffron-900 border-b border-saffron-100 pb-2">
            <Home className="h-4 w-4 text-saffron-600" />
            <span>{contactSectionLabel}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t("booking.devotee.phone")} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder={t("booking.devotee.phonePlaceholder")}
                className={`${inputCls} ${
                  form.phone && !phoneValid
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                    : ""
                }`}
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                {t("booking.devotee.whatsappNote")}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t("common.email")} ({locale === "hi" ? "वैकल्पिक" : locale === "te" ? "ఐచ్ఛికం" : locale === "ta" ? "விருப்பத்தேர்வு" : "Optional"})
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="e.g. devotee@example.com"
                className={inputCls}
              />
              <p className="mt-1 text-[11px] text-ink-soft">
                {emailNote}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t("booking.devotee.city")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder={t("booking.devotee.cityPlaceholder")}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                {t("booking.devotee.address")}
              </label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) =>
                  onFormChange((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder={t("booking.devotee.addressPlaceholder")}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Special Sankalp Wishes / Intention */}
        <div className="rounded-2xl border border-saffron-100 bg-cream/30 p-4 sm:p-5 space-y-3">
          <label className="block text-xs font-bold text-ink">
            {t("booking.devotee.sankalpReason")}
          </label>

          <div className="flex flex-wrap gap-2">
            {sankalpReasons.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectReason(r.text)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                  form.reason === r.text
                    ? "border-saffron-500 bg-saffron-500 text-white shadow-xs"
                    : "border-saffron-200 bg-white text-ink hover:border-saffron-400 hover:bg-saffron-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <textarea
            rows={2}
            value={form.reason}
            onChange={(e) =>
              onFormChange((prev) => ({
                ...prev,
                reason: e.target.value,
              }))
            }
            placeholder={t("booking.devotee.sankalpReasonPlaceholder")}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
