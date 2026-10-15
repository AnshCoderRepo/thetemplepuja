"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  X,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
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

interface ContinueBookingSectionProps {
  phone?: string | null;
  className?: string;
  contained?: boolean;
}

const STORAGE_EXPANDED_KEY = "ttp_continue_booking_expanded";

export default function ContinueBookingSection({
  phone,
  className = "",
  contained = true,
}: ContinueBookingSectionProps) {
  const { openBooking } = useBookingModal();
  const [drafts, setDrafts] = useState<IncompleteBooking[]>([]);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

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

    // Check stored user preference for expansion state (default collapsed)
    try {
      const stored = localStorage.getItem(STORAGE_EXPANDED_KEY);
      if (stored === "true") {
        setIsExpanded(true);
      }
    } catch {
      // ignore
    }

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

  if (!mounted || drafts.length === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_EXPANDED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleResume = (draft: IncompleteBooking) => {
    openBooking(draft.poojaSlug, draft);
  };

  const handleDismiss = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    removeIncompleteBooking(bookingId);
  };

  return (
    <section
      aria-label="Continue Incomplete Booking"
      className={`${contained ? "container-px my-4 sm:my-5" : "my-4"} ${className}`}
    >
      <div className="flex flex-col items-start">
        {/* ─── Compact Collapsed Badge (Default State) ─── */}
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={
            isExpanded
              ? "Collapse incomplete bookings panel"
              : `Complete Your Booking (${drafts.length} resumable seva)`
          }
          className="group inline-flex items-center gap-2.5 rounded-full border border-saffron-300/80 bg-gradient-to-r from-amber-50/95 via-white to-amber-50/90 px-3.5 py-1.5 text-xs font-bold text-ink shadow-soft transition-all duration-200 hover:border-saffron-400 hover:bg-white hover:shadow-card focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 active:scale-[0.98]"
        >
          {/* Flame Icon with subtle ping */}
          <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500 to-amber-600 text-white text-[11px] shadow-xs">
            🪔
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-1 ring-white" />
          </span>

          <span className="tracking-tight font-extrabold text-saffron-950">
            Complete Your Booking
          </span>

          {/* Booking count pill */}
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-saffron-100 px-1.5 text-[10px] font-extrabold text-saffron-800 border border-saffron-300/60">
            {drafts.length}
          </span>

          {/* Indicator: Down when collapsed, Up when expanded */}
          <span className="text-saffron-700 transition-transform duration-200">
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5" />
            )}
          </span>
        </button>

        {/* ─── Expanded Compact Panel ─── */}
        {isExpanded && (
          <div className="mt-2.5 w-full max-w-lg rounded-2xl border border-saffron-200/90 bg-white p-3.5 sm:p-4 shadow-card animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-saffron-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🪔</span>
                <div>
                  <h3 className="font-display text-sm font-extrabold text-ink leading-tight">
                    {userName ? (
                      <>
                        <span className="text-purple-900 capitalize">{userName}</span>
                        <span>, your seva awaits</span>
                      </>
                    ) : (
                      "Your Incomplete Bookings"
                    )}
                  </h3>
                  <p className="text-[10px] text-ink-soft">
                    {drafts.length === 1
                      ? "1 seva waiting to be completed"
                      : `${drafts.length} sevas waiting to be completed`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleExpanded}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-soft hover:bg-cream hover:text-ink transition-colors"
                title="Collapse panel"
              >
                <span>Collapse</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable Compact List */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {drafts.map((draft) => {
                const isPaymentPending =
                  draft.status === "pending_payment" ||
                  draft.status === "payment_processing";
                const isPaymentFailed =
                  draft.status === "payment_failed" || draft.status === "failed";

                return (
                  <div
                    key={draft.bookingId}
                    onClick={() => handleResume(draft)}
                    className="group relative flex items-center justify-between gap-3 rounded-xl border border-saffron-100/90 bg-gradient-to-r from-amber-50/30 via-white to-white p-2.5 hover:border-saffron-300 hover:shadow-xs transition-all cursor-pointer"
                  >
                    {/* Left: Thumbnail */}
                    <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
                      <PoojaImage
                        src={
                          draft.poojaImageUrl ||
                          getPoojaBannerImage({
                            slug: draft.poojaSlug,
                            title: draft.poojaTitle,
                          })
                        }
                        alt={draft.poojaTitle}
                        fallbackSize="sm"
                        imgClassName="transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-xs font-bold text-ink truncate group-hover:text-saffron-800 transition-colors">
                        {draft.poojaTitle}
                      </h4>

                      {draft.templeName && (
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-ink-soft truncate">
                          <MapPin className="h-2.5 w-2.5 text-saffron-600 shrink-0" />
                          <span className="truncate">{draft.templeName}</span>
                        </p>
                      )}

                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="font-semibold text-amber-950 capitalize bg-amber-100/70 px-1.5 py-0.5 rounded">
                          {draft.packageTier} Seva
                        </span>
                        <span className="font-bold text-saffron-700">
                          {formatINR(draft.amount)}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-1 flex items-center gap-1 text-[10px]">
                        {isPaymentFailed ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                            <AlertCircle className="h-2.5 w-2.5" />
                            <span>Payment Failed</span>
                          </span>
                        ) : isPaymentPending ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Payment Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                            <Clock className="h-2.5 w-2.5 text-slate-400" />
                            <span>Draft Saved • Step {draft.step || 1} of 4</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDismiss(e, draft.bookingId)}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Dismiss draft"
                        aria-label="Dismiss draft"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResume(draft);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs hover:shadow-xs transition-all"
                      >
                        <span>Resume</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel Footer */}
            <div className="mt-2.5 pt-2 border-t border-saffron-100/70 flex items-center justify-between text-[10px] text-ink-soft">
              <span>Your sankalp gotra & seva details are preserved.</span>
              <button
                type="button"
                onClick={toggleExpanded}
                className="font-bold text-saffron-700 hover:underline"
              >
                Hide
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
