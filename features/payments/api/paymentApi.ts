import type { RazorpayOrderStart } from "../types/payment.types";

export async function createRazorpayOrderRemote(input: {
  poojaSlug: string;
  packageTier?: string;
  addons?: { id: string; quantity: number }[];
  couponCode: string | null;
  phone: string;
}): Promise<RazorpayOrderStart> {
  try {
    const res = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<RazorpayOrderStart>;
    if (res.ok && body.configured === false) return { configured: false };
    if (res.ok && body.configured) {
      return {
        configured: true,
        keyId: body.keyId,
        orderId: body.orderId,
        amount: body.amount,
        subtotal: body.subtotal,
        discount: body.discount,
        validatedAddons: body.validatedAddons,
        currency: body.currency,
        receipt: body.receipt,
      };
    }
    return { configured: false, error: body.error ?? "Order failed" };
  } catch {
    return { configured: false };
  }
}

export async function createStandardRazorpayOrder(input: {
  amount: number; // in paise
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<{
  order_id?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  key_id?: string;
  keyId?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || `Failed to create order (${res.status})` };
    }
    return data;
  } catch (err: any) {
    return { error: err?.message || "Network error while creating Razorpay order." };
  }
}

export async function verifyRazorpayPayment(input: {
  order_id: string;
  payment_id: string;
  signature: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || "Payment verification failed." };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Network error while verifying payment." };
  }
}

