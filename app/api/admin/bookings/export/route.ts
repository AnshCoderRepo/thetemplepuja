import { NextRequest, NextResponse } from "next/server";
import { getAllDevotees, isValidSessionToken } from "@/lib/server-store";
import { generateBookingsExportCsv } from "@/lib/booking-export";
import type { BookingRecord, BookingStatus, UserProfile } from "@/lib/storage";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("search")?.toLowerCase().trim() || "";
  const dateFilter = searchParams.get("date")?.trim() || "";
  const statusParam = searchParams.get("status")?.toLowerCase().trim();

  // Retrieve all devotee profiles
  const users = await getAllDevotees();

  // Flatten matching bookings
  const records: { booking: BookingRecord; user: UserProfile }[] = [];
  for (const user of users) {
    for (const booking of user.bookings) {
      const isConfirmedOrRescheduled =
        booking.status === "confirmed" || booking.status === "rescheduled";

      // If status param provided, match against it. Default to confirmed/rescheduled.
      const matchesStatus = statusParam
        ? statusParam === "all" || booking.status === statusParam
        : isConfirmedOrRescheduled;

      if (!matchesStatus) continue;

      const matchesSearch =
        !q ||
        booking.bookingId.toLowerCase().includes(q) ||
        booking.poojaTitle.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        user.phone.includes(q) ||
        (user.city && user.city.toLowerCase().includes(q)) ||
        (user.address && user.address.toLowerCase().includes(q)) ||
        (booking.address && booking.address.toLowerCase().includes(q)) ||
        (user.gotra && user.gotra.toLowerCase().includes(q)) ||
        (booking.gotra && booking.gotra.toLowerCase().includes(q)) ||
        (booking.primaryDevoteeName && booking.primaryDevoteeName.toLowerCase().includes(q));

      const matchesDate =
        !dateFilter ||
        booking.createdAt.startsWith(dateFilter) ||
        booking.date.toLowerCase().includes(dateFilter.toLowerCase());

      if (matchesSearch && matchesDate) {
        records.push({ booking, user });
      }
    }
  }

  // Sort newest first
  records.sort(
    (a, b) =>
      new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()
  );

  const csvContent = generateBookingsExportCsv(records);
  const dateSuffix = new Date().toISOString().slice(0, 10);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings_export_${dateSuffix}.csv"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
