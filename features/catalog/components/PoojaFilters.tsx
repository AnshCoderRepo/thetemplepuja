"use client";

import { Search, X } from "lucide-react";

export interface PoojaFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  totalCount: number;
  filteredCount: number;
}

export default function PoojaFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalCount,
  filteredCount,
}: PoojaFiltersProps) {
  return (
    <div className="mb-10 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-saffron-600/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by puja name, deity, or purpose..."
            className="w-full rounded-2xl border border-saffron-200 bg-white pl-10 pr-9 py-2.5 text-xs text-ink placeholder:text-ink-soft/50 shadow-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs font-semibold text-ink-soft">
          Showing <span className="font-bold text-saffron-800">{filteredCount}</span> of {totalCount} sacred ceremonies
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            selectedCategory === "all"
              ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/20"
              : "border border-saffron-100 bg-white text-ink-soft hover:bg-saffron-50 hover:text-saffron-800"
          }`}
        >
          All Pujas ({totalCount})
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/20"
                  : "border border-saffron-100 bg-white text-ink-soft hover:bg-saffron-50 hover:text-saffron-800"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
