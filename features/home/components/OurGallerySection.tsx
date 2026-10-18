"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Sparkles, Image as ImageIcon } from "lucide-react";
import type { GalleryItem } from "@/lib/gallery-types";
import { fetchPublicGallery } from "@/lib/api";
import { useBookingModal, useI18n } from "@/components/providers";
import GalleryCard, { type GalleryCardOpenOptions } from "@/components/gallery/GalleryCard";
import GalleryModal from "@/components/gallery/GalleryModal";

export default function OurGallerySection() {
  const { t } = useI18n();
  const { openBooking } = useBookingModal();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [modalOptions, setModalOptions] = useState<GalleryCardOpenOptions | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function loadHomepageGallery() {
      try {
        const res = await fetchPublicGallery({ homepage: true });
        if (active && res.ok && Array.isArray(res.items)) {
          setItems(res.items);
        }
      } catch (err) {
        console.error("Failed to load homepage gallery:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadHomepageGallery();

    const handleCatalogUpdate = () => {
      loadHomepageGallery();
    };
    window.addEventListener("catalog-updated", handleCatalogUpdate);

    return () => {
      active = false;
      window.removeEventListener("catalog-updated", handleCatalogUpdate);
    };
  }, []);

  // Clean empty state if no active items marked for homepage
  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <section id="gallery" className="py-14 sm:py-20 bg-[#FFFDF9] border-t border-saffron-100/60">
      <div className="container-px">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-14">
          <span className="eyebrow inline-flex items-center gap-1.5 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
            <span>Sacred Visual Darshan</span>
          </span>

          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl">
            Our Gallery
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
            Explore the beautiful moments of our puja ceremonies, traditions, and devotion.
          </p>
        </div>

        {/* Dynamic Gallery Grid (4–6 Cards) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl sm:rounded-3xl border border-saffron-100 bg-white/60 p-4 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full h-44 rounded-xl bg-saffron-50/70" />
                <div className="space-y-2 mt-3">
                  <div className="h-4 w-3/4 rounded bg-saffron-100/60" />
                  <div className="h-3 w-1/2 rounded bg-saffron-50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {items.map((item, idx) => (
              <GalleryCard
                key={item.id || item._id}
                item={item}
                priority={idx < 2}
                onOpen={(it, opts) => {
                  setSelectedItem(it);
                  setModalOptions(opts);
                }}
              />
            ))}
          </div>
        )}

        {/* Action Row: View All & Book Puja CTA */}
        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <Link
            href="/our-gallery"
            className="btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-sm font-bold shadow-md shadow-saffron-600/20"
          >
            <span>View All Photos & Videos</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => openBooking()}
            className="btn-outline inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-sm font-bold bg-white"
          >
            <Calendar className="h-4 w-4 text-saffron-600" />
            <span>Book Your Puja</span>
          </button>
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
    </section>
  );
}
