"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/common";
import {
  activePoojas,
  getLocalizedPoojaDescription,
  getLocalizedPoojaTitle,
} from "@/lib/data";
import { useI18n } from "@/components/providers";
import { useCatalog } from "../hooks/useCatalog";
import PoojaCard from "./PoojaCard";
import PoojaFilters from "./PoojaFilters";

export interface PoojaCatalogProps {
  notice?: string;
  limit?: number;
  showViewAll?: boolean;
  viewAllHref?: string;
}

export default function PoojaCatalog({
  notice,
  limit,
  showViewAll = false,
  viewAllHref = "/book",
}: PoojaCatalogProps) {
  const { poojas } = useCatalog();
  const { locale } = useI18n();
  const list = activePoojas(poojas);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "temple" | "home">("all");
  const [selectedDeity, setSelectedDeity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Dynamic categories with live counts from active catalog
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    list.forEach((p) => {
      if (p.category && p.category.trim()) {
        const cat = p.category.trim();
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [list]);

  // Dynamic deities with live counts
  const deities = useMemo(() => {
    const map = new Map<string, number>();
    list.forEach((p) => {
      if (p.deities && Array.isArray(p.deities)) {
        p.deities.forEach((d) => {
          if (d && d.trim()) {
            const deity = d.trim();
            map.set(deity, (map.get(deity) || 0) + 1);
          }
        });
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [list]);

  const templeCount = useMemo(() => {
    return list.filter((p) => p.type === "temple" || !p.type).length;
  }, [list]);

  const homeCount = useMemo(() => {
    return list.filter((p) => p.type === "home").length;
  }, [list]);

  const hasActiveFilters = Boolean(
    search.trim() ||
    selectedCategory !== "all" ||
    selectedType !== "all" ||
    selectedDeity !== "all" ||
    sortBy !== "recommended"
  );

  const resetAllFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedDeity("all");
    setSortBy("recommended");
  };

  const filteredPoojas = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result = list.filter((p) => {
      const locTitle = getLocalizedPoojaTitle(p, locale).toLowerCase();
      const locDesc = getLocalizedPoojaDescription(p, locale).toLowerCase();

      const matchesSearch =
        !q ||
        locTitle.includes(q) ||
        locDesc.includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.hindiTitle.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q)) ||
        (p.deities && p.deities.some((d) => d.toLowerCase().includes(q))) ||
        (p.category && p.category.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "all" ||
        (p.category && p.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim());

      const matchesType =
        selectedType === "all" ||
        (selectedType === "temple" && (p.type === "temple" || !p.type)) ||
        (selectedType === "home" && p.type === "home");

      const matchesDeity =
        selectedDeity === "all" ||
        (p.deities && p.deities.some((d) => d.toLowerCase().trim() === selectedDeity.toLowerCase().trim()));

      return matchesSearch && matchesCategory && matchesType && matchesDeity;
    });

    if (sortBy === "price-asc") {
      result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [list, search, selectedCategory, selectedType, selectedDeity, sortBy, locale]);

  // When filters are active, do not cap by homepage limit so devotee sees complete results
  const displayedPoojas = limit && !hasActiveFilters ? filteredPoojas.slice(0, limit) : filteredPoojas;

  return (
    <div className="container-px">
      {notice && (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200/60 p-4 text-center text-xs text-amber-900 font-medium">
          {notice}
        </div>
      )}

      <PoojaFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        templeCount={templeCount}
        homeCount={homeCount}
        selectedDeity={selectedDeity}
        onDeityChange={setSelectedDeity}
        deities={deities}
        sortBy={sortBy}
        onSortChange={setSortBy}
        totalCount={list.length}
        filteredCount={displayedPoojas.length}
        onResetFilters={resetAllFilters}
      />

      {filteredPoojas.length === 0 ? (
        <div className="rounded-3xl border border-saffron-200/80 bg-white p-10 md:p-14 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-saffron-50 text-3xl shadow-inner border border-saffron-100">
            🪔
          </div>
          <h3 className="mt-4 font-display text-xl font-bold text-ink">
            No Sacred Ceremonies Match Your Filter
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-ink-soft leading-relaxed">
            We couldn&apos;t find ceremonies matching your current filters. Try searching for other sacred rituals or reset filters.
          </p>

          {/* Quick suggestions */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold text-ink-soft">Popular suggestions:</span>
            {["Rudrabhishek", "Satyanarayan Katha", "Mahamrityunjaya", "Ganesh Puja", "Lord Shiva"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  resetAllFilters();
                  setSearch(term);
                }}
                className="rounded-xl border border-saffron-200 bg-cream/50 px-2.5 py-1 text-xs font-semibold text-saffron-900 hover:bg-saffron-100 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2.5 text-xs font-bold text-white shadow-soft hover:shadow-glow transition-all"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayedPoojas.map((pooja, index) => (
              <Reveal key={pooja.slug} delay={Math.min(index * 50, 300)}>
                <PoojaCard pooja={pooja} />
              </Reveal>
            ))}
          </div>

          {showViewAll && !hasActiveFilters && (
            <div className="mt-12 flex flex-col items-center justify-center text-center">
              <Link
                href={viewAllHref}
                id="view-all-poojas-btn"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-saffron-500 via-saffron-600 to-amber-600 px-8 py-4 text-base font-bold text-white shadow-soft transition-all duration-300 hover:scale-[1.02] hover:shadow-glow active:scale-[0.98]"
              >
                <span>View All Sacred Poojas</span>
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">
                  {list.length > 10 ? `${list.length}+` : "35+"} Poojas
                </span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <p className="mt-2.5 text-xs text-ink-soft">
                Explore our complete sacred collection of dosha nivaran, prosperity & festival rituals
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
