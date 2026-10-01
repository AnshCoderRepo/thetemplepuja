"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Flame,
  Gift,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Menu,
  MoreVertical,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Undo2,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import BookPageHeader from "@/components/BookPageHeader";
import PoojasManager from "@/components/admin/PoojasManager";
import TemplesManager from "@/components/admin/TemplesManager";
import BookingsTable from "@/components/admin/BookingsTable";
import OrdersManager from "@/components/admin/OrdersManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import DatesManager from "@/components/admin/DatesManager";
import CouponsManager from "@/components/admin/CouponsManager";
import AccountManager from "@/components/admin/AccountManager";
import CustomerProfileModal from "@/components/admin/CustomerProfileModal";
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
  fetchCatalog,
  refundBookingRemote,
  resetDevoteePassword,
} from "@/lib/api";
import { formatINR } from "@/lib/format";

type Tab =
  | "analytics"
  | "poojas"
  | "temples"
  | "bookings"
  | "orders"
  | "devotees"
  | "dates"
  | "coupons"
  | "account";

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof Users;
  badge?: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "analytics", label: "Analytics Dashboard", icon: BarChart3, group: "Overview" },
  { id: "poojas", label: "Puja Catalog", icon: Flame, group: "Management" },
  { id: "temples", label: "Temples", icon: Building2, group: "Management" },
  { id: "bookings", label: "Successful Bookings", icon: ShieldCheck, group: "Orders & Sevas" },
  { id: "orders", label: "All Orders & Payments", icon: ShoppingBag, group: "Orders & Sevas" },
  { id: "devotees", label: "Devotee Profiles", icon: Users, group: "Community" },
  { id: "dates", label: "Pooja Dates", icon: CalendarDays, group: "Settings" },
  { id: "coupons", label: "Coupons", icon: Gift, group: "Settings" },
  { id: "account", label: "Admin Account", icon: KeyRound, group: "Settings" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AdminPage() {
  const [session, setSession] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("analytics");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [poojaCount, setPoojaCount] = useState(12);
  const [templeCount, setTempleCount] = useState(6);
  const [adminEmail, setAdminEmail] = useState("admin@templepujasewa.com");
  const [isDefaultCreds, setIsDefaultCreds] = useState(false);

  // Devotee list filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [poojaFilter, setPoojaFilter] = useState("all");
  const [resettingPhone, setResettingPhone] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedDevotee, setSelectedDevotee] = useState<UserProfile | null>(null);

  useEffect(() => {
    const isAuth = isAdminSession();
    const storedToken = getAdminToken();
    setSession(isAuth);
    setToken(storedToken);

    if (isAuth) {
      loadData(storedToken);
    }
  }, []);

  const loadData = async (tok: string | null) => {
    const remoteUsers = await fetchAllUsers(tok);
    if (remoteUsers) setUsers(remoteUsers);
    else setUsers(getUsers());

    const catalog = await fetchCatalog();
    if (catalog) {
      if (catalog.poojas) setPoojaCount(catalog.poojas.length);
      if (catalog.temples) setTempleCount(catalog.temples.length);
    }

    const cfg = await adminConfig();
    setAdminEmail(cfg.email);
    setIsDefaultCreds(cfg.isDefault);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await adminLogin(email.trim(), password);
    if (!res.ok || !res.token) {
      setError(res.error || "Invalid email or password.");
      return;
    }
    setAdminToken(res.token);
    setSession(true);
    setToken(res.token);
    setEmail("");
    setPassword("");
    loadData(res.token);
  };

  const handleLogout = async () => {
    if (token) await adminLogout(token);
    clearAdminToken();
    setSession(false);
    setToken(null);
  };

  const handleAuthError = () => {
    clearAdminToken();
    setSession(false);
    setToken(null);
    setError("Session expired. Please log in again.");
  };

  const handleRefund = async (userId: string, bookingId: string) => {
    if (!token) return;
    const res = await refundBookingRemote(userId, bookingId, token);
    if (res.status === 401) {
      handleAuthError();
      return;
    }
    await loadData(token);
  };

  const handleResetPassword = async (phone: string) => {
    if (!token) return;
    setResetMsg("");
    setResetErr("");
    if (!newPassword || newPassword.length < 6) {
      setResetErr("Password must be at least 6 characters.");
      return;
    }
    const res = await resetDevoteePassword(phone, newPassword, token);
    if (!res.ok) {
      if (res.status === 401) {
        handleAuthError();
        return;
      }
      setResetErr(res.error || "Failed to reset password.");
      return;
    }
    setResetMsg(`Password reset successfully for devotee.`);
    setNewPassword("");
    setTimeout(() => {
      setResettingPhone(null);
      setResetMsg("");
    }, 2000);
  };

  const handleDeleteUser = async (id: string) => {
    if (!token) return;
    if (!confirm("Are you sure you want to permanently delete this devotee account?")) return;
    const res = await deleteUserRemote(id, token);
    if (res.status === 401) {
      handleAuthError();
      return;
    }
    setDeletingId(null);
    await loadData(token);
  };

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

  // Devotee filtered view
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

  // ── Login Gate ──
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream via-white to-cream flex flex-col justify-between">
        <BookPageHeader
          eyebrow="Admin Portal"
          title="Sign in to Admin Dashboard"
          subtitle="Access analytics, booking fulfillment, puja catalog, and temple management."
        />

        <div className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md rounded-3xl border border-saffron-100 bg-white p-8 shadow-xl shadow-saffron-500/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20 mb-6">
              <Lock className="h-6 w-6" />
            </div>

            <h2 className="text-xl font-bold text-ink">Admin Sign In</h2>
            <p className="text-xs text-ink-soft mt-1 mb-6">
              Enter your authorized admin credentials to proceed.
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@thetemplepuja.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 transition-all"
              >
                Sign In
              </button>
            </form>
          </div>
        </div>

        <footer className="border-t border-saffron-100 py-4 text-center text-xs text-ink-soft">
          © {new Date().getFullYear()} The Temple Puja — Admin Security Panel
        </footer>
      </div>
    );
  }

  // ── Sidebar Component Helper ──
  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 pt-1 pb-3 border-b border-saffron-100/80">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-xl font-bold text-white shadow-md shadow-saffron-500/20">
            🪔
          </span>
          <div>
            <span className="text-sm font-extrabold text-ink tracking-tight block">
              The Temple Puja
            </span>
            <span className="text-[10px] font-bold text-saffron-600 tracking-wider uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isSelected = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all text-left ${
                  isSelected
                    ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20"
                    : "text-ink-soft hover:bg-cream/60 hover:text-ink"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-white" : "text-saffron-600"}`} />
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout */}
      <div className="space-y-2 pt-4 border-t border-saffron-100/80">
        <Link
          href="/"
          target="_blank"
          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-cream/50 hover:text-ink"
        >
          <span>View Public Site</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-center justify-between rounded-2xl bg-cream/40 p-2.5 border border-saffron-100">
          <div className="flex items-center gap-2.5 truncate">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-saffron-200 text-xs font-bold text-saffron-800">
              {initials(adminEmail || "Admin")}
            </div>
            <div className="truncate">
              <div className="text-[11px] font-bold text-ink leading-tight">Admin User</div>
              <div className="text-[10px] text-ink-soft/70 truncate max-w-[110px]">{adminEmail}</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Authenticated Admin Portal with Sidebar Layout ──
  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop Persistent Left Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-white border-r border-saffron-100 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex w-72 max-w-[80vw] flex-col bg-white shadow-2xl z-10 animate-fadeIn">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-saffron-100 bg-white/95 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-saffron-200 bg-cream/40 text-ink-soft hover:bg-saffron-50"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-soft hidden sm:inline">Admin Console</span>
              <span className="text-ink-soft/40 hidden sm:inline">/</span>
              <span className="font-bold text-ink">
                {NAV_ITEMS.find((n) => n.id === tab)?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-cream/60 px-3 py-1.5 border border-saffron-100 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-ink text-[11px] hidden sm:inline">Database Live</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/60 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-6xl w-full mx-auto">
          {/* ── TAB 1: Analytics Dashboard ── */}
          {tab === "analytics" && (
            <AnalyticsDashboard
              users={users}
              onRefresh={() => loadData(token)}
              activePoojaCount={poojaCount}
              activeTempleCount={templeCount}
            />
          )}

          {/* ── TAB 2: Puja Catalog Management ── */}
          {tab === "poojas" && (
            <PoojasManager token={token || ""} onAuthError={handleAuthError} />
          )}

          {/* ── TAB 3: Temple Management ── */}
          {tab === "temples" && (
            <TemplesManager token={token || ""} onAuthError={handleAuthError} />
          )}

          {/* ── TAB 4: Successful Bookings ── */}
          {tab === "bookings" && (
            <BookingsTable users={users} onRefund={handleRefund} />
          )}

          {/* ── TAB 5: Orders & Transactions ── */}
          {tab === "orders" && (
            <OrdersManager users={users} onRefund={handleRefund} />
          )}

          {/* ── TAB 6: Devotee Profiles ── */}
          {tab === "devotees" && (
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
                  {/* Status Dropdown */}
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

                  {/* Pooja Dropdown */}
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

                  {/* Reset */}
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
                          onClick={() => setSelectedDevotee(devotee)}
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
                            onClick={() => handleDeleteUser(devotee.id)}
                            className="text-red-500 font-semibold hover:underline"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Reset Password Modal / Form inline */}
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
                              onClick={() => handleResetPassword(devotee.phone)}
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
          )}

          {/* ── TAB 7: Pooja Dates ── */}
          {tab === "dates" && (
            <DatesManager token={token || ""} onAuthError={handleAuthError} />
          )}

          {/* ── TAB 8: Coupons ── */}
          {tab === "coupons" && (
            <CouponsManager token={token || ""} onAuthError={handleAuthError} />
          )}

          {/* ── TAB 9: Account Settings ── */}
          {tab === "account" && (
            <AccountManager token={token || ""} onAuthError={handleAuthError} />
          )}
        </main>
      </div>

      {/* Customer Full Profile & Media Modal */}
      {selectedDevotee && (
        <CustomerProfileModal
          user={selectedDevotee}
          token={token || ""}
          onClose={() => setSelectedDevotee(null)}
          onUserUpdated={(updated) => {
            setSelectedDevotee(updated);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
          }}
          onRefund={handleRefund}
          onDelete={(id) => {
            handleDeleteUser(id);
            setSelectedDevotee(null);
          }}
          onResetPassword={async (phone, newPass) => {
            if (!token) return { ok: false, error: "Not authenticated" };
            return await resetDevoteePassword(phone, newPass, token);
          }}
        />
      )}
    </div>
  );
}
