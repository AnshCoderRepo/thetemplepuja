"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle, Play, Star, Video } from "lucide-react";
import { cancelBookingRemote, rescheduleBookingRemote } from "@/features/bookings";
import { fetchUserByPhone } from "../api/devoteeApi";
import { getDevoteePhone, type BookingRecord, type UserProfile } from "@/lib/storage";
import { ContinueBookingSection } from "@/components/common";
import DevoteeBookingsList from "./DevoteeBookingsList";
import DevoteeLookupGate from "./DevoteeLookupGate";
import DevoteeProfileCard from "./DevoteeProfileCard";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

function displayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function DevoteeProfileView() {
  const [mounted, setMounted] = useState(false);
  const [inputPhone, setInputPhone] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelMsg, setCancelMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [reschedId, setReschedId] = useState<string | null>(null);
  const [reschedDate, setReschedDate] = useState("");
  const [reschedTime, setReschedTime] = useState("");
  const [reschedMsg, setReschedMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Feature E: Ceremony Session Videos & Devotee Feedback
  const [sessionVideos, setSessionVideos] = useState<any[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<
    Record<string, { rating: number; message: string; loading?: boolean; submitted?: boolean; error?: string }>
  >({});

  const loadSessionVideos = async () => {
    try {
      const res = await fetch("/api/devotee/videos");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.videos)) {
          setSessionVideos(data.videos);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleFeedbackSubmit = async (videoId: string, poojaSlug: string, poojaTitle: string, bookingId?: string) => {
    const current = feedbackForms[videoId] || { rating: 5, message: "" };
    const rating = current.rating || 5;
    const message = current.message?.trim() || `Blessed ritual experience for ${poojaTitle}.`;

    setFeedbackForms((prev) => ({
      ...prev,
      [videoId]: { ...current, rating, loading: true, error: undefined },
    }));

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile?.name || "Devotee",
          phone: profile?.phone || "",
          poojaSlug,
          poojaTitle,
          rating,
          message,
          bookingId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setFeedbackForms((prev) => ({
          ...prev,
          [videoId]: { ...current, rating, loading: false, submitted: true },
        }));
      } else {
        setFeedbackForms((prev) => ({
          ...prev,
          [videoId]: { ...current, rating, loading: false, error: data.error || "Failed to submit review." },
        }));
      }
    } catch {
      setFeedbackForms((prev) => ({
        ...prev,
        [videoId]: { ...current, rating, loading: false, error: "Network error submitting feedback." },
      }));
    }
  };

  const refresh = async (phone: string) => {
    setCancelMsg(null);
    setReschedMsg(null);
    const found = await fetchUserByPhone(phone);
    setProfile(found ?? null);
    setNotFound(!found);
    void loadSessionVideos();
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("phone") ?? "";
    const activePhone = p || getDevoteePhone() || "";
    if (activePhone) {
      void refresh(activePhone);
    }
    setMounted(true);
  }, []);

  // Live real-time sync: refresh devotee profile when admin uploads videos or updates status
  useEffect(() => {
    if (!profile?.phone) return;
    const phone = profile.phone;
    const onDevoteeUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ target?: string }>).detail;
      const target = detail?.target;
      if (!target || target === phone || target === profile.id) {
        void refresh(phone);
      }
    };
    window.addEventListener("devotee-updated", onDevoteeUpdated);
    return () => window.removeEventListener("devotee-updated", onDevoteeUpdated);
  }, [profile?.phone, profile?.id]);

  const handleCancel = async (bookingId: string) => {
    if (!profile) return;
    const res = await cancelBookingRemote(profile.phone, bookingId);
    if (res.ok) {
      await refresh(profile.phone);
      setConfirmCancelId(null);
      setCancelMsg({ ok: true, text: "Booking cancelled. Your refund will be processed within 5–7 business days." });
    } else {
      setConfirmCancelId(null);
      setCancelMsg({ ok: false, text: "This booking can no longer be cancelled." });
    }
  };

  const openResched = (b: BookingRecord) => {
    setConfirmCancelId(null);
    setReschedMsg(null);
    setReschedDate("");
    setReschedTime(b.time === "—" ? "" : b.time);
    setReschedId(b.bookingId);
  };

  const handleReschedule = async (b: BookingRecord) => {
    if (!profile) return;
    if (!reschedDate) {
      setReschedMsg({ ok: false, text: "Pick a new date for your pooja." });
      return;
    }
    if (!reschedTime.trim()) {
      setReschedMsg({ ok: false, text: "Enter the time for your new muhurat." });
      return;
    }
    const res = await rescheduleBookingRemote(profile.phone, b.bookingId, {
      date: displayDate(reschedDate),
      time: reschedTime.trim(),
      dateISO: b.eventDateISO ? reschedDate : undefined,
    });
    if (res.ok) {
      await refresh(profile.phone);
      setReschedId(null);
      setReschedDate("");
      setReschedTime("");
      setCancelMsg({ ok: true, text: "Booking rescheduled — your new muhurat is confirmed." });
    } else {
      setReschedMsg({ ok: false, text: "This booking can no longer be rescheduled." });
    }
  };

  const lookup = async (phone: string) => {
    const p = phone.trim();
    if (!/^[6-9]\d{9}$/.test(p)) {
      setNotFound(true);
      setProfile(null);
      return;
    }
    const found = await fetchUserByPhone(p);
    setProfile(found ?? null);
    setNotFound(!found);
  };

  return (
    <div className="container-px mx-auto max-w-3xl">
      {!mounted ? (
        <div className="h-64 animate-pulse rounded-3xl bg-saffron-100/60" />
      ) : profile ? (
        <>
          <DevoteeProfileCard profile={profile} />

          {/* Continue Incomplete Bookings / Resume Payment - Prominently right below profile card */}
          <ContinueBookingSection
            phone={profile.phone}
            contained={false}
            defaultExpanded={true}
            showAll={true}
            className="mt-6"
          />

          {/* Sacred Ceremony Session Videos (Feature E: with rating and review feedback) */}
          {(sessionVideos.length > 0 || (profile.videos && profile.videos.length > 0)) && (
            <div className="mt-8 rounded-3xl border border-saffron-100 bg-white p-6 shadow-card space-y-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Video className="h-5 w-5 text-saffron-600" />
                Your Sacred Puja Video Recordings ({sessionVideos.length + (profile.videos?.length || 0)})
              </h3>
              <p className="text-xs text-ink-soft">
                Watch the authentic Vedic rituals and sankalp performed on your behalf by our certified pandits.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Ceremony Session Videos matching Confirmed Bookings */}
                {sessionVideos.map((vid) => {
                  const form = feedbackForms[vid.id] || { rating: 5, message: "" };
                  return (
                    <div
                      key={vid.id}
                      className="flex flex-col justify-between rounded-2xl border border-saffron-200 bg-amber-50/30 p-4 space-y-3.5 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-ink text-sm flex items-center gap-1.5">
                            📹 {vid.title}
                          </h4>
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                            📅 {vid.date}
                          </span>
                        </div>
                        {vid.poojaTitle && (
                          <p className="text-saffron-700 text-xs font-semibold mt-1">
                            🪔 {vid.poojaTitle}
                          </p>
                        )}
                        {vid.description && (
                          <p className="text-xs text-ink-soft mt-1 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-saffron-100/60">
                            {vid.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-saffron-200/60 pt-2 text-[11px]">
                        <span className="text-ink-soft font-medium">
                          {vid.matchedBookingId ? `Ref: ${vid.matchedBookingId}` : "Ceremony Session"}
                        </span>
                        <a
                          href={vid.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft hover:bg-saffron-600 transition-colors"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Watch Video
                        </a>
                      </div>

                      {/* Interactive Feedback / Review Section */}
                      <div className="border-t border-saffron-200/60 pt-3">
                        {form.submitted ? (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <span>Thank you for sharing your blessed review! ({form.rating} ★)</span>
                          </div>
                        ) : (
                          <div className="space-y-2 rounded-xl bg-white/90 p-3 border border-saffron-100">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-ink">Rate this Ceremony:</span>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setFeedbackForms((prev) => ({
                                        ...prev,
                                        [vid.id]: { ...form, rating: star },
                                      }))
                                    }
                                    className="p-0.5 focus:outline-none cursor-pointer"
                                  >
                                    <Star
                                      className={`h-4 w-4 ${
                                        star <= (form.rating || 5)
                                          ? "text-amber-400 fill-amber-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <input
                              type="text"
                              placeholder="Share your divine experience or blessing..."
                              value={form.message || ""}
                              onChange={(e) =>
                                setFeedbackForms((prev) => ({
                                  ...prev,
                                  [vid.id]: { ...form, message: e.target.value },
                                }))
                              }
                              className="w-full rounded-lg border border-saffron-100 bg-cream/30 px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-soft/50 focus:border-saffron-400 focus:bg-white outline-none"
                            />

                            {form.error && (
                              <p className="text-[10px] text-red-600 font-medium">⚠️ {form.error}</p>
                            )}

                            <div className="flex justify-end">
                              <button
                                type="button"
                                disabled={form.loading}
                                onClick={() =>
                                  handleFeedbackSubmit(
                                    vid.id,
                                    vid.poojaSlug,
                                    vid.poojaTitle,
                                    vid.matchedBookingId
                                  )
                                }
                                className="rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white font-bold text-[11px] px-3 py-1 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {form.loading ? "Submitting..." : "Submit Feedback"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* 2. Legacy Individual Media Records */}
                {profile.videos &&
                  profile.videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex flex-col justify-between rounded-2xl border border-saffron-100 bg-cream/50 p-4 space-y-3"
                    >
                      <div>
                        <h4 className="font-bold text-ink text-sm flex items-center gap-1.5">
                          📹 {vid.title}
                        </h4>
                        {vid.poojaTitle && (
                          <p className="text-saffron-700 text-xs font-semibold mt-0.5">
                            🪔 {vid.poojaTitle}
                          </p>
                        )}
                        {vid.description && (
                          <p className="text-xs text-ink-soft mt-1 leading-relaxed bg-white/80 p-2 rounded-xl">
                            {vid.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between border-t border-saffron-100/60 pt-2 text-[11px]">
                        <span className="text-ink-soft">
                          {vid.bookingId ? `Ref: ${vid.bookingId}` : "General Ritual"}
                        </span>
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft hover:bg-saffron-600 transition-colors"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          Watch Video
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <h3 className="mb-4 mt-10 flex items-center gap-2 font-display text-xl font-bold text-ink">
            <CalendarDays className="h-5 w-5 text-saffron-600" />
            Your Bookings
          </h3>

          {cancelMsg && (
            <div
              className={`mb-5 rounded-2xl border px-5 py-3.5 text-sm font-semibold ${
                cancelMsg.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {cancelMsg.ok ? "✅ " : "⚠️ "}
              {cancelMsg.text}
            </div>
          )}

          <DevoteeBookingsList
            profile={profile}
            reschedId={reschedId}
            reschedDate={reschedDate}
            onDateChange={setReschedDate}
            reschedTime={reschedTime}
            onTimeChange={setReschedTime}
            reschedMsg={reschedMsg}
            onOpenReschedule={openResched}
            onSaveReschedule={handleReschedule}
            onCloseReschedule={() => {
              setReschedId(null);
              setReschedMsg(null);
            }}
            confirmCancelId={confirmCancelId}
            onPromptCancel={setConfirmCancelId}
            onConfirmCancel={handleCancel}
            onDismissCancel={() => setConfirmCancelId(null)}
            inputCls={inputCls}
            onRefresh={() => refresh(profile.phone)}
          />

          <p className="mt-8 rounded-2xl bg-saffron-50 px-5 py-4 text-center text-xs leading-relaxed text-ink-soft">
            ℹ️ Your profile is stored securely on our server — you can view
            it from any device with this mobile number. It also syncs to
            our admin dashboard instantly.
          </p>
        </>
      ) : (
        <>
          <ContinueBookingSection contained={false} defaultExpanded={true} showAll={true} className="mb-6" />
          <DevoteeLookupGate
            inputPhone={inputPhone}
            onPhoneChange={setInputPhone}
            notFound={notFound}
            onLookup={lookup}
            inputCls={inputCls}
          />
        </>
      )}
    </div>
  );
}
