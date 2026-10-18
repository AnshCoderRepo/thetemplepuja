import { NextRequest, NextResponse } from "next/server";
import {
  findUserByPhone,
  generateRandomPassword,
  hashPassword,
  upsertUserBooking,
} from "@/lib/server-store";
import type { BookingInput } from "@/lib/storage";
import { notifyBookingConfirmed, receiptUrlFor } from "@/lib/whatsapp";
import {
  generateReceiptNumber,
  getRazorpayOrder,
  razorpayConfigured,
  verifyPaymentSignature,
} from "@/lib/razorpay";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";
import { bookingRateLimiter } from "@/lib/rate-limit";
import { broadcastRealtime } from "@/lib/realtime";
import { SITE_CONFIG } from "@/lib/config";
import { sendCapiPurchaseEvent } from "@/lib/meta-capi";

interface PaymentProof {
  method?: "upi_qr" | "razorpay" | "simulated";
  razorpayOrderId?: unknown;
  razorpayPaymentId?: unknown;
  razorpaySignature?: unknown;
  upiTransactionId?: unknown;
  upiId?: unknown;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<BookingInput> & {
    payment?: PaymentProof;
  };
  const booking = body.booking as BookingInput["booking"] | undefined;

  const rawPhone = typeof body.phone === "string" ? body.phone : "";
  const normalizedPhone = normalizePhone(rawPhone);

  if (
    !isValidIndianPhone(normalizedPhone) ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    !booking ||
    typeof booking.bookingId !== "string" ||
    !booking.bookingId
  ) {
    return NextResponse.json(
      { error: "Missing or invalid required booking details." },
      { status: 400 }
    );
  }

  // Validate puja existence and addon assignments
  if (booking.poojaSlug) {
    const { getResolvedCatalog, getAllAddons } = await import("@/lib/server-store");
    const { DEMO_POOJA, isDemoSlug, isPoojaActive } = await import("@/lib/data");
    const catalog = await getResolvedCatalog();
    const normSlug = booking.poojaSlug.toLowerCase().replace(/_/g, "-");
    const pooja = isDemoSlug(normSlug) ? DEMO_POOJA : catalog.poojas.find((p) => p.slug === normSlug);
    if (!pooja || !isPoojaActive(pooja)) {
      return NextResponse.json(
        { error: "The selected puja is not available." },
        { status: 400 }
      );
    }
    if (Array.isArray(booking.addons) && booking.addons.length > 0) {
      const dbAddons = await getAllAddons();
      const assignedIds = new Set(pooja.assignedAddonIds || []);
      const hasExplicitAssignments = Array.isArray(pooja.assignedAddonIds);

      for (const item of booking.addons) {
        if (!item || !item.id) continue;
        const match = dbAddons.find((a) => a._id === item.id || a.id === item.id);
        if (!match) {
          return NextResponse.json(
            { error: `Add-on with ID "${item.id}" does not exist.` },
            { status: 400 }
          );
        }
        if (match.active === false) {
          return NextResponse.json(
            { error: `Add-on "${match.name}" is inactive.` },
            { status: 400 }
          );
        }
        if (hasExplicitAssignments && !assignedIds.has(match._id) && !assignedIds.has(match.id)) {
          return NextResponse.json(
            { error: `Add-on "${match.name}" is not assigned to this puja.` },
            { status: 400 }
          );
        }
      }
    }

    if (booking.couponCode) {
      const { isCouponActive } = await import("@/lib/data");
      const code = String(booking.couponCode).trim().toUpperCase();
      const c = catalog.coupons[code];
      if (!c) {
        return NextResponse.json(
          { error: `Coupon "${code}" is not a valid coupon code.` },
          { status: 400 }
        );
      }
      if (!isCouponActive(c)) {
        return NextResponse.json(
          { error: `Coupon "${code}" is currently inactive.` },
          { status: 400 }
        );
      }
    }
  }

  const targetStatus = booking.status || "confirmed";

