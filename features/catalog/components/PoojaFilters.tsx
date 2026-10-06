"use client";

import { useMemo } from "react";
import { Search, X, ArrowUpDown, RotateCcw, SlidersHorizontal, Sparkles, ChevronDown } from "lucide-react";

export interface CategoryItem {
  name: string;
  count?: number;
}

export interface DeityItem {
  name: string;
  count?: number;
}

export interface PoojaFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: (string | CategoryItem)[];
  selectedType?: "all" | "temple" | "home";
  onTypeChange?: (type: "all" | "temple" | "home") => void;
  templeCount?: number;
  homeCount?: number;
  selectedDeity?: string;
  onDeityChange?: (deity: string) => void;
  deities?: DeityItem[];
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters?: () => void;
}

export function getDeityEmoji(deity: string): string {
  const d = deity.toLowerCase();
  if (d.includes("shiva") || d.includes("mahadev") || d.includes("rudra")) return "🔱";
  if (d.includes("ganesh") || d.includes("vinayak") || d.includes("vighnaharta")) return "🐘";
  if (d.includes("vishnu") || d.includes("narayan") || d.includes("jagannath")) return "🪷";
  if (d.includes("hanuman") || d.includes("bajrang") || d.includes("sankat")) return "🚩";
  if (d.includes("durga") || d.includes("kali") || d.includes("chandi") || d.includes("devi") || d.includes("shakti")) return "🌺";
  if (d.includes("lakshmi") || d.includes("laxmi") || d.includes("kuber") || d.includes("vaibhav")) return "🪙";
  if (d.includes("krishna") || d.includes("radha") || d.includes("gopal")) return "🪈";
  if (d.includes("ram") || d.includes("sita")) return "🏹";
  if (d.includes("shani")) return "⚖️";
  if (d.includes("navgraha") || d.includes("graha") || d.includes("surya")) return "☀️";
  if (d.includes("kartikeya") || d.includes("murugan")) return "🦚";
  if (d.includes("saraswati")) return "🪕";
  return "🕉️";
}

export function getCategoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("dosha") || c.includes("dosh")) return "🪐";
  if (c.includes("rashi") || c.includes("horoscope")) return "♈";
  if (c.includes("festival") || c.includes("utsav") || c.includes("special")) return "🪔";
  if (c.includes("career") || c.includes("business") || c.includes("vyapar")) return "💼";
  if (c.includes("health") || c.includes("ayush") || c.includes("aarogya")) return "🌿";
  if (c.includes("vivah") || c.includes("marriage") || c.includes("family")) return "💍";
  if (c.includes("pitra") || c.includes("shradh") || c.includes("tarpan")) return "🌾";
  if (c.includes("griha") || c.includes("vastu") || c.includes("house")) return "🏡";
  if (c.includes("navgraha") || c.includes("shanti")) return "☀️";
  if (c.includes("yagya") || c.includes("havan")) return "🔥";
  if (c.includes("wealth") || c.includes("prosperity") || c.includes("laxmi")) return "🪙";
  return "🕉️";
}

