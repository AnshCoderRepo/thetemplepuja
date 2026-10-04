import type { RazorpayOrderStart } from "../types/payment.types";

export async function createRazorpayOrderRemote(input: {
  poojaSlug: string;
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
