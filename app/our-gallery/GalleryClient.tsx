"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Film,
  Layers,
  Search,
  Sparkles,
  Calendar,
  X,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import type { GalleryItem, GalleryMediaType } from "@/lib/gallery-types";
import { GALLERY_CATEGORIES } from "@/lib/gallery-types";
import { fetchPublicGallery } from "@/lib/api";
import dynamic from "next/dynamic";
import { useBookingModal, useI18n } from "@/components/providers";
import GalleryCard, { type GalleryCardOpenOptions } from "@/components/gallery/GalleryCard";
import { trackCustomEvent } from "@/lib/meta-pixel";

const GalleryModal = dynamic(() => import("@/components/gallery/GalleryModal"), {
  ssr: false,
});

const PAGE_SIZE = 9;

export default function GalleryClient() {
  const { t } = useI18n();
  const { openBooking } = useBookingModal();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [mediaFilter, setMediaFilter] = useState<"all" | GalleryMediaType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination / Load more
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Lightbox / Video Modal state
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [modalOptions, setModalOptions] = useState<GalleryCardOpenOptions | undefined>(undefined);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchPublicGallery();
      if (res.ok && Array.isArray(res.items)) {
        setItems(res.items);
      } else {
        setError(res.error || "Failed to load gallery items");
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading gallery");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
    trackCustomEvent("GalleryView");

    const handleCatalogUpdate = () => {
      loadGallery();
    };
    window.addEventListener("catalog-updated", handleCatalogUpdate);

    return () => {
      window.removeEventListener("catalog-updated", handleCatalogUpdate);
    };
  }, []);

  // Filter items client-side for instantaneous reactive filtering
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Media type filter
      if (mediaFilter !== "all" && item.mediaType !== mediaFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "all" && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) {
          return false;
        }
      }
      return true;
    });
  }, [items, mediaFilter, categoryFilter, searchQuery]);

  // Paginated slice
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const hasMore = visibleCount < filteredItems.length;

  const photoCount = useMemo(() => items.filter((i) => i.mediaType === "photo").length, [items]);
  const videoCount = useMemo(() => items.filter((i) => i.mediaType === "video").length, [items]);

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-32 sm:pb-36">
      {/* Top Breadcrumb & Hero */}
      <div className="relative overflow-hidden bg-gradient-to-b from-saffron-50/80 via-cream to-[#FFFDF9] pt-8 pb-12 sm:pt-12 sm:pb-16 border-b border-saffron-100/70">
        <div className="container-px">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-saffron-800 hover:text-saffron-950 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow inline-flex items-center gap-1.5 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
              <span>Divine Moments & Holy Darshan</span>
            </span>

            {/* Exact Heading */}
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
              Our Gallery
            </h1>

            {/* Exact Supporting Text */}
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
              Explore the beautiful moments of our puja ceremonies, traditions, and devotion.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container-px pt-8 sm:pt-10">
        {/* Controls Bar: Media Type Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Media Type Tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-saffron-100/50 p-1 border border-saffron-200/80 self-start">
            <button
              type="button"
              onClick={() => {
                setMediaFilter("all");
                setVisibleCount(PAGE_SIZE);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                mediaFilter === "all"
                  ? "bg-white text-saffron-800 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Media ({items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMediaFilter("photo");
                setVisibleCount(PAGE_SIZE);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                mediaFilter === "photo"
                  ? "bg-white text-saffron-800 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Camera className="h-3.5 w-3.5" />
              <span>Photos ({photoCount})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMediaFilter("video");
                setVisibleCount(PAGE_SIZE);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                mediaFilter === "video"
                  ? "bg-white text-saffron-800 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Videos ({videoCount})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search ceremonies..."
              className="w-full rounded-2xl border border-saffron-200/80 bg-white pl-10 pr-9 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/40 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-8 pb-1">
          <button
            type="button"
            onClick={() => {
              setCategoryFilter("all");
              setVisibleCount(PAGE_SIZE);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              categoryFilter === "all"
                ? "bg-saffron-600 text-white shadow-xs"
                : "border border-saffron-200/90 bg-white text-ink-soft hover:border-saffron-400 hover:text-ink"
            }`}
          >
            All Categories
          </button>

          {GALLERY_CATEGORIES.map((cat) => {
            const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryFilter(isSelected ? "all" : cat);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-saffron-600 text-white shadow-xs"
                    : "border border-saffron-200/90 bg-white text-ink-soft hover:border-saffron-400 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl sm:rounded-3xl border border-saffron-100 bg-white/70 p-4 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full h-48 rounded-xl bg-saffron-50" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 w-3/4 rounded bg-saffron-100/60" />
                  <div className="h-3 w-1/2 rounded bg-saffron-50" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-red-200 bg-red-50/40 p-10 text-center">
            <p className="text-sm font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={loadGallery}
              className="btn-primary mt-4 !py-2 !px-4 !text-xs"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-dashed border-saffron-200 bg-saffron-50/30 p-12 text-center max-w-md mx-auto">
            <span className="text-4xl block mb-3">🪔</span>
            <h3 className="font-display text-lg font-bold text-ink">
              No gallery items found
            </h3>
            <p className="text-xs sm:text-sm text-ink-soft mt-1.5 leading-relaxed">
              No photos or videos match your selected filter criteria. Try changing categories or clearing the search.
            </p>
            {(mediaFilter !== "all" || categoryFilter !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setMediaFilter("all");
                  setCategoryFilter("all");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-xl border border-saffron-300 bg-white px-4 py-2 text-xs font-bold text-saffron-800 hover:bg-saffron-50 shadow-xs"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {displayedItems.map((item, idx) => (
                <GalleryCard
                  key={item.id || item._id}
                  item={item}
                  priority={idx < 3}
                  onOpen={(it, opts) => {
                    setSelectedItem(it);
                    setModalOptions(opts);
                  }}
                />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="btn-outline inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold bg-white"
                >
                  <span>Load More Moments ({filteredItems.length - visibleCount} remaining)</span>
                  <ChevronDown className="h-4 w-4 text-saffron-600" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Bottom Devotion Callout */}
        <div className="mt-16 sm:mt-20 rounded-3xl border border-saffron-200 bg-gradient-to-r from-saffron-50 via-cream to-amber-50 p-6 sm:p-10 text-center max-w-3xl mx-auto shadow-sm">
          <span className="text-3xl block mb-2">🕉️</span>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
            Experience the Blessings of Authentic Vedic Rituals
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-ink-soft max-w-xl mx-auto leading-relaxed">
            All rituals showcased are conducted by certified Vedic Pandits with authentic samagri and personalized gotra sankalp. Book your sacred puja ceremony online in minutes.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openBooking()}
              className="btn-primary !py-2.5 !px-6 !text-xs sm:!text-sm inline-flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span>Book Your Puja</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Video Modal */}
      <GalleryModal
        item={selectedItem}
        initialTab={modalOptions?.initialTab}
        initialPhotoIndex={modalOptions?.photoIndex}
        onClose={() => {
          setSelectedItem(null);
          setModalOptions(undefined);
        }}
      />
    </div>
  );
}
