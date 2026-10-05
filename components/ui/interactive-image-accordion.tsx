"use client";

import { useEffect, useRef, useState } from "react";

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
      onMouseEnter={suppressHover ? undefined : onActivate}
      onClick={onClick}
      aria-expanded={isActive}
      aria-label={item.title}
      className={`
        relative cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl
        transition-all duration-500 ease-in-out text-left select-none
        h-[420px] sm:h-[450px] lg:h-[480px]
        ${
          isActive
            ? "w-[min(380px,82vw)] md:w-auto md:flex-[4] lg:flex-[4.5] shrink-0 md:shrink shadow-xl ring-2 ring-saffron-400/60"
            : "w-[58px] sm:w-[68px] md:w-auto md:flex-1 shrink-0 md:shrink opacity-90 hover:opacity-100 hover:ring-1 hover:ring-saffron-300/40"
        }
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

      {/* ── INACTIVE: vertical rotated title ── */}
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-xs md:text-sm font-semibold tracking-wide text-white/90 drop-shadow transition-opacity duration-200 pointer-events-none ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
      >
        {item.title}
      </span>

      {/* ── ACTIVE: question + answer inside the card ── */}
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-full flex-col overflow-y-auto p-5 sm:p-6 lg:p-7 text-left transition-opacity duration-300 ${
          isActive
            ? "opacity-100 delay-200"
            : "opacity-0 delay-0 pointer-events-none"
        }`}
      >
        {/* Question */}
        <p className="text-base sm:text-lg lg:text-xl font-bold leading-snug text-white drop-shadow-md">
          {item.title}
        </p>
        {/* Divider */}
        <div className="mt-2.5 h-1 w-12 shrink-0 rounded-full bg-saffron-400" />
        {/* Answer */}
        <p className="mt-3 text-xs sm:text-sm lg:text-[15px] leading-relaxed text-white/95 drop-shadow">
          {item.answer}
        </p>
      </div>
    </button>
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
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for touch / coarse pointer devices
  const [isCoarsePointer] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches
  );

  // Auto-reset back to default card after 5.5 seconds of viewing an active card
  useEffect(() => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }

    if (activeIndex !== defaultActive) {
      autoResetTimerRef.current = setTimeout(() => {
        setActiveIndex(defaultActive);
      }, 5500);
    }

    return () => {
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = null;
      }
    };
  }, [activeIndex, defaultActive]);

  const handleTileClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleTileActivate = (index: number) => {
    setActiveIndex(index);
  };

  // Scroll active tile into horizontal view inside the container without locking window
  useEffect(() => {
    const tile = tileRefs.current[activeIndex];
    const container = containerRef.current;
    if (!tile || !container) return;

    // Only scroll horizontally if container is overflowing (mobile/tablet)
    if (container.scrollWidth > container.clientWidth) {
      const tileLeft = tile.offsetLeft;
      const tileWidth = tile.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollTarget = tileLeft - (containerWidth / 2) + (tileWidth / 2);

      container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex flex-row items-stretch w-full gap-2.5 sm:gap-3 lg:gap-4 overflow-x-auto md:overflow-visible p-1 sm:p-2 scroll-smooth no-scrollbar"
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.id}
            item={item}
            isActive={index === activeIndex}
            onActivate={() => handleTileActivate(index)}
            onClick={() => handleTileClick(index)}
            suppressHover={isCoarsePointer}
            tileRef={(node) => {
              tileRefs.current[index] = node;
            }}
          />
        ))}
      </div>
    </div>
  );
}
