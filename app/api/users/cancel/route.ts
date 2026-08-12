import { NextRequest, NextResponse } from "next/server";
import { cancelUserBooking } from "@/lib/server-store";
import { notifyBookingCancelled, receiptUrlFor } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    phone?: unknown;
    bookingId?: unknown;
  };
  if (typeof body.phone !== "string" || typeof body.bookingId !== "string") {
    return NextResponse.json(
      { error: "Missing phone or booking id." },
      { status: 400 }
    );
  }
  const res = await cancelUserBooking(body.phone, body.bookingId);
  if (!res.ok) {
    return NextResponse.json(
      { error: "This booking can no longer be cancelled." },
      { status: 400 }
    );
  }
  if (res.user) {
    const b = res.user.bookings.find((x) => x.bookingId === body.bookingId);
    if (b) {
      // Alert the admin and notify the devotee on WhatsApp (fire-and-forget;
      // no-op without config and never blocks the response).
      notifyBookingCancelled({
        bookingId: b.bookingId,
        poojaTitle: b.poojaTitle,
        name: res.user.name,
        phone: res.user.phone,
        date: b.date,
        time: b.time,
        amount: b.amount,
        discount: b.discount ?? 0,
        couponCode: b.couponCode ?? null,
        reason: b.reason,
        receiptUrl: receiptUrlFor(
          req.headers.get("host"),
          b.bookingId,
          res.user.phone
        ),
      });
    }
  }
  return NextResponse.json({ ok: true, user: res.user });
}
