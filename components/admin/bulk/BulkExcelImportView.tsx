"use client";

import React, { useState, useRef } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Home,
  Info,
  Landmark,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import type { Temple } from "@/lib/data";
import { isTempleActive } from "@/lib/data";
import type { ParsedPoojaDraft, BulkParsedResult } from "@/lib/pooja-bulk-excel";

interface BulkExcelImportViewProps {
  token: string;
  temples: Temple[];
  categories: string[];
  onImportSuccess: (result: {
    totalSubmitted: number;
    created: number;
    failed: number;
    failedRecords: ParsedPoojaDraft[];
  }) => void;
}

export default function BulkExcelImportView({
  token,
  temples,
  categories,
  onImportSuccess,
}: BulkExcelImportViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<BulkParsedResult | null>(null);
  const [items, setItems] = useState<ParsedPoojaDraft[]>([]);

  // Filters & Search
  const [filterMode, setFilterMode] = useState<"all" | "valid" | "errors">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inline editing
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [publishImmediately, setPublishImmediately] = useState<boolean>(false);
  const [isExportingErrors, setIsExportingErrors] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTemples = temples.filter(isTempleActive);

  // ── Download Blank Template ──
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`/api/admin/poojas/template?token=${encodeURIComponent(token)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to download template. Please check your admin privileges.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "TemplePujaSewa_Bulk_Puja_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error downloading template.");
    }
  };

  // ── Parse Uploaded File ──
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setParsedData(null);
    setItems([]);
    setIsParsing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/admin/poojas/parse-excel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to parse spreadsheet file.");
      }

      const result: BulkParsedResult = json.data;
      setParsedData(result);
      setItems(result.items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process the uploaded file.";
      setParseError(msg);
    } finally {
      setIsParsing(false);
    }
  };

  // ── Drag & Drop Handlers ──
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  // ── Item Actions: Delete, Edit ──
  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemField = (id: string, field: keyof ParsedPoojaDraft, val: unknown) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: val };
        if (field === "type" && val === "home") {
          updated.templeId = undefined;
          updated.templeSlug = undefined;
          updated.templeName = undefined;
        }

        // Re-validate row
        const errs: string[] = [];
        if (!updated.title?.trim()) errs.push("Puja Name (English) is required.");
        if (!updated.hindiTitle?.trim()) errs.push("Puja Name (Hindi) is required.");
        if (!updated.category?.trim()) errs.push("Puja Category is required.");
        if (isNaN(Number(updated.price)) || Number(updated.price) <= 0) {
          errs.push("Starting price must be a valid positive number.");
        }
        if (updated.type === "temple") {
          if (!updated.templeId && !updated.templeSlug && !updated.templeName) {
            errs.push("Associated Temple is required for Temple Pujas.");
          }
        }
        updated.isValid = errs.length === 0;
        updated.errors = errs;
        return updated;
      })
    );
  };

  // ── Export Failed Rows to Excel ──
  const handleExportFailed = async () => {
    const failedItems = items.filter((item) => !item.isValid);
    if (failedItems.length === 0) return;

    setIsExportingErrors(true);
    try {
      const res = await fetch("/api/admin/poojas/export-failed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ failedRecords: failedItems }),
      });

      if (!res.ok) {
        throw new Error("Failed to export error report.");
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "Bulk_Puja_Validation_Errors.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error exporting failed records.");
    } finally {
      setIsExportingErrors(false);
    }
  };

  // ── Submit Valid Records ──
  const handleSubmitValid = async () => {
    const validItems = items.filter((item) => item.isValid);
    if (validItems.length === 0) {
      alert("No valid records found to import. Please correct the validation errors first.");
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
          poojas: validItems,
          publishAll: publishImmediately,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to bulk create Pujas.");
      }

      const invalidRemaining = items.filter((item) => !item.isValid);

      onImportSuccess({
        totalSubmitted: validItems.length,
        created: json.summary.created,
        failed: json.summary.failed + invalidRemaining.length,
        failedRecords: [...(json.failedRecords || []), ...invalidRemaining],
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error submitting bulk Pujas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived counts
  const validCount = items.filter((i) => i.isValid).length;
  const errorCount = items.filter((i) => !i.isValid).length;

  const filteredItems = items.filter((item) => {
    if (filterMode === "valid" && !item.isValid) return false;
    if (filterMode === "errors" && item.isValid) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = item.title?.toLowerCase().includes(q);
      const matchesHindi = item.hindiTitle?.toLowerCase().includes(q);
      const matchesTemple = item.templeName?.toLowerCase().includes(q);
      const matchesCat = item.category?.toLowerCase().includes(q);
      return matchesTitle || matchesHindi || matchesTemple || matchesCat;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Step 1: Template Download Banner ── */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm shadow-amber-500/30">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Download Excel Template</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Use our pre-configured .xlsx template with formatted columns, sample Temple & Home Puja rows, and active temple names.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-amber-900 bg-white border border-amber-300 rounded-xl shadow-xs hover:bg-amber-100/70 hover:border-amber-400 transition-all shrink-0"
        >
          <ArrowDownToLine className="h-4 w-4 text-amber-700" />
          Download Template (.xlsx)
        </button>
      </div>

      {/* ── Step 2: Upload Dropzone ── */}
      {!parsedData && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-saffron-500 bg-slate-50/60 hover:bg-saffron-50/30 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center max-w-md mx-auto">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-saffron-100 text-saffron-600 mb-3.5 shadow-sm">
              {isParsing ? (
                <Loader2 className="h-7 w-7 animate-spin text-saffron-600" />
              ) : (
                <UploadCloud className="h-7 w-7 text-saffron-600" />
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isParsing ? "Reading & Validating Spreadsheet..." : "Click or Drag & Drop Excel File"}
            </h3>

            <p className="text-xs text-slate-500 mb-3">
              Supports .xlsx, .xls, and .csv files. Each row will be validated against active Temple Management records.
            </p>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <Upload className="h-3.5 w-3.5 text-saffron-600" /> Browse File
            </span>
          </div>
        </div>
      )}

      {/* Parse Error Alert */}
      {parseError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 text-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-950">Spreadsheet Processing Error</p>
            <p className="mt-0.5 text-red-800">{parseError}</p>
          </div>
          <button
            type="button"
            onClick={() => setParseError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Step 3: Preview Data Grid & Inline Editor ── */}
      {parsedData && (
        <div className="space-y-4">
          {/* Header Bar: File details, summary badges & actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate max-w-xs md:max-w-md">
                  {file?.name || "Uploaded Spreadsheet"}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {items.length} total rows parsed ({validCount} valid, {errorCount} errors)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <button
                  type="button"
                  onClick={handleExportFailed}
                  disabled={isExportingErrors}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors"
                >
                  {isExportingErrors ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-amber-700" />
                  )}
                  Download Errors (.xlsx)
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setParsedData(null);
                  setItems([]);
                  setFile(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Re-upload
              </button>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterMode === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Records ({items.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("valid")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  filterMode === "valid"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Valid ({validCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterMode("errors")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  filterMode === "errors"
                    ? "bg-white text-red-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <AlertCircle className="h-3 w-3 text-red-600" />
                Errors ({errorCount})
              </button>
            </div>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rows by title, temple, or category..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 font-medium"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs max-h-[460px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Row</th>
                  <th className="py-2.5 px-3 w-28">Status</th>
                  <th className="py-2.5 px-3">Puja Name (EN / HI)</th>
                  <th className="py-2.5 px-3 w-28">Ritual Type</th>
                  <th className="py-2.5 px-3">Associated Temple</th>
                  <th className="py-2.5 px-3 w-24">Price</th>
                  <th className="py-2.5 px-3 w-24">Category</th>
                  <th className="py-2.5 px-3 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      No records match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isEditing = editingRowId === item.id;
                    const isTemple = item.type === "temple";

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !item.isValid ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                            {item.rowIndex}
                          </td>

                          <td className="py-2.5 px-3">
                            {item.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Valid
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md cursor-pointer"
                                title={item.errors.join("\n")}
                              >
                                <AlertCircle className="h-3 w-3 text-red-600" />
                                {item.errors.length} err
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900 truncate max-w-[200px]">
                              {item.title || <span className="text-red-500 italic">Missing Name</span>}
                            </p>
                            {item.hindiTitle && (
                              <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                {item.hindiTitle}
                              </p>
                            )}
                            {!item.isValid && item.errors.length > 0 && (
                              <p className="text-[10px] text-red-600 mt-0.5 truncate max-w-[240px]">
                                ⚠️ {item.errors[0]}
                              </p>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                isTemple
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-blue-100 text-blue-900"
                              }`}
                            >
                              {isTemple ? <Landmark className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                              {isTemple ? "Temple" : "Home"}
                            </span>
                          </td>

                          <td className="py-2.5 px-3">
                            {isTemple ? (
                              item.templeName ? (
                                <span className="font-medium text-slate-800 truncate max-w-[180px] block">
                                  📍 {item.templeName}
                                </span>
                              ) : (
                                <span className="text-red-500 font-semibold italic text-[11px]">
                                  No temple matched
                                </span>
                              )
                            ) : (
                              <span className="text-slate-400 italic">Doorstep visit (None)</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            ₹{item.price || 0}
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]">
                            {item.category || "—"}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingRowId(isEditing ? null : item.id)}
                                className="p-1 rounded-md text-slate-500 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
                                title="Edit row details"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(item.id)}
                                className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete row"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Inline Quick Editor */}
                        {isEditing && (
                          <tr className="bg-amber-50/40 border-b border-amber-200">
                            <td colSpan={8} className="p-4 space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                                <h5 className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                                  <Pencil className="h-3.5 w-3.5 text-amber-700" /> Edit Row #{item.rowIndex}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => setEditingRowId(null)}
                                  className="text-xs text-slate-500 hover:text-slate-800"
                                >
                                  Done Editing
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Puja Name (English)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => handleUpdateItemField(item.id, "title", e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Puja Name (Hindi)
                                  </label>
                                  <input
                                    type="text"
                                    value={item.hindiTitle}
                                    onChange={(e) => handleUpdateItemField(item.id, "hindiTitle", e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Ritual Type
                                  </label>
                                  <select
                                    value={item.type}
                                    onChange={(e) => handleUpdateItemField(item.id, "type", e.target.value as "temple" | "home")}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                  >
                                    <option value="temple">Temple Puja</option>
                                    <option value="home">Home Puja</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Starting Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => handleUpdateItemField(item.id, "price", Number(e.target.value))}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                  />
                                </div>

                                {isTemple && (
                                  <div className="sm:col-span-2">
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                      Associated Temple (Active)
                                    </label>
                                    <select
                                      value={item.templeSlug || item.templeId || ""}
                                      onChange={(e) => {
                                        const selected = activeTemples.find(
                                          (t) => t.slug === e.target.value || (t._id && String(t._id) === e.target.value)
                                        );
                                        if (selected) {
                                          handleUpdateItemField(item.id, "templeSlug", selected.slug);
                                          handleUpdateItemField(item.id, "templeId", selected._id ? String(selected._id) : selected.id);
                                          handleUpdateItemField(item.id, "templeName", selected.name);
                                        }
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                    >
                                      <option value="">-- Select Active Temple --</option>
                                      {activeTemples.map((t) => (
                                        <option key={t.slug} value={t.slug}>
                                          {t.name} ({t.city || ""})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Category
                                  </label>
                                  <input
                                    type="text"
                                    value={item.category}
                                    onChange={(e) => handleUpdateItemField(item.id, "category", e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Duration
                                  </label>
                                  <input
                                    type="text"
                                    value={item.duration}
                                    onChange={(e) => handleUpdateItemField(item.id, "duration", e.target.value)}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Submission Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white shadow-md">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={publishImmediately}
                  onChange={(e) => setPublishImmediately(e.target.checked)}
                  className="rounded border-slate-600 text-saffron-500 focus:ring-saffron-400"
                />
                Publish directly to public catalog (otherwise saved as Drafts)
              </label>
            </div>

            <button
              type="button"
              onClick={handleSubmitValid}
              disabled={isSubmitting || validCount === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-xs shadow-md shadow-saffron-500/30 disabled:opacity-50 transition-all shrink-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing Pujas...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" /> Import {validCount} Valid Pujas
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

