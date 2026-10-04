"use client";

import { Heart, Plus, Trash2, Users } from "lucide-react";
import { type Pooja } from "@/lib/data";
import { useI18n } from "@/components/providers";
import type { BookingFormData } from "../types/booking.types";

const inputCls =
  "w-full rounded-xl border border-saffron-200 bg-cream/30 px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/50 focus:border-saffron-500 focus:bg-white focus:ring-1 focus:ring-saffron-200";

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
  phoneValid,
}: BookingDevoteeDetailsProps) {
  const { locale } = useI18n();

  const handleSelectDefaultGotra = () => {
    const defaultGotra =
      locale === "hi"
        ? "काश्यप"
        : locale === "te"
        ? "కాశ్యప"
        : locale === "ta"
        ? "காஷ்யப"
        : "Kashyap";
    onFormChange((prev) => ({ ...prev, gotra: defaultGotra }));
  };

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

  const reasons = [
    {
      id: "peace",
      label:
        locale === "hi"
          ? "सुख व शांति"
          : locale === "te"
          ? "శాంతి & శ్రేయస్సు"
          : locale === "ta"
          ? "அமைதி & வளம்"
          : "Peace & Harmony",
      text: "Family peace, harmony and universal wellbeing",
    },
    {
      id: "health",
      label:
        locale === "hi"
          ? "उत्तम स्वास्थ्य"
          : locale === "te"
          ? "ఆరోగ్యం"
          : locale === "ta"
          ? "நல்வாழ்வு"
          : "Good Health",
      text: "Good health, recovery and longevity for family",
    },
    {
      id: "career",
      label:
        locale === "hi"
          ? "कार्य सिद्धि"
          : locale === "te"
          ? "కార్య సిద్ధి"
          : locale === "ta"
          ? "காரிய சித்தி"
          : "Career & Growth",
      text: "Career growth, success in business and removal of obstacles",
    },
    {
      id: "ancestor",
      label:
        locale === "hi"
          ? "पितृ शांति"
          : locale === "te"
          ? "పితృ శాంతి"
          : locale === "ta"
          ? "பித்ரு சாந்தி"
          : "Ancestral Peace",
      text: "Ancestral peace and blessings",
    },
  ];

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-4 sm:p-5 shadow-xs space-y-4">
      <div className="border-b border-saffron-100 pb-2.5">
        <h3 className="text-sm font-bold text-ink">
          {locale === "hi"
            ? "यजमान संकल्प विवरण"
            : locale === "te"
            ? "భక్తుల సంకల్ప వివరాలు"
            : locale === "ta"
            ? "பக்தர் சங்கல்ப விவரங்கள்"
            : "Devotee Details for Sankalp"}
        </h3>
        <p className="text-[11px] text-ink-soft">
          {locale === "hi"
            ? "पूजा के संकल्प के समय पंडित जी द्वारा यह नाम व गोत्र उच्चारित किया जाएगा।"
            : "Purohit ji will chant these details during the Vedic sankalp."}
        </p>
      </div>

      {/* Row 1: Name and Gotra */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            {locale === "hi" ? "यजमान का नाम" : "Devotee Full Name"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Aarav Sharma"
            className={inputCls}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-ink">
              {locale === "hi" ? "गोत्र" : "Gotra"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleSelectDefaultGotra}
              className="text-[10px] font-bold text-saffron-700 hover:underline"
            >
              {locale === "hi" ? "गोत्र ज्ञात नहीं? (काश्यप)" : "Unknown? Use Kashyap"}
            </button>
          </div>
          <input
            type="text"
            required
            value={form.gotra}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, gotra: e.target.value }))
            }
            placeholder="e.g. Kashyap / Bhardwaj"
            className={inputCls}
          />
        </div>
      </div>

      {/* Couple Partner input if tier is couple */}
      {form.packageTier === "couple" && (
        <div className="rounded-xl border border-saffron-200 bg-saffron-50/40 p-3">
          <label className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <span>
              {locale === "hi" ? "जीवनसाथी का नाम" : "Spouse / Partner Name"}{" "}
              <span className="text-red-500">*</span>
            </span>
          </label>
          <input
            type="text"
            value={form.partnerName || ""}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, partnerName: e.target.value }))
            }
            placeholder="e.g. Priya Sharma"
            className={inputCls}
          />
        </div>
      )}

      {/* Family members dynamic inputs if tier is family */}
      {form.packageTier === "family" && (
        <div className="rounded-xl border border-saffron-200 bg-saffron-50/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Users className="h-3.5 w-3.5 text-saffron-700" />
              <span>
                {locale === "hi" ? "परिवार के सदस्य (अधिकतम 5)" : "Family Member Names (Up to 5)"}
              </span>
            </label>
            <span className="text-[10px] text-ink-soft font-semibold">
              {form.familyMembers.length}/5
            </span>
          </div>

          <div className="space-y-1.5">
            {form.familyMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-saffron-100 text-xs font-bold text-saffron-800">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={member}
                  onChange={(e) => handleUpdateFamilyMember(idx, e.target.value)}
                  placeholder={`Member #${idx + 1}`}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFamilyMember(idx)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  aria-label="Remove member"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {form.familyMembers.length < 5 && (
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:text-saffron-900"
              >
                <Plus className="h-3 w-3" />
                <span>Add Another Name</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row 2: Phone & City */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            {locale === "hi" ? "मोबाइल नंबर (व्हाट्सऐप)" : "WhatsApp Mobile Number"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="10-digit number"
            className={`${inputCls} ${
              form.phone && !phoneValid ? "border-red-300 ring-1 ring-red-200" : ""
            }`}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            {locale === "hi" ? "शहर / स्थान" : "City / Town"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.city}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, city: e.target.value }))
            }
            placeholder="e.g. Varanasi, Delhi, Mumbai"
            className={inputCls}
          />
        </div>
      </div>

      {/* Row 3: Sankalp Wish (Compact) */}
      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          {locale === "hi" ? "विशेष मनोकामना / संकल्प (वैकल्पिक)" : "Sankalp Intention / Wish (Optional)"}
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {reasons.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onFormChange((prev) => ({ ...prev, reason: r.text }))}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                form.reason === r.text
                  ? "border-saffron-500 bg-saffron-500 text-white"
                  : "border-saffron-200 bg-white text-ink hover:bg-saffron-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={form.reason}
          onChange={(e) =>
            onFormChange((prev) => ({ ...prev, reason: e.target.value }))
          }
          placeholder="e.g. Family peace, health, and prosperity"
          className={inputCls}
        />
      </div>
    </div>
  );
}
