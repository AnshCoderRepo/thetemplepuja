// Pure, testable coupon logic shared by the booking flow. Kept free of React so
// the rules can be unit-tested directly (see tests/coupons.test.ts).
import { coupons, type Coupon } from "./data";
import { formatINR } from "./format";
import { findUserByPhone } from "./storage";

/** How many confirmed bookings a phone number already has. */
export function confirmedBookingCount(phone: string): number {
  const user = findUserByPhone(phone.trim());
  if (!user) return 0;
  return user.bookings.filter((b) => b.status === "confirmed").length;
}

export interface CouponContext {
  phone: string;
  /** Pooja base price the coupon would apply to. */
  price: number;
  /** Title used in eligibility error messages. */
  poojaTitle: string;
}

/**
 * Returns an error message when `code` is not usable for this context, or null
 * when it qualifies. Mirrors the rules declared on each coupon in data.ts
 * (firstBookingOnly, minBookings, minAmount).
 *
 * `couponMap` lets the booking flow evaluate admin-managed coupons (see
 * lib/catalog.ts); it defaults to the static catalog so existing callers and
 * tests keep working unchanged.
 *
 * `bookingCount` lets server-side callers pass a phone's confirmed-booking
 * count from the backend (the browser-based `confirmedBookingCount` reads
 * localStorage, which is always 0 on the server). When omitted the local
 * cache is used, keeping client behaviour unchanged.
 */
export function couponProblem(
  code: string,
  ctx: CouponContext,
  couponMap: Record<string, Coupon> = coupons,
  bookingCount?: number
): string | null {
  const c = couponMap[code];
  if (!c) return `"${code}" is not a valid coupon code.`;
  const countOf =
    bookingCount !== undefined
      ? () => bookingCount
      : () => confirmedBookingCount(ctx.phone);
  if (c.firstBookingOnly) {
    if (ctx.phone.trim().length < 10)
      return "Enter your 10-digit mobile number first so we can check your first-booking eligibility.";
    if (countOf() > 0)
      return `${code} is only for your first booking — you already have a confirmed pooja on this number.`;
  }
  if (c.minBookings) {
    if (ctx.phone.trim().length < 10)
      return "Enter your 10-digit mobile number first so we can check how many poojas you've booked.";
    const booked = countOf();
    if (booked + 1 < c.minBookings)
      return `${code} needs ${c.minBookings}+ poojas booked — you have ${booked + 1} (including this one).`;
  }
  if (c.minAmount && ctx.price < c.minAmount)
    return `${code} applies to poojas above ${formatINR(c.minAmount)} — ${ctx.poojaTitle} is ${formatINR(ctx.price)}.`;
  return null;
}

/**
 * Cash discount a coupon produces for a given price. Percent coupons round to
 * the nearest rupee; benefit coupons (and unknown codes) give ₹0.
 */
export function couponDiscount(
  code: string,
  price: number,
  couponMap: Record<string, Coupon> = coupons
): number {
  const c = couponMap[code];
  if (c?.kind === "percent" && c.value) return Math.round((price * c.value) / 100);
  return 0;
}
