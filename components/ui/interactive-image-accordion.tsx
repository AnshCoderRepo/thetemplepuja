"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface ImageAccordionItem {
  id: number;
  title: string;
  answer: string;
  imageUrl: string;
}

function AccordionItem({
  item,
  isActive,
  onActivate,
  onClick,
  suppressHover,
  tileRef,
}: {
  item: ImageAccordionItem;
  isActive: boolean;
  onActivate: () => void;
  onClick: () => void;
  suppressHover: boolean;
  tileRef: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      ref={tileRef}
      type="button"
      // On touch devices the browser fires a synthetic mouseenter before the
      // tap, which would skip straight past "expand" to "enlarge". Gate hover
      // activation on a fine pointer so a tap expands first, then a second
      // tap enlarges.
      onMouseEnter={suppressHover ? undefined : onActivate}
      onClick={onClick}
      aria-expanded={isActive}
      aria-label={item.title}
      className={`
        relative shrink-0 cursor-pointer overflow-hidden rounded-2xl
        transition-all duration-700 ease-in-out
        ${isActive ? "h-[420px] w-[min(400px,88vw)]" : "h-[420px] w-[60px]"}
      `}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      {/* Dark gradient overlay — stronger at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />

      {/* ── INACTIVE: vertical rotated title ── */}
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-sm font-medium text-white/90 transition-opacity duration-200 ${
          isActive ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {item.title}
      </span>

      {/* ── ACTIVE: question + answer inside the card ── */}
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-full flex-col overflow-y-auto p-5 text-left transition-opacity duration-300 ${
          isActive
            ? "opacity-100 delay-500"
            : "opacity-0 delay-0 pointer-events-none"
        }`}
      >
        {/* Question — pinned to the top of the text block so it never shifts
            with answer length; long answers scroll inside the card. */}
        <p className="text-[15px] font-bold leading-snug text-white drop-shadow-sm">
          {item.title}
        </p>
        {/* Divider */}
        <div className="mt-2 h-px w-10 shrink-0 bg-saffron-400" />
        {/* Answer — directly below the question, same left edge */}
        <p className="mt-2.5 text-[13px] leading-relaxed text-white/90">
          {item.answer}
        </p>
      </div>
    </button>
  );
}

/** Click-to-enlarge overlay: the active tile's image, question and full answer. */
function EnlargedView({
  item,
  onClose,
}: {
  item: ImageAccordionItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 sm:h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            autoFocus
            onClick={onClose}
            aria-label="Close enlarged view"
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto p-6">
          <p className="font-display text-lg font-bold text-maroon-700">
            {item.title}
          </p>
          <div className="mt-3 h-px w-12 bg-saffron-400" />
          <p className="mt-4 text-sm leading-relaxed text-gray-700">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

interface InteractiveImageAccordionProps {
  items: ImageAccordionItem[];
  /** Index of the item expanded on first render (default 0). */
  defaultActive?: number;
}

export default function InteractiveImageAccordion({
  items,
  defaultActive = 0,
}: InteractiveImageAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(
    Math.min(defaultActive, Math.max(items.length - 1, 0))
  );
  const [enlarged, setEnlarged] = useState<ImageAccordionItem | null>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Touch / coarse-pointer devices don't hover, so activation happens purely
  // by tapping — without this, the synthetic mouseenter would swallow taps.
  const [isCoarsePointer] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches
  );

  // Tap-to-expand, tap-again-to-enlarge. On hover devices the mouseenter has
  // already activated the tile, so the first click on it enlarges it.
  const handleTileClick = (index: number) => {
    if (index === activeIndex) {
      setEnlarged(items[index]);
    } else {
      setActiveIndex(index);
    }
  };

  // Scroll the active tile (with its answer overlay) into view. The accordion
  // row scrolls horizontally and the section can scroll vertically, so on
  // mobile the answer would otherwise sit off-screen after a tap.
  useEffect(() => {
    if (enlarged) return;
    const tile = tileRefs.current[activeIndex];
    if (!tile) return;
    tile.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeIndex, enlarged]);

  // Lightbox: lock body scroll and close on Escape.
  useEffect(() => {
    if (!enlarged) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnlarged(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [enlarged]);

  return (
    <>
      <div className="flex flex-row items-stretch justify-center gap-3 overflow-x-auto p-2">
        {items.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isActive={index === activeIndex}
            onActivate={() => setActiveIndex(index)}
            onClick={() => handleTileClick(index)}
            suppressHover={isCoarsePointer}
            tileRef={(node) => {
              tileRefs.current[index] = node;
            }}
          />
        ))}
      </div>
      {enlarged && (
        <EnlargedView item={enlarged} onClose={() => setEnlarged(null)} />
      )}
    </>
  );
}
