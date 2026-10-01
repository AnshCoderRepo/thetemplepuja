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
        relative shrink-0 cursor-pointer overflow-hidden rounded-2xl
        transition-all duration-500 ease-in-out text-left select-none
        ${isActive ? "h-[420px] w-[min(400px,88vw)] shadow-lg ring-2 ring-saffron-400/40" : "h-[420px] w-[60px] opacity-90 hover:opacity-100"}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />

      {/* ── INACTIVE: vertical rotated title ── */}
      <span
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap text-sm font-medium text-white/90 transition-opacity duration-200 pointer-events-none ${
          isActive ? "opacity-0" : "opacity-100"
        }`}
      >
        {item.title}
      </span>

      {/* ── ACTIVE: question + answer inside the card ── */}
      <div
        className={`absolute inset-x-0 bottom-0 flex max-h-full flex-col overflow-y-auto p-5 text-left transition-opacity duration-300 ${
          isActive
            ? "opacity-100 delay-300"
            : "opacity-0 delay-0 pointer-events-none"
        }`}
      >
        {/* Question */}
        <p className="text-[15px] font-bold leading-snug text-white drop-shadow-sm">
          {item.title}
        </p>
        {/* Divider */}
        <div className="mt-2 h-0.5 w-10 shrink-0 bg-saffron-400" />
        {/* Answer */}
        <p className="mt-2.5 text-[13px] leading-relaxed text-white/90">
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

  // Auto-reset back to default card after 4.5 seconds of viewing an active card
  useEffect(() => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }

    if (activeIndex !== defaultActive) {
      autoResetTimerRef.current = setTimeout(() => {
        setActiveIndex(defaultActive);
      }, 4500);
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

    const tileLeft = tile.offsetLeft;
    const tileWidth = tile.offsetWidth;
    const containerWidth = container.offsetWidth;
    const scrollTarget = tileLeft - (containerWidth / 2) + (tileWidth / 2);

    container.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <div
      ref={containerRef}
      className="flex flex-row items-stretch justify-start lg:justify-center gap-3 overflow-x-auto p-2 scroll-smooth no-scrollbar"
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
  );
}
