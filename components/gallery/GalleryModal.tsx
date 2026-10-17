"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X, Sparkles, ExternalLink, Play, Calendar } from "lucide-react";
import type { GalleryItem } from "@/lib/gallery-types";
import { useBookingModal } from "@/components/providers";

interface GalleryModalProps {
  item: GalleryItem | null;
  onClose: () => void;
}

export default function GalleryModal({ item, onClose }: GalleryModalProps) {
  const { openBooking } = useBookingModal();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!item) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  const isVideo = item.mediaType === "video";
  const hasYouTube = Boolean(isVideo && item.youtubeVideoId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        ref={modalRef}
        className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-white shadow-2xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-saffron-100 bg-[#FFFDF9] px-4 py-3 sm:px-6 sm:py-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-700 border border-saffron-200">
              {isVideo ? <Play className="h-4 w-4 fill-current" /> : <Sparkles className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-sm sm:text-base md:text-lg font-bold text-ink truncate">
                {item.title}
              </h3>
              <p className="text-[10px] sm:text-xs font-medium text-saffron-800">
                {item.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasYouTube && item.youtubeUrl && (
              <a
                href={item.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                title="Open on YouTube in new tab"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-saffron-200/80 bg-white text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-800 active:scale-95 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Media Body */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[380px] md:min-h-[460px] bg-black flex items-center justify-center overflow-hidden">
          {isVideo ? (
            hasYouTube ? (
              <div className="relative w-full h-full aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${item.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={item.title}
                  className="w-full h-full absolute inset-0 border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : item.videoUrl ? (
              <video
                src={item.videoUrl}
                controls
                autoPlay
                className="max-h-[70vh] w-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="p-8 text-center text-white">
                <p className="text-sm">Video source unavailable.</p>
              </div>
            )
          ) : (
            <div className="relative w-full h-full min-h-[320px] sm:min-h-[480px]">
              <Image
                src={item.imageUrl || item.thumbnailUrl || "/logo.jpeg"}
                alt={item.title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 900px"
              />
            </div>
          )}
        </div>

        {/* Modal Footer: Description & Booking Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FFFDF9] border-t border-saffron-100 px-4 py-3.5 sm:px-6 sm:py-4 shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-ink-soft leading-relaxed line-clamp-2">
              {item.description || "Authentic Vedic rituals and spiritual devotion recorded with utmost sanctity."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                openBooking();
              }}
              className="btn-primary !py-2 !px-4 !text-xs w-full sm:w-auto inline-flex items-center justify-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Your Puja</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
