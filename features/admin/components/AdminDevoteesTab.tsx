"use client";

import { useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import type { UserProfile } from "@/lib/storage";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface AdminDevoteesTabProps {
  users: UserProfile[];
  onSelectDevotee: (u: UserProfile) => void;
  onResetPassword: (phone: string, newPass: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

export default function AdminDevoteesTab({
  users,
  onSelectDevotee,
  onResetPassword,
  onDeleteUser,
}: AdminDevoteesTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [poojaFilter, setPoojaFilter] = useState("all");
  const [resettingPhone, setResettingPhone] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const availablePoojaSlugs = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users) {
      for (const b of u.bookings) {
        if (b.poojaSlug && b.poojaTitle) {
          map.set(b.poojaSlug, b.poojaTitle);
        }
      }
    }
    return Array.from(map.entries()).map(([slug, title]) => ({ slug, title }));
  }, [users]);

  const filteredDevotees = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.gotra && u.gotra.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        u.bookings.some((b) => b.bookingId.toLowerCase().includes(q) || b.poojaTitle.toLowerCase().includes(q));

      const matchPooja =
        poojaFilter === "all" ||
        u.bookings.some((b) => b.poojaSlug === poojaFilter);

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "none" && u.bookings.length === 0) ||
        u.bookings.some((b) => b.status === statusFilter);

      return matchQuery && matchPooja && matchStatus;
    });
  }, [users, search, poojaFilter, statusFilter]);

  const handlePasswordSubmit = async (phone: string) => {
    setResetMsg("");
    setResetErr("");
    if (!newPassword || newPassword.length < 6) {
      setResetErr("Password must be at least 6 characters.");
      return;
    }
    try {
      await onResetPassword(phone, newPassword);
      setResetMsg("Password reset successfully for devotee.");
      setNewPassword("");
      setTimeout(() => {
        setResettingPhone(null);
        setResetMsg("");
      }, 2000);
    } catch {
      setResetErr("Failed to reset password.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Users className="h-6 w-6 text-saffron-600" />
            Devotee Profiles & Accounts
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Manage registered devotees, reset devotee credentials, and audit individual pooja histories.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-saffron-100 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devotees by name, phone, gotra or city..."
            className="w-full pl-9 pr-7 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:bg-white"
          >
            <option value="all">All Booking Statuses</option>
            <option value="confirmed">Confirmed Devotees</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
            <option value="none">No Bookings Yet</option>
          </select>

          {availablePoojaSlugs.length > 0 && (
            <select
              value={poojaFilter}
              onChange={(e) => setPoojaFilter(e.target.value)}
              className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:bg-white max-w-[180px] truncate"
            >
              <option value="all">All Pujas</option>
              {availablePoojaSlugs.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {(search || statusFilter !== "all" || poojaFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setPoojaFilter("all");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1.5 rounded-lg border border-saffron-200"
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Devotees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDevotees.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-dashed border-saffron-200 bg-white p-12 text-center text-xs text-ink-soft">
            <p>No devotees found matching current criteria.</p>
            {(search || statusFilter !== "all" || poojaFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPoojaFilter("all");
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:underline bg-saffron-50 px-3 py-1.5 rounded-lg border border-saffron-200"
              >
                Reset All Filters ✕
              </button>
            )}
          </div>
        ) : (
          filteredDevotees.map((devotee) => (
            <div
              key={devotee.id}
              className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold text-xs">
                    {initials(devotee.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{devotee.name}</h3>
                    <p className="text-xs text-ink-soft">
                      📱 {devotee.phone} • Gotra: {devotee.gotra || "Kashyap"}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold text-saffron-800 border border-saffron-100">
                  {devotee.bookings.length} Sevas
                </span>
              </div>

              <div className="space-y-1 text-xs text-ink-soft border-t border-saffron-50 pt-2">
                <div>City: {devotee.city}</div>
                {devotee.email && <div>Email: {devotee.email}</div>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-saffron-100 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectDevotee(devotee)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500/10 px-2.5 py-1.5 font-bold text-saffron-700 hover:bg-saffron-500/20 transition-colors"
                >
                  <Users className="h-3.5 w-3.5" />
                  View Complete Profile & Media
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResettingPhone(devotee.phone);
                      setNewPassword("");
                      setResetMsg("");
                      setResetErr("");
                    }}
                    className="text-saffron-700 font-semibold hover:underline"
                  >
                    Reset Password
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteUser(devotee.id)}
                    className="text-red-500 font-semibold hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Reset Password Form inline */}
              {resettingPhone === devotee.phone && (
                <div className="rounded-xl border border-saffron-200 bg-cream/40 p-3 space-y-2 mt-2">
                  <div className="text-xs font-bold text-ink">
                    Set New Password for {devotee.name}:
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="flex-1 rounded-lg border border-saffron-200 bg-white px-3 py-1.5 text-xs text-ink focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasswordSubmit(devotee.phone)}
                      className="rounded-lg bg-saffron-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setResettingPhone(null)}
                      className="text-xs text-ink-soft hover:text-ink px-2"
                    >
                      Cancel
                    </button>
                  </div>
                  {resetMsg && <div className="text-[11px] text-emerald-700 font-bold">{resetMsg}</div>}
                  {resetErr && <div className="text-[11px] text-red-600 font-bold">{resetErr}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
