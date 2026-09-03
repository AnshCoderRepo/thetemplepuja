// Analytics utilities — pure functions that compute chart data from user profiles.
// No I/O, no side effects — easy to test and reuse.

import type { BookingRecord, UserProfile } from "./storage";

export interface DailyBookings {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "Mon"
  count: number;
  revenue: number;
}

export interface PoojaPopularity {
  slug: string;
  title: string;
  count: number;
  revenue: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalBookings: number;
  activeBookings: number;
  cancelledBookings: number;
  refundedBookings: number;
  averageOrderValue: number;
  bookingsPerDay: DailyBookings[];
  popularPoojas: PoojaPopularity[];
  monthlyRevenue: { month: string; revenue: number }[];
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
function allBookings(users: UserProfile[]): BookingRecord[] {
  return users.flatMap((u) => u.bookings);
}

/**
 * Compute analytics from user profiles.
 * @param days - number of days to look back for the daily chart (default: 30)
 */
export function computeAnalytics(
  users: UserProfile[],
  days = 30
): AnalyticsSummary {
  const bookings = allBookings(users);
  const now = new Date();

  // ── Totals ──
  const activeBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "rescheduled"
  );
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
  const refundedBookings = bookings.filter((b) => b.status === "refunded");
  const totalRevenue = activeBookings.reduce((s, b) => s + b.amount, 0);
  const averageOrderValue =
    activeBookings.length > 0 ? totalRevenue / activeBookings.length : 0;

  // ── Bookings per day (last N days) ──
  const dayMap = new Map<string, { count: number; revenue: number }>();
  for (let i = days - 1; i >= 0; i--) {
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
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const entry = dayMap.get(key) ?? { count: 0, revenue: 0 };
    bookingsPerDay.push({
      date: key,
      label: toDayLabel(d),
      count: entry.count,
      revenue: entry.revenue,
    });
  }

  // ── Popular poojas ──
  const poojaMap = new Map<string, { title: string; count: number; revenue: number }>();
  for (const b of bookings) {
    const existing = poojaMap.get(b.poojaSlug);
    if (existing) {
      existing.count++;
      if (b.status !== "cancelled" && b.status !== "refunded") {
        existing.revenue += b.amount;
      }
    } else {
      poojaMap.set(b.poojaSlug, {
        title: b.poojaTitle,
        count: 1,
        revenue: b.status !== "cancelled" && b.status !== "refunded" ? b.amount : 0,
      });
    }
  }

  const popularPoojas: PoojaPopularity[] = Array.from(poojaMap.entries())
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => b.count - a.count);

  // ── Monthly revenue (last 6 months) ──
  const monthMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthMap.set(toMonthLabel(d), 0);
  }

  for (const b of activeBookings) {
    const d = new Date(b.createdAt);
    const key = toMonthLabel(d);
    if (monthMap.has(key)) {
      monthMap.set(key, monthMap.get(key)! + b.amount);
    }
  }

  const monthlyRevenue = Array.from(monthMap.entries()).map(
    ([month, revenue]) => ({ month, revenue })
  );

  return {
    totalRevenue,
    totalBookings: bookings.length,
    activeBookings: activeBookings.length,
    cancelledBookings: cancelledBookings.length,
    refundedBookings: refundedBookings.length,
    averageOrderValue,
    bookingsPerDay,
    popularPoojas,
    monthlyRevenue,
  };
}