  // Rate-limit initial booking creation attempts per phone number (default: 5 per hour).
  // Status transitions (pending -> confirmed / failed) on an existing booking do not consume extra tokens.
  if (
    targetStatus === "pending" ||
    targetStatus === "checkout_incomplete" ||
    targetStatus === "pending_payment"
  ) {
    const rateLimit = bookingRateLimiter.consume(normalizedPhone);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many booking attempts. Please try again later.",
          retryAfterSec: rateLimit.retryAfterSec,
        },
        { status: 429 }
      );
    }
  }

  // Generate unique official receipt number for this transaction
  if (!booking.receiptNumber) {
    booking.receiptNumber = generateReceiptNumber(booking.bookingId);
  }

  // Count addons if array provided
  if (Array.isArray(booking.addons) && booking.addons.length > 0) {
    booking.addonCount = booking.addons.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  let devoteePassword = body.generatedPassword || body.password;
  let passwordHash: string | undefined;

  if (
    targetStatus === "pending" ||
    targetStatus === "checkout_incomplete" ||
    targetStatus === "pending_payment" ||
    targetStatus === "payment_processing"
  ) {
    // Booking initiated / draft preserved — pending payment
    booking.status = targetStatus;
  } else if (targetStatus === "failed" || targetStatus === "payment_failed") {
    // Booking failed — payment was rejected, expired, or cancelled
    booking.status = targetStatus;
  } else {
    const isUpiQrPayment =
      booking.paymentMethod === "upi_qr" ||
      body.payment?.method === "upi_qr" ||
      typeof body.payment?.upiTransactionId === "string" ||
      typeof booking.upiTransactionId === "string";

    if (isUpiQrPayment) {
      // Devotee paid via merchant UPI ID / QR code
      booking.paymentMethod = "upi_qr";
      const utr =
        (typeof body.payment?.upiTransactionId === "string" && body.payment.upiTransactionId.trim()) ||
        (typeof booking.upiTransactionId === "string" && booking.upiTransactionId.trim()) ||
        "";
      const upiId =
        (typeof body.payment?.upiId === "string" && body.payment.upiId.trim()) ||
        (typeof booking.upiId === "string" && booking.upiId.trim()) ||
        SITE_CONFIG.payment.upiId;

      booking.upiTransactionId = utr;
      booking.upiId = upiId;
      booking.paidAt = booking.paidAt || new Date().toISOString();
      booking.status = "confirmed";
    } else if (
      razorpayConfigured() &&
      (booking.paymentMethod === "razorpay" ||
        body.payment?.method === "razorpay" ||
        body.payment?.razorpayPaymentId ||
        booking.razorpayPaymentId)
    ) {
      // Real Razorpay gateway payment verification
      const payment = body.payment ?? {
        razorpayOrderId: booking.razorpayOrderId,
        razorpayPaymentId: booking.razorpayPaymentId,
        razorpaySignature: booking.razorpaySignature,
      };
      const orderId =
        typeof payment.razorpayOrderId === "string" ? payment.razorpayOrderId : "";
      const paymentId =
        typeof payment.razorpayPaymentId === "string"
          ? payment.razorpayPaymentId
          : "";
      const signature =
        typeof payment.razorpaySignature === "string"
          ? payment.razorpaySignature
          : "";

      if (!orderId || !paymentId || !signature) {
        return NextResponse.json(
          { error: "Payment is required to confirm this booking." },
          { status: 400 }
        );
      }
      if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
        return NextResponse.json(
          { error: "Payment verification failed. Please try again." },
          { status: 402 }
        );
      }
      // Belt-and-braces: the paid order's amount must match the booking amount.
      try {
        const order = await getRazorpayOrder(orderId);
        if (order.amount !== Math.round(booking.amount * 100)) {
          return NextResponse.json(
            { error: "Payment amount does not match this booking." },
            { status: 402 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "We couldn't verify your payment. Please contact support." },
          { status: 502 }
        );
      }

      // Stamp the verified payment proof on the booking (server-authoritative —
      // never trust these fields from the client).
      booking.paymentMethod = "razorpay";
      booking.razorpayOrderId = orderId;
      booking.razorpayPaymentId = paymentId;
      booking.razorpaySignature = signature;
      booking.paidAt = new Date().toISOString();
      booking.status = "confirmed";
    } else {
      // Demo / simulated checkout fallback
      booking.paymentMethod = booking.paymentMethod || "simulated";
      booking.paidAt = booking.paidAt || new Date().toISOString();
      booking.status = "confirmed";
    }

    // Create / ensure user profile has a random password if none set
    const existingUser = await findUserByPhone(normalizedPhone);
    if (!existingUser?.passwordHash && !existingUser?.email?.startsWith("pw:")) {
      if (!devoteePassword) {
        devoteePassword = generateRandomPassword(8);
      }
      passwordHash = await hashPassword(devoteePassword);
    } else if (devoteePassword && body.generatedPassword) {
      passwordHash = await hashPassword(devoteePassword);
    } else if (existingUser?.generatedPassword) {
      devoteePassword = existingUser.generatedPassword;
    }
  }

  const user = await upsertUserBooking({
    phone: normalizedPhone,
    name: body.name.trim(),
    gotra: typeof body.gotra === "string" ? body.gotra : "",
    city: typeof body.city === "string" ? body.city : "",
    email: typeof body.email === "string" ? body.email : "",
    address: typeof (body as any).address === "string"
      ? (body as any).address.trim()
      : typeof booking.address === "string"
      ? booking.address.trim()
      : undefined,
    booking,
    passwordHash,
    generatedPassword: devoteePassword,
  });

  // Alert the admin and send the devotee their confirmation on WhatsApp only on confirmed bookings
  if (booking.status === "confirmed") {
    const host = req.headers.get("host");
    const siteUrl = process.env.SITE_URL || (host ? `http://${host}` : "http://localhost:3000");
    const passToSend = devoteePassword || user.generatedPassword;

    notifyBookingConfirmed({
      bookingId: booking.bookingId,
      poojaTitle: booking.poojaTitle,
      name: body.name.trim(),
      phone: normalizedPhone,
      date: booking.date,
      time: booking.time,
      amount: booking.amount,
      discount: booking.discount ?? 0,
      couponCode: booking.couponCode ?? null,
      reason: booking.reason,
      paymentMethod: booking.paymentMethod,
      upiTransactionId: booking.upiTransactionId,
      receiptUrl: receiptUrlFor(
        host,
        booking.bookingId,
        normalizedPhone
      ),
      credentials: {
        username: normalizedPhone,
        password: passToSend,
        loginUrl: `${siteUrl}/login`,
      },
    });

    // Dispatch Meta Conversions API (CAPI) Purchase event (non-blocking, deduplicated)
    void sendCapiPurchaseEvent({
      booking: {
        bookingId: booking.bookingId,
        orderId: booking.razorpayOrderId,
        paymentId: booking.razorpayPaymentId || booking.upiTransactionId,
        poojaSlug: booking.poojaSlug,
        poojaTitle: booking.poojaTitle,
        amount: booking.amount,
        currency: "INR",
      },
      user: {
        name: body.name.trim(),
        phone: normalizedPhone,
        email: typeof body.email === "string" ? body.email : undefined,
        city: typeof body.city === "string" ? body.city : undefined,
      },
      req,
    }).catch((err) => {
      console.warn("[meta-capi] booking dispatch error:", err?.message);
    });
  }

  // Broadcast realtime updates for live seating and devotee profiles
  broadcastRealtime({ type: "devotee_updated", target: normalizedPhone });
  broadcastRealtime({ type: "catalog_updated", section: "events" });

  return NextResponse.json({
    ok: true,
    user,
    booking,
    credentials: {
      username: normalizedPhone,
      password: devoteePassword || user.generatedPassword,
    },
  });
}
