"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  Download,
  Gift,
  KeyRound,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  Undo2,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import BookPageHeader from "@/components/BookPageHeader";
import PoojasManager from "@/components/admin/PoojasManager";

import DatesManager from "@/components/admin/DatesManager";
import CouponsManager from "@/components/admin/CouponsManager";
import AccountManager from "@/components/admin/AccountManager";
import {
  clearAdminToken,
  getAdminToken,
  getUsers,
  isAdminSession,
  setAdminToken,
  type UserProfile,
} from "@/lib/storage";
import {
  adminConfig,
  adminLogin,
  adminLogout,
  deleteUserRemote,
  fetchAllUsers,
  refundBookingRemote,
} from "@/lib/api";
import { formatINR } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

type Tab = "devotees" | "poojas" | "dates" | "coupons" | "account";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "devotees", label: "Devotees", icon: Users },
  { id: "poojas", label: "Poojas", icon: LayoutGrid },
  { id: "dates", label: "Dates", icon: CalendarDays },
  { id: "coupons", label: "Coupons", icon: Gift },
  { id: "account", label: "Account", icon: KeyRound },
];

const TAB_META: Record<
  Tab,
  { title: React.ReactNode; subtitle: string; facts: { icon: string; label: string }[] }
> = {
  devotees: {
    title: (
      <>
        Devotees & <span className="text-amber-200">Bookings</span>
      </>
    ),
    subtitle:
      "Every devotee who completes a payment creates a profile here, with their full details and pooja history.",
    facts: [],
  },
  poojas: {
    title: (
      <>
        Pooja <span className="text-amber-200">Catalog</span>
      </>
    ),
    subtitle:
      "Add, edit or remove poojas — the booking form, catalogue, detail pages and home-page carousel all update instantly.",
    facts: [{ icon: "🪔", label: "Manage poojas" }, { icon: "📅", label: "Schedule events" }],
  },
  dates: {
    title: (
      <>
        Pooja <span className="text-amber-200">Dates</span>
      </>
    ),
    subtitle:
      "Set recurring dates each month when pujas are conducted — devotees pick from these when booking.",
    facts: [{ icon: "📅", label: "Manage dates" }],
  },
  coupons: {
    title: (
      <>
        Coupon <span className="text-amber-200">Codes</span>
      </>
    ),
    subtitle:
      "Create and edit discount codes and free benefits — devotees apply them at the secure payment checkout.",
    facts: [{ icon: "🎟️", label: "Manage coupons" }],
  },
  account: {
    title: (
      <>
        Admin <span className="text-amber-200">Account</span>
      </>
    ),
    subtitle:
      "Change the email and password used to sign in to this dashboard — no more hardcoded credentials.",
    facts: [{ icon: "🔑", label: "Manage sign-in" }],
  },
};

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

