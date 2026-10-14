"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, ArrowRight, X, Calendar, MapPin, AlertCircle } from "lucide-react";
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

export default function ContinueBookingSection({
  phone,
  className = "",
  contained = true,
}: ContinueBookingSectionProps) {
  const { openBooking } = useBookingModal();
  const [drafts, setDrafts] = useState<IncompleteBooking[]>([]);
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>("");

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

  if (!mounted || drafts.length === 0) {
    return null;
  }

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
      className={`${contained ? "container-px my-6 sm:my-8" : "my-6"} animate-in fade-in duration-300 ${className}`}
    >
      <div className="rounded-3xl border border-saffron-200/90 bg-gradient-to-br from-white via-amber-50/20 to-white p-5 sm:p-7 shadow-soft">
        {/* Section Heading & Subheading matching reference design */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {userName ? (
                <>
                  <span className="text-purple-900 capitalize">{userName}</span>
                  <span className="text-ink">, your seva awaits</span>
                </>
              ) : (
                "Your Seva Awaits"
              )}
            </h2>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-soft">
            <span>Continue booking</span>
            <div className="h-0.5 w-12 rounded-full bg-saffron-500" />
          </div>
        </div>

        {/* Incomplete Booking Cards List */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drafts.map((draft) => {
            const isPaymentPending =
              draft.status === "pending_payment" || draft.status === "payment_processing";
            const isPaymentFailed =
              draft.status === "payment_failed" || draft.status === "failed";

            return (
              <div
                key={draft.bookingId}
                onClick={() => handleResume(draft)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-saffron-200/80 bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-saffron-400 hover:shadow-card cursor-pointer"
              >
                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(e, draft.bookingId)}
                  className="absolute top-2.5 right-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur transition-all"
                  title="Dismiss this draft"
                  aria-label="Dismiss draft"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {/* Top Image Thumbnail Area (Aspect ratio preserved, object-contain) */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
                  <PoojaImage
                    src={draft.poojaImageUrl || getPoojaBannerImage({ slug: draft.poojaSlug, title: draft.poojaTitle })}
                    alt={draft.poojaTitle}
                    fallbackSize="md"
                    imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                  />

                  {/* Top-Left Puja Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-900/90 border border-purple-400/30 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-purple-100 backdrop-blur shadow-xs">
                      <Sparkles className="h-2.5 w-2.5 text-purple-300" />
                      <span>Puja</span>
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute bottom-2 left-2.5 z-10">
                    {isPaymentFailed ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-600/90 border border-rose-300/40 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur shadow-xs">
                        <AlertCircle className="h-2.5 w-2.5" />
                        <span>Payment Retry</span>
                      </span>
                    ) : isPaymentPending ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-600/90 border border-amber-300/40 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        <span>Payment Pending</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-black/60 border border-white/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur shadow-xs">
                        <span>Draft Saved</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="mt-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-ink leading-snug line-clamp-1 group-hover:text-saffron-800 transition-colors">
                      {draft.poojaTitle}
                    </h3>

                    {draft.templeName && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-ink-soft truncate">
                        <MapPin className="h-3 w-3 text-saffron-600 shrink-0" />
                        <span className="truncate">{draft.templeName}</span>
                      </p>
                    )}

                    {/* Booking Details Pill */}
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-amber-50/70 border border-amber-200/60 px-2 py-1 text-[11px]">
                      <span className="font-semibold text-amber-950 capitalize">
                        {draft.packageTier} Seva
                      </span>
                      <span className="font-bold text-saffron-700">
                        {formatINR(draft.amount)}
                      </span>
                    </div>

                    {draft.primaryName && (
                      <p className="mt-1.5 text-[11px] text-ink-soft/80 truncate">
                        Sankalp for: <span className="font-semibold text-ink">{draft.primaryName}</span>
                        {draft.gotra ? ` (${draft.gotra})` : ""}
                      </p>
                    )}
                  </div>

                  {/* Resume CTA Button */}
                  <div className="mt-3 pt-2.5 border-t border-saffron-100 flex items-center justify-between">
                    <span className="text-[10px] text-ink-soft/70">
                      Step {draft.step || 1} of 4
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResume(draft);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-white px-4 py-1.5 text-xs font-bold shadow-xs hover:shadow-soft transition-all"
                    >
                      <span>Resume</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
