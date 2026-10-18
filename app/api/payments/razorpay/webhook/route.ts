import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { normalizeToE164 } from "@/lib/phone";
import {
  findUserByPhone,
  generateRandomPassword,
  hashPassword,
  recordWebhookEvent,
  saveOrder,
  addDevoteeEntitlement,
} from "@/lib/server-store";
import { sendCapiPurchaseEvent } from "@/lib/meta-capi";

import type { UserProfile } from "@/lib/storage";

/**
 * POST /api/payments/razorpay/webhook
 * Authoritative payment webhook with HMAC-SHA256 signature verification,
 * idempotency, safe account creation in pending_activation state, and entitlement assignment.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "";
  const signature = req.headers.get("x-razorpay-signature");

  const rawBody = await req.text();
  let event: any = null;

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // 1. Signature Verification
  if (webhookSecret && signature) {
    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[razorpay-webhook] signature mismatch rejected");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }
  }

  const eventId = event?.event_id || event?.id || (event?.payload?.payment?.entity?.id ? `evt_${event.payload.payment.entity.id}` : "");
  const eventType = event?.event || "unknown";

  // 2. Idempotency Check — Never process the same webhook event twice
  if (eventId) {
    const isNew = await recordWebhookEvent(eventId, eventType);
    if (!isNew) {
      // Event already processed — return 200 immediately
      return NextResponse.json({ status: "already_processed", eventId });
    }
  }

  // 3. Process Payment Confirmation
  if (eventType === "payment.captured" || eventType === "order.paid") {
    const payment = event?.payload?.payment?.entity;
    const order = event?.payload?.order?.entity;

    const paymentId = payment?.id || "";
    const orderId = payment?.order_id || order?.id || "";
    const amountPaise = payment?.amount ?? order?.amount ?? 0;
    const amountRupees = Math.round(amountPaise / 100);
    const currency = payment?.currency || order?.currency || "INR";
    const notes = payment?.notes || order?.notes || {};

    const rawContact = payment?.contact || notes?.phone || "";
    const customerPhone = normalizeToE164(rawContact);
    const poojaSlug = notes?.poojaSlug || "custom-puja";
    const bookingId = notes?.bookingId || `BK-${Date.now().toString(36).toUpperCase()}`;

    if (customerPhone) {
      // Look up existing user
      let user = await findUserByPhone(customerPhone);
      let isNewAccount = false;

      if (!user) {
        // Create new account in pending_activation state
        isNewAccount = true;
        const tempPassword = generateRandomPassword(10);
        const passwordHash = await hashPassword(tempPassword);
        const userId = "devotee_" + Date.now().toString(36);

        user = {
          id: userId,
          phone: customerPhone,
          name: notes?.name || "Sacred Devotee",
          gotra: notes?.gotra || "Kashyap",
          city: notes?.city || "Varanasi",
          email: notes?.email || "",
          createdAt: new Date().toISOString(),
          passwordHash,
          isActivated: false,
          status: "pending_activation",
          role: "devotee",
          bookings: [],
          entitlements: [],
        };
      }

      // Record Entitlement
      const entitlement = {
        id: `ent_${paymentId || Date.now().toString(36)}`,
        poojaSlug,
        poojaTitle: notes?.poojaTitle || "Sacred Puja Seva",
        bookingId,
        paymentId,
        orderId,
        amount: amountRupees,
        grantedAt: new Date().toISOString(),
        status: "active" as const,
      };

      await addDevoteeEntitlement(customerPhone, entitlement);

      // Save order record
      await saveOrder({
        _id: orderId || `ord_${Date.now().toString(36)}`,
        orderId: orderId || paymentId,
        paymentId,
        phone: customerPhone,
        amount: amountRupees,
        currency,
        status: "verified",
        paymentMethod: "razorpay",
        receipt: payment?.receipt || order?.receipt || `RCPT-${Date.now().toString(36).toUpperCase()}`,
        poojaSlug,
        bookingId,
        createdAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        metadata: {
          isNewAccount,
          notes,
          capturedAt: payment?.created_at,
        },
      });

      // Dispatch Meta Conversions API (CAPI) Purchase event (non-blocking, deduplicated by eventId)
      void sendCapiPurchaseEvent({
        booking: {
          bookingId,
          orderId,
          paymentId,
          poojaSlug,
          poojaTitle: notes?.poojaTitle || "Sacred Puja Seva",
          amount: amountRupees,
          currency,
        },
        user: {
          name: notes?.name,
          phone: customerPhone,
          email: notes?.email,
          city: notes?.city,
        },
        req,
      }).catch((err) => {
        console.warn("[meta-capi] webhook dispatch error:", err?.message);
      });

      console.log(`[razorpay-webhook] verified payment ${paymentId} for phone ${customerPhone} (account ${isNewAccount ? "created (pending activation)" : "updated"})`);
    }
  }

  return NextResponse.json({ status: "success", eventId });
}
