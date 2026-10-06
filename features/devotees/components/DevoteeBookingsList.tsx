"use client";

import Link from "next/link";
import { CalendarClock, Play, Video, XCircle } from "lucide-react";
import type { BookingRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import BookingCancelDialog from "./BookingCancelDialog";
import BookingRescheduleForm from "./BookingRescheduleForm";

interface DevoteeBookingsListProps {
  profile: UserProfile;
  reschedId: string | null;
  reschedDate: string;
  onDateChange: (val: string) => void;
  reschedTime: string;
  onTimeChange: (val: string) => void;
  reschedMsg: { ok: boolean; text: string } | null;
  onOpenReschedule: (b: BookingRecord) => void;
  onSaveReschedule: (b: BookingRecord) => void;
  onCloseReschedule: () => void;
  confirmCancelId: string | null;
  onPromptCancel: (id: string) => void;
  onConfirmCancel: (id: string) => void;
  onDismissCancel: () => void;
  inputCls: string;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  rescheduled: "bg-amber-100 text-amber-700",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DevoteeBookingsList({
  profile,
  reschedId,
  reschedDate,
  onDateChange,
  reschedTime,
  onTimeChange,
  reschedMsg,
  onOpenReschedule,
  onSaveReschedule,
  onCloseReschedule,
  confirmCancelId,
  onPromptCancel,
  onConfirmCancel,
  onDismissCancel,
  inputCls,
}: DevoteeBookingsListProps) {
  if (profile.bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-saffron-100 bg-white p-10 text-center shadow-soft">
        <p className="text-3xl">🪔</p>
        <p className="mt-3 text-sm text-ink-soft">
          No bookings yet — book your first pooja today.
        </p>
        <Link href="/book" className="btn-primary mt-5">
          Browse Poojas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...profile.bookings].reverse().map((b) => (
        <article
          key={b.bookingId}
          className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft transition-shadow hover:shadow-card"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-saffron-50 to-amber-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🪔</span>
              <div>
                <h4 className="font-display text-base font-bold text-ink">
                  {b.poojaTitle}
                </h4>
                <p className="text-xs text-ink-soft">
                  <span className="font-mono font-semibold text-saffron-700">
                    {b.bookingId}
                  </span>{" "}
                  · {b.date} · {b.time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-display text-xl font-bold ${
                  b.status === "cancelled"
                    ? "text-ink-soft/40 line-through"
                    : "text-saffron-600"
                }`}
              >
                {formatINR(b.amount)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  statusStyles[b.status] ?? "bg-emerald-100 text-emerald-700"
                }`}
              >
                {b.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 text-xs text-ink-soft">
            <span>🙏 {b.panditName}</span>
            {b.reason && (
              <span className="max-w-xs truncate" title={b.reason}>
                🪔 {b.reason}
              </span>
            )}
            {b.status === "rescheduled" &&
              b.previousDate &&
              !b.previousDate.startsWith("To be") && (
                <span className="font-semibold text-amber-600">
                  ↩️ Moved from {b.previousDate}
                  {b.previousTime && b.previousTime !== "—" ? ` · ${b.previousTime}` : ""}
                </span>
              )}
            {b.addonCount > 0 && (
              <span>🎁 {b.addonCount} add-on{b.addonCount > 1 ? "s" : ""}</span>
            )}
            {b.couponCode && (
              <span className="font-mono font-semibold text-emerald-600">
                🎟️ {b.couponCode}
              </span>
            )}
            {b.discount > 0 && (
              <span className="font-semibold text-emerald-600">
                🎉 saved {formatINR(b.discount)}
              </span>
            )}
            <Link
              href={`/booking/${b.bookingId}?phone=${encodeURIComponent(
                profile.phone
              )}`}
              className="font-semibold text-saffron-600 transition-colors hover:text-saffron-700 hover:underline"
            >
              🧾 Receipt
            </Link>
            <span className="ml-auto">Booked {formatDate(b.createdAt)}</span>
          </div>

          {b.videos && b.videos.length > 0 && (
            <div className="border-t border-saffron-100 bg-saffron-50/50 px-6 py-3.5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-800 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-saffron-600" />
                Live Puja Video Recordings ({b.videos.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {b.videos.map((vid) => (
                  <div
                    key={vid.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-saffron-200/80 bg-white p-2.5 shadow-2xs"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{vid.title}</p>
                      {vid.description && (
                        <p className="text-[11px] text-ink-soft truncate">{vid.description}</p>
                      )}
                    </div>
                    <a
                      href={vid.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-saffron-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-saffron-600"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      Watch
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(b.status === "confirmed" || b.status === "rescheduled") && (
            <div className="border-t border-dashed border-saffron-100 px-6 py-3.5">
              {reschedId === b.bookingId ? (
                <BookingRescheduleForm
                  booking={b}
                  reschedDate={reschedDate}
                  onDateChange={onDateChange}
                  reschedTime={reschedTime}
                  onTimeChange={onTimeChange}
                  reschedMsg={reschedMsg}
                  onSave={() => onSaveReschedule(b)}
                  onCancel={onCloseReschedule}
                  inputCls={inputCls}
                />
              ) : confirmCancelId === b.bookingId ? (
                <BookingCancelDialog
                  onConfirm={() => onConfirmCancel(b.bookingId)}
                  onCancel={onDismissCancel}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenReschedule(b)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => onPromptCancel(b.bookingId)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
