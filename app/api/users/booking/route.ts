import { NextRequest, NextResponse } from "next/server";
import { upsertUserBooking } from "@/lib/server-store";
import type { BookingInput } from "@/lib/storage";
import { notifyBookingConfirmed, receiptUrlFor } from "@/lib/whatsapp";
import {
  getRazorpayOrder,
  razorpayConfigured,
  verifyPaymentSignature,
} from "@/lib/razorpay";

interface PaymentProof {
  razorpayOrderId?: unknown;
  razorpayPaymentId?: unknown;
  razorpaySignature?: unknown;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<BookingInput> & {
    payment?: PaymentProof;
  };
  const booking = body.booking as BookingInput["booking"] | undefined;

  if (
    typeof body.phone !== "string" ||
    !body.phone.trim() ||
    typeof body.name !== "string" ||
    !body.name.trim() ||
    !booking ||
    typeof booking.bookingId !== "string" ||
    !booking.bookingId
  ) {
    return NextResponse.json(
      { error: "Missing required booking details." },
      { status: 400 }
    );
  }

  // Real-payment flow: when Razorpay is configured, a booking is only accepted
  // with a payment proof whose signature verifies and whose order amount
  // matches the price the client was charged.
  if (razorpayConfigured()) {
    const payment = body.payment ?? {};
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
    booking.razorpayOrderId = orderId;
    booking.razorpayPaymentId = paymentId;
    booking.razorpaySignature = signature;
    booking.paidAt = new Date().toISOString();
  }

  const user = await upsertUserBooking({
    phone: body.phone.trim(),
    name: body.name.trim(),
    gotra: typeof body.gotra === "string" ? body.gotra : "",
    city: typeof body.city === "string" ? body.city : "",
    email: typeof body.email === "string" ? body.email : "",
    booking,
  });

  // Alert the admin and send the devotee their confirmation on WhatsApp
  // (fire-and-forget; a no-op without Twilio config and never blocks the
  // booking response).
  notifyBookingConfirmed({
    bookingId: booking.bookingId,
    poojaTitle: booking.poojaTitle,
    name: body.name.trim(),
    phone: body.phone.trim(),
    date: booking.date,
    time: booking.time,
    amount: booking.amount,
    discount: booking.discount ?? 0,
    couponCode: booking.couponCode ?? null,
    reason: booking.reason,
    receiptUrl: receiptUrlFor(
      req.headers.get("host"),
      booking.bookingId,
      body.phone.trim()
    ),
  });

  return NextResponse.json({ ok: true, user });
}
