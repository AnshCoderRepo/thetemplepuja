// Server-side Razorpay Orders API integration. Never import this from a
// client component — the key secret must stay on the server.
//
// Configuration (environment variables, all optional):
//   RAZORPAY_KEY_ID     — Razorpay public key (safe to send to the browser)
//   RAZORPAY_KEY_SECRET — Razorpay secret key (server only)
//
// When the keys are missing the helpers are safe no-ops / report
// "unconfigured", so the site (and its simulated checkout) keeps working
// without Razorpay. When configured, the flow is:
//   1. POST /api/payments/razorpay/order creates an order server-side at a
//      price derived from the catalog (clients can't tamper with amounts).
//   2. The browser opens Razorpay's hosted checkout with that order id.
//   3. The booking route verifies the payment signature and stores the
//      payment id on the booking before confirming it.

import { createHmac } from "crypto";
import { couponDiscount, couponProblem } from "./coupons";
import type { Coupon, Pooja } from "./data";

const RAZORPAY_API = "https://api.razorpay.com/v1";
const CREATE_TIMEOUT_MS = 10_000;

function razorpayConfig() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  };
}

/** True when both Razorpay keys are present. */
export function razorpayConfigured(): boolean {
  const c = razorpayConfig();
  return Boolean(c.keyId && c.keySecret);
}

/** The public key id, for the browser checkout script. Empty when unconfigured. */
export function razorpayKeyId(): string {
  return razorpayConfig().keyId;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number; // paise
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
  notes?: Record<string, string>;
}

/** Compute what a devotee must pay for a pooja, server-side: base price minus
 * a validated coupon's discount. `confirmedCount` is the phone's confirmed
 * booking count (used by first-booking / min-booking coupon rules) — pass 0
 * when the devotee has no history. Pure and testable. */
export function computeOrderAmount(input: {
  pooja: Pooja;
  couponCode: string | null;
  couponMap: Record<string, Coupon>;
  phone: string;
  confirmedCount: number;
}): { amount: number; discount: number; couponProblem: string | null } {
  const price = input.pooja.price;
  let discount = 0;
  let problem: string | null = null;
  if (input.couponCode) {
    problem = couponProblem(
      input.couponCode,
      {
        phone: input.phone,
        price,
        poojaTitle: input.pooja.title,
      },
      input.couponMap,
      input.confirmedCount
    );
    if (!problem) {
      discount = couponDiscount(input.couponCode, price, input.couponMap);
    }
  }
  return { amount: Math.max(price - discount, 0), discount, couponProblem: problem };
}

/** Create an order at Razorpay. Throws on failure (callers decide how to
 * surface it) and is only meaningful when `razorpayConfigured()`. */
export async function createRazorpayOrder(input: {
  amount: number; // rupees — converted to paise server-side
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const c = razorpayConfig();
  if (!c.keyId || !c.keySecret) {
    throw new Error("Razorpay is not configured");
  }
  const amountPaise = Math.round(input.amount * 100);
  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
    signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed (${res.status})${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Fetch an existing order (used to verify the paid amount matches the
 * booking). Throws on failure. */
export async function getRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  const c = razorpayConfig();
  if (!c.keyId || !c.keySecret) {
    throw new Error("Razorpay is not configured");
  }
  const res = await fetch(`${RAZORPAY_API}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${c.keyId}:${c.keySecret}`).toString("base64"),
    },
    signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Razorpay order lookup failed (${res.status})`);
  }
  return (await res.json()) as RazorpayOrder;
}

/** Verify Razorpay's payment signature (HMAC-SHA256 of `orderId|paymentId`
 * signed with the key secret). Returns false when unconfigured or tampered. */
export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const c = razorpayConfig();
  if (!c.keyId || !c.keySecret) return false;
  const expected = createHmac("sha256", c.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return expected === input.signature;
}
