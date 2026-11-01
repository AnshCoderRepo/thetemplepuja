"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Flame,
  Globe,
  Home,
  Image as ImageIcon,
  Landmark,
  Layers,
  MapPin,
  Package,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import type { Temple, PoojaPackage } from "@/lib/data";
import { isTempleActive } from "@/lib/data";
import type { ParsedPoojaDraft } from "@/lib/pooja-bulk-excel";

interface BulkFormEntryProps {
  entry: ParsedPoojaDraft;
  index: number;
  temples: Temple[];
  categories: string[];
  onChange: (updated: ParsedPoojaDraft) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  isOnlyEntry: boolean;
}

export default function BulkFormEntry({
  entry,
  index,
  temples,
  categories,
  onChange,
  onDuplicate,
  onRemove,
  isOnlyEntry,
}: BulkFormEntryProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const activeTemples = temples.filter(isTempleActive);

  // Field updater
  const updateField = <K extends keyof ParsedPoojaDraft>(key: K, value: ParsedPoojaDraft[K]) => {
    const updated = { ...entry, [key]: value };
    // If switching ritual type to home, clear temple associations
    if (key === "type" && value === "home") {
      updated.templeId = undefined;
      updated.templeSlug = undefined;
      updated.templeName = undefined;
    }
    // Re-check minimal inline validity
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

    onChange(updated);
  };

  // Temple selection handler
  const handleTempleChange = (templeSlugOrId: string) => {
    if (!templeSlugOrId) {
      updateField("templeId", undefined);
      updateField("templeSlug", undefined);
      updateField("templeName", undefined);
      return;
    }

    const selected = activeTemples.find(
      (t) => (t._id && String(t._id) === templeSlugOrId) || t.slug === templeSlugOrId
    );

    if (selected) {
      const updated = {
        ...entry,
        templeId: selected._id ? String(selected._id) : (selected.id || selected.slug),
        templeSlug: selected.slug,
        templeName: selected.name,
      };
      // Re-validate
      const errs: string[] = [];
      if (!updated.title?.trim()) errs.push("Puja Name (English) is required.");
      if (!updated.hindiTitle?.trim()) errs.push("Puja Name (Hindi) is required.");
      if (!updated.category?.trim()) errs.push("Puja Category is required.");
      if (isNaN(Number(updated.price)) || Number(updated.price) <= 0) {
        errs.push("Starting price must be a valid positive number.");
      }
      updated.isValid = errs.length === 0;
      updated.errors = errs;
      onChange(updated);
    }
  };

  // Package helpers
  const handleAddPackage = () => {
    const newPkg: PoojaPackage = {
      id: `pkg-${Date.now()}-${entry.packages.length}`,
      name: `Tier ${entry.packages.length + 1}`,
      price: entry.price || 1100,
      description: "Includes complete rituals and offerings.",
      benefits: ["Sankalp in devotee name"],
    };
    updateField("packages", [...entry.packages, newPkg]);
  };

  const handleUpdatePackage = (pkgIndex: number, field: keyof PoojaPackage, val: unknown) => {
    const updatedPkgs = entry.packages.map((p, idx) => {
      if (idx === pkgIndex) {
        return { ...p, [field]: val };
      }
      return p;
    });
    updateField("packages", updatedPkgs);
  };

  const handleRemovePackage = (pkgIndex: number) => {
    const updatedPkgs = entry.packages.filter((_, idx) => idx !== pkgIndex);
    updateField("packages", updatedPkgs);
  };

  const isTempleRitual = entry.type === "temple";

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
        entry.errors.length > 0
          ? "border-amber-300/80 bg-amber-50/20"
          : "border-slate-200 bg-white hover:border-saffron-200"
      }`}
    >
      {/* ── Collapsible Card Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-50 via-white to-amber-50/30 border-b border-slate-100 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center justify-center h-7 w-7 rounded-full bg-saffron-100 text-saffron-800 font-bold text-xs shrink-0">
            #{index + 1}
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-slate-900 text-sm truncate max-w-xs md:max-w-md">
                {entry.title || <span className="text-slate-400 italic">Untitled Puja</span>}
              </h4>

              {entry.hindiTitle && (
                <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
                  ({entry.hindiTitle})
                </span>
              )}

              {/* Ritual Type Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  isTempleRitual
                    ? "bg-amber-100/80 text-amber-900"
                    : "bg-blue-100/80 text-blue-900"
                }`}
              >
                {isTempleRitual ? (
                  <>
                    <Landmark className="h-3 w-3 text-amber-700" /> Temple Puja
                  </>
                ) : (
                  <>
                    <Home className="h-3 w-3 text-blue-700" /> Home Puja
                  </>
                )}
              </span>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                  entry.active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {entry.active ? "Active" : "Draft (Hidden)"}
              </span>

              {/* Validation Indicator */}
              {entry.errors.length > 0 ? (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md"
                  title={entry.errors.join("; ")}
                >
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                  {entry.errors.length} issue{entry.errors.length > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Ready
                </span>
              )}
            </div>

            <div className="text-[12px] text-slate-500 flex items-center gap-3 mt-0.5">
              <span>₹{entry.price || 0}</span>
              <span>•</span>
              <span>{entry.category || "Uncategorized"}</span>
              {isTempleRitual && entry.templeName && (
                <>
                  <span>•</span>
                  <span className="text-amber-800 font-medium truncate max-w-[180px]">
                    📍 {entry.templeName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg text-slate-500 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
            title="Duplicate this Puja entry"
          >
            <Copy className="h-4 w-4" />
          </button>

          {!isOnlyEntry && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remove this Puja entry"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* ── Collapsible Card Body ── */}
      {isExpanded && (
        <div className="p-5 space-y-5 bg-white">
          {/* Validation Errors Notice */}
          {entry.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Please complete the required details:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-900/90">
                  {entry.errors.map((err, errIdx) => (
                    <li key={errIdx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Row 1: Puja Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Puja Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={entry.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Mahamrityunjaya Jaap & Maha Hawan"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Puja Name (Hindi) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={entry.hindiTitle}
                onChange={(e) => updateField("hindiTitle", e.target.value)}
                placeholder="उदा. महामृत्युंजय जाप एवं महाहवन"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Row 2: Ritual Type & Associated Temple */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Ritual Type Segmented Toggle */}
            <div className={isTempleRitual ? "md:col-span-5" : "md:col-span-12"}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ritual Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => updateField("type", "temple")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    isTempleRitual
                      ? "bg-white text-saffron-900 shadow-xs border border-saffron-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5 text-saffron-600" />
                  Temple Puja
                </button>
                <button
                  type="button"
                  onClick={() => updateField("type", "home")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    !isTempleRitual
                      ? "bg-white text-blue-900 shadow-xs border border-blue-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Home className="h-3.5 w-3.5 text-blue-600" />
                  Home Puja
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {isTempleRitual
                  ? "Performed at temple. Devotee attends via Name & Gotra Sankalp."
                  : "Doorstep visit. Panditji visits devotee's home in person. No temple association."}
              </p>
            </div>

            {/* Associated Temple Dropdown (ONLY visible when Temple Puja is selected) */}
            {isTempleRitual && (
              <div className="md:col-span-7">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Associated Temple (Temple Management) <span className="text-red-500">*</span>
                </label>
                <select
                  value={entry.templeSlug || entry.templeId || ""}
                  onChange={(e) => handleTempleChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
                >
                  <option value="">-- Select Active Temple --</option>
                  {activeTemples.map((temple) => (
                    <option
                      key={temple.slug || temple._id || temple.id}
                      value={temple.slug || temple._id || temple.id}
                    >
                      {temple.name} {temple.city ? `(${temple.city})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Loaded from active temples in Temple Management.
                </p>
              </div>
            )}
          </div>

          {/* Row 3: Category, Prices & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                list={`categories-list-${entry.id}`}
                value={entry.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="Select or enter category"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
              <datalist id={`categories-list-${entry.id}`}>
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Starting Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={entry.price || ""}
                onChange={(e) => updateField("price", Number(e.target.value))}
                placeholder="1100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Original Price (₹) (Optional)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={entry.originalPrice || ""}
                onChange={(e) => updateField("originalPrice", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="2100"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={entry.duration}
                onChange={(e) => updateField("duration", e.target.value)}
                placeholder="45-60 mins"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Row 4: Scheduling & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Puja Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={entry.startDate || ""}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={entry.eventTime || ""}
                onChange={(e) => updateField("eventTime", e.target.value)}
                placeholder="09:00 AM IST"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Availability
              </label>
              <select
                value={entry.availability}
                onChange={(e) => updateField("availability", e.target.value as "open" | "closing_soon" | "full")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              >
                <option value="open">Open for Bookings</option>
                <option value="closing_soon">Closing Soon</option>
                <option value="full">Bookings Full</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Devotee Capacity
              </label>
              <input
                type="number"
                min="1"
                value={entry.capacity || 50}
                onChange={(e) => updateField("capacity", Number(e.target.value))}
                placeholder="50"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Row 5: Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Description
              </label>
              <textarea
                rows={2}
                value={entry.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Brief summary for listing cards and preview..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Ceremony Description (Optional)
              </label>
              <textarea
                rows={2}
                value={entry.fullDescription || ""}
                onChange={(e) => updateField("fullDescription", e.target.value)}
                placeholder="Comprehensive ritual significance, vidhi, and samagri..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Row 6: Image URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Featured Image URL
              </label>
              <input
                type="text"
                value={entry.imageUrl || ""}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                placeholder="https://... or /images/poojas/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Benefits & Inclusions (Comma or pipe | separated)
              </label>
              <input
                type="text"
                value={entry.benefits.join(" | ")}
                onChange={(e) =>
                  updateField(
                    "benefits",
                    e.target.value
                      .split(/[|,]/)
                      .map((b) => b.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Name & Gotra Sankalp | Prasad Delivery | Live Chanting"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-100 transition-all font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Advanced Section Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-saffron-700 hover:text-saffron-800 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options (Packages, SEO, Placements)"}
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 pt-3 border-t border-slate-100">
                {/* Packages Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-saffron-600" />
                      Puja Packages ({entry.packages.length})
                    </label>
                    <button
                      type="button"
                      onClick={handleAddPackage}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-saffron-700 hover:text-saffron-800 bg-saffron-50 hover:bg-saffron-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="h-3 w-3" /> Add Package
                    </button>
                  </div>

                  {entry.packages.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">
                      No custom tiers added. Standard tier at ₹{entry.price || 0} will be automatically assigned.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {entry.packages.map((pkg, pIdx) => (
                        <div
                          key={pkg.id || pIdx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200"
                        >
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handleUpdatePackage(pIdx, "name", e.target.value)}
                            placeholder="Package Name"
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                          <input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => handleUpdatePackage(pIdx, "price", Number(e.target.value))}
                            placeholder="Price"
                            className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                          <input
                            type="text"
                            value={pkg.description || ""}
                            onChange={(e) => handleUpdatePackage(pIdx, "description", e.target.value)}
                            placeholder="Description"
                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePackage(pIdx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SEO Meta */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      SEO Meta Title
                    </label>
                    <input
                      type="text"
                      value={entry.seoTitle || ""}
                      onChange={(e) => updateField("seoTitle", e.target.value)}
                      placeholder="e.g. Book Online Mahamrityunjaya Puja"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      SEO Meta Description
                    </label>
                    <input
                      type="text"
                      value={entry.seoDescription || ""}
                      onChange={(e) => updateField("seoDescription", e.target.value)}
                      placeholder="e.g. Participate in authentic Vedic ceremonies..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Display Placements & Publish Status */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-700">Display In:</span>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.showInCatalog}
                        onChange={(e) => updateField("showInCatalog", e.target.checked)}
                        className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                      />
                      Puja Catalog
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.showInHero}
                        onChange={(e) => updateField("showInHero", e.target.checked)}
                        className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                      />
                      Hero Carousel
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.showInHeroCard}
                        onChange={(e) => updateField("showInHeroCard", e.target.checked)}
                        className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                      />
                      Hero Featured Card
                    </label>
                  </div>

                  {/* Publish Status Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-semibold text-slate-700">Publish Immediately:</span>
                    <input
                      type="checkbox"
                      checked={entry.active}
                      onChange={(e) => updateField("active", e.target.checked)}
                      className="rounded border-slate-300 text-saffron-600 focus:ring-saffron-500"
                    />
                    <span className={`text-xs font-semibold ${entry.active ? "text-emerald-700" : "text-slate-500"}`}>
                      {entry.active ? "Active" : "Draft (Hidden)"}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

