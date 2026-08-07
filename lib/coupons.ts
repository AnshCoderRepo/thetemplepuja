// Pure, testable coupon logic shared by the booking flow. Kept free of React so
// the rules can be unit-tested directly (see tests/coupons.test.ts).
import { coupons } from "./data";
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
 */
export function couponProblem(code: string, ctx: CouponContext): string | null {
  const c = coupons[code];
  if (!c) return `"${code}" is not a valid coupon code.`;
  if (c.firstBookingOnly) {
    if (ctx.phone.trim().length < 10)
      return "Enter your 10-digit mobile number first so we can check your first-booking eligibility.";
    if (confirmedBookingCount(ctx.phone) > 0)
      return `${code} is only for your first booking — you already have a confirmed pooja on this number.`;
  }
  if (c.minBookings) {
    if (ctx.phone.trim().length < 10)
      return "Enter your 10-digit mobile number first so we can check how many poojas you've booked.";
    const booked = confirmedBookingCount(ctx.phone);
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
export function couponDiscount(code: string, price: number): number {
  const c = coupons[code];
  if (c?.kind === "percent" && c.value) return Math.round((price * c.value) / 100);
  return 0;
}
