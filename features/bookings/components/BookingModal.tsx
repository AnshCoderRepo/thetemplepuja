"use client";

import { useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useBookingModal, useI18n } from "@/components/providers";
import { useCatalog } from "@/features/catalog";
import { getLocalizedPoojaTitle, getLocalizedPoojaDescription } from "@/lib/data";
import BookingFlow from "./BookingFlow";

export default function BookingModal() {
  const { isOpen, selectedPoojaSlug, closeBooking } = useBookingModal();
  const { poojas } = useCatalog();
  const { locale, t } = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedPooja = poojas.find((p) => p.slug === selectedPoojaSlug);

  // Auto-scroll modal to top when pooja changes or modal opens
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, selectedPoojaSlug]);

  if (!isOpen) return null;

  const modalTitle = selectedPooja
    ? getLocalizedPoojaTitle(selectedPooja, locale)
    : t("booking.modalTitle");

  const modalSubtitle = selectedPooja
    ? getLocalizedPoojaDescription(selectedPooja, locale)
    : t("booking.modalSubtitle");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book Pooja Modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        onClick={closeBooking}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Container */}
      <div className="relative z-10 flex h-full max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-saffron-200/80 bg-[#FFFDF9] shadow-[0_20px_60px_rgba(30,10,5,0.3)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-saffron-100 bg-white/95 px-5 py-3.5 sm:px-6 shadow-xs backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-50 border border-saffron-200 text-lg shadow-xs">
              {selectedPooja?.emoji || "🪔"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-ink leading-tight">
                  {modalTitle}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-saffron-50 border border-saffron-200 px-2 py-0.5 text-[10px] font-bold text-saffron-800">
                  <Sparkles className="h-2.5 w-2.5 text-saffron-600" />
                  {t("booking.vedicSankalpBadge")}
                </span>
              </div>
              <p className="text-[11px] font-medium text-ink-soft line-clamp-1">
                {modalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeBooking}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-saffron-200/80 bg-white text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-800 active:scale-95"
            aria-label="Close booking modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8"
        >
          <BookingFlow
            pooja={selectedPooja}
            initialPoojaSlug={selectedPoojaSlug}
            isModal={true}
            onClose={closeBooking}
            scrollContainerRef={scrollContainerRef}
          />
        </div>
      </div>
    </div>
  );
}
