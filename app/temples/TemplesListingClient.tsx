"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Clock, MapPin, Search, Sparkles, X } from "lucide-react";
import {
  activeTemples,
  getLocalizedTempleDescription,
  getLocalizedTempleName,
  type Temple,
} from "@/lib/data";
import { useCatalog } from "@/features/catalog";
import { useI18n } from "@/components/providers";
import { TempleImage } from "@/components/common";

interface TemplesListingClientProps {
  initialTemples: Temple[];
}

export default function TemplesListingClient({ initialTemples }: TemplesListingClientProps) {
  const { temples: catalogTemples } = useCatalog();
  const { t, locale } = useI18n();

  // Use live catalog if loaded and has temples, else fallback to initial SSR data
  const templesList = useMemo(() => {
    const source = catalogTemples && catalogTemples.length > 0 ? catalogTemples : initialTemples;
    return activeTemples(source);
  }, [catalogTemples, initialTemples]);

  const [search, setSearch] = useState("");
  const [selectedDeity, setSelectedDeity] = useState<string>("all");

  const availableDeities = useMemo(() => {
    const set = new Set<string>();
    templesList.forEach((t) => {
      if (t.deity) set.add(t.deity.trim());
      if (t.deities && Array.isArray(t.deities)) {
        t.deities.forEach((d) => d && set.add(d.trim()));
      }
    });
    return Array.from(set);
  }, [templesList]);

  const filteredTemples = useMemo(() => {
    const q = search.toLowerCase().trim();
    return templesList.filter((temple) => {
      const matchSearch =
        !q ||
        temple.name.toLowerCase().includes(q) ||
        (temple.hindiName && temple.hindiName.toLowerCase().includes(q)) ||
        (temple.teluguName && temple.teluguName.toLowerCase().includes(q)) ||
        (temple.tamilName && temple.tamilName.toLowerCase().includes(q)) ||
        temple.deity.toLowerCase().includes(q) ||
        temple.city.toLowerCase().includes(q) ||
        temple.state.toLowerCase().includes(q) ||
        (temple.description && temple.description.toLowerCase().includes(q));

      const matchDeity =
        selectedDeity === "all" ||
        temple.deity.toLowerCase() === selectedDeity.toLowerCase() ||
        (temple.deities && temple.deities.some((d) => d.toLowerCase() === selectedDeity.toLowerCase()));

      return matchSearch && matchDeity;
    });
  }, [templesList, search, selectedDeity]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 pt-24 sm:pt-36 md:pt-44 lg:pt-48">
      <div className="container-px mx-auto max-w-6xl space-y-8">
        {/* Hero / Header Section */}
        <div className="rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-amber-500/10 via-saffron-50 to-orange-50/40 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-saffron-300 bg-white/80 px-3.5 py-1 text-xs font-bold text-saffron-800 shadow-xs backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
              <span>{t("temples.verifiedShrine")}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-ink">
              {t("temples.pageTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
              {t("temples.pageSubtitle")}
            </p>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="rounded-2xl border border-saffron-200/80 bg-white p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("temples.searchPlaceholder")}
                className="w-full rounded-xl border border-saffron-200 bg-cream/20 pl-10 pr-9 py-2.5 text-xs text-ink placeholder:text-ink-soft/50 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft/50 hover:text-ink cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Deity Filter Dropdown */}
            {availableDeities.length > 0 && (
              <div className="sm:w-64">
                <select
                  value={selectedDeity}
                  onChange={(e) => setSelectedDeity(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all cursor-pointer"
                >
                  <option value="all">{t("temples.allTemples")}</option>
                  {availableDeities.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Temple Cards Grid */}
        {filteredTemples.length === 0 ? (
          <div className="rounded-3xl border border-saffron-200 bg-white p-12 text-center space-y-3">
            <Building2 className="mx-auto h-10 w-10 text-saffron-400" />
            <p className="text-sm font-bold text-ink">{t("temples.noTemples")}</p>
            {(search || selectedDeity !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedDeity("all");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-50 px-4 py-2 text-xs font-bold text-saffron-700 hover:bg-saffron-100 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemples.map((temple) => {
              const displayName = getLocalizedTempleName(temple, locale);
              const displayDesc = getLocalizedTempleDescription(temple, locale);

              return (
                <div
                  key={temple.slug}
                  className="group rounded-3xl border border-saffron-200/80 bg-white overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Temple Photograph Banner */}
                    <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                      <TempleImage
                        src={temple.image}
                        alt={displayName}
                        className="h-full w-full"
                        imgClassName="group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Location Badge */}
                      <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-slate-950/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/10 shadow-xs">
                        <MapPin className="h-3 w-3 text-saffron-400 shrink-0" />
                        <span>
                          {temple.city}, {temple.state}
                        </span>
                      </div>

                      {/* Associated Sevas Count */}
                      {temple.poojaSlugs && temple.poojaSlugs.length > 0 && (
                        <div className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-saffron-600/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-extrabold text-white shadow-xs">
                          <span>{temple.poojaSlugs.length} Sevas</span>
                        </div>
                      )}
                    </div>

                    {/* Temple Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-saffron-700 mb-1">
                          <Building2 className="h-3.5 w-3.5 text-saffron-600" />
                          <span>{temple.deity}</span>
                        </div>
                        <h2 className="font-display text-lg font-bold text-ink leading-snug group-hover:text-saffron-700 transition-colors">
                          {displayName}
                        </h2>
                      </div>

                      {temple.timings && (
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-soft bg-saffron-50/70 border border-saffron-100/80 rounded-xl px-2.5 py-1.5 font-medium">
                          <Clock className="h-3.5 w-3.5 text-saffron-600 shrink-0" />
                          <span className="line-clamp-1">{temple.timings}</span>
                        </div>
                      )}

                      <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                        {displayDesc}
                      </p>
                    </div>
                  </div>

                  {/* Footer & CTA */}
                  <div className="p-5 pt-0">
                    <Link
                      href={`/temples/${temple.slug}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white font-bold text-xs py-2.5 shadow-md shadow-saffron-500/15 transition-all group-hover:shadow-lg"
                    >
                      <span>{t("temples.viewDetails")}</span>
                      <span aria-hidden="true" className="group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
