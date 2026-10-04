"use client";

import { useMemo, useState } from "react";
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
}

export default function PoojaCatalog({ notice }: PoojaCatalogProps) {
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
        filteredCount={filteredPoojas.length}
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPoojas.map((pooja, index) => (
            <Reveal key={pooja.slug} delay={Math.min(index * 50, 300)}>
              <PoojaCard pooja={pooja} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
