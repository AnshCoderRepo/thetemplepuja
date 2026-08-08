import { NextRequest, NextResponse } from "next/server";
import { cancelUserBooking } from "@/lib/server-store";

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
  return NextResponse.json({ ok: true, user: res.user });
}