export default function PoojaFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedType = "all",
  onTypeChange,
  templeCount = 0,
  homeCount = 0,
  selectedDeity = "all",
  onDeityChange,
  deities = [],
  sortBy = "recommended",
  onSortChange,
  totalCount,
  filteredCount,
  onResetFilters,
}: PoojaFiltersProps) {
  // Normalize categories to object format
  const normalizedCategories = useMemo<CategoryItem[]>(() => {
    return categories.map((c) => (typeof c === "string" ? { name: c } : c));
  }, [categories]);

  const hasActiveFilters = Boolean(
    search.trim() ||
    selectedCategory !== "all" ||
    selectedType !== "all" ||
    selectedDeity !== "all" ||
    sortBy !== "recommended"
  );

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onSearchChange("");
      onCategoryChange("all");
      if (onTypeChange) onTypeChange("all");
      if (onDeityChange) onDeityChange("all");
      if (onSortChange) onSortChange("recommended");
    }
  };

  return (
    <div className="mb-8 space-y-3">
      {/* ── Main Filter Console Card (No Horizontal Sliding Bars) ── */}
      <div className="rounded-3xl border border-saffron-200/90 bg-white/95 p-4 sm:p-5 shadow-card backdrop-blur-sm space-y-3.5">
        {/* Row 1: Search Bar & Live Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-saffron-600/70" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search pujas by name, deity (Shiva, Ganesha...), dosha, benefit..."
              className="w-full rounded-2xl border border-saffron-200 bg-cream/30 pl-10 pr-9 py-2.5 text-xs text-ink placeholder:text-ink-soft/60 shadow-xs focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-200 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear search text"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-1 rounded-full hover:bg-saffron-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold text-ink-soft shrink-0">
            <span>
              Showing <strong className="text-saffron-800 font-bold">{filteredCount}</strong> of {totalCount} ceremonies
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition-all"
                title="Reset all filters"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Clean Controls Toolbar (Segmented Tabs + Dropdowns) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-saffron-100/80">
          {/* Ritual Type Segmented Control */}
          {onTypeChange && (
            <div className="inline-flex rounded-2xl bg-cream/70 p-1 border border-saffron-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => onTypeChange("all")}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedType === "all"
                    ? "bg-white text-saffron-900 shadow-xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("temple")}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedType === "temple"
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span>🛕 Temple</span>
                {templeCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedType === "temple" ? "bg-white/25 text-white" : "bg-saffron-100 text-saffron-800"
                  }`}>
                    {templeCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => onTypeChange("home")}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedType === "home"
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-xs font-bold"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span>🏠 Home</span>
                {homeCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedType === "home" ? "bg-white/25 text-white" : "bg-saffron-100 text-saffron-800"
                  }`}>
                    {homeCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={`appearance-none rounded-2xl border px-3.5 py-2 pr-8 text-xs font-bold transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 ${
                selectedCategory !== "all"
                  ? "border-saffron-500 bg-saffron-50 text-saffron-900 ring-1 ring-saffron-400"
                  : "border-saffron-200 bg-white text-ink hover:border-saffron-400"
              }`}
            >
              <option value="all">📁 All Categories ({totalCount})</option>
              {normalizedCategories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {getCategoryEmoji(cat.name)} {cat.name} {typeof cat.count === "number" ? `(${cat.count})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-saffron-600" />
          </div>

          {/* Presiding Deity Dropdown */}
          {onDeityChange && deities.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                value={selectedDeity}
                onChange={(e) => onDeityChange(e.target.value)}
                className={`appearance-none rounded-2xl border px-3.5 py-2 pr-8 text-xs font-bold transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 ${
                  selectedDeity !== "all"
                    ? "border-purple-500 bg-purple-50 text-purple-900 ring-1 ring-purple-400"
                    : "border-saffron-200 bg-white text-ink hover:border-saffron-400"
                }`}
              >
                <option value="all">🔱 All Deities</option>
                {deities.map((d) => (
                  <option key={d.name} value={d.name}>
                    {getDeityEmoji(d.name)} {d.name} {typeof d.count === "number" ? `(${d.count})` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-purple-600" />
            </div>
          )}

          {/* Sort Dropdown */}
          {onSortChange && (
            <div className="relative inline-flex items-center">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none rounded-2xl border border-saffron-200 bg-white px-3.5 py-2 pr-8 text-xs font-bold text-ink transition-all shadow-2xs cursor-pointer hover:border-saffron-400 focus:outline-none focus:ring-2 focus:ring-saffron-200"
              >
                <option value="recommended">✨ Recommended</option>
                <option value="price-asc">💰 Price: Low to High</option>
                <option value="price-desc">💎 Price: High to Low</option>
                <option value="name-asc">🔤 Name: A to Z</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-saffron-600" />
            </div>
          )}
        </div>

        {/* Row 3: Active Filter Chips (Removable Badges) */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-saffron-100/80 text-xs">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider mr-1">
              Active:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-100 px-2.5 py-1 text-xs font-semibold text-saffron-900">
                <span>Keyword: &ldquo;{search}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="hover:text-red-600"
                  aria-label="Remove search filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedType !== "all" && onTypeChange && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-100 px-2.5 py-1 text-xs font-semibold text-saffron-900">
                <span>Type: {selectedType === "temple" ? "🛕 Temple" : "🏠 Home"}</span>
                <button
                  type="button"
                  onClick={() => onTypeChange("all")}
                  className="hover:text-red-600"
                  aria-label="Remove type filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-100 px-2.5 py-1 text-xs font-semibold text-saffron-900">
                <span>{getCategoryEmoji(selectedCategory)} {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => onCategoryChange("all")}
                  className="hover:text-red-600"
                  aria-label="Remove category filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {selectedDeity !== "all" && onDeityChange && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-900">
                <span>{getDeityEmoji(selectedDeity)} {selectedDeity}</span>
                <button
                  type="button"
                  onClick={() => onDeityChange("all")}
                  className="hover:text-red-600"
                  aria-label="Remove deity filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {sortBy !== "recommended" && onSortChange && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                <span>
                  Sorted:{" "}
                  {sortBy === "price-asc"
                    ? "Price Low→High"
                    : sortBy === "price-desc"
                    ? "Price High→Low"
                    : "Name A→Z"}
                </span>
                <button
                  type="button"
                  onClick={() => onSortChange("recommended")}
                  className="hover:text-red-600"
                  aria-label="Reset sort"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-bold text-red-600 hover:text-red-800 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

