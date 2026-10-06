// Analytics utilities — pure functions that compute chart data from user profiles.
// No I/O, no side effects — easy to test and reuse.

import type { BookingRecord, UserProfile } from "./storage";

export interface DailyBookings {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon" or "15 Sep"
  count: number;
  revenue: number;
}

export interface PoojaPopularity {
  slug: string;
  title: string;
  count: number;
  revenue: number;
  cancelledCount: number;
  avgOrderValue: number;
}

export interface TemplePopularity {
  slug: string;
  name: string;
  count: number;
  revenue: number;
}

export interface CityMetric {
  city: string;
  devoteeCount: number;
  bookingCount: number;
  revenue: number;
}

export interface GotraMetric {
  gotra: string;
  count: number;
}

export interface DevoteeRanking {
  id: string;
  name: string;
  phone: string;
  city: string;
  gotra: string;
  bookingCount: number;
  totalSpent: number;
  lastBookingDate: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  pendingBookings: number;
  pendingRevenue: number;
  failedBookings: number;
  failedRevenue: number;
  cancelledBookings: number;
  refundedBookings: number;
  rescheduledBookings: number;
  averageOrderValue: number;
  conversionRate: number;
  revenueGrowthPct: number;
  userGrowthPct: number;
  totalDiscountsGiven: number;
  couponBookingsCount: number;
  bookingsPerDay: DailyBookings[];
  popularPoojas: PoojaPopularity[];
  popularTemples: TemplePopularity[];
  monthlyRevenue: { month: string; revenue: number; bookings: number }[];
  cityMetrics: CityMetric[];
  gotraMetrics: GotraMetric[];
  topDevotees: DevoteeRanking[];
  weekdayStats: { day: string; count: number; revenue: number }[];
}

/** Format a Date as YYYY-MM-DD */
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Format a Date as short label, e.g. "Mon" */
function toDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Format a Date as "Mon YYYY" */
function toMonthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** Get all bookings from all users */
function allBookings(users: UserProfile[]): { booking: BookingRecord; user: UserProfile }[] {
  const result: { booking: BookingRecord; user: UserProfile }[] = [];
  for (const u of users) {
    for (const b of u.bookings) {
      result.push({ booking: b, user: u });
    }
  }
  return result;
}

/**
 * Compute analytics from user profiles.
 * @param days - number of days to look back for the daily chart (default: 30, or 0 / 9999 for all-time)
 */
