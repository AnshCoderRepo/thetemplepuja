import { NextRequest, NextResponse } from "next/server";
import { findBookingById } from "@/lib/server-store";
import { normalizePhone } from "@/lib/validation";

// Receipt lookup guarded by the devotee's mobile number: the booking id alone
// is not enough — the caller must also provide the phone used at booking.
// Both values must match, and any mismatch returns the same 404 so ids can't
// be probed to discover whether a booking exists.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const found = await findBookingById(bookingId);
  if (
    !found ||
    normalizePhone(found.user.phone) !== normalizePhone(phone)
  ) {
    return NextResponse.json(
      { error: "No booking found for that id and mobile number." },
      { status: 404 }
    );
  }
  const { user, booking } = found;
  return NextResponse.json({
    booking,
    holder: {
      name: user.name,
      phone: user.phone,
      gotra: user.gotra,
      city: user.city,
    },
  });
}
