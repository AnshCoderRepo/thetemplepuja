"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  MapPin,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import BookPageHeader from "@/components/BookPageHeader";
import { findUserByPhone, type UserProfile } from "@/lib/storage";
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

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [inputPhone, setInputPhone] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Read ?phone= from the URL once (avoids useSearchParams/Suspense)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("phone") ?? "";
    if (p) {
      const found = findUserByPhone(p);
      setProfile(found ?? null);
      setNotFound(!found);
    }
    setMounted(true);
  }, []);

  const lookup = (phone: string) => {
    const p = phone.trim();
    if (!/^[6-9]\d{9}$/.test(p)) {
      setNotFound(true);
      setProfile(null);
      return;
    }
    const found = findUserByPhone(p);
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
                    <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
                      <BadgeCheck className="h-4 w-4" />
                      {profile.bookings.length} Booking
                      {profile.bookings.length !== 1 ? "s" : ""}
                    </span>
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
                            <span className="font-display text-xl font-bold text-saffron-600">
                              {formatINR(b.amount)}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
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
                          {b.addonCount > 0 && (
                            <span>🎁 {b.addonCount} add-on{b.addonCount > 1 ? "s" : ""}</span>
                          )}
                          {b.couponCode && (
                            <span className="font-mono font-semibold text-emerald-600">
                              🎟️ {b.couponCode}
                            </span>
                          )}
                          <span className="ml-auto">Booked {formatDate(b.createdAt)}</span>
                        </div>
                      </article>
                    ))}
                </div>
              )}

              <p className="mt-8 rounded-2xl bg-saffron-50 px-5 py-4 text-center text-xs leading-relaxed text-ink-soft">
                ℹ️ This demo stores your profile in this browser&apos;s local
                storage — it&apos;s only visible on this device. A real backend
                will sync it across devices and to your WhatsApp.
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
