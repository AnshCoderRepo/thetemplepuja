import { NextRequest, NextResponse } from "next/server";
import { rescheduleUserBooking } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    phone?: unknown;
    bookingId?: unknown;
    date?: unknown;
    time?: unknown;
    dateISO?: unknown;
  };
  if (
    typeof body.phone !== "string" ||
    typeof body.bookingId !== "string" ||
    typeof body.date !== "string" ||
    typeof body.time !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing phone, booking id, date or time." },
      { status: 400 }
    );
  }
  const res = await rescheduleUserBooking(body.phone, body.bookingId, {
    date: body.date,
    time: body.time,
    dateISO: typeof body.dateISO === "string" ? body.dateISO : undefined,
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: "This booking can no longer be rescheduled." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, user: res.user });
}
