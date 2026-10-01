"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Flame,
  Globe,
  Layers,
  MapPin,
  Percent,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import type { UserProfile } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import { computeAnalytics } from "@/lib/analytics";

type DateRange = "today" | "7d" | "30d" | "90d" | "year" | "custom" | "all";

export default function AnalyticsDashboard({
  users,
  onRefresh,
  activePoojaCount = 12,
  activeTempleCount = 6,
}: {
  users: UserProfile[];
  onRefresh: () => void;
  activePoojaCount?: number;
  activeTempleCount?: number;
}) {
  const [range, setRange] = useState<DateRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "users" | "pujas" | "temples" | "bookings" | "revenue" | "lookup"
  >("overview");
  const [lookupQuery, setLookupQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const daysLookback = useMemo(() => {
    switch (range) {
      case "today":
        return 1;
      case "7d":
        return 7;
      case "30d":
        return 30;
      case "90d":
        return 90;
      case "year":
        return 365;
      case "custom":
        if (customStart && customEnd) {
          const diff = Math.ceil(
            (new Date(customEnd).getTime() - new Date(customStart).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return Math.max(1, diff);
        }
        return 30;
      case "all":
        return 9999;
    }
  }, [range, customStart, customEnd]);

  const stats = useMemo(() => {
    return computeAnalytics(users, daysLookback);
  }, [users, daysLookback]);

  // All bookings for recent feed & export
  const allBookings = useMemo(() => {
    const list = [];
    for (const u of users) {
      for (const b of u.bookings) {
        list.push({ booking: b, user: u });
      }
    }
    return list.sort(
      (a, b) => new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()
    );
  }, [users]);

  const totalDevotees = users.length;
  const confirmedCount = stats.activeBookings;
  const cancelledAndRefunded = stats.cancelledBookings + stats.refundedBookings;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const exportExcel = () => {
    const headers = [
      "Booking ID",
      "Customer",
      "Phone",
      "Gotra",
      "City",
      "Pooja",
      "Amount (INR)",
      "Discount",
      "Coupon",
      "Status",
      "Booking Date",
    ];
    const rows = allBookings.map(({ booking, user }) => [
      `"${booking.bookingId}"`,
      `"${user.name}"`,
      `"${user.phone}"`,
      `"${user.gotra || "Kashyap"}"`,
      `"${user.city || ""}"`,
      `"${booking.poojaTitle}"`,
      booking.amount,
      booking.discount || 0,
      `"${booking.couponCode || ""}"`,
      `"${booking.status}"`,
      `"${booking.createdAt}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SVG Trend Chart Dimensions
  const chartPoints = stats.bookingsPerDay;
  const maxRevenue = Math.max(...chartPoints.map((p) => p.revenue), 1000);
  const chartHeight = 160;
  const chartWidth = 600;

  const pathD = useMemo(() => {
    if (chartPoints.length < 2) return "";
    const dx = chartWidth / (chartPoints.length - 1);
    const coords = chartPoints.map((p, i) => {
      const x = i * dx;
      const y = chartHeight - (p.revenue / maxRevenue) * (chartHeight - 30) - 15;
      return { x, y };
    });

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [chartPoints, maxRevenue]);

  const fillD = useMemo(() => {
    if (!pathD) return "";
    return `${pathD} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [pathD]);

  // Lookup results
  const lookupDevotees = useMemo(() => {
    if (!lookupQuery.trim()) return [];
    const q = lookupQuery.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.city.toLowerCase().includes(q) ||
        (u.gotra && u.gotra.toLowerCase().includes(q)) ||
        u.bookings.some((b) => b.bookingId.toLowerCase().includes(q))
    );
  }, [users, lookupQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Range Actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">Analytics Dashboard</h2>
            <p className="text-xs text-ink-soft">
              Real-time intelligence computed dynamically from verified devotee bookings
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selector */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as DateRange)}
            className="rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink focus:outline-none shadow-sm"
          >
            <option value="all">All Time (Complete History)</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {/* Custom Date Inputs if Range is Custom */}
          {range === "custom" && (
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-saffron-200 text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-lg px-2 py-1 text-xs border border-saffron-100 focus:outline-none"
              />
              <span className="text-ink-soft text-[10px]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-lg px-2 py-1 text-xs border border-saffron-100 focus:outline-none"
              />
            </div>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefreshClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-saffron-50 shadow-sm transition-all"
            title="Reload latest booking data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* Export Excel / CSV */}
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV / Excel
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-white p-1.5 border border-saffron-100 shadow-sm text-xs font-bold">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "users", label: `Devotees (${totalDevotees})`, icon: Users },
          { id: "pujas", label: `Pujas (${stats.popularPoojas.length})`, icon: Flame },
          { id: "temples", label: `Temples (${stats.popularTemples.length || activeTempleCount})`, icon: MapPin },
          { id: "bookings", label: `Bookings (${allBookings.length})`, icon: CheckCircle2 },
          { id: "revenue", label: `Revenue (${formatINR(stats.totalRevenue)})`, icon: Wallet },
          { id: "lookup", label: "Devotee Lookup", icon: Search },
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 transition-all ${
                isSelected
                  ? "bg-purple-700 text-white shadow-sm shadow-purple-700/20"
                  : "text-ink-soft hover:text-ink hover:bg-cream/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* TOTAL DEVOTEES */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-soft tracking-wider uppercase">
              DEVOTEES
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink mt-2">{totalDevotees}</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowUpRight className="h-3 w-3" />
            {stats.userGrowthPct >= 0 ? `+${stats.userGrowthPct}%` : `${stats.userGrowthPct}%`}
          </div>
        </div>

        {/* CONFIRMED BOOKINGS */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-soft tracking-wider uppercase">
              CONFIRMED
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink mt-2">{confirmedCount}</div>
          <div className="text-[10px] text-ink-soft/70 mt-1 truncate">
            {stats.conversionRate}% completion rate
          </div>
        </div>

        {/* ADJUSTED / REFUNDED */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-soft tracking-wider uppercase">
              CANCEL/REFUND
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink mt-2">
            {cancelledAndRefunded}
          </div>
          <div className="text-[10px] text-ink-soft/70 mt-1 truncate">
            {stats.refundedBookings} refunded • {stats.cancelledBookings} cancelled
          </div>
        </div>

        {/* TOTAL REVENUE */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-soft tracking-wider uppercase">
              REVENUE
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink mt-2">
            {formatINR(stats.totalRevenue)}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowUpRight className="h-3 w-3" />
            {stats.revenueGrowthPct >= 0 ? `+${stats.revenueGrowthPct}%` : `${stats.revenueGrowthPct}%`}
          </div>
        </div>

        {/* ACTIVE PUJAS */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-soft tracking-wider uppercase">
              ACTIVE PUJAS
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink mt-2">{activePoojaCount}</div>
          <div className="text-[10px] text-ink-soft/70 mt-1">Catalog services</div>
        </div>

        {/* TEMPLES */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ink-soft tracking-wider uppercase">
              TEMPLES
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-ink mt-2">{activeTempleCount}</div>
          <div className="text-[10px] text-ink-soft/70 mt-1">Pilgrimage sites</div>
        </div>
      </div>

      {/* ────────────────── SUB-TAB 1: OVERVIEW ────────────────── */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend SVG Curve Chart */}
            <div className="lg:col-span-2 rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-ink">Revenue Trend (INR)</h3>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Avg Order: {formatINR(stats.averageOrderValue)}
                  </span>
                </div>
                <p className="text-xs text-ink-soft">
                  Daily revenue curve computed directly from platform transactions
                </p>

                {/* SVG Chart */}
                <div className="mt-6 w-full overflow-hidden relative">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-44 overflow-visible"
                  >
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    {[0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = chartHeight * ratio;
                      return (
                        <line
                          key={ratio}
                          x1="0"
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeDasharray="4 4"
                        />
                      );
                    })}

                    {/* Area fill */}
                    {fillD && <path d={fillD} fill="url(#revenueGrad)" />}

                    {/* Smooth trend curve */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Data Points with hover */}
                    {chartPoints.map((p, i) => {
                      const dx = chartWidth / (chartPoints.length - 1 || 1);
                      const cx = i * dx;
                      const cy = chartHeight - (p.revenue / maxRevenue) * (chartHeight - 30) - 15;
                      const isHovered = hoveredPointIndex === i;
                      return (
                        <g key={p.date}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={isHovered ? 5 : 3}
                            fill={isHovered ? "#059669" : "#10b981"}
                            stroke="#fff"
                            strokeWidth="1.5"
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setHoveredPointIndex(i)}
                            onMouseLeave={() => setHoveredPointIndex(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Active Tooltip */}
                  {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                    <div className="absolute top-2 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs shadow-lg animate-fadeIn font-mono">
                      <span className="font-bold">{chartPoints[hoveredPointIndex].date}: </span>
                      <span className="text-emerald-400 font-bold">
                        {formatINR(chartPoints[hoveredPointIndex].revenue)}
                      </span>{" "}
                      ({chartPoints[hoveredPointIndex].count} bookings)
                    </div>
                  )}

                  {/* X Axis dates */}
                  <div className="flex justify-between text-[10px] text-ink-soft/60 pt-2 border-t border-slate-100 font-mono">
                    {chartPoints
                      .filter((_, i) => i % Math.max(1, Math.floor(chartPoints.length / 6)) === 0)
                      .map((p) => (
                        <span key={p.date}>{p.date.slice(5)}</span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performing Pujas Progress Bar */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Top Performing Pujas</h3>
                <p className="text-xs text-ink-soft">Highest revenue generating ceremonies</p>
              </div>

              <div className="space-y-4 pt-1">
                {stats.popularPoojas.length === 0 ? (
                  <p className="text-xs text-ink-soft text-center py-6">No bookings recorded yet.</p>
                ) : (
                  stats.popularPoojas.slice(0, 5).map((pooja) => {
                    const maxCount = stats.popularPoojas[0]?.count || 1;
                    const pct = Math.round((pooja.count / maxCount) * 100);
                    return (
                      <div key={pooja.slug} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-ink truncate max-w-[160px]">
                            {pooja.title}
                          </span>
                          <span className="font-bold text-purple-900">
                            {pooja.count} bookings
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="h-2 w-full rounded-full bg-purple-50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-700 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-ink-soft font-medium">
                          <span>Avg: {formatINR(pooja.avgOrderValue)}</span>
                          <span className="text-emerald-700 font-bold">
                            Rev: {formatINR(pooja.revenue)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Recent Booking Activity Feed */}
          <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Recent Booking Activity</h3>
                <p className="text-xs text-ink-soft">
                  Live feed of the latest bookings placed on the platform
                </p>
              </div>
              <span className="text-xs font-bold text-purple-700">
                {allBookings.length} Total Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink">
                <thead className="border-b border-saffron-100 bg-cream/30 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Booking ID</th>
                    <th className="px-3.5 py-2.5">Devotee</th>
                    <th className="px-3.5 py-2.5">Pooja Ceremony</th>
                    <th className="px-3.5 py-2.5">Scheduled Muhurat</th>
                    <th className="px-3.5 py-2.5">Amount</th>
                    <th className="px-3.5 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-saffron-50">
                  {allBookings.slice(0, 6).map(({ booking, user }) => (
                    <tr key={booking.bookingId} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono font-bold text-saffron-800">
                        {booking.bookingId}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-bold text-ink">{user.name}</div>
                        <div className="text-[11px] text-ink-soft">{user.phone}</div>
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-ink">
                        {booking.poojaTitle}
                      </td>
                      <td className="px-3.5 py-2.5 text-ink-soft">{booking.date}</td>
                      <td className="px-3.5 py-2.5 font-bold text-ink">
                        {formatINR(booking.amount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            booking.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800"
                              : booking.status === "refunded"
                              ? "bg-purple-100 text-purple-800"
                              : booking.status === "rescheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 2: DEVOTEES / USERS ────────────────── */}
      {activeSubTab === "users" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* City Distribution */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-ink">Devotees by City</h3>
              </div>
              <div className="space-y-3">
                {stats.cityMetrics.length === 0 ? (
                  <p className="text-xs text-ink-soft">No devotee records found.</p>
                ) : (
                  stats.cityMetrics.slice(0, 6).map((cm) => (
                    <div
                      key={cm.city}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-cream/30 border border-saffron-50"
                    >
                      <div>
                        <div className="font-bold text-ink">{cm.city}</div>
                        <div className="text-[10px] text-ink-soft">
                          {cm.bookingCount} bookings placed
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-purple-900">
                          {cm.devoteeCount} devotees
                        </span>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          {formatINR(cm.revenue)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gotra Distribution */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-saffron-600" />
                <h3 className="text-sm font-bold text-ink">Gotra Demographics</h3>
              </div>
              <div className="space-y-2.5">
                {stats.gotraMetrics.length === 0 ? (
                  <p className="text-xs text-ink-soft">No gotra records found.</p>
                ) : (
                  stats.gotraMetrics.slice(0, 6).map((gm) => (
                    <div
                      key={gm.gotra}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-cream/20"
                    >
                      <span className="font-bold text-saffron-900">Gotra: {gm.gotra}</span>
                      <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 font-bold text-saffron-800 text-[11px]">
                        {gm.count} devotees
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Devotee Retention & Activity Summary */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-ink">Devotee Activity Summary</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-ink-soft text-[11px]">Repeat Devotees</div>
                  <div className="text-xl font-bold text-emerald-900 mt-0.5">
                    {users.filter((u) => u.bookings.length > 1).length} devotees
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">
                    Have booked multiple puja ceremonies
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50/50 border border-purple-100">
                  <div className="text-ink-soft text-[11px]">Avg Seva Spend / Devotee</div>
                  <div className="text-xl font-bold text-purple-900 mt-0.5">
                    {formatINR(
                      totalDevotees > 0 ? Math.round(stats.totalRevenue / totalDevotees) : 0
                    )}
                  </div>
                  <div className="text-[10px] text-purple-700 mt-1">
                    Lifetime average platform value
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Devotees Table */}
          <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-ink">Top Devotees (By Seva Contributions)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-ink">
                <thead className="border-b border-saffron-100 bg-cream/30 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                  <tr>
                    <th className="px-3.5 py-2.5">Devotee Name</th>
                    <th className="px-3.5 py-2.5">Phone Number</th>
                    <th className="px-3.5 py-2.5">Location & Gotra</th>
                    <th className="px-3.5 py-2.5 text-center">Total Bookings</th>
                    <th className="px-3.5 py-2.5">Total Spent</th>
                    <th className="px-3.5 py-2.5">Last Ceremony</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-saffron-50">
                  {stats.topDevotees.map((d) => (
                    <tr key={d.id} className="hover:bg-orange-50/20">
                      <td className="px-3.5 py-2.5 font-bold text-ink">{d.name}</td>
                      <td className="px-3.5 py-2.5 font-mono text-ink-soft">{d.phone}</td>
                      <td className="px-3.5 py-2.5 text-ink-soft">
                        {d.city} • Gotra: {d.gotra}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 font-bold text-purple-800 text-[10px]">
                          {d.bookingCount}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-emerald-700">
                        {formatINR(d.totalSpent)}
                      </td>
                      <td className="px-3.5 py-2.5 text-ink-soft">{d.lastBookingDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 3: PUJAS PERFORMANCE ────────────────── */}
      {activeSubTab === "pujas" && (
        <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Puja Ceremony Performance Catalog</h3>
              <p className="text-xs text-ink-soft">
                Detailed breakdown of booking volume, gross revenue, cancellations and average order value
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700">
              {stats.popularPoojas.length} Active Services
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="border-b border-saffron-100 bg-cream/30 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5">Puja Name</th>
                  <th className="px-3.5 py-2.5 text-center">Total Bookings</th>
                  <th className="px-3.5 py-2.5 text-center">Cancelled / Refunded</th>
                  <th className="px-3.5 py-2.5">Total Revenue</th>
                  <th className="px-3.5 py-2.5">Avg Order Value</th>
                  <th className="px-3.5 py-2.5">Market Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {stats.popularPoojas.map((pooja) => {
                  const sharePct =
                    stats.totalRevenue > 0
                      ? Math.round((pooja.revenue / stats.totalRevenue) * 100)
                      : 0;
                  return (
                    <tr key={pooja.slug} className="hover:bg-orange-50/20">
                      <td className="px-3.5 py-2.5 font-bold text-ink">
                        <div>{pooja.title}</div>
                        <div className="text-[10px] text-ink-soft font-mono font-normal">
                          slug: {pooja.slug}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-bold text-purple-900">
                          {pooja.count}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`font-semibold ${
                            pooja.cancelledCount > 0 ? "text-amber-700" : "text-ink-soft"
                          }`}
                        >
                          {pooja.cancelledCount}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-emerald-700">
                        {formatINR(pooja.revenue)}
                      </td>
                      <td className="px-3.5 py-2.5 text-ink-soft">
                        {formatINR(pooja.avgOrderValue)}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>
                          <span className="font-bold text-[11px] text-ink-soft">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB: TEMPLES PERFORMANCE ────────────────── */}
      {activeSubTab === "temples" && (
        <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink">Sacred Temples & Pilgrimage Analytics</h3>
              <p className="text-xs text-ink-soft">
                Seva distribution and revenue breakdown across registered temple locations
              </p>
            </div>
            <span className="text-xs font-bold text-saffron-700">
              {stats.popularTemples.length || activeTempleCount} Temples Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink">
              <thead className="border-b border-saffron-100 bg-cream/30 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
                <tr>
                  <th className="px-3.5 py-2.5">Sacred Temple</th>
                  <th className="px-3.5 py-2.5 text-center">Total Sevas Performed</th>
                  <th className="px-3.5 py-2.5">Total Revenue Generated</th>
                  <th className="px-3.5 py-2.5">Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-50">
                {stats.popularTemples.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-xs text-ink-soft">
                      No temple-specific booking records found yet.
                    </td>
                  </tr>
                ) : (
                  stats.popularTemples.map((temple) => {
                    const sharePct =
                      stats.totalRevenue > 0
                        ? Math.round((temple.revenue / stats.totalRevenue) * 100)
                        : 0;
                    return (
                      <tr key={temple.slug} className="hover:bg-orange-50/20">
                        <td className="px-3.5 py-2.5 font-bold text-ink">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🛕</span>
                            <div>
                              <div>{temple.name}</div>
                              <div className="text-[10px] text-ink-soft font-mono font-normal">
                                slug: {temple.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 text-center">
                          <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 font-bold text-saffron-900">
                            {temple.count}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-emerald-700">
                          {formatINR(temple.revenue)}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-saffron-500 rounded-full"
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                            <span className="font-bold text-[11px] text-ink-soft">
                              {sharePct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 4: BOOKINGS & TIMING ────────────────── */}
      {activeSubTab === "bookings" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Breakdown & Weekday traffic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-ink">Booking Status Breakdown</h3>
              <div className="space-y-3">
                {[
                  {
                    label: "Confirmed (Paid & Scheduled)",
                    count: confirmedCount,
                    color: "bg-emerald-500",
                    textColor: "text-emerald-700",
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "Rescheduled to New Muhurat",
                    count: stats.rescheduledBookings,
                    color: "bg-blue-500",
                    textColor: "text-blue-700",
                    bg: "bg-blue-50",
                  },
                  {
                    label: "Refunded to Devotee",
                    count: stats.refundedBookings,
                    color: "bg-purple-500",
                    textColor: "text-purple-700",
                    bg: "bg-purple-50",
                  },
                  {
                    label: "Cancelled by User",
                    count: stats.cancelledBookings,
                    color: "bg-red-500",
                    textColor: "text-red-700",
                    bg: "bg-red-50",
                  },
                ].map((st) => {
                  const pct =
                    allBookings.length > 0
                      ? Math.round((st.count / allBookings.length) * 100)
                      : 0;
                  return (
                    <div key={st.label} className={`p-3 rounded-2xl ${st.bg} space-y-1.5`}>
                      <div className="flex justify-between text-xs font-bold">
                        <span className={st.textColor}>{st.label}</span>
                        <span className={st.textColor}>
                          {st.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white overflow-hidden">
                        <div className={`h-full ${st.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekday Distribution */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-ink">Day of Week Booking Traffic</h3>
              <div className="grid grid-cols-7 gap-2 pt-4">
                {stats.weekdayStats.map((w) => {
                  const maxDayCount = Math.max(
                    ...stats.weekdayStats.map((x) => x.count),
                    1
                  );
                  const hPct = Math.round((w.count / maxDayCount) * 100);
                  return (
                    <div key={w.day} className="flex flex-col items-center gap-2">
                      <div className="text-[10px] text-ink-soft font-bold">{w.count}</div>
                      <div className="h-28 w-6 rounded-t-lg bg-cream/70 flex flex-col justify-end p-0.5">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-saffron-600 to-saffron-400 transition-all duration-500"
                          style={{ height: `${Math.max(hPct, 8)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-ink">{w.day}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-ink-soft text-center pt-2 border-t border-saffron-50">
                Auspicious days such as Mondays (Lord Shiva) & Tuesdays (Hanuman Ji) drive peak traffic
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 5: REVENUE & FINANCIALS ────────────────── */}
      {activeSubTab === "revenue" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Financial Summary */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-ink">Financial Performance</h3>
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between py-1.5 border-b border-saffron-50">
                  <span className="text-ink-soft">Total Gross Volume</span>
                  <span className="font-bold text-ink">
                    {formatINR(
                      allBookings.reduce((s, { booking }) => s + booking.amount, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-saffron-50">
                  <span className="text-ink-soft">Net Platform Revenue</span>
                  <span className="font-bold text-emerald-700">
                    {formatINR(stats.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-saffron-50">
                  <span className="text-ink-soft">Discounts Absorbed</span>
                  <span className="font-bold text-amber-700">
                    {formatINR(stats.totalDiscountsGiven)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-ink-soft">Average Order Value (AOV)</span>
                  <span className="font-bold text-purple-900">
                    {formatINR(stats.averageOrderValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Coupons Impact */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-ink">Coupons & Offer Impact</h3>
              <div className="space-y-2 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <div className="text-ink-soft text-[11px]">Orders With Coupons</div>
                  <div className="text-xl font-bold text-amber-900 mt-0.5">
                    {stats.couponBookingsCount} orders
                  </div>
                  <div className="text-[10px] text-amber-700 mt-1">
                    {allBookings.length > 0
                      ? Math.round((stats.couponBookingsCount / allBookings.length) * 100)
                      : 0}
                    % of all devotee bookings used a promo code
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-ink-soft text-[11px]">Total Savings Provided</div>
                  <div className="text-xl font-bold text-emerald-900 mt-0.5">
                    {formatINR(stats.totalDiscountsGiven)}
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1">
                    Direct devotee promotional savings
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Trend List */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-ink">Monthly Revenue History</h3>
              <div className="space-y-2 pt-1 max-h-48 overflow-y-auto">
                {stats.monthlyRevenue.map((m) => (
                  <div
                    key={m.month}
                    className="flex justify-between items-center text-xs p-2 rounded-xl bg-cream/30"
                  >
                    <span className="font-semibold text-ink">{m.month}</span>
                    <div className="text-right">
                      <span className="font-bold text-emerald-700">
                        {formatINR(m.revenue)}
                      </span>
                      <span className="text-[10px] text-ink-soft ml-2">
                        ({m.bookings} bks)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── SUB-TAB 6: DEVOTEE LOOKUP ────────────────── */}
      {activeSubTab === "lookup" && (
        <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="text-sm font-bold text-ink">Devotee Profile Lookup</h3>
          <p className="text-xs text-ink-soft">
            Instant search across names, phone numbers, gotra, city, and booking IDs
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Search by name, phone, gotra, city or booking ID..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-saffron-200 bg-cream/30 text-ink focus:border-saffron-500 focus:bg-white focus:outline-none shadow-sm"
            />
          </div>

          <div className="space-y-3 pt-2">
            {lookupDevotees.length === 0 ? (
              <p className="text-xs text-ink-soft">
                {lookupQuery
                  ? "No matching devotee profiles found."
                  : "Type a devotee name, gotra, or phone number above to inspect full booking history."}
              </p>
            ) : (
              lookupDevotees.map((devotee) => (
                <div
                  key={devotee.id}
                  className="rounded-2xl border border-saffron-100 bg-cream/20 p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-ink text-sm">{devotee.name}</h4>
                      <p className="text-xs text-ink-soft">
                        📱 {devotee.phone} • Gotra: {devotee.gotra || "Kashyap"} • {devotee.city}
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-bold text-purple-800">
                      {devotee.bookings.length} Bookings
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-saffron-100">
                    {devotee.bookings.map((b) => (
                      <div
                        key={b.bookingId}
                        className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-saffron-50"
                      >
                        <div>
                          <span className="font-bold text-saffron-900">{b.poojaTitle}</span>
                          <span className="text-[11px] text-ink-soft ml-2">
                            ({b.date} • {b.bookingId})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-ink">{formatINR(b.amount)}</span>
                          <span
                            className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              b.status === "confirmed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
