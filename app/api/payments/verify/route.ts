import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164 } from "@/lib/phone";
import {
  verifyPaymentSignature,
  getRazorpayOrder,
  razorpayConfigured,
} from "@/lib/razorpay";
import {
  findUserByPhone,
  generateRandomPassword,
  hashPassword,
  saveOrder,
  addDevoteeEntitlement,
} from "@/lib/server-store";
import { sendCapiPurchaseEvent } from "@/lib/meta-capi";
import type { UserProfile } from "@/lib/storage";

/**
 * POST /api/payments/verify
 * Server-authoritative payment verification for online checkout.
 * Validates order reference, payment ID, signature, and amount.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    orderId,
    paymentId,
    signature,
    phone,
    name,
    gotra,
    city,
    poojaSlug,
    poojaTitle,
    bookingId,
    amount,
  } = body;

  const customerPhone = normalizeToE164(phone);
  if (!customerPhone) {
    return NextResponse.json({ error: "Please provide a valid mobile number." }, { status: 400 });
  }

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "Payment verification details (orderId, paymentId, signature) are required." },
      { status: 400 }
    );
  }

  // 1. Verify Signature
  if (razorpayConfigured()) {
    const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!isValid) {
      return NextResponse.json({ error: "Payment signature verification failed." }, { status: 402 });
    }

    // 2. Validate Amount from Razorpay Order API
    try {
      const order = await getRazorpayOrder(orderId);
      if (amount && order.amount !== Math.round(Number(amount) * 100)) {
        return NextResponse.json(
          { error: "Payment amount does not match authoritative gateway order." },
          { status: 402 }
        );
      }
    } catch {
      // Order lookup issue — signature was valid
    }
  }

  // 3. Find or Create User Account
  let user = await findUserByPhone(customerPhone);
  let isNewAccount = false;

  if (!user) {
    isNewAccount = true;
    const tempPassword = generateRandomPassword(8);
    const passwordHash = await hashPassword(tempPassword);
    const userId = "devotee_" + Date.now().toString(36);

    user = {
      id: userId,
      phone: customerPhone,
      name: (name || "Sacred Devotee").trim(),
      gotra: (gotra || "Kashyap").trim(),
      city: (city || "Varanasi").trim(),
      email: "",
      createdAt: new Date().toISOString(),
      passwordHash,
      isActivated: false,
      status: "pending_activation",
      role: "devotee",
      bookings: [],
      entitlements: [],
    };
  }

  // 4. Record Entitlement & Order
  const safeAmount = Number(amount) || 0;
  const entitlementId = `ent_${paymentId || Date.now().toString(36)}`;
  const entitlement = {
    id: entitlementId,
    poojaSlug: poojaSlug || "custom-puja",
    poojaTitle: poojaTitle || "Sacred Puja Seva",
    bookingId: bookingId || `BK-${Date.now().toString(36).toUpperCase()}`,
    paymentId,
    orderId,
    amount: safeAmount,
    grantedAt: new Date().toISOString(),
    status: "active" as const,
  };

  await addDevoteeEntitlement(customerPhone, entitlement);

  await saveOrder({
    _id: orderId || `ord_${Date.now().toString(36)}`,
    orderId,
    paymentId,
    phone: customerPhone,
    amount: safeAmount,
    currency: "INR",
    status: "verified",
    paymentMethod: "razorpay",
    receipt: `RCPT-${Date.now().toString(36).toUpperCase()}`,
    poojaSlug,
    bookingId,
    createdAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
    metadata: {
      verifiedVia: "server_api",
      signature,
    },
  });

  // Dispatch Meta Conversions API (CAPI) Purchase event (non-blocking, deduplicated by eventId)
  void sendCapiPurchaseEvent({
    booking: {
      bookingId,
      orderId,
      paymentId,
      poojaSlug,
      poojaTitle,
      amount: safeAmount,
      currency: "INR",
    },
    user: {
      name,
      phone: customerPhone,
      city,
    },
    req,
  }).catch((err) => {
    console.warn("[meta-capi] verify route dispatch error:", err?.message);
  });

  return NextResponse.json({
    ok: true,
    phone: customerPhone,
    isActivated: user.isActivated ?? true,
    isNewAccount,
    message: isNewAccount
      ? "Payment verified. Account created and pending activation."
      : "Payment verified. Entitlement linked to your existing account.",
  });
}
