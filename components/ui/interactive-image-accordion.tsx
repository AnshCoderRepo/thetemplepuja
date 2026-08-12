"use client";

import { useState } from "react";

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
}: {
  item: ImageAccordionItem;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onActivate}
      onClick={onActivate}
      aria-expanded={isActive}
      aria-label={item.title}
      className={`
        relative shrink-0 cursor-pointer overflow-hidden rounded-2xl
        transition-all duration-700 ease-in-out
        ${isActive ? "h-[420px] w-[400px]" : "h-[420px] w-[60px]"}
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

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
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 text-left transition-opacity duration-300 ${
          isActive ? "opacity-100 delay-500" : "opacity-0 delay-0 pointer-events-none"
        }`}
      >
        {/* Question */}
        <p className="text-base font-bold leading-snug text-white">
          {item.title}
        </p>
        {/* Divider */}
        <div className="h-px w-10 bg-saffron-400" />
        {/* Answer */}
        <p className="text-xs leading-relaxed text-white/85">
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

  return (
    <div className="flex flex-row items-stretch justify-center gap-3 overflow-x-auto p-2">
      {items.map((item, index) => (
        <AccordionItem
          key={item.id}
          item={item}
          isActive={index === activeIndex}
          onActivate={() => setActiveIndex(index)}
        />
      ))}
    </div>
  );
}
