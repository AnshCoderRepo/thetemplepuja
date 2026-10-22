"use client";

import { useEffect, useState, useCallback } from "react";
import {
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Languages,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { fetchCatalog, saveCatalogSection, resetCatalogSection } from "@/lib/api";
import { faqs as defaultFaqs, type FaqItem } from "@/lib/data";
import {
  Field,
  ManagerCard,
  ManagerHeader,
  TextAreaInput,
  TextInput,
  Toggle,
} from "./manager-ui";

import { translateFieldsToAllLanguages, type SupportedLocale } from "@/lib/translate-client";

interface FaqDraft {
  id: string;
  q: string;
  a: string;
  hindiQ: string;
  hindiA: string;
  teluguQ: string;
  teluguA: string;
  tamilQ: string;
  tamilA: string;
  order: number;
  active: boolean;
}

const emptyDraft: FaqDraft = {
  id: "",
  q: "",
  a: "",
  hindiQ: "",
  hindiA: "",
  teluguQ: "",
  teluguA: "",
  tamilQ: "",
  tamilA: "",
  order: 1,
  active: true,
};

export default function FaqManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}) {
  const [list, setList] = useState<FaqItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState<FaqDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<SupportedLocale>("en");
  const [lastEditedLang, setLastEditedLang] = useState<SupportedLocale>("en");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const c = await fetchCatalog();
      if (c.faqs && Array.isArray(c.faqs) && c.faqs.length > 0) {
        setList(
          c.faqs.map((f, idx) => ({
            ...f,
            id: f.id || `faq-legacy-${idx + 1}`,
            order: typeof f.order === "number" ? f.order : idx + 1,
            active: f.active !== false,
          }))
        );
      } else {
        // Populate default FAQs if no custom ones have been saved
        setList(
          defaultFaqs.map((f, idx) => ({
            ...f,
            id: `faq-default-${idx + 1}`,
            order: idx + 1,
            active: true,
          }))
        );
      }
    } catch {
      setError("Failed to load FAQs from server.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveList = async (updated: FaqItem[]) => {
    setIsSaving(true);
    setError("");
    try {
      const res = await saveCatalogSection("faqs", updated, token);
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return;
        }
        setError(res.error || "Failed to persist FAQs to MongoDB.");
        return;
      }
      setList(updated);
      setNotification("FAQs updated successfully and published to website.");
      setTimeout(() => setNotification(""), 4000);
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setDraft({
      ...emptyDraft,
      id: `faq-${Date.now()}`,
      order: list.length + 1,
    });
    setActiveLangTab("en");
    setLastEditedLang("en");
    setIsAdding(true);
    setEditingId(null);
  };

  const handleOpenEdit = (faq: FaqItem) => {
    setDraft({
      id: faq.id || `faq-${Date.now()}`,
      q: faq.q || "",
      a: faq.a || "",
      hindiQ: faq.hindiQ || "",
      hindiA: faq.hindiA || "",
      teluguQ: faq.teluguQ || "",
      teluguA: faq.teluguA || "",
      tamilQ: faq.tamilQ || "",
      tamilA: faq.tamilA || "",
      order: typeof faq.order === "number" ? faq.order : list.findIndex((x) => x.id === faq.id) + 1,
      active: faq.active !== false,
    });
    setActiveLangTab("en");
    setLastEditedLang("en");
    setEditingId(faq.id || "");
    setIsAdding(false);
  };

  const handleCloseForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setDraft(emptyDraft);
    setError("");
  };

  /**
   * Synchronizes FAQ content across all 4 supported languages.
   * If any language was edited, it translates the Question & Answer to all other languages.
   */
  const handleAutoTranslate = async (sourceLang: SupportedLocale = activeLangTab) => {
    let srcQ = "";
    let srcA = "";

    if (sourceLang === "en") {
      srcQ = draft.q.trim();
      srcA = draft.a.trim();
    } else if (sourceLang === "hi") {
      srcQ = draft.hindiQ.trim();
      srcA = draft.hindiA.trim();
    } else if (sourceLang === "te") {
      srcQ = draft.teluguQ.trim();
      srcA = draft.teluguA.trim();
    } else if (sourceLang === "ta") {
      srcQ = draft.tamilQ.trim();
      srcA = draft.tamilA.trim();
    }

    // If active language has no text, search for whichever language has content
    if (!srcQ && !srcA) {
      const candidates: SupportedLocale[] = ["en", "hi", "te", "ta"];
      for (const lang of candidates) {
        const qVal = lang === "en" ? draft.q : lang === "hi" ? draft.hindiQ : lang === "te" ? draft.teluguQ : draft.tamilQ;
        const aVal = lang === "en" ? draft.a : lang === "hi" ? draft.hindiA : lang === "te" ? draft.teluguA : draft.tamilA;
        if (qVal.trim() || aVal.trim()) {
          sourceLang = lang;
          srcQ = qVal.trim();
          srcA = aVal.trim();
          break;
        }
      }
    }

    if (!srcQ && !srcA) {
      setError("Please enter a question or answer in at least one language to translate.");
      return;
    }

    setIsTranslating(true);
    setError("");
    try {
      const res = await translateFieldsToAllLanguages(
        { q: srcQ, a: srcA },
        sourceLang
      );

      setDraft((prev) => ({
        ...prev,
        q: sourceLang === "en" ? srcQ : res.en?.q || prev.q || srcQ,
        a: sourceLang === "en" ? srcA : res.en?.a || prev.a || srcA,
        hindiQ: sourceLang === "hi" ? srcQ : res.hi?.q || prev.hindiQ || srcQ,
        hindiA: sourceLang === "hi" ? srcA : res.hi?.a || prev.hindiA || srcA,
        teluguQ: sourceLang === "te" ? srcQ : res.te?.q || prev.teluguQ || srcQ,
        teluguA: sourceLang === "te" ? srcA : res.te?.a || prev.teluguA || srcA,
        tamilQ: sourceLang === "ta" ? srcQ : res.ta?.q || prev.tamilQ || srcQ,
        tamilA: sourceLang === "ta" ? srcA : res.ta?.a || prev.tamilA || srcA,
      }));

      const langNames: Record<SupportedLocale, string> = {
        en: "English",
        hi: "Hindi",
        te: "Telugu",
        ta: "Tamil",
      };
      setNotification(`✨ Content from ${langNames[sourceLang]} synchronized to all other languages!`);
      setTimeout(() => setNotification(""), 4000);
    } catch (e: any) {
      setError(e?.message || "Failed to translate content.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if any language has question and answer
    const hasEnglish = Boolean(draft.q.trim() && draft.a.trim());
    const hasHindi = Boolean(draft.hindiQ.trim() && draft.hindiA.trim());
    const hasTelugu = Boolean(draft.teluguQ.trim() && draft.teluguA.trim());
    const hasTamil = Boolean(draft.tamilQ.trim() && draft.tamilA.trim());

    if (!hasEnglish && !hasHindi && !hasTelugu && !hasTamil) {
      setError("Please provide both a Question and Answer in at least one language.");
      return;
    }

    setIsSaving(true);
    setError("");

    // Identify primary source language for auto-synchronization
    let primarySource: SupportedLocale = lastEditedLang;
    if (primarySource === "en" && !hasEnglish) {
      primarySource = hasHindi ? "hi" : hasTelugu ? "te" : "ta";
    }

    let finalDraft = { ...draft };

    // If any other languages are missing, synchronize automatically before saving
    if (!hasEnglish || !hasHindi || !hasTelugu || !hasTamil) {
      try {
        let srcQ = "";
        let srcA = "";
        if (primarySource === "en") {
          srcQ = draft.q.trim();
          srcA = draft.a.trim();
        } else if (primarySource === "hi") {
          srcQ = draft.hindiQ.trim();
          srcA = draft.hindiA.trim();
        } else if (primarySource === "te") {
          srcQ = draft.teluguQ.trim();
          srcA = draft.teluguA.trim();
        } else {
          srcQ = draft.tamilQ.trim();
          srcA = draft.tamilA.trim();
        }

        const translations = await translateFieldsToAllLanguages(
          { q: srcQ, a: srcA },
          primarySource
        );

        finalDraft = {
          ...draft,
          q: draft.q.trim() || translations.en?.q || srcQ,
          a: draft.a.trim() || translations.en?.a || srcA,
          hindiQ: draft.hindiQ.trim() || translations.hi?.q || srcQ,
          hindiA: draft.hindiA.trim() || translations.hi?.a || srcA,
          teluguQ: draft.teluguQ.trim() || translations.te?.q || srcQ,
          teluguA: draft.teluguA.trim() || translations.te?.a || srcA,
          tamilQ: draft.tamilQ.trim() || translations.ta?.q || srcQ,
          tamilA: draft.tamilA.trim() || translations.ta?.a || srcA,
        };
      } catch (err) {
        console.warn("[FaqManager] Auto-sync on save error, persisting current inputs:", err);
      }
    }

    const itemToSave: FaqItem = {
      id: finalDraft.id || `faq-${Date.now()}`,
      q: finalDraft.q.trim() || finalDraft.hindiQ.trim() || "FAQ Question",
      a: finalDraft.a.trim() || finalDraft.hindiA.trim() || "FAQ Answer",
      hindiQ: finalDraft.hindiQ.trim() || undefined,
      hindiA: finalDraft.hindiA.trim() || undefined,
      teluguQ: finalDraft.teluguQ.trim() || undefined,
      teluguA: finalDraft.teluguA.trim() || undefined,
      tamilQ: finalDraft.tamilQ.trim() || undefined,
      tamilA: finalDraft.tamilA.trim() || undefined,
      order: Number(finalDraft.order) || list.length + 1,
      active: finalDraft.active,
    };

    let updated: FaqItem[];
    if (editingId) {
      updated = list.map((item) => (item.id === editingId ? itemToSave : item));
    } else {
      updated = [...list, itemToSave];
    }

    // Sort by order
    updated.sort((a, b) => (a.order || 0) - (b.order || 0));

    await saveList(updated);
    handleCloseForm();
  };

  const handleDelete = async (id: string) => {
    const updated = list.filter((item) => item.id !== id);
    await saveList(updated);
    setConfirmDeleteId(null);
  };

  const handleToggleActive = async (faq: FaqItem) => {
    const updated = list.map((item) =>
      item.id === faq.id ? { ...item, active: item.active === false ? true : false } : item
    );
    await saveList(updated);
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const copy = [...list];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Re-assign order numbers
    const updated = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    await saveList(updated);
  };

  const handleResetDefaults = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await resetCatalogSection("faqs", token);
      if (!res.ok) {
        if (res.status === 401) onAuthError();
        setError(res.error || "Failed to reset FAQs.");
        return;
      }
      await loadData();
      setNotification("FAQs reset to original default state.");
      setTimeout(() => setNotification(""), 4000);
      setConfirmResetOpen(false);
      onRefresh?.();
    } catch (err: any) {
      setError(err?.message || "Failed to reset FAQs.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ManagerHeader
        title="FAQ Management"
        subtitle="Edit existing frequently asked questions, answers, ordering, and visibility on the public homepage with full multilingual translation support."
        count={list.length}
        onAdd={handleOpenAdd}
        onReset={() => setConfirmResetOpen(true)}
        addLabel="Add Question"
      />

      {/* Notifications and Alerts */}
      {notification && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-800 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {confirmResetOpen && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <RotateCcw className="h-4 w-4 text-amber-700" />
            <span>Confirm Reset to Default FAQs?</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            This will clear your customized questions from MongoDB and restore the 6 verified default Vedic FAQs.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={isSaving}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold transition-colors"
            >
              Yes, Reset FAQs
            </button>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="rounded-xl border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit / Add Drawer Modal */}
      {(isAdding || editingId) && (
        <ManagerCard>
          <div className="flex items-center justify-between pb-3 border-b border-saffron-100 mb-4">
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                {editingId ? "Edit FAQ Item" : "Create New FAQ Item"}
              </h3>
              <p className="text-xs text-ink-soft">
                Update question details and localized translations.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseForm}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {/* Top Bar: Order & Auto-Translate Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-saffron-50/70 border border-saffron-200/80">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-saffron-600 shrink-0" />
                <span className="text-xs font-bold text-ink">
                  Multilingual Synchronizer:
                </span>
                <span className="text-[11px] text-ink-soft hidden sm:inline">
                  Edit in any language and synchronize across all languages instantly.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <TextInput
                    type="number"
                    min="1"
                    value={draft.order}
                    onChange={(e) => setDraft({ ...draft, order: parseInt(e.target.value, 10) || 1 })}
                    placeholder="Order"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAutoTranslate(activeLangTab)}
                  disabled={isTranslating}
                  className="rounded-xl bg-saffron-500 hover:bg-saffron-600 text-white font-bold px-3 py-2 text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  title="Translate content in current language to all other 3 languages"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isTranslating ? "animate-spin" : ""}`} />
                  <span>{isTranslating ? "Translating..." : "✨ Auto-Translate to All Languages"}</span>
                </button>
              </div>
            </div>

            {/* Language Selector Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Languages className="h-4 w-4 text-saffron-600" />
                  <span>Select Language to Edit</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  {[
                    { id: "en", label: "English", has: Boolean(draft.q.trim() && draft.a.trim()) },
                    { id: "hi", label: "हिंदी (HI)", has: Boolean(draft.hindiQ.trim() && draft.hindiA.trim()) },
                    { id: "te", label: "తెలుగు (TE)", has: Boolean(draft.teluguQ.trim() && draft.teluguA.trim()) },
                    { id: "ta", label: "தமிழ் (TA)", has: Boolean(draft.tamilQ.trim() && draft.tamilA.trim()) },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveLangTab(tab.id as SupportedLocale);
                      }}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                        activeLangTab === tab.id
                          ? "bg-white text-saffron-700 shadow-2xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.has && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Completed" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* English Inputs */}
              {activeLangTab === "en" && (
                <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
                  <Field label="Question (English)">
                    <TextInput
                      value={draft.q}
                      onChange={(e) => {
                        setDraft({ ...draft, q: e.target.value });
                        setLastEditedLang("en");
                      }}
                      placeholder="e.g. Will I receive a video recording of my pooja?"
                    />
                  </Field>
                  <Field label="Answer (English)">
                    <TextAreaInput
                      rows={3}
                      value={draft.a}
                      onChange={(e) => {
                        setDraft({ ...draft, a: e.target.value });
                        setLastEditedLang("en");
                      }}
                      placeholder="Enter comprehensive answer for devotees..."
                    />
                  </Field>
                </div>
              )}

              {/* Hindi Inputs */}
              {activeLangTab === "hi" && (
                <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-saffron-200">
                  <Field label="हिंदी प्रश्न (Hindi Question)">
                    <TextInput
                      value={draft.hindiQ}
                      onChange={(e) => {
                        setDraft({ ...draft, hindiQ: e.target.value });
                        setLastEditedLang("hi");
                      }}
                      placeholder="उदा. क्या मुझे अपनी पूजा की वीडियो रिकॉर्डिंग मिलेगी?"
                    />
                  </Field>
                  <Field label="हिंदी उत्तर (Hindi Answer)">
                    <TextAreaInput
                      rows={3}
                      value={draft.hindiA}
                      onChange={(e) => {
                        setDraft({ ...draft, hindiA: e.target.value });
                        setLastEditedLang("hi");
                      }}
                      placeholder="हिंदी उत्तर दर्ज करें..."
                    />
                  </Field>
                </div>
              )}

              {/* Telugu Inputs */}
              {activeLangTab === "te" && (
                <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-saffron-200">
                  <Field label="తెలుగు ప్రశ్న (Telugu Question)">
                    <TextInput
                      value={draft.teluguQ}
                      onChange={(e) => {
                        setDraft({ ...draft, teluguQ: e.target.value });
                        setLastEditedLang("te");
                      }}
                      placeholder="తెలుగు ప్రశ్న..."
                    />
                  </Field>
                  <Field label="తెలుగు సమాధానం (Telugu Answer)">
                    <TextAreaInput
                      rows={3}
                      value={draft.teluguA}
                      onChange={(e) => {
                        setDraft({ ...draft, teluguA: e.target.value });
                        setLastEditedLang("te");
                      }}
                      placeholder="తెలుగు సమాధానం..."
                    />
                  </Field>
                </div>
              )}

              {/* Tamil Inputs */}
              {activeLangTab === "ta" && (
                <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-saffron-200">
                  <Field label="தமிழ் கேள்வி (Tamil Question)">
                    <TextInput
                      value={draft.tamilQ}
                      onChange={(e) => {
                        setDraft({ ...draft, tamilQ: e.target.value });
                        setLastEditedLang("ta");
                      }}
                      placeholder="தமிழ் கேள்வி..."
                    />
                  </Field>
                  <Field label="தமிழ் பதில் (Tamil Answer)">
                    <TextAreaInput
                      rows={3}
                      value={draft.tamilA}
                      onChange={(e) => {
                        setDraft({ ...draft, tamilA: e.target.value });
                        setLastEditedLang("ta");
                      }}
                      placeholder="தமிழ் பதில்..."
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-saffron-100/80 flex items-center justify-between">
              <Toggle
                label="Visible on Public Website"
                checked={draft.active}
                onChange={(checked) => setDraft({ ...draft, active: checked })}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingId ? "Update FAQ" : "Save FAQ"}</span>
                </button>
              </div>
            </div>
          </form>
        </ManagerCard>
      )}

      {/* FAQs List */}
      <div className="space-y-3">
        {list.map((faq, index) => {
          const isHidden = faq.active === false;
          return (
            <div
              key={faq.id || index}
              className={`rounded-2xl border bg-white p-4 transition-all duration-200 ${
                isHidden
                  ? "border-slate-200 opacity-60 bg-slate-50/50"
                  : "border-saffron-200/80 shadow-xs hover:border-saffron-300 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Order & Reordering */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-100 text-saffron-900 text-xs font-extrabold border border-saffron-200">
                      #{faq.order || index + 1}
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0 || isSaving}
                        className="p-0.5 text-slate-400 hover:text-saffron-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Move Up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, "down")}
                        disabled={index === list.length - 1 || isSaving}
                        className="p-0.5 text-slate-400 hover:text-saffron-600 disabled:opacity-30 disabled:hover:text-slate-400"
                        title="Move Down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Q&A Content */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display font-bold text-sm text-ink">{faq.q}</h4>
                      {isHidden ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          <EyeOff className="h-3 w-3" />
                          <span>Hidden</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <Eye className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                          EN ✓
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${faq.hindiQ ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                          HI {faq.hindiQ ? "✓" : "—"}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${faq.teluguQ ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                          TE {faq.teluguQ ? "✓" : "—"}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${faq.tamilQ ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-400"}`}>
                          TA {faq.tamilQ ? "✓" : "—"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                      {faq.a}
                    </p>

                    {/* Regional Snippets */}
                    {faq.hindiQ && (
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-amber-800">HI:</span> {faq.hindiQ}
                      </p>
                    )}
                    {faq.teluguQ && (
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-amber-800">TE:</span> {faq.teluguQ}
                      </p>
                    )}
                    {faq.tamilQ && (
                      <p className="text-[11px] text-slate-500 truncate">
                        <span className="font-semibold text-amber-800">TA:</span> {faq.tamilQ}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(faq)}
                    disabled={isSaving}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    title={isHidden ? "Show on public site" : "Hide from public site"}
                  >
                    {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(faq)}
                    disabled={isSaving}
                    className="p-1.5 rounded-xl border border-saffron-200 text-saffron-700 hover:bg-saffron-50 transition-colors"
                    title="Edit FAQ"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(faq.id || null)}
                    disabled={isSaving}
                    className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete FAQ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Confirm Delete Inline Box */}
              {confirmDeleteId === faq.id && (
                <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-xs">
                  <span className="text-rose-700 font-semibold">
                    Are you sure you want to delete this FAQ question?
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDelete(faq.id!)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="rounded-3xl border border-dashed border-saffron-300 bg-amber-50/40 p-8 text-center space-y-3">
            <span className="text-3xl">❓</span>
            <h4 className="font-display font-bold text-ink text-base">No FAQs Configured</h4>
            <p className="text-xs text-ink-soft max-w-md mx-auto">
              There are no FAQs saved in MongoDB. You can restore the default verified Vedic FAQs or add your own custom questions.
            </p>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Default FAQs</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
