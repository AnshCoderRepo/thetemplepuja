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

  const categories = useMemo(() => {
    const set = new Set<string>();
    list.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [list]);

  const filteredPoojas = useMemo(() => {
    const q = search.toLowerCase().trim();
    return list.filter((p) => {
      const locTitle = getLocalizedPoojaTitle(p, locale).toLowerCase();
      const locDesc = getLocalizedPoojaDescription(p, locale).toLowerCase();

      const matchesSearch =
        !q ||
        locTitle.includes(q) ||
        locDesc.includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.hindiTitle.toLowerCase().includes(q) ||
        (p.deities && p.deities.some((d) => d.toLowerCase().includes(q))) ||
        (p.category && p.category.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [list, search, selectedCategory, locale]);

  const displayedPoojas = limit ? filteredPoojas.slice(0, limit) : filteredPoojas;

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
        totalCount={list.length}
        filteredCount={displayedPoojas.length}
      />

      {filteredPoojas.length === 0 ? (
        <div className="rounded-3xl border border-saffron-100 bg-white p-12 text-center shadow-card">
          <span className="text-4xl">🔍</span>
          <h3 className="mt-4 font-display text-lg font-bold text-ink">
            No Poojas Match Your Search
          </h3>
          <p className="mt-1 text-xs text-ink-soft">
            Try clearing filters or searching for keywords like &quot;Satyanarayan&quot;, &quot;Rudrabhishek&quot;, or &quot;Ganesha&quot;.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCategory("all");
            }}
            className="mt-4 inline-flex rounded-xl bg-saffron-500 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-saffron-600"
          >
            Clear Filters
          </button>
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

          {showViewAll && (
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
