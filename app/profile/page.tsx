"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  MapPin,
  Phone,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import BookPageHeader from "@/components/BookPageHeader";
import { cancelBookingRemote, fetchUserByPhone, rescheduleBookingRemote } from "@/lib/api";
import type { BookingRecord, UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

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

/** "2026-08-22" → "Sat, 22 Aug" — matches the booking form's display. */
function displayDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  rescheduled: "bg-amber-100 text-amber-700",
};

export default function ProfilePage() {
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

  // Server-backed (falls back to the local cache offline) so a devotee sees
  // their history from any device.
  const refresh = async (phone: string) => {
    setCancelMsg(null);
    setReschedMsg(null);
    const found = await fetchUserByPhone(phone);
    setProfile(found ?? null);
    setNotFound(!found);
  };

  // Read ?phone= from the URL once (avoids useSearchParams/Suspense)
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
      // Event-slot bookings move their held seat to the new occurrence.
      dateISO: b.eventDateISO ? reschedDate : undefined,
    });
    if (res.ok) {
      await refresh(profile.phone);
      setReschedId(null);
      setReschedDate("");
      setReschedTime("");
      // Success shows in the top banner (the form closes on success);
      // failures stay inline inside the form.
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
    <>
      <BookPageHeader
        crumb="My Profile"
        eyebrow="🙏 Devotee Profile"
        title={
          <>
            My <span className="text-amber-200">Sacred Profile</span>
          </>
        }
        subtitle="View your personal details and every pooja you've booked with The Temple Puja."
        facts={[
          { icon: "🪔", label: "Booking history" },
          { icon: "🔒", label: "Private & secure" },
        ]}
      />

      <section className="section-pad bg-cream">
        <div className="container-px mx-auto max-w-3xl">
          {!mounted ? (
            <div className="h-64 animate-pulse rounded-3xl bg-saffron-100/60" />
          ) : profile ? (
            <>
              {/* Profile card */}
              <div className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
                <div className="relative h-24 bg-gradient-to-r from-saffron-500 via-saffron-600 to-maroon-700">
                  <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
                </div>
                <div className="px-8 pb-8">
                  <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                      <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-saffron-400 to-maroon-600 font-display text-2xl font-bold text-white shadow-card">
                        {initials(profile.name)}
                      </span>
                      <div className="pb-1">
                        <h2 className="font-display text-2xl font-bold text-ink">
                          {profile.name}
                        </h2>
                        <p className="text-xs font-medium text-ink-soft">
                          Devotee since {formatDate(profile.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mb-1 flex flex-wrap items-center justify-end gap-2">
                      {(() => {
                        const activeCount = profile.bookings.filter(
                          (b) => b.status !== "cancelled"
                        ).length;
                        const cancelledCount = profile.bookings.length - activeCount;
                        return (
                          <>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
                              <BadgeCheck className="h-4 w-4" />
                              {activeCount} Active Booking
                              {activeCount !== 1 ? "s" : ""}
                            </span>
                            {cancelledCount > 0 && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold text-red-600">
                                <XCircle className="h-4 w-4" />
                                {cancelledCount} Cancelled
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { icon: "🧬", label: "Gotra", value: profile.gotra || "—" },
                      {
                        icon: <MapPin className="h-4 w-4 text-saffron-600" />,
                        label: "City",
                        value: profile.city || "—",
                      },
                      {
                        icon: <Phone className="h-4 w-4 text-saffron-600" />,
                        label: "Mobile",
                        value: (
                          <a
                            href={`tel:+91${profile.phone}`}
                            className="font-semibold text-ink transition-colors hover:text-saffron-600"
                          >
                            +91 {profile.phone}
                          </a>
                        ),
                      },
                      {
                        icon: "✉️",
                        label: "Email",
                        value: profile.email || "—",
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center gap-3 rounded-2xl border border-saffron-100 bg-cream/60 px-4 py-3.5"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-soft">
                          {row.icon}
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                            {row.label}
                          </dt>
                          <dd className="truncate text-sm text-ink">{row.value}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Bookings */}
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

              {profile.bookings.length === 0 ? (
                <div className="rounded-3xl border border-saffron-100 bg-white p-10 text-center shadow-soft">
                  <p className="text-3xl">🪔</p>
                  <p className="mt-3 text-sm text-ink-soft">
                    No bookings yet — book your first pooja today.
                  </p>
                  <Link href="/book" className="btn-primary mt-5">
                    Browse Poojas
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...profile.bookings]
                    .reverse()
                    .map((b) => (
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

                        {(b.status === "confirmed" || b.status === "rescheduled") && (
                          <div className="border-t border-dashed border-saffron-100 px-6 py-3.5">
                            {reschedId === b.bookingId ? (
                              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                                <p className="text-xs font-bold text-amber-800">
                                  📅 Move this booking to a new muhurat
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80">
                                  {b.eventDateISO
                                    ? "This is an event slot — rescheduling moves your held seat to the new date."
                                    : "Pick a fresh date and time — the pandit will perform the pooja then."}
                                </p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                      New Date *
                                    </label>
                                    <input
                                      type="date"
                                      min={new Date().toLocaleDateString("en-CA")}
                                      value={reschedDate}
                                      onChange={(e) => setReschedDate(e.target.value)}
                                      className={inputCls}
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-amber-800">
                                      New Time *
                                    </label>
                                    <input
                                      value={reschedTime}
                                      onChange={(e) => setReschedTime(e.target.value)}
                                      placeholder="e.g. 7:00 PM IST"
                                      className={inputCls}
                                    />
                                  </div>
                                </div>
                                {reschedMsg && (
                                  <p
                                    className={`mt-2.5 text-xs font-semibold ${
                                      reschedMsg.ok ? "text-emerald-700" : "text-red-600"
                                    }`}
                                  >
                                    {reschedMsg.ok ? "✅ " : "⚠️ "}
                                    {reschedMsg.text}
                                  </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleReschedule(b)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
                                  >
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    Save New Muhurat
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReschedId(null);
                                      setReschedMsg(null);
                                    }}
                                    className="rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
                                  >
                                    Keep Current Date
                                  </button>
                                </div>
                              </div>
                            ) : confirmCancelId === b.bookingId ? (
                              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-xs font-semibold text-red-700">
                                  Cancel this booking? Your seat will be released and a refund
                                  initiated within 5–7 business days.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleCancel(b.bookingId)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700"
                                  >
                                    Yes, Cancel Booking
                                  </button>
                                  <button
                                    onClick={() => setConfirmCancelId(null)}
                                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                                  >
                                    Keep Booking
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => openResched(b)}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                                >
                                  <CalendarClock className="h-3.5 w-3.5" />
                                  Reschedule
                                </button>
                                <button
                                  onClick={() => setConfirmCancelId(b.bookingId)}
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
              )}

              <p className="mt-8 rounded-2xl bg-saffron-50 px-5 py-4 text-center text-xs leading-relaxed text-ink-soft">
                ℹ️ Your profile is stored securely on our server — you can view
                it from any device with this mobile number. It also syncs to
                our admin dashboard instantly.
              </p>
            </>
          ) : (
            /* Lookup form */
            <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-8 text-center shadow-card">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50">
                <UserRound className="h-8 w-8 text-saffron-500" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold text-ink">
                Find Your Profile
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Enter the 10-digit mobile number you used at booking to view your
                profile and pooja history.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookup(inputPhone);
                }}
                className="mt-6 space-y-3"
              >
                <input
                  value={inputPhone}
                  onChange={(e) =>
                    setInputPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  autoFocus
                  className={`${inputCls} text-center font-mono tracking-widest`}
                />
                {notFound && (
                  <p className="text-xs font-semibold text-red-500">
                    No profile found for this number. Please check and try again,
                    or book a pooja to create one.
                  </p>
                )}
                <button type="submit" className="btn-primary !w-full">
                  <Search className="h-4 w-4" />
                  View My Profile
                </button>
              </form>
              <Link
                href="/book/form"
                className="mt-4 inline-block text-xs font-semibold text-saffron-600 transition-colors hover:text-saffron-700"
              >
                New here? Book a pooja →
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