export function computeAnalytics(
  users: UserProfile[],
  days = 30
): AnalyticsSummary {
  const userBookings = allBookings(users);
  const bookings = userBookings.map((ub) => ub.booking);
  const now = new Date();

  // ── Totals ──
  const activeBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "rescheduled"
  );
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const failedBookings = bookings.filter((b) => b.status === "failed");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const refundedBookings = bookings.filter((b) => b.status === "refunded");
  const rescheduledBookings = bookings.filter((b) => b.status === "rescheduled");
  
  const totalRevenue = activeBookings.reduce((s, b) => s + b.amount, 0);
  const pendingRevenue = pendingBookings.reduce((s, b) => s + b.amount, 0);
  const failedRevenue = failedBookings.reduce((s, b) => s + b.amount, 0);
  const settledBookings = bookings.filter((b) => b.status !== "pending" && b.status !== "failed");
  const totalDiscountsGiven = settledBookings.reduce((s, b) => s + (b.discount || 0), 0);
  const couponBookingsCount = settledBookings.filter((b) => Boolean(b.couponCode)).length;
  const averageOrderValue =
    activeBookings.length > 0 ? Math.round(totalRevenue / activeBookings.length) : 0;
  const conversionRate =
    bookings.length > 0 ? Math.round((activeBookings.length / bookings.length) * 100) : 100;

  // ── Growth Calculations (Current vs Previous Period) ──
  const effectiveDays = days > 0 && days <= 365 ? days : 30;
  const cutoffCurrent = new Date(now.getTime() - effectiveDays * 24 * 60 * 60 * 1000);
  const cutoffPrev = new Date(now.getTime() - 2 * effectiveDays * 24 * 60 * 60 * 1000);

  const currentPeriodRevenue = activeBookings
    .filter((b) => new Date(b.createdAt) >= cutoffCurrent)
    .reduce((s, b) => s + b.amount, 0);
  const prevPeriodRevenue = activeBookings
    .filter((b) => {
      const d = new Date(b.createdAt);
      return d >= cutoffPrev && d < cutoffCurrent;
    })
    .reduce((s, b) => s + b.amount, 0);

  const revenueGrowthPct =
    prevPeriodRevenue > 0
      ? Math.round(((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100)
      : currentPeriodRevenue > 0
      ? 100
      : 0;

  const currentPeriodUsers = users.filter((u) => new Date(u.createdAt) >= cutoffCurrent).length;
  const prevPeriodUsers = users.filter((u) => {
    const d = new Date(u.createdAt);
    return d >= cutoffPrev && d < cutoffCurrent;
  }).length;

  const userGrowthPct =
    prevPeriodUsers > 0
      ? Math.round(((currentPeriodUsers - prevPeriodUsers) / prevPeriodUsers) * 100)
      : currentPeriodUsers > 0
      ? 100
      : 0;

  // ── Bookings per day (Adaptive to selected range or all dates) ──
  const dayMap = new Map<string, { count: number; revenue: number }>();
  
  // Initialize days
  const numDaysToGen = Math.min(days, 90);
  for (let i = numDaysToGen - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dayMap.set(toDateKey(d), { count: 0, revenue: 0 });
  }

  for (const b of bookings) {
    const key = b.createdAt.slice(0, 10);
    if (dayMap.has(key)) {
      const entry = dayMap.get(key)!;
      entry.count++;
      if (b.status !== "cancelled" && b.status !== "refunded") {
        entry.revenue += b.amount;
      }
    }
  }

  const bookingsPerDay: DailyBookings[] = [];
  for (let i = numDaysToGen - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const entry = dayMap.get(key) ?? { count: 0, revenue: 0 };
    bookingsPerDay.push({
      date: key,
      label: numDaysToGen <= 7 ? toDayLabel(d) : key.slice(5),
      count: entry.count,
      revenue: entry.revenue,
    });
  }

  // ── Popular poojas with complete metrics ──
  const poojaMap = new Map<
    string,
    { title: string; count: number; revenue: number; cancelledCount: number }
  >();

  for (const b of bookings) {
    const existing = poojaMap.get(b.poojaSlug);
    const isPaid = b.status !== "cancelled" && b.status !== "refunded";
    const isCancelled = b.status === "cancelled" || b.status === "refunded";

    if (existing) {
      existing.count++;
      if (isPaid) existing.revenue += b.amount;
      if (isCancelled) existing.cancelledCount++;
    } else {
      poojaMap.set(b.poojaSlug, {
        title: b.poojaTitle,
        count: 1,
        revenue: isPaid ? b.amount : 0,
        cancelledCount: isCancelled ? 1 : 0,
      });
    }
  }

  const popularPoojas: PoojaPopularity[] = Array.from(poojaMap.entries())
    .map(([slug, data]) => ({
      slug,
      title: data.title,
      count: data.count,
      revenue: data.revenue,
      cancelledCount: data.cancelledCount,
      avgOrderValue: data.count > 0 ? Math.round(data.revenue / (data.count - data.cancelledCount || 1)) : 0,
    }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  // ── Popular Temples ──
  const templeMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const b of bookings) {
    const isPaid = b.status !== "cancelled" && b.status !== "refunded";
    const templeKey = b.templeSlug || b.templeName || "Main Sanctum";
    const templeName = b.templeName || b.templeSlug || "Sacred Temple";
    const existing = templeMap.get(templeKey);
    if (existing) {
      existing.count++;
      if (isPaid) existing.revenue += b.amount;
    } else {
      templeMap.set(templeKey, {
        name: templeName,
        count: 1,
        revenue: isPaid ? b.amount : 0,
      });
    }
  }

  const popularTemples: TemplePopularity[] = Array.from(templeMap.entries())
    .map(([slug, data]) => ({
      slug,
      name: data.name,
      count: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue);

  // ── Monthly revenue (last 12 months) ──
  const monthMap = new Map<string, { revenue: number; bookings: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap.set(toMonthLabel(d), { revenue: 0, bookings: 0 });
  }

  for (const b of bookings) {
    const d = new Date(b.createdAt);
    const key = toMonthLabel(d);
    if (monthMap.has(key)) {
      const entry = monthMap.get(key)!;
      entry.bookings++;
      if (b.status !== "cancelled" && b.status !== "refunded") {
        entry.revenue += b.amount;
      }
    }
  }

  const monthlyRevenue = Array.from(monthMap.entries()).map(
    ([month, data]) => ({ month, revenue: data.revenue, bookings: data.bookings })
  );

  // ── City Metrics ──
  const cityMap = new Map<string, { devoteeCount: number; bookingCount: number; revenue: number }>();
  for (const u of users) {
    const c = (u.city || "Unspecified").trim();
    const existing = cityMap.get(c);
    const uRev = u.bookings
      .filter((b) => b.status !== "cancelled" && b.status !== "refunded")
      .reduce((s, b) => s + b.amount, 0);

    if (existing) {
      existing.devoteeCount++;
      existing.bookingCount += u.bookings.length;
      existing.revenue += uRev;
    } else {
      cityMap.set(c, {
        devoteeCount: 1,
        bookingCount: u.bookings.length,
        revenue: uRev,
      });
    }
  }

  const cityMetrics: CityMetric[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.revenue - a.revenue || b.bookingCount - a.bookingCount);

  // ── Gotra Metrics ──
  const gotraMap = new Map<string, number>();
  for (const u of users) {
    const g = (u.gotra || "Kashyap").trim();
    gotraMap.set(g, (gotraMap.get(g) || 0) + 1);
  }
  const gotraMetrics: GotraMetric[] = Array.from(gotraMap.entries())
    .map(([gotra, count]) => ({ gotra, count }))
    .sort((a, b) => b.count - a.count);

  // ── Top Devotees Ranking ──
  const topDevotees: DevoteeRanking[] = users
    .map((u) => {
      const paidBookings = u.bookings.filter(
        (b) => b.status !== "cancelled" && b.status !== "refunded"
      );
      const totalSpent = paidBookings.reduce((s, b) => s + b.amount, 0);
      const latest = u.bookings.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        city: u.city || "India",
        gotra: u.gotra || "Kashyap",
        bookingCount: u.bookings.length,
        totalSpent,
        lastBookingDate: latest?.date || latest?.createdAt?.slice(0, 10) || "Recent",
      };
    })
    .sort((a, b) => b.totalSpent - a.totalSpent || b.bookingCount - a.bookingCount);

  // ── Weekday Performance Stats ──
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekdayMap = new Map<string, { count: number; revenue: number }>();
  for (const d of daysOfWeek) weekdayMap.set(d, { count: 0, revenue: 0 });

  for (const b of bookings) {
    const dayName = daysOfWeek[new Date(b.createdAt).getDay()];
    if (dayName && weekdayMap.has(dayName)) {
      const entry = weekdayMap.get(dayName)!;
      entry.count++;
      if (b.status !== "cancelled" && b.status !== "refunded") {
        entry.revenue += b.amount;
      }
    }
  }

  const weekdayStats = daysOfWeek.map((day) => ({
    day,
    count: weekdayMap.get(day)?.count || 0,
    revenue: weekdayMap.get(day)?.revenue || 0,
  }));

  return {
    totalRevenue,
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    pendingBookings: pendingBookings.length,
    pendingRevenue,
    failedBookings: failedBookings.length,
    failedRevenue,
    cancelledBookings: cancelledBookings.length,
    refundedBookings: refundedBookings.length,
    rescheduledBookings: rescheduledBookings.length,
    averageOrderValue,
    conversionRate,
    revenueGrowthPct,
    userGrowthPct,
    totalDiscountsGiven,
    couponBookingsCount,
    bookingsPerDay,
    popularPoojas,
    popularTemples,
    monthlyRevenue,
    cityMetrics,
    gotraMetrics,
    topDevotees,
    weekdayStats,
  };
}
