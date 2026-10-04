import type { Coupon } from "@/lib/data";

export type PaymentTab = "upi" | "card" | "netbanking" | "wallet";

export interface PaymentProof {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface AppliedCoupon {
  code: string;
  label: string;
  description: string;
  kind: Coupon["kind"];
  value?: number;
}

export interface CheckoutSummary {
  amount: number;
  subtotal?: number;
  addonTotal?: number;
  discount: number;
  coupon: AppliedCoupon | null;
  addons?: { id: string; name: string; price: number; quantity: number; emoji?: string }[];
}

export interface RazorpayOrderStart {
  configured: boolean;
  keyId?: string;
  orderId?: string;
  amount?: number; // paise
  subtotal?: number;
  discount?: number;
  currency?: string;
  receipt?: string;
  validatedAddons?: { id: string; name: string; price: number; quantity: number; emoji?: string }[];
  error?: string;
}

export type RealMode =
  | { kind: "none" }
  | { kind: "ready"; keyId: string; orderId: string; amount: number; currency: string }
  | { kind: "error"; message: string };
