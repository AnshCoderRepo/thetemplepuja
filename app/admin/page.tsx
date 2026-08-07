"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Download,
  Lock,
  LogOut,
  ShieldCheck,
  Users,
  CalendarCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import BookPageHeader from "@/components/BookPageHeader";
import { getUsers, isAdminSession, setAdminSession, type UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";

const ADMIN_PASSCODE = "admin123";

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

function exportJSON(users: UserProfile[]) {
  const blob = new Blob([JSON.stringify(users, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `temple-puja-users-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passError, setPassError] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(isAdminSession());
    setUsers(getUsers());
    setMounted(true);

    // Stay fresh when a booking is completed in another tab of the same browser
    const onStorage = () => setUsers(getUsers());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const stats = useMemo(() => {
    const allBookings = users.flatMap((u) => u.bookings);
    const active = allBookings.filter((b) => b.status !== "cancelled");
    const revenue = active.reduce((s, b) => s + b.amount, 0);
    return {
      devotees: users.length,
      bookings: allBookings.length,
      active: active.length,
      cancelled: allBookings.length - active.length,
      revenue,
    };
  }, [users]);

  if (!mounted) {
    return (
      <section className="section-pad bg-cream">
        <div className="mx-auto h-64 max-w-md animate-pulse rounded-3xl bg-saffron-100/60" />
      </section>
    );
  }

  if (!authed) {
    return (
      <>
        <BookPageHeader
          crumb="Admin"
          eyebrow="🔐 Admin Access"
          title={
            <>
              Admin <span className="text-amber-200">Dashboard</span>
            </>
          }
          subtitle="Restricted area — sign in with the admin passcode to manage devotees and bookings."
        />
        <section className="section-pad bg-cream">
          <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-8 shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maroon-50">
              <Lock className="h-8 w-8 text-maroon-600" />
            </div>
            <h2 className="mt-5 text-center font-display text-2xl font-bold text-ink">
              Enter Passcode
            </h2>
            <p className="mt-2 text-center text-sm text-ink-soft">
              Only authorised admins can view devotee profiles.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (passcode.trim() === ADMIN_PASSCODE) {
                  setAdminSession(true);
                  setAuthed(true);
                  setPassError(false);
                } else {
                  setPassError(true);
                }
              }}
              className="mt-6 space-y-3"
            >
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPassError(false);
                }}
                placeholder="••••••••"
                autoFocus
                className={`${inputCls} text-center font-mono tracking-[0.4em]`}
              />
              {passError && (
                <p className="text-center text-xs font-semibold text-red-500">
                  Incorrect passcode. Try again.
                </p>
              )}
              <button type="submit" className="btn-primary !w-full">
                <ShieldCheck className="h-4 w-4" />
                Unlock Dashboard
              </button>
            </form>
            <p className="mt-5 rounded-xl bg-saffron-50 px-4 py-3 text-center text-xs font-medium text-ink-soft">
              🧪 Demo passcode:{" "}
              <code className="font-mono font-bold text-saffron-700">admin123</code>
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <BookPageHeader
        crumb="Admin"
        eyebrow="🔐 Admin Dashboard"
        title={
          <>
            Devotees & <span className="text-amber-200">Bookings</span>
          </>
        }
        subtitle="Every devotee who completes a payment creates a profile here, with their full details and pooja history."
        facts={[
          { icon: "🙏", label: `${stats.devotees} Devotees` },
          { icon: "🪔", label: `${stats.bookings} Total Bookings` },
          { icon: "💳", label: `${formatINR(stats.revenue)} Net Collected` },
        ]}
      />

      <section className="section-pad bg-cream">
        <div className="container-px mx-auto max-w-4xl">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, label: "Total Devotees", value: stats.devotees, cls: "from-saffron-500 to-saffron-600" },
            { icon: CalendarCheck, label: "Active Bookings", value: stats.active, cls: "from-emerald-500 to-teal-600" },
            { icon: Wallet, label: "Revenue (Active)", value: formatINR(stats.revenue), cls: "from-maroon-600 to-maroon-700" },
            { icon: XCircle, label: "Cancelled", value: stats.cancelled, cls: "from-red-500 to-rose-600" },
          ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${s.cls} text-white shadow-soft`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-4 font-display text-3xl font-bold text-ink">
                    {s.value}
                  </div>
                  <div className="text-xs font-medium text-ink-soft">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
              <Users className="h-5 w-5 text-saffron-600" />
              All Devotee Profiles
            </h2>
            <div className="flex gap-2.5">
              <button
                onClick={() => exportJSON(users)}
                disabled={users.length === 0}
                className="btn-outline !px-4 !py-2.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </button>
              <button
                onClick={() => {
                  setAdminSession(false);
                  setAuthed(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>

          {/* Users */}
          {users.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-saffron-100 bg-white p-12 text-center shadow-soft">
              <p className="text-4xl">🪔</p>
              <h3 className="mt-4 font-display text-xl font-bold text-ink">
                No Devotees Yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                Devotee profiles are created automatically the moment a payment
                is completed on the booking page. They will appear here
                instantly.
              </p>
              <Link href="/book/form" className="btn-primary mt-6">
                Open Booking Form
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {users.map((u) => {
                const open = expanded === u.id;
                return (
                  <div
                    key={u.id}
                    className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft"
                  >
                    <button
                      onClick={() => setExpanded(open ? null : u.id)}
                      aria-expanded={open}
                      className="flex w-full flex-wrap items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-saffron-50/40"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron-400 to-maroon-600 font-display text-base font-bold text-white shadow-soft">
                        {initials(u.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-base font-bold text-ink">
                          {u.name}
                          {u.bookings.length > 0 && (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              {u.bookings.length} booking{u.bookings.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-soft">
                          +91 {u.phone} · {u.city || "—"} · since {formatDate(u.createdAt)}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-display text-base font-bold text-saffron-600">
                          {formatINR(
                            u.bookings
                              .filter((b) => b.status !== "cancelled")
                              .reduce((s, b) => s + b.amount, 0)
                          )}
                        </span>
                        <span className="text-[10px] font-medium text-ink-soft">net paid</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-ink-soft transition-transform duration-300 ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {open && (
                      <div className="border-t border-saffron-100 bg-cream/40 px-6 py-5">
                        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {[
                            { label: "Gotra", value: u.gotra || "—" },
                            { label: "City", value: u.city || "—" },
                            { label: "Email", value: u.email || "—" },
                            {
                              label: "Mobile",
                              value: (
                                <a
                                  href={`tel:+91${u.phone}`}
                                  className="font-semibold text-saffron-700 hover:underline"
                                >
                                  +91 {u.phone}
                                </a>
                              ),
                            },
                          ].map((f) => (
                            <div key={f.label}>
                              <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                                {f.label}
                              </dt>
                              <dd className="mt-0.5 truncate text-sm text-ink">{f.value}</dd>
                            </div>
                          ))}
                        </dl>

                        <h4 className="mt-5 text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                          Booking History
                        </h4>
                        <div className="mt-2 space-y-2">
                          {u.bookings.length === 0 ? (
                            <p className="text-xs text-ink-soft">No bookings yet.</p>
                          ) : (
                            [...u.bookings].reverse().map((b) => (
                              <div
                                key={b.bookingId}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-saffron-100 bg-white px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-ink">
                                      🪔 {b.poojaTitle}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                                        b.status === "cancelled"
                                          ? "bg-red-100 text-red-600"
                                          : b.status === "rescheduled"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-emerald-100 text-emerald-700"
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-xs text-ink-soft">
                                    <span className="font-mono font-semibold text-saffron-700">
                                      {b.bookingId}
                                    </span>{" "}
                                    · {b.date} · {b.time} · 🙏 {b.panditName}
                                    {b.couponCode && (
                                      <span className="ml-1.5 font-mono text-emerald-600">
                                        🎟️ {b.couponCode}
                                      </span>
                                    )}
                                    {b.discount > 0 && (
                                      <span className="ml-1.5 font-semibold text-emerald-600">
                                        🎉 saved {formatINR(b.discount)}
                                      </span>
                                    )}
                                  </p>
                                  {b.reason && (
                                    <p className="mt-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
                                      🪔 Reason: {b.reason}
                                    </p>
                                  )}
                                  {b.status === "cancelled" && b.cancelledAt && (
                                    <p className="mt-1.5 text-[11px] font-semibold text-red-500">
                                      ↩️ Cancelled on {formatDate(b.cancelledAt)} — refund
                                      initiated
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`font-display text-base font-bold ${
                                    b.status === "cancelled"
                                      ? "text-ink-soft/40 line-through"
                                      : "text-saffron-600"
                                  }`}
                                >
                                  {formatINR(b.amount)}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
