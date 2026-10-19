"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Globe,
  Languages,
  MessageSquareQuote,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import { testimonials as defaultTestimonials, type Testimonial } from "@/lib/data";
import {
  Field,
  ManagerCard,
  ManagerHeader,
  SelectInput,
  TextAreaInput,
  TextInput,
  Toggle,
} from "./manager-ui";

interface TestimonialDraft {
  id: string;
  name: string;
  hindiName: string;
  teluguName: string;
  tamilName: string;
  location: string;
  hindiLocation: string;
  teluguLocation: string;
  tamilLocation: string;
  rating: string;
  text: string;
  hindiText: string;
  teluguText: string;
  tamilText: string;
  avatar: string;
  color: string;
  active: boolean;
}

const emptyDraft: TestimonialDraft = {
  id: "",
  name: "",
  hindiName: "",
  teluguName: "",
  tamilName: "",
  location: "",
  hindiLocation: "",
  teluguLocation: "",
  tamilLocation: "",
  rating: "5",
  text: "",
  hindiText: "",
  teluguText: "",
  tamilText: "",
  avatar: "",
  color: "from-rose-400 to-pink-600",
  active: true,
};

const COLOR_OPTIONS = [
  { label: "Rose & Pink", value: "from-rose-400 to-pink-600" },
  { label: "Saffron & Orange", value: "from-saffron-400 to-orange-600" },
  { label: "Emerald & Teal", value: "from-emerald-400 to-teal-600" },
  { label: "Indigo & Purple", value: "from-indigo-400 to-purple-600" },
  { label: "Amber & Golden", value: "from-amber-400 to-yellow-600" },
];

