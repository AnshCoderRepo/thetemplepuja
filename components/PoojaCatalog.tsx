"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, Filter, Search, Sparkles, X } from "lucide-react";
import Reveal from "./Reveal";
import {
  activePoojas,
  getLocalizedPoojaTitle,
  getLocalizedPoojaNativeBadge,
  getLocalizedPoojaDescription,
  getLocalizedPoojaBenefits,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useCatalog } from "./useCatalog";
import { useI18n } from "./I18nProvider";

export default function PoojaCatalog({ notice }: { notice?: string }) {
  // Static defaults on first render (SSR-safe); swaps to the server catalog.
  // Inactive poojas (admin toggle) are hidden from visitors.
  const { poojas } = useCatalog();
  const { locale, t } = useI18n();
  const list = activePoojas(poojas);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Extract unique categories dynamically from the active list
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of list) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set);
  }, [list]);

  // Filter list by search query and selected category
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return list.filter((p) => {
      const locTitle = getLocalizedPoojaTitle(p, locale).toLowerCase();
      const locDesc = getLocalizedPoojaDescription(p, locale).toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.hindiTitle && p.hindiTitle.toLowerCase().includes(q)) ||
        (p.teluguTitle && p.teluguTitle.toLowerCase().includes(q)) ||
        (p.tamilTitle && p.tamilTitle.toLowerCase().includes(q)) ||
        locTitle.includes(q) ||
        p.description.toLowerCase().includes(q) ||
        locDesc.includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.deities && p.deities.some((d) => d.toLowerCase().includes(q)));

      const matchesCategory =
        selectedCategory === "all" ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [list, search, selectedCategory, locale]);

  return (
    <div className="container-px pb-24">
      {notice && (
        <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center text-sm font-medium text-amber-800">
          {notice}
        </div>
      )}

      {/* Interactive Filter Bar */}
      <div className="mb-10 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-saffron-600/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by puja name, deity, or purpose..."
              className="w-full rounded-2xl border border-saffron-200 bg-white pl-10 pr-9 py-2.5 text-xs text-ink placeholder:text-ink-soft/50 shadow-sm focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs font-semibold text-ink-soft">
            Showing <span className="font-bold text-saffron-800">{filtered.length}</span> of {list.length} sacred ceremonies
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              selectedCategory === "all"
                ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/20"
                : "border border-saffron-100 bg-white text-ink-soft hover:bg-saffron-50 hover:text-saffron-800"
            }`}
          >
            All Pujas ({list.length})
          </button>
          {categories.map((cat) => {
            const count = list.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/20"
                    : "border border-saffron-100 bg-white text-ink-soft hover:bg-saffron-50 hover:text-saffron-800"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Pujas */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-saffron-200 bg-white p-12 text-center">
          <span className="text-3xl mb-2 block">🪔</span>
          <h3 className="text-base font-bold text-ink">No pujas found</h3>
          <p className="text-xs text-ink-soft mt-1 max-w-sm mx-auto">
            We couldn&apos;t find any puja matching your current search or category filter. Try clearing filters or search term.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-saffron-600 hover:underline"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 3) * 80}>
              <Link
                href={`/book/${p.slug}`}
                className="group card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft"
              >
                <div className={`relative h-28 bg-gradient-to-br ${p.gradient}`}>
                  <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
                  <span className="absolute right-5 top-4 text-4xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
                    {p.emoji}
                  </span>
                  <span className="absolute left-5 top-4 text-sm font-semibold text-white/90">
                    {getLocalizedPoojaNativeBadge(p, locale)}
                  </span>
                  <span className="absolute bottom-3 left-5 flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Clock className="h-3.5 w-3.5" />
                    {p.duration}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-display text-lg font-bold text-ink leading-snug">
                      {getLocalizedPoojaTitle(p, locale)}
                    </h3>
                  </div>
                  {p.category && (
                    <span className="inline-block self-start rounded-full bg-cream px-2.5 py-0.5 text-[10px] font-bold text-saffron-800 border border-saffron-100 mb-2">
                      {p.category}
                    </span>
                  )}
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-ink-soft">
                    {getLocalizedPoojaDescription(p, locale)}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {getLocalizedPoojaBenefits(p, locale).slice(0, 2).map((b) => (
                      <li
                        key={b}
                        className="rounded-full bg-saffron-50 px-2.5 py-1 text-[10px] font-semibold text-saffron-700"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center justify-between border-t border-dashed border-saffron-100 pt-4">
                    <div>
                      <span className="font-display text-xl font-bold text-saffron-600">
                        {formatINR(p.price)}
                      </span>
                      <span className="text-[11px] font-medium text-ink-soft/60"> onwards</span>
                    </div>
                    <span className="btn-primary !px-5 !py-2.5 text-xs">
                      {t("hero.cta.book") || "Book Now"}
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
