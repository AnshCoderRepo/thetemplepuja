import { NextRequest, NextResponse } from "next/server";
import { upsertUserBooking } from "@/lib/server-store";
import type { BookingInput } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<BookingInput>;
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

  const user = await upsertUserBooking({
    phone: body.phone.trim(),
    name: body.name.trim(),
    gotra: typeof body.gotra === "string" ? body.gotra : "",
    city: typeof body.city === "string" ? body.city : "",
    email: typeof body.email === "string" ? body.email : "",
    booking,
  });

  return NextResponse.json({ ok: true, user });
}
