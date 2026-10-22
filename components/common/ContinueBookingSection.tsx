"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  X,
  AlertCircle,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBookingModal } from "@/components/providers";
import {
  getIncompleteBookings,
  removeIncompleteBooking,
  type IncompleteBooking,
} from "@/lib/incomplete-booking";
import { formatINR } from "@/lib/format";
import { getDevoteePhone, getUsers } from "@/lib/storage";
import { getPoojaBannerImage } from "@/lib/data";
import PoojaImage from "./PoojaImage";

export interface ContinueBookingSectionProps {
  phone?: string | null;
  className?: string;
  contained?: boolean;
  defaultExpanded?: boolean;
  limit?: number; // Maximum cards to display (default 4 on home page)
  showAll?: boolean; // When true, displays all drafts without 4-card cutoff
}

export const STORAGE_EXPANDED_KEY = "ttp_continue_booking_expanded";

export default function ContinueBookingSection({
  phone,
  className = "",
  contained = true,
  defaultExpanded = true,
  limit = 4,
  showAll = false,
}: ContinueBookingSectionProps) {
  const { openBooking, isOpen: isBookingModalOpen } = useBookingModal();
  const [drafts, setDrafts] = useState<IncompleteBooking[]>([]);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const refreshDrafts = useCallback(() => {
    const activePhone = phone || getDevoteePhone();
    const list = getIncompleteBookings(activePhone);
    setDrafts(list);

    // Resolve devotee name from profile or first draft
    if (activePhone) {
      try {
        const users = getUsers();
        const found = users.find((u) => u.phone === activePhone.trim());
        if (found?.name) {
          setUserName(found.name.split(" ")[0]);
          return;
        }
      } catch {
        // ignore
      }
    }

    const firstDraft = list.length > 0 ? list[0] : null;
    const resolvedName =
      firstDraft?.primaryName ||
      (firstDraft as { devoteeName?: string })?.devoteeName;
    if (resolvedName) {
      setUserName(resolvedName.trim().split(" ")[0]);
    } else {
      setUserName("");
    }
  }, [phone]);

  useEffect(() => {
    setMounted(true);
    refreshDrafts();

    const handleUpdate = () => {
      refreshDrafts();
    };

    window.addEventListener("incomplete-bookings-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("devotee-updated", handleUpdate);

    return () => {
      window.removeEventListener("incomplete-bookings-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("devotee-updated", handleUpdate);
    };
  }, [refreshDrafts]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (!mounted || drafts.length === 0 || isBookingModalOpen) {
    return null;
  }

  const handleResume = (draft: IncompleteBooking) => {
    openBooking(draft.poojaSlug, draft);
  };

  const handleDismiss = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    removeIncompleteBooking(bookingId);
  };

  // Determine cards to show: if showAll is true or limit is 0/falsy, show all; otherwise show up to limit (4)
  const effectiveLimit = showAll || !limit || limit <= 0 ? drafts.length : limit;
  const visibleDrafts = drafts.slice(0, effectiveLimit);
  const remainingCount = drafts.length - visibleDrafts.length;

  return (
    <section
      aria-label="Complete Your Booking"
      className={
        contained
          ? `w-full max-w-7xl mx-auto container-px my-4 sm:my-6 px-3 sm:px-6 lg:px-8 ${className}`
          : `w-full my-4 ${className}`
      }
    >
      {/* Section Header */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className="relative flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-amber-600 text-white text-sm shadow-xs border border-saffron-300/40">
            🪔
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm sm:text-base md:text-lg font-bold text-ink truncate">
                {userName ? `${userName}'s Incomplete Bookings` : "Complete Your Booking"}
              </h2>
              <span className="inline-flex items-center rounded-full bg-saffron-100 px-2 py-0.5 text-[11px] font-extrabold text-saffron-900 border border-saffron-200 shrink-0">
                {drafts.length} {drafts.length === 1 ? "draft" : "drafts"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-ink-soft hidden sm:block truncate">
              Pick up right where you left off — your sacred sankalp &amp; seva details are preserved.
            </p>
          </div>
        </div>

        {/* Right Header Navigation & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {remainingCount > 0 && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-saffron-700 hover:text-saffron-800 bg-saffron-50 hover:bg-saffron-100/80 px-2.5 py-1.5 rounded-xl border border-saffron-200/80 transition-colors"
            >
              <span>View Rest on Profile ({remainingCount})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* Horizontal Scroll Controls */}
          {(visibleDrafts.length > 2 || remainingCount > 0) && (
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={scrollLeft}
                aria-label="Scroll left"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-saffron-200 bg-white text-slate-600 hover:bg-saffron-50 hover:text-saffron-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={scrollRight}
                aria-label="Scroll right"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-saffron-200 bg-white text-slate-600 hover:bg-saffron-50 hover:text-saffron-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Cards Container (Card type, in horizontal way across all screens) */}
      <div
        ref={scrollContainerRef}
        className="flex flex-row items-stretch gap-3.5 sm:gap-4 overflow-x-auto pb-2.5 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar w-full"
      >
        {visibleDrafts.map((draft, idx) => {
          const isPaymentPending =
            draft.status === "pending_payment" ||
            draft.status === "payment_processing";
          const isPaymentFailed =
            draft.status === "payment_failed" || draft.status === "failed";

          return (
            <div
              key={`${draft.bookingId || "draft"}-${idx}`}
              onClick={() => handleResume(draft)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleResume(draft);
                }
              }}
              aria-label={`Complete booking for ${draft.poojaTitle}`}
              className="group relative flex flex-col justify-between w-[265px] xs:w-[285px] sm:w-[300px] lg:w-[calc(25%-0.75rem)] lg:min-w-[260px] lg:flex-1 shrink-0 snap-start rounded-2xl border border-saffron-200/90 bg-white hover:border-saffron-400 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 select-none"
            >
              {/* Card Banner / Image */}
              <div className="relative h-28 xs:h-32 w-full overflow-hidden bg-slate-900 shrink-0">
                <PoojaImage
                  src={
                    draft.poojaImageUrl ||
                    getPoojaBannerImage({
                      slug: draft.poojaSlug,
                      title: draft.poojaTitle,
                    })
                  }
                  alt={draft.poojaTitle}
                  fallbackSize="md"
                  imgClassName="transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Status Pill Badge (Top Left) */}
                <div className="absolute top-2 left-2 z-10">
                  {isPaymentFailed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/90 text-white text-[10px] font-bold px-2 py-0.5 shadow-xs backdrop-blur-xs">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>Payment Failed</span>
                    </span>
                  ) : isPaymentPending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 text-white text-[10px] font-bold px-2 py-0.5 shadow-xs backdrop-blur-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse shrink-0" />
                      <span>Payment Pending</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 text-amber-200 text-[10px] font-bold px-2 py-0.5 shadow-xs backdrop-blur-xs border border-amber-300/30">
                      <Clock className="h-3 w-3 text-amber-300 shrink-0" />
                      <span>Step {draft.step || 1} of 4</span>
                    </span>
                  )}
                </div>

                {/* Dismiss Button (Top Right) */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, draft.bookingId)}
                  className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white/90 hover:bg-rose-600 hover:text-white backdrop-blur-xs transition-colors cursor-pointer"
                  title="Dismiss draft"
                  aria-label="Dismiss draft"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Amount Pill Badge (Bottom Left Overlay) */}
                <div className="absolute bottom-2 left-2 z-10">
                  <span className="rounded-lg bg-black/75 px-2 py-0.5 text-xs font-extrabold text-amber-300 border border-amber-400/30 backdrop-blur-xs">
                    {formatINR(draft.amount)}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 gap-2.5">
                <div>
                  <h3 className="font-display text-xs sm:text-sm font-bold text-ink line-clamp-1 group-hover:text-saffron-700 transition-colors">
                    {draft.poojaTitle}
                  </h3>

                  {draft.templeName && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-soft truncate">
                      <MapPin className="h-3 w-3 text-saffron-600 shrink-0" />
                      <span className="truncate">{draft.templeName}</span>
                    </p>
                  )}

                  <div className="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-ink-soft pt-1.5 border-t border-saffron-100/70">
                    <span className="font-semibold text-amber-950 capitalize bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px]">
                      {draft.packageTier || "Standard"} Seva
                    </span>
                    {draft.date ? (
                      <span className="text-[10px] text-slate-500 font-medium">
                        📅 {draft.date}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-medium">
                        ✓ Sankalp saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Action CTA Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResume(draft);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white py-2 text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-150 active:scale-98 cursor-pointer"
                >
                  <span>{isPaymentPending || isPaymentFailed ? "Resume Payment" : "Continue Booking"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* 5th Card: Remaining Bookings on Profile Page (When drafts > 4 on Home) */}
        {remainingCount > 0 && (
          <div className="flex flex-col items-center justify-center text-center p-4 sm:p-5 rounded-2xl border-2 border-dashed border-saffron-300/90 bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 hover:border-saffron-500 hover:bg-amber-50 transition-all duration-200 w-[240px] sm:w-[260px] shrink-0 snap-start shadow-xs hover:shadow-sm">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-saffron-100 flex items-center justify-center text-xl sm:text-2xl mb-2 sm:mb-3 text-saffron-700 shadow-2xs border border-saffron-200">
              📜
            </div>
            <h3 className="font-display font-bold text-ink text-sm sm:text-base">
              +{remainingCount} More {remainingCount === 1 ? "Booking" : "Bookings"}
            </h3>
            <p className="text-[11px] sm:text-xs text-ink-soft mt-1 leading-relaxed">
              View the rest of your incomplete pooja bookings on your sacred profile page.
            </p>
            <Link
              href="/profile"
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white px-3.5 py-1.5 sm:py-2 text-xs font-bold shadow-xs hover:shadow-sm transition-all duration-150"
            >
              <span>View Rest on Profile</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
