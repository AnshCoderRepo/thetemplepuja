"use client";

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, X, Sparkles, ZoomIn } from "lucide-react";

export interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  badge?: string;
  photoCount?: string;
}

export default function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  badge = "GROUP PUJA",
  photoCount = "1/1",
}: ImagePreviewModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !imageUrl || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Pooja Image Preview"}
      style={{ backgroundColor: "rgba(10, 8, 6, 0.96)" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full max-w-6xl flex items-center justify-between gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-900/90 border border-purple-400/40 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-purple-200 shadow-md">
            <Sparkles className="h-3 w-3 text-purple-300" />
            <span>{badge}</span>
          </span>
        </div>

        {/* Right Actions: All Photos & Close Button */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Camera className="h-3.5 w-3.5 text-amber-300" />
            <span>All Photos (1)</span>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Close image preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container — Preserves Original Aspect Ratio & object-fit: contain */}
      <div
        className="relative flex-1 w-full max-w-6xl my-auto flex items-center justify-center p-2 sm:p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient blurred glow for dark mode atmosphere */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain blur-2xl opacity-20 pointer-events-none scale-105"
        />

        {/* Complete Uncropped Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || "Pooja Image Preview"}
          className="relative z-10 max-h-[75vh] sm:max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 transition-all duration-300"
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* Bottom Bar: Title & Photo Counter Badge */}
      <div
        className="w-full max-w-6xl flex items-center justify-between gap-3 z-10 text-white/90 text-xs sm:text-sm bg-black/60 backdrop-blur border border-white/10 px-4 py-2.5 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="truncate font-display font-medium text-amber-100 max-w-md sm:max-w-xl">
          {title || "templepujasewa Sacred Ritual"}
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/80 border border-white/20 px-3 py-1 font-mono text-xs font-bold text-amber-200 shadow-sm">
          <span>{photoCount}</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
