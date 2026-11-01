"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import type { Temple, Pooja } from "@/lib/data";
import { isTempleActive } from "@/lib/data";
import type { ParsedPoojaDraft } from "@/lib/pooja-bulk-excel";
import BulkFormEntry from "./BulkFormEntry";
import BulkExcelImportView from "./BulkExcelImportView";

interface BulkPoojaModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  temples: Temple[];
  categories: string[];
  initialMode?: "form" | "excel";
  onSuccess: () => void;
}

interface BulkSummaryState {
  totalSubmitted: number;
  created: number;
  failed: number;
  createdPoojas?: Pooja[];
  failedRecords: ParsedPoojaDraft[];
}

function createDefaultDraft(index: number, activeTemples: Temple[], defaultCategory: string): ParsedPoojaDraft {
  const firstTemple = activeTemples[0];

  return {
    id: `draft-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
    rowIndex: index + 1,
    title: "",
    hindiTitle: "",
    category: defaultCategory || "Rashifal Pooja",
    type: "temple",
    templeId: firstTemple?._id ? String(firstTemple._id) : (firstTemple?.id || firstTemple?.slug),
    templeSlug: firstTemple?.slug,
    templeName: firstTemple?.name,
    price: 1100,
    duration: "45-60 mins",
    startDate: "",
    eventTime: "09:00 AM IST",
    availability: "open",
    capacity: 50,
    description: "",
    imageUrl: "/images/poojas/default-pooja.jpg",
    galleryImages: [],
    benefits: ["Name & Gotra Sankalp", "Prasad Delivery to Home", "Live Panditji Chanting"],
    packages: [],
    assignedAddonIds: [],
    active: false, // Default to Draft/Inactive status
    showInHero: false,
    showInHeroCard: false,
    showInCatalog: true,
    isValid: false,
    errors: ["Puja Name (English) is required.", "Puja Name (Hindi) is required."],
  };
}

export default function BulkPoojaModal({
  isOpen,
  onClose,
  token,
  temples,
  categories,
  initialMode = "form",
  onSuccess,
}: BulkPoojaModalProps) {
  const activeTemples = temples.filter(isTempleActive);
  const defaultCategory = categories[0] || "Rashifal Pooja";

  const [activeTab, setActiveTab] = useState<"form" | "excel">(initialMode);
  const [entries, setEntries] = useState<ParsedPoojaDraft[]>([
    createDefaultDraft(0, activeTemples, defaultCategory),
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [publishImmediately, setPublishImmediately] = useState<boolean>(false);
  const [summary, setSummary] = useState<BulkSummaryState | null>(null);
  const [isExportingFailed, setIsExportingFailed] = useState<boolean>(false);

  if (!isOpen) return null;

  // ── Dynamic Form Operations ──
  const handleAddEntry = () => {
    setEntries((prev) => [...prev, createDefaultDraft(prev.length, activeTemples, defaultCategory)]);
  };

  const handleUpdateEntry = (index: number, updated: ParsedPoojaDraft) => {
    setEntries((prev) => prev.map((e, idx) => (idx === index ? updated : e)));
  };

  const handleDuplicateEntry = (index: number) => {
    const target = entries[index];
    const cloned: ParsedPoojaDraft = {
      ...target,
      id: `draft-${Date.now()}-${entries.length}-${Math.random().toString(36).substring(2, 6)}`,
      rowIndex: entries.length + 1,
      title: target.title ? `${target.title} (Copy)` : "",
      hindiTitle: target.hindiTitle ? `${target.hindiTitle} (प्रतिलिपि)` : "",
      packages: target.packages.map((p) => ({ ...p })),
      benefits: [...target.benefits],
      galleryImages: [...target.galleryImages],
      assignedAddonIds: [...target.assignedAddonIds],
    };
    setEntries((prev) => [...prev, cloned]);
  };

  const handleRemoveEntry = (index: number) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  // ── Submit Dynamic Form ──
  const handleSubmitForm = async () => {
    // Check if any entries are invalid
    const invalidItems = entries.filter((e) => !e.isValid || e.errors.length > 0);
    if (invalidItems.length > 0) {
      alert(`Please fix the errors in ${invalidItems.length} entry/entries before submitting.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/poojas/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          poojas: entries,
          publishAll: publishImmediately,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to bulk create Pujas.");
      }

      setSummary({
        totalSubmitted: entries.length,
        created: json.summary.created,
        failed: json.summary.failed,
        createdPoojas: json.createdPoojas,
        failedRecords: json.failedRecords || [],
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting bulk Pujas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Export Failed Records from Summary ──
  const handleExportSummaryFailed = async () => {
    if (!summary || summary.failedRecords.length === 0) return;

    setIsExportingFailed(true);
    try {
      const res = await fetch("/api/admin/poojas/export-failed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ failedRecords: summary.failedRecords }),
      });

      if (!res.ok) {
        throw new Error("Failed to export failed records.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "Failed_Bulk_Puja_Records.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error downloading failed records.");
    } finally {
      setIsExportingFailed(false);
    }
  };

  const handleFinishAndRefresh = () => {
    onSuccess();
    onClose();
  };

  const validEntriesCount = entries.filter((e) => e.isValid).length;
  const errorEntriesCount = entries.filter((e) => !e.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Create Multiple Pujas
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-saffron-500/20 text-saffron-300 border border-saffron-500/30">
                  Bulk Manager
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Add multiple Vedic ceremonies at once via dynamic form or Excel import.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Summary View (Displayed after completion) ── */}
        {summary ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div className="text-center max-w-lg mx-auto space-y-2">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Bulk Operation Completed</h3>
              <p className="text-xs text-slate-600">
                Processed {summary.totalSubmitted} Puja records. Check the results below.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="block text-2xl font-black text-slate-800">{summary.totalSubmitted}</span>
                <span className="text-xs font-semibold text-slate-500">Total Submitted</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="block text-2xl font-black text-emerald-700">{summary.created}</span>
                <span className="text-xs font-semibold text-emerald-800">Successfully Created</span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="block text-2xl font-black text-amber-700">{summary.failed}</span>
                <span className="text-xs font-semibold text-amber-800">Failed / Invalid</span>
              </div>
            </div>

            {/* Failed Records Action Banner */}
            {summary.failedRecords.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950">
                    <p className="font-bold">
                      {summary.failedRecords.length} record(s) failed validation.
                    </p>
                    <p className="text-amber-900/90 mt-0.5">
                      Download the error report spreadsheet to review validation errors, fix them, and re-upload.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportSummaryFailed}
                  disabled={isExportingFailed}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs hover:bg-amber-700 transition-colors shrink-0"
                >
                  {isExportingFailed ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download Failed Records (.xlsx)
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setSummary(null);
                  setEntries([createDefaultDraft(0, activeTemples, defaultCategory)]);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Create More Pujas
              </button>

              <button
                type="button"
                onClick={handleFinishAndRefresh}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-xs shadow-md shadow-saffron-500/20 transition-all flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Done & View in Catalog
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Mode Selection Navigation Tabs ── */}
            <div className="px-6 pt-3 pb-0 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className={`inline-flex items-center gap-2 pb-3 px-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === "form"
                      ? "border-saffron-600 text-saffron-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  Dynamic Form (Bulk Create)
                  <span className="px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-800 text-[10px]">
                    {entries.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("excel")}
                  className={`inline-flex items-center gap-2 pb-3 px-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === "excel"
                      ? "border-saffron-600 text-saffron-900"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Import from Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === "form" ? (
                <div className="space-y-6">
                  {/* Top Bar: Summary counts and Add Another button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-700">
                        Total Entries: <b className="text-slate-900">{entries.length}</b>
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Ready: <b>{validEntriesCount}</b>
                      </span>
                      {errorEntriesCount > 0 && (
                        <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                          Needs Attention: <b>{errorEntriesCount}</b>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEntry}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-saffron-50 text-saffron-800 border border-saffron-200 hover:bg-saffron-100 text-xs font-bold transition-all shadow-xs"
                    >
                      <Plus className="h-4 w-4 text-saffron-600" />
                      Add Another Puja
                    </button>
                  </div>

                  {/* List of Form Cards */}
                  <div className="space-y-4">
                    {entries.map((entry, idx) => (
                      <BulkFormEntry
                        key={entry.id}
                        entry={entry}
                        index={idx}
                        temples={temples}
                        categories={categories}
                        onChange={(updated) => handleUpdateEntry(idx, updated)}
                        onDuplicate={() => handleDuplicateEntry(idx)}
                        onRemove={() => handleRemoveEntry(idx)}
                        isOnlyEntry={entries.length <= 1}
                      />
                    ))}
                  </div>

                  {/* Bottom "Add Another" CTA */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={handleAddEntry}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-saffron-500 text-xs font-bold text-slate-700 hover:text-saffron-800 hover:bg-saffron-50/50 transition-all"
                    >
                      <Plus className="h-4 w-4 text-saffron-600" />
                      + Add Another Puja Entry
                    </button>
                  </div>
                </div>
              ) : (
                <BulkExcelImportView
                  token={token}
                  temples={temples}
                  categories={categories}
                  onImportSuccess={(res) => {
                    setSummary({
                      totalSubmitted: res.totalSubmitted,
                      created: res.created,
                      failed: res.failed,
                      failedRecords: res.failedRecords,
                    });
                  }}
                />
              )}
            </div>

            {/* ── Modal Footer (Dynamic Form Submit Controls) ── */}
            {activeTab === "form" && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                  />
                  Publish immediately (otherwise saved as Draft / Inactive)
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitForm}
                    disabled={isSubmitting || errorEntriesCount > 0}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-xs shadow-md shadow-saffron-500/20 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Creating Pujas...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Create {entries.length} Puja(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

