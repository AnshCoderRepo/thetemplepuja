import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  Key,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import type { UserProfile } from "@/lib/storage";
import type { ProfileTab } from "@/components/admin/CustomerProfileModal";
import { poojas as staticPoojas } from "@/lib/data";
import { exportDevoteesExcelRemote } from "@/lib/api";

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
  onSelectDevotee: (u: UserProfile, initialTab?: ProfileTab) => void;
  onResetPassword: (phone: string, newPass: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  token?: string;
  onRefresh?: () => void;
}

export default function AdminDevoteesTab({
  users,
  onSelectDevotee,
  onResetPassword,
  onDeleteUser,
  token,
  onRefresh,
}: AdminDevoteesTabProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [poojaFilter, setPoojaFilter] = useState("all");
  const [resettingPhone, setResettingPhone] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportSuccess, setExportSuccess] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const availablePoojaList = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of staticPoojas) {
      map.set(p.slug, p.title);
    }
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
      const cleanDigits = q.replace(/\D/g, "");
      const matchQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (cleanDigits.length >= 3 && u.phone.replace(/\D/g, "").includes(cleanDigits)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.gotra && u.gotra.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        u.bookings.some((b) => b.bookingId.toLowerCase().includes(q) || b.poojaTitle.toLowerCase().includes(q));

      const matchPooja =
        poojaFilter === "all" ||
        u.bookings.some(
          (b) =>
            b.poojaSlug === poojaFilter ||
            b.poojaTitle.toLowerCase() === poojaFilter.toLowerCase()
        );

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "none" && u.bookings.length === 0) ||
        u.bookings.some((b) => b.status === statusFilter);

      return matchQuery && matchPooja && matchStatus;
    });
  }, [users, search, poojaFilter, statusFilter]);

  const handleExportExcel = async () => {
    if (!token) {
      setExportError("Admin authentication session required.");
      return;
    }
    if (filteredDevotees.length === 0) return;

    setExporting(true);
    setExportError("");
    setExportSuccess("");

    const selectedPujaObj = availablePoojaList.find((p) => p.slug === poojaFilter);
    const res = await exportDevoteesExcelRemote(token, {
      puja: poojaFilter,
      status: statusFilter,
      search: search.trim(),
      title: selectedPujaObj?.title,
    });

    setExporting(false);
    if (res.ok) {
      setExportSuccess(
        `Exported ${res.distinctCount ?? filteredDevotees.length} distinct devotees to Excel successfully.`
      );
      setTimeout(() => setExportSuccess(""), 4500);
    } else {
      setExportError(res.error || "Failed to generate Excel export.");
      setTimeout(() => setExportError(""), 5000);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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

  const selectedPujaTitle = availablePoojaList.find((p) => p.slug === poojaFilter)?.title;

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

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-saffron-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            title="Reload latest devotee profiles without reloading the page"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-saffron-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting || filteredDevotees.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
            title={
              filteredDevotees.length === 0
                ? "No matching devotees to export"
                : `Export ${filteredDevotees.length} distinct devotees to Excel (.xlsx)`
            }
          >
            {exporting ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Generating Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export Excel ({filteredDevotees.length})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccess && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {exportError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Distinct Count Pill */}
          <span className="rounded-xl bg-saffron-50 px-3 py-2 text-xs font-bold text-saffron-800 border border-saffron-200 shadow-2xs">
            {filteredDevotees.length} Distinct Devotee{filteredDevotees.length === 1 ? "" : "s"}
            {poojaFilter !== "all" && selectedPujaTitle ? ` (${selectedPujaTitle})` : ""}
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="all">All Booking Statuses</option>
            <option value="confirmed">Confirmed Devotees</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
            <option value="none">No Bookings Yet</option>
          </select>

          {availablePoojaList.length > 0 && (
            <select
              value={poojaFilter}
              onChange={(e) => setPoojaFilter(e.target.value)}
              className="rounded-xl border border-saffron-100 bg-cream/40 px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:bg-white max-w-[200px] truncate cursor-pointer"
            >
              <option value="all">All Pujas</option>
              {availablePoojaList.map((p) => (
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1.5 rounded-lg border border-saffron-200 cursor-pointer"
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

              <div className="space-y-1.5 text-xs text-ink-soft border-t border-saffron-50 pt-2">
                <div className="flex justify-between">
                  <span>City: <strong className="text-ink">{devotee.city || "Varanasi"}</strong></span>
                  {devotee.generatedPassword && (
                    <span className="font-mono text-[11px] bg-amber-50 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                      <Key className="h-3 w-3 text-amber-700" /> {devotee.generatedPassword}
                    </span>
                  )}
                </div>
                {devotee.email && !devotee.email.startsWith("pw:") && (
                  <div>Email: {devotee.email}</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-saffron-100 pt-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectDevotee(devotee, "edit")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-saffron-600 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Devotee
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectDevotee(devotee, "overview")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-saffron-200 bg-saffron-50/70 px-2.5 py-1.5 font-semibold text-saffron-800 hover:bg-saffron-100 transition-colors cursor-pointer"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Profile
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResettingPhone(devotee.phone);
                      setNewPassword("");
                      setResetMsg("");
                      setResetErr("");
                    }}
                    className="text-saffron-700 font-semibold hover:underline cursor-pointer"
                  >
                    Reset Password
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteUser(devotee.id)}
                    className="text-red-500 font-semibold hover:underline cursor-pointer"
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