function DevoteesPanel({
  users,
  expanded,
  setExpanded,
  stats,
  onUsersChange,
  token,
  onAuthError,
}: {
  users: UserProfile[];
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  stats: {
    devotees: number;
    bookings: number;
    active: number;
    cancelled: number;
    refunded: number;
    revenue: number;
  };
  onUsersChange: () => void;
  token: string;
  onAuthError: () => void;
}) {
  const handleDeleteUser = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Delete ${name}'s profile and ALL their bookings? This cannot be undone.`
      )
    ) {
      return;
    }
    const res = await deleteUserRemote(id, token);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    setExpanded(null);
    onUsersChange();
  };

  const handleRefund = async (userId: string, bookingId: string, poojaTitle: string) => {
    if (
      !window.confirm(
        `Mark the ${poojaTitle} booking as refunded? It will no longer count as revenue.`
      )
    ) {
      return;
    }
    const res = await refundBookingRemote(userId, bookingId, token);
    if (res.status === 401) {
      onAuthError();
      return;
    }
    onUsersChange();
  };

  return (
    <>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: "Total Devotees", value: stats.devotees, cls: "from-saffron-500 to-saffron-600" },
          { icon: CalendarCheck, label: "Active Bookings", value: stats.active, cls: "from-emerald-500 to-teal-600" },
          { icon: Wallet, label: "Revenue (Active)", value: formatINR(stats.revenue), cls: "from-maroon-600 to-maroon-700" },
          { icon: XCircle, label: "Cancelled / Refunded", value: stats.cancelled + stats.refunded, cls: "from-red-500 to-rose-600" },
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
                          .filter(
                            (b) =>
                              b.status !== "cancelled" &&
                              b.status !== "refunded"
                          )
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
                    <div className="mb-4 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.name)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete User
                      </button>
                    </div>
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: "Gotra", value: u.gotra || "—" },
                        { label: "City", value: u.city || "—" },
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
                                    b.status === "refunded"
                                      ? "bg-indigo-100 text-indigo-700"
                                      : b.status === "cancelled"
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
                              {b.status === "refunded" && b.refundedAt && (
                                <p className="mt-1.5 text-[11px] font-semibold text-indigo-600">
                                  💸 Refunded on {formatDate(b.refundedAt)}
                                </p>
                              )}
                              {b.status === "rescheduled" && b.rescheduledAt && (
                                <p className="mt-1.5 text-[11px] font-semibold text-amber-600">
                                  🔁 Rescheduled on {formatDate(b.rescheduledAt)}
                                  {b.previousDate && !b.previousDate.startsWith("To be")
                                    ? ` — was ${b.previousDate}${b.previousTime && b.previousTime !== "—" ? ` · ${b.previousTime}` : ""}`
                                    : ""}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5">
                              {(b.status === "confirmed" ||
                                b.status === "rescheduled") && (
                                <button
                                  onClick={() =>
                                    handleRefund(u.id, b.bookingId, b.poojaTitle)
                                  }
                                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                                >
                                  <Undo2 className="h-3 w-3" />
                                  Refund
                                </button>
                              )}
                              <span
                                className={`font-display text-base font-bold ${
                                  b.status === "cancelled" || b.status === "refunded"
                                    ? "text-ink-soft/40 line-through"
                                    : "text-saffron-600"
                                }`}
                              >
                                {formatINR(b.amount)}
                              </span>
                            </div>
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
    </>
  );
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [config, setConfig] = useState<{ email: string; isDefault: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>("devotees");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Pull the devotee list from the server (the source of truth across devices),
  // falling back to the local cache when offline. A 401 means a stale session.
  const loadUsers = async (t: string | null) => {
    const res = await fetchAllUsers(t);
    if (res === null) {
      handleAuthError();
      return;
    }
    setUsers(res);
    setExpanded(null);
  };

  useEffect(() => {
    setAuthed(isAdminSession());
    setToken(getAdminToken());
    setUsers(getUsers()); // instant paint from the local cache
    setMounted(true);
    adminConfig().then(setConfig);

    // The server list wins once it arrives — this is what makes bookings made
    // on any device appear here.
    const token = getAdminToken();
    if (token) void loadUsers(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A 401 from an admin API (stale/expired token) — drop the session and show
  // the login screen again.
  const handleAuthError = () => {
    clearAdminToken();
    setToken(null);
    setAuthed(false);
  };

  const stats = useMemo(() => {
    const allBookings = users.flatMap((u) => u.bookings);
    const active = allBookings.filter(
      (b) => b.status !== "cancelled" && b.status !== "refunded"
    );
    const cancelled = allBookings.filter((b) => b.status === "cancelled");
    const refunded = allBookings.filter((b) => b.status === "refunded");
    const revenue = active.reduce((s, b) => s + b.amount, 0);
    return {
      devotees: users.length,
      bookings: allBookings.length,
      active: active.length,
      cancelled: cancelled.length,
      refunded: refunded.length,
      revenue,
    };
  }, [users]);

  const meta = TAB_META[tab];

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
          subtitle="Restricted area — sign in with the admin account to manage poojas, events, coupons and devotees."
        />
        <section className="section-pad bg-cream">
          <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-8 shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-maroon-50">
              <Lock className="h-8 w-8 text-maroon-600" />
            </div>
            <h2 className="mt-5 text-center font-display text-2xl font-bold text-ink">
              Admin Login
            </h2>
            <p className="mt-2 text-center text-sm text-ink-soft">
              Sign in with the admin account to control the whole site.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoginBusy(true);
                const res = await adminLogin(email, password);
                setLoginBusy(false);
                if (res.ok && res.token) {
                  setAdminToken(res.token);
                  setToken(res.token);
                  setAuthed(true);
                  setAuthError("");
                } else {
                  setAuthError(res.error ?? "Login failed. Try again.");
                }
              }}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="adm-email"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                >
                  Admin Email
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className="h-4 w-4 text-saffron-500" />
                  </span>
                  <input
                    id="adm-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAuthError("");
                    }}
                    placeholder="admin@thetemplepuja.com"
                    autoComplete="username"
                    autoFocus
                    className={`${inputCls} pl-11`}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="adm-password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                >
                  Password
                </label>
                <input
                  id="adm-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setAuthError("");
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`${inputCls} font-mono tracking-[0.3em]`}
                />
              </div>
              {authError && (
                <p className="text-center text-xs font-semibold text-red-500">
                  {authError}
                </p>
              )}
              <button
                type="submit"
                disabled={loginBusy}
                className="btn-primary !w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldCheck className="h-4 w-4" />
                {loginBusy ? "Signing in…" : "Login to Dashboard"}
              </button>
            </form>
            {config === null ? null : config.isDefault ? (
              <p className="mt-5 rounded-xl bg-saffron-50 px-4 py-3 text-center text-xs font-medium text-ink-soft">
                🧪 Demo account:{" "}
                <code className="font-mono font-bold text-saffron-700">
                  {config.email}
                </code>{" "}
                /{" "}
                <code className="font-mono font-bold text-saffron-700">admin123</code>
              </p>
            ) : (
              <p className="mt-5 rounded-xl bg-saffron-50 px-4 py-3 text-center text-xs font-medium text-ink-soft">
                🔑 Sign in with your custom admin email and password (set from the
                Account tab).
              </p>
            )}
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
        title={meta.title}
        subtitle={meta.subtitle}
        facts={[
          { icon: "🙏", label: `${stats.devotees} Devotees` },
          { icon: "🪔", label: `${stats.bookings} Total Bookings` },
          ...meta.facts,
        ]}
      />

      <section className="section-pad bg-cream">
        <div className="container-px mx-auto max-w-4xl">
          {/* Tabs + logout */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-saffron-100 bg-white p-2 shadow-soft">
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    aria-current={active}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? "bg-gradient-to-r from-saffron-500 to-maroon-600 text-white shadow-soft"
                        : "text-ink-soft hover:bg-saffron-50 hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => {
                if (token) adminLogout(token);
                clearAdminToken();
                setToken(null);
                setAuthed(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>

          <div className="mt-6">
            {tab === "devotees" && (
              <DevoteesPanel
                users={users}
                expanded={expanded}
                setExpanded={setExpanded}
                stats={stats}
                onUsersChange={() => void loadUsers(token)}
                token={token ?? ""}
                onAuthError={handleAuthError}
              />
            )}
            {tab === "poojas" && (
              <PoojasManager token={token ?? ""} onAuthError={handleAuthError} />
            )}
            {tab === "dates" && (
              <DatesManager token={token ?? ""} onAuthError={handleAuthError} />
            )}
            {tab === "coupons" && (
              <CouponsManager token={token ?? ""} onAuthError={handleAuthError} />
            )}
            {tab === "account" && (
              <AccountManager token={token ?? ""} onAuthError={handleAuthError} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