export default function TestimonialsManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}) {
  const [list, setList] = useState<Testimonial[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<TestimonialDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<"hi" | "te" | "ta">("hi");

  const loadData = async () => {
    try {
      const c = await fetchCatalog();
      if (c.testimonials && Array.isArray(c.testimonials) && c.testimonials.length > 0) {
        setList(c.testimonials);
      } else {
        setList(defaultTestimonials);
      }
    } catch {
      setList(defaultTestimonials);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4500);
  };

  const handleAutoTranslateAll = async () => {
    if (!draft.text.trim()) {
      setError("Please write the devotee's English review text before translating.");
      return;
    }
    setIsTranslating(true);
    setError("");
    try {
      // Translate review text
      const resText = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft.text.trim(), targets: ["hi", "te", "ta"] }),
      });
      const dataText = await resText.json();

      // Translate location if present
      let dataLoc: { ok?: boolean; translations?: Record<string, string> } = {};
      if (draft.location.trim()) {
        const resLoc = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.location.trim(), targets: ["hi", "te", "ta"] }),
        });
        dataLoc = await resLoc.json();
      }

      // Translate name if present
      let dataName: { ok?: boolean; translations?: Record<string, string> } = {};
      if (draft.name.trim()) {
        const resName = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.name.trim(), targets: ["hi", "te", "ta"] }),
        });
        dataName = await resName.json();
      }

      if (dataText.ok && dataText.translations) {
        setDraft((prev) => ({
          ...prev,
          hindiText: dataText.translations.hi || prev.hindiText,
          teluguText: dataText.translations.te || prev.teluguText,
          tamilText: dataText.translations.ta || prev.tamilText,
          hindiLocation: dataLoc.translations?.hi || prev.hindiLocation,
          teluguLocation: dataLoc.translations?.te || prev.teluguLocation,
          tamilLocation: dataLoc.translations?.ta || prev.tamilLocation,
          hindiName: dataName.translations?.hi || prev.hindiName,
          teluguName: dataName.translations?.te || prev.teluguName,
          tamilName: dataName.translations?.ta || prev.tamilName,
        }));
        showNotification("✨ Review, name & location successfully translated to Hindi, Telugu & Tamil!");
      } else {
        setError(dataText.error || "Translation service was unable to complete.");
      }
    } catch (e) {
      console.error("[TestimonialsManager] Auto-translate error:", e);
      setError("Failed to communicate with translation API.");
    } finally {
      setIsTranslating(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      id: `testi-${Date.now()}`,
    });
    setError("");
    setIsAdding(true);
  };

  const openEdit = (item: Testimonial, index: number) => {
    setEditingId(item.id || `testi-${index}`);
    setDraft({
      id: item.id || `testi-${index}`,
      name: item.name || "",
      hindiName: item.hindiName || "",
      teluguName: item.teluguName || "",
      tamilName: item.tamilName || "",
      location: item.location || "",
      hindiLocation: item.hindiLocation || "",
      teluguLocation: item.teluguLocation || "",
      tamilLocation: item.tamilLocation || "",
      rating: String(item.rating || 5),
      text: item.text || "",
      hindiText: item.hindiText || "",
      teluguText: item.teluguText || "",
      tamilText: item.tamilText || "",
      avatar: item.avatar || "",
      color: item.color || COLOR_OPTIONS[0].value,
      active: item.active !== false,
    });
    setError("");
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setError("Devotee name is required.");
      return;
    }
    if (!draft.text.trim()) {
      setError("Devotee review text is required.");
      return;
    }

    const initials =
      draft.avatar.trim() ||
      draft.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");

    const itemToSave: Testimonial = {
      id: draft.id || `testi-${Date.now()}`,
      name: draft.name.trim(),
      hindiName: draft.hindiName.trim() || undefined,
      teluguName: draft.teluguName.trim() || undefined,
      tamilName: draft.tamilName.trim() || undefined,
      location: draft.location.trim(),
      hindiLocation: draft.hindiLocation.trim() || undefined,
      teluguLocation: draft.teluguLocation.trim() || undefined,
      tamilLocation: draft.tamilLocation.trim() || undefined,
      rating: Number(draft.rating) || 5,
      text: draft.text.trim(),
      hindiText: draft.hindiText.trim() || undefined,
      teluguText: draft.teluguText.trim() || undefined,
      tamilText: draft.tamilText.trim() || undefined,
      avatar: initials,
      color: draft.color || COLOR_OPTIONS[0].value,
      active: draft.active,
    };

    let nextList: Testimonial[];
    if (editingId) {
      nextList = list.map((item, idx) =>
        (item.id || `testi-${idx}`) === editingId ? itemToSave : item
      );
    } else {
      nextList = [itemToSave, ...list];
    }

    const res = await saveCatalogSection("testimonials", nextList, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error || "Could not save review.");
      return;
    }

    setList(nextList);
    setIsAdding(false);
    setEditingId(null);
    setDraft(emptyDraft);
    showNotification("✨ Devotee review saved successfully!");
    if (onRefresh) onRefresh();
  };

  const handleDelete = async (id: string, idx: number) => {
    if (!confirm("Are you sure you want to delete this devotee review?")) return;
    const nextList = list.filter((item, i) => (item.id || `testi-${i}`) !== id);
    const res = await saveCatalogSection("testimonials", nextList, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      alert(res.error || "Failed to delete review.");
      return;
    }
    setList(nextList);
    showNotification("Review removed.");
    if (onRefresh) onRefresh();
  };

  const handleToggleActive = async (item: Testimonial, idx: number) => {
    const targetId = item.id || `testi-${idx}`;
    const nextList = list.map((t, i) =>
      (t.id || `testi-${i}`) === targetId ? { ...t, active: t.active === false } : t
    );
    const res = await saveCatalogSection("testimonials", nextList, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      alert(res.error || "Failed to update review status.");
      return;
    }
    setList(nextList);
    if (onRefresh) onRefresh();
  };

  const handleResetToDefaults = async () => {
    if (!confirm("Reset all devotee reviews to default seed reviews?")) return;
    const res = await resetCatalogSection("testimonials", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      alert(res.error || "Could not reset reviews.");
      return;
    }
    setList(defaultTestimonials);
    showNotification("Reset to default devotee reviews.");
    if (onRefresh) onRefresh();
  };

  const activeCount = list.filter((item) => item.active !== false).length;
  const translatedCount = list.filter((item) => item.hindiText && item.hindiText.trim()).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <ManagerHeader
        title="Devotee Reviews & Feedback"
        subtitle="Manage devotional reviews, testimonials, and authentic feedback shown across the home page with full multi-language AI translation support."
        count={list.length}
        onAdd={openAdd}
        onReset={handleResetToDefaults}
        addLabel="Add Devotee Review"
      />

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Overview Stats Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Total Reviews</p>
          <p className="mt-1 text-2xl font-display font-extrabold text-ink">{list.length}</p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Active Reviews</p>
          <p className="mt-1 text-2xl font-display font-extrabold text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Average Rating</p>
          <p className="mt-1 text-2xl font-display font-extrabold text-amber-500 flex items-center gap-1">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            5.0
          </p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-xs">
          <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">AI Translated (HI)</p>
          <p className="mt-1 text-2xl font-display font-extrabold text-saffron-600">
            {translatedCount}/{list.length}
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((item, idx) => {
          const id = item.id || `testi-${idx}`;
          const isAct = item.active !== false;
          const hasHindi = Boolean(item.hindiText?.trim());
          const hasTelugu = Boolean(item.teluguText?.trim());
          const hasTamil = Boolean(item.tamilText?.trim());

          return (
            <ManagerCard key={id} active={isAct}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${
                      item.color || "from-saffron-400 to-orange-600"
                    } text-sm font-black text-white shadow-soft`}
                  >
                    {item.avatar || "🙏"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                      <span>{item.name}</span>
                      {!isAct && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          Inactive
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-ink-soft">{item.location || "India"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(item, idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-soft hover:bg-saffron-50 hover:text-saffron-700 transition-colors"
                    title="Edit review & translations"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(id, idx)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-ink-soft hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mt-2.5 flex items-center gap-1 text-amber-400">
                {Array.from({ length: item.rating || 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                ))}
              </div>

              {/* English Review Quote */}
              <p className="mt-2 text-xs leading-relaxed text-ink line-clamp-3 italic">
                &ldquo;{item.text}&rdquo;
              </p>

              {/* Hindi Snippet if available */}
              {item.hindiText && (
                <div className="mt-2 rounded-xl border border-saffron-100 bg-saffron-50/50 p-2 text-[11px] text-ink-soft line-clamp-2">
                  <span className="font-bold text-saffron-700 mr-1.5">हिन्दी:</span>
                  &ldquo;{item.hindiText}&rdquo;
                </div>
              )}

              {/* Translation Status Badges & Toggle */}
              <div className="mt-3.5 flex items-center justify-between border-t border-saffron-100/70 pt-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span
                    className={`rounded-md px-1.5 py-0.5 ${
                      hasHindi ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    HI {hasHindi ? "✓" : "—"}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 ${
                      hasTelugu ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    TE {hasTelugu ? "✓" : "—"}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 ${
                      hasTamil ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    TA {hasTamil ? "✓" : "—"}
                  </span>
                </div>

                <Toggle
                  checked={isAct}
                  onChange={() => handleToggleActive(item, idx)}
                  label={isAct ? "Published" : "Hidden"}
                />
              </div>
            </ManagerCard>
          );
        })}
      </div>

      {/* Modal: Add or Edit Testimonial */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-saffron-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-saffron-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="h-5 w-5 text-saffron-600" />
                <h3 className="font-display text-lg font-bold text-ink">
                  {editingId ? "Edit Devotee Review" : "Add New Devotee Review"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-full p-1.5 text-ink-soft hover:bg-saffron-50 hover:text-ink transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Row 1: Devotee Name & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Devotee Name (English) *">
                  <TextInput
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                  />
                </Field>
                <Field label="Location (English) *">
                  <TextInput
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder="e.g. Ahmedabad, Gujarat"
                  />
                </Field>
              </div>

              {/* Row 2: Rating & Color Theme */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Rating (Stars)">
                  <SelectInput
                    value={draft.rating}
                    onChange={(e) => setDraft({ ...draft, rating: e.target.value })}
                    options={[
                      { value: "5", label: "⭐⭐⭐⭐⭐ (5 Stars)" },
                      { value: "4", label: "⭐⭐⭐⭐ (4 Stars)" },
                      { value: "3", label: "⭐⭐⭐ (3 Stars)" },
                    ]}
                  />
                </Field>

                <Field label="Avatar Initials (optional)">
                  <TextInput
                    value={draft.avatar}
                    onChange={(e) => setDraft({ ...draft, avatar: e.target.value.toUpperCase() })}
                    placeholder="Auto from name (e.g. RP)"
                    maxLength={3}
                  />
                </Field>

                <Field label="Avatar Badge Color">
                  <SelectInput
                    value={draft.color}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    options={COLOR_OPTIONS}
                  />
                </Field>
              </div>

              {/* Row 3: English Review Text */}
              <Field label="Devotee Review Quote (English) *">
                <TextAreaInput
                  rows={3}
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                  placeholder="Share the devotee's sacred experience with our certified pandits and rituals..."
                />
              </Field>

              {/* AI Auto-Translation Banner Button */}
              <div className="rounded-2xl border border-saffron-200/90 bg-gradient-to-r from-saffron-50 via-amber-50 to-cream p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-saffron-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-saffron-600 shrink-0" />
                      <span>1-Click AI Auto-Translation</span>
                    </h5>
                    <p className="mt-0.5 text-[11px] text-ink-soft">
                      Translates English review, name & location to Hindi, Telugu, and Tamil instantly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoTranslateAll}
                    disabled={isTranslating || !draft.text.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-600 to-saffron-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:from-saffron-500 hover:to-saffron-600 disabled:opacity-50"
                  >
                    <Languages className="h-4 w-4" />
                    <span>{isTranslating ? "Translating with AI…" : "Auto-Translate to 3 Languages"}</span>
                  </button>
                </div>
              </div>

              {/* Regional Language Tabs */}
              <div className="border border-saffron-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-saffron-600" />
                    <span className="text-xs font-bold text-ink">Regional Language Translations</span>
                  </div>
                  <div className="flex rounded-lg bg-saffron-100/70 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveLangTab("hi")}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeLangTab === "hi"
                          ? "bg-white text-saffron-900 shadow-2xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      हिन्दी (HI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab("te")}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeLangTab === "te"
                          ? "bg-white text-saffron-900 shadow-2xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      తెలుగు (TE)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLangTab("ta")}
                      className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                        activeLangTab === "ta"
                          ? "bg-white text-saffron-900 shadow-2xs font-bold"
                          : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      தமிழ் (TA)
                    </button>
                  </div>
                </div>

                {activeLangTab === "hi" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Devotee Name (हिन्दी)">
                        <TextInput
                          value={draft.hindiName}
                          onChange={(e) => setDraft({ ...draft, hindiName: e.target.value })}
                          placeholder="उदा. रमेश पटेल"
                        />
                      </Field>
                      <Field label="Location (हिन्दी)">
                        <TextInput
                          value={draft.hindiLocation}
                          onChange={(e) => setDraft({ ...draft, hindiLocation: e.target.value })}
                          placeholder="उदा. अहमदाबाद, गुजरात"
                        />
                      </Field>
                    </div>
                    <Field label="Review Quote (हिन्दी)">
                      <TextAreaInput
                        rows={2}
                        value={draft.hindiText}
                        onChange={(e) => setDraft({ ...draft, hindiText: e.target.value })}
                        placeholder="हिन्दी समीक्षा लिखें या Auto-Translate पर क्लिक करें..."
                      />
                    </Field>
                  </div>
                )}

                {activeLangTab === "te" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Devotee Name (తెలుగు)">
                        <TextInput
                          value={draft.teluguName}
                          onChange={(e) => setDraft({ ...draft, teluguName: e.target.value })}
                          placeholder="ఉదా. రమేష్ పటేల్"
                        />
                      </Field>
                      <Field label="Location (తెలుగు)">
                        <TextInput
                          value={draft.teluguLocation}
                          onChange={(e) => setDraft({ ...draft, teluguLocation: e.target.value })}
                          placeholder="ఉదా. అహ్మదాబాద్, గుజరాత్"
                        />
                      </Field>
                    </div>
                    <Field label="Review Quote (తెలుగు)">
                      <TextAreaInput
                        rows={2}
                        value={draft.teluguText}
                        onChange={(e) => setDraft({ ...draft, teluguText: e.target.value })}
                        placeholder="తెలుగు సమీక్ష రాయండి లేదా ఆటో-ట్రాన్స్‌లేట్ ఉపయోగించండి..."
                      />
                    </Field>
                  </div>
                )}

                {activeLangTab === "ta" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Devotee Name (தமிழ்)">
                        <TextInput
                          value={draft.tamilName}
                          onChange={(e) => setDraft({ ...draft, tamilName: e.target.value })}
                          placeholder="உதா. ரமேஷ் படேல்"
                        />
                      </Field>
                      <Field label="Location (தமிழ்)">
                        <TextInput
                          value={draft.tamilLocation}
                          onChange={(e) => setDraft({ ...draft, tamilLocation: e.target.value })}
                          placeholder="உதா. அகமதாபாத், குஜராத்"
                        />
                      </Field>
                    </div>
                    <Field label="Review Quote (தமிழ்)">
                      <TextAreaInput
                        rows={2}
                        value={draft.tamilText}
                        onChange={(e) => setDraft({ ...draft, tamilText: e.target.value })}
                        placeholder="தமிழ் விமர்சனம் எழுதவும்..."
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="pt-2">
                <Toggle
                  checked={draft.active}
                  onChange={() => setDraft({ ...draft, active: !draft.active })}
                  label={draft.active ? "Visible on Public Website" : "Hidden from Public Website"}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-saffron-100 pt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-outline text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary text-xs"
              >
                {editingId ? "Save Review Changes" : "Publish Devotee Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
