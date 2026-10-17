"use client";

import { useEffect, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useBookingModal, useI18n } from "@/components/providers";
import { useCatalog } from "@/features/catalog";
import { getLocalizedPoojaTitle, getLocalizedPoojaDescription } from "@/lib/data";
import { event as trackMetaEvent } from "@/lib/meta-pixel";
import BookingFlow from "./BookingFlow";

export default function BookingModal() {
  const { isOpen, selectedPoojaSlug, resumeData, closeBooking } = useBookingModal();
  const { poojas } = useCatalog();
  const { locale, t } = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const selectedPooja = poojas.find((p) => p.slug === selectedPoojaSlug);

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Auto-scroll modal to top when pooja changes or modal opens
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, selectedPoojaSlug]);

  // Track Meta Pixel InitiateCheckout event
  useEffect(() => {
    if (isOpen && selectedPooja) {
      trackMetaEvent("InitiateCheckout", {
        content_name: selectedPooja.title,
        content_category: "Pooja",
        value: selectedPooja.price,
        currency: "INR",
      });
    }
  }, [isOpen, selectedPooja]);

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
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden animate-fadeIn"
    >
      {/* Backdrop */}
      <div
        onClick={closeBooking}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Container - Full screen on mobile, centered card on desktop */}
      <div className="relative z-10 flex h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[88vh] md:max-h-[90vh] w-full max-w-full sm:max-w-lg flex-col rounded-none sm:rounded-3xl border-0 sm:border border-saffron-200/90 bg-[#FFFDF9] shadow-[0_25px_70px_rgba(30,10,5,0.35)] overflow-hidden min-h-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-2 border-b border-saffron-100 bg-white/95 px-3.5 py-2.5 sm:px-6 sm:py-3.5 shadow-xs backdrop-blur shrink-0 min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-saffron-50 border border-saffron-200 text-base sm:text-lg shadow-xs">
              {selectedPooja?.emoji || "🪔"}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-sm sm:text-base font-bold text-ink leading-tight line-clamp-1 sm:line-clamp-2">
                  {modalTitle}
                </h3>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-saffron-50 border border-saffron-200 px-2 py-0.5 text-[10px] font-bold text-saffron-800 shrink-0">
                  <Sparkles className="h-2.5 w-2.5 text-saffron-600" />
                  {t("booking.vedicSankalpBadge")}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-ink-soft truncate hidden xs:block">
                {modalSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={closeBooking}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-saffron-200/80 bg-white text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-800 active:scale-95 cursor-pointer touch-manipulation"
              aria-label="Close booking modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body - Hosts BookingFlow with zero double-scrollbars */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <BookingFlow
            pooja={selectedPooja}
            initialPoojaSlug={selectedPoojaSlug}
            resumeData={resumeData}
            isModal={true}
            onClose={closeBooking}
            scrollContainerRef={scrollContainerRef}
          />
        </div>
      </div>
    </div>
  );
}
