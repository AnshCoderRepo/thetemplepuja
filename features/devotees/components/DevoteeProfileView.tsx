"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Play, Video } from "lucide-react";
import { PoojaExperience } from "@/features/catalog";
import { cancelBookingRemote, rescheduleBookingRemote } from "@/features/bookings";
import { fetchUserByPhone } from "../api/devoteeApi";
import type { BookingRecord, UserProfile } from "@/lib/storage";
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

  const refresh = async (phone: string) => {
    setCancelMsg(null);
    setReschedMsg(null);
    const found = await fetchUserByPhone(phone);
    setProfile(found ?? null);
    setNotFound(!found);
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("phone") ?? "";
    if (p) {
      void refresh(p);
    }
    setMounted(true);
  }, []);

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
          <PoojaExperience
            title="Your Pooja Experience"
            date={
              profile.bookings[profile.bookings.length - 1]?.poojaTitle ??
              "Live Aarti at the Mandir"
            }
            scrollHint="Scroll to reveal your pooja experience"
          >
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
                🙏 Your Ritual, Live
              </span>
              <h3 className="mt-6 font-display text-3xl font-bold text-white md:text-4xl">
                This is what your pooja looks like
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/70 md:text-base">
                Certified pandits perform every ritual with the same Vedic
                chants, sacred lamps and devotion you see here. After your
                pooja is performed, your HD video recording is shared with
                you on WhatsApp — so you can relive the blessings anytime.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/book/form" className="btn-primary">
                  🪔 Book Another Pooja
                </Link>
                <Link href="/book" className="btn-outline">
                  Browse All Poojas
                </Link>
              </div>
            </div>
          </PoojaExperience>

          <DevoteeProfileCard profile={profile} />

          {profile.videos && profile.videos.length > 0 && (
            <div className="mt-8 rounded-3xl border border-saffron-100 bg-white p-6 shadow-card space-y-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Video className="h-5 w-5 text-saffron-600" />
                Your Sacred Puja Video Recordings ({profile.videos.length})
              </h3>
              <p className="text-xs text-ink-soft">
                Watch the authentic Vedic rituals and sankalp performed on your behalf by our certified pandits.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {profile.videos.map((vid) => (
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
          />

          <p className="mt-8 rounded-2xl bg-saffron-50 px-5 py-4 text-center text-xs leading-relaxed text-ink-soft">
            ℹ️ Your profile is stored securely on our server — you can view
            it from any device with this mobile number. It also syncs to
            our admin dashboard instantly.
          </p>
        </>
      ) : (
        <DevoteeLookupGate
          inputPhone={inputPhone}
          onPhoneChange={setInputPhone}
          notFound={notFound}
          onLookup={lookup}
          inputCls={inputCls}
        />
      )}
    </div>
  );
}
