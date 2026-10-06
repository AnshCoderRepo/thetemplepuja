"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ExternalLink, Play, Video, X, XCircle } from "lucide-react";
import type { BookingRecord, CustomerMediaRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import BookingCancelDialog from "./BookingCancelDialog";
import BookingRescheduleForm from "./BookingRescheduleForm";

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1`
      : null;
  } catch {
    return null;
  }
}

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
  onRefresh?: () => void;
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
  onRefresh,
}: DevoteeBookingsListProps) {
  const [activeVideoPlayer, setActiveVideoPlayer] = useState<CustomerMediaRecord | null>(null);
  const [addVideoBooking, setAddVideoBooking] = useState<BookingRecord | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [saveVideoErr, setSaveVideoErr] = useState("");
  const [saveVideoSuccess, setSaveVideoSuccess] = useState("");

  const handleOpenAddVideo = (b: BookingRecord) => {
    setAddVideoBooking(b);
    setFormTitle(`${b.poojaTitle} Sacred Puja Video & Darshan`);
    setFormUrl("");
    setFormDesc("");
    setSaveVideoErr("");
    setSaveVideoSuccess("");
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVideoBooking) return;
    setSaveVideoErr("");
    setSaveVideoSuccess("");

    if (!formUrl.trim() || !formTitle.trim()) {
      setSaveVideoErr("Please enter both the video link URL and video title.");
      return;
    }

    setIsSavingVideo(true);
    try {
      const res = await fetch("/api/devotee/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: profile.phone,
          userId: profile.id,
          bookingId: addVideoBooking.bookingId,
          media: {
            title: formTitle.trim(),
            url: formUrl.trim(),
            description: formDesc.trim() || undefined,
            poojaTitle: addVideoBooking.poojaTitle,
            bookingId: addVideoBooking.bookingId,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      setIsSavingVideo(false);

      if (res.ok && data.ok) {
        setSaveVideoSuccess("Puja video link added successfully to your account!");
        onRefresh?.();
        setTimeout(() => {
          setAddVideoBooking(null);
          setSaveVideoSuccess("");
        }, 1400);
      } else {
        setSaveVideoErr(data.error || "Failed to save video link.");
      }
    } catch {
      setIsSavingVideo(false);
      setSaveVideoErr("Network error while saving video link.");
    }
  };

  const handleDeleteVideo = async (mediaId: string) => {
    if (!confirm("Are you sure you want to remove this video link from your account?")) return;
    try {
      const res = await fetch("/api/devotee/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          phone: profile.phone,
          userId: profile.id,
          mediaId,
        }),
      });
      if (res.ok) {
        onRefresh?.();
      }
    } catch {
      // ignore
    }
  };

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
    <div className="space-y-6">
      {profile.bookings.map((b) => {
        // Find videos attached to this booking or profile videos tagged with this bookingId
        const bookingVideos = [
          ...(b.videos || []),
          ...(profile.videos || []).filter((v) => v.bookingId === b.bookingId),
        ].filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx);

        return (
          <article
            key={b.bookingId}
            className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card transition-shadow hover:shadow-soft"
          >
            <div className="flex flex-col gap-4 border-b border-saffron-100/60 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-saffron-50 text-xl">
                  🪔
                </span>
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

            {/* Sacred Puja Video Recordings Section */}
            <div className="border-t border-saffron-100 bg-gradient-to-r from-saffron-50/90 via-amber-50/70 to-saffron-50/90 px-6 py-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-900 flex items-center gap-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-500 text-white shadow-xs">
                    <Video className="h-3.5 w-3.5" />
                  </span>
                  Sacred Puja Video Recording & Darshan {bookingVideos.length > 0 ? `(${bookingVideos.length})` : ""}
                </span>

                <div className="flex items-center gap-2">
                  {bookingVideos.length > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      ✓ Available in Account
                    </span>
                  ) : null}

                  {/* Add Video Link Button in Devotee Account */}
                  <button
                    type="button"
                    onClick={() => handleOpenAddVideo(b)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-saffron-300 bg-white px-3 py-1 text-xs font-bold text-saffron-700 shadow-2xs hover:bg-saffron-50 transition-all hover:border-saffron-400 cursor-pointer"
                  >
                    <Video className="h-3.5 w-3.5 text-saffron-600" />
                    + Add Video Link
                  </button>
                </div>
              </div>

              {bookingVideos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {bookingVideos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex flex-col justify-between rounded-2xl border border-saffron-200/90 bg-white p-3.5 shadow-2xs hover:border-saffron-300 transition-all space-y-2.5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-ink flex items-center gap-1.5 leading-snug">
                            📹 {vid.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDeleteVideo(vid.id)}
                            title="Remove video link"
                            className="text-ink-soft/40 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {vid.description && (
                          <p className="text-[11px] text-ink-soft mt-1 leading-relaxed bg-cream/40 p-2 rounded-lg">
                            {vid.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-saffron-100/60">
                        <span className="text-[10px] text-ink-soft">
                          {vid.uploadedAt ? formatDate(vid.uploadedAt) : "Sacred Seva"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveVideoPlayer(vid)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:from-saffron-600 hover:to-saffron-700 transition-all cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Watch Video
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (b.status === "confirmed" || b.status === "rescheduled") ? (
                <div className="rounded-xl bg-white/70 border border-saffron-200/60 p-3 text-[11px] text-ink-soft flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span>🪔</span>
                    <span>No video link attached yet. Click <strong>+ Add Video Link</strong> above to paste your YouTube or Drive link so you can check your puja here anytime.</span>
                  </div>
                </div>
              ) : null}
            </div>

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
        );
      })}

      {/* Active Video Player Modal */}
      {activeVideoPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setActiveVideoPlayer(null)}
          />
          <div className="relative w-full max-w-3xl rounded-3xl bg-white overflow-hidden shadow-2xl z-10 border border-saffron-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-saffron-600 via-amber-600 to-maroon-700 px-5 sm:px-6 py-4 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white shadow-2xs">
                  <Video className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm sm:text-base truncate">
                    {activeVideoPlayer.title}
                  </h3>
                  {activeVideoPlayer.poojaTitle && (
                    <p className="text-[11px] sm:text-xs text-amber-200/90 truncate">
                      🪔 {activeVideoPlayer.poojaTitle}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoPlayer(null)}
                className="rounded-full bg-white/10 p-2 text-white/90 hover:bg-white/25 hover:text-white transition-colors cursor-pointer"
                aria-label="Close video player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Display */}
            <div className="p-3 sm:p-6 bg-slate-950">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner flex items-center justify-center">
                {getYouTubeEmbedUrl(activeVideoPlayer.url) ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeVideoPlayer.url)!}
                    title={activeVideoPlayer.title}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : activeVideoPlayer.url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={activeVideoPlayer.url}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-6 text-white space-y-3">
                    <p className="text-sm text-slate-300">
                      This sacred recording link opens directly in your browser or video service.
                    </p>
                    <a
                      href={activeVideoPlayer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:from-saffron-600 hover:to-saffron-700 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Watch Video in Fullscreen
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Description & Action Bar */}
            <div className="p-5 sm:p-6 bg-white space-y-3 border-t border-saffron-100">
              {activeVideoPlayer.description && (
                <div className="rounded-xl bg-saffron-50/70 p-3.5 border border-saffron-100 text-xs text-ink-soft leading-relaxed">
                  <span className="font-bold text-ink block mb-0.5">Pandit Sankalp & Ceremony Notes:</span>
                  {activeVideoPlayer.description}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-soft pt-1">
                <a
                  href={activeVideoPlayer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-saffron-600 hover:text-saffron-700 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Direct Video Link
                </a>
                <button
                  type="button"
                  onClick={() => setActiveVideoPlayer(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close Player
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Link Modal Form */}
      {addVideoBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="fixed inset-0"
            onClick={() => setAddVideoBooking(null)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-saffron-200">
            <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-100 text-saffron-700 font-bold">
                  📹
                </span>
                <div>
                  <h3 className="font-display font-bold text-ink text-base">
                    Add Sacred Puja Video Link
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    {addVideoBooking.poojaTitle} · Ref {addVideoBooking.bookingId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddVideoBooking(null)}
                className="text-ink-soft/60 hover:text-ink transition-colors p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Video Link URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. https://youtu.be/... or Google Drive / Zoom link"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2.5 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200"
                />
                <p className="mt-1 text-[10px] text-ink-soft">
                  Supports YouTube, Google Drive, Vimeo, Zoom cloud recordings, or direct MP4 links.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Video Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2.5 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Puja Sankalp & Blessing Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Performed with full Vedic rites and family sankalp at Kashi temple..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full rounded-xl border border-saffron-200 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200 resize-none"
                />
              </div>

              {saveVideoErr && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-600">
                  ⚠️ {saveVideoErr}
                </div>
              )}

              {saveVideoSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-700">
                  ✅ {saveVideoSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={() => setAddVideoBooking(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingVideo}
                  className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2 text-xs font-bold text-white shadow-soft hover:from-saffron-600 hover:to-saffron-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingVideo ? "Saving Video..." : "Save & Attach Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
