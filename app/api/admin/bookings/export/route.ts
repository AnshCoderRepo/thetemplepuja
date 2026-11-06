import { NextRequest, NextResponse } from "next/server";
import { getAllDevotees, isValidSessionToken } from "@/lib/server-store";
import {
  filterBookingRecords,
  generateBookingsExportCsv,
  getExportFilename,
} from "@/lib/booking-export";
import type { BookingRecord, UserProfile } from "@/lib/storage";

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
  const dateLegacy = searchParams.get("date")?.trim() || "";
  const startDate = searchParams.get("startDate")?.trim() || (dateLegacy.length === 10 ? dateLegacy : "");
  const endDate = searchParams.get("endDate")?.trim() || (dateLegacy.length === 10 ? dateLegacy : "");
  const statusParam = searchParams.get("status")?.toLowerCase().trim();
  const pujaSlug = searchParams.get("pujaSlug")?.trim() || searchParams.get("puja")?.trim() || "";
  const dateType = (searchParams.get("dateType")?.trim() === "pujaDate" ? "pujaDate" : "createdAt") as "createdAt" | "pujaDate";
  const section = (searchParams.get("section")?.trim() === "orders" ? "orders" : "bookings") as "bookings" | "orders";

  // Retrieve all devotee profiles
  const users = await getAllDevotees();

  // Flatten all booking records across users
  const allRecords: { booking: BookingRecord; user: UserProfile }[] = [];
  const seenBookingIds = new Set<string>();
  for (const user of users) {
    for (const booking of user.bookings) {
      if (booking.bookingId) {
        if (seenBookingIds.has(booking.bookingId)) continue;
        seenBookingIds.add(booking.bookingId);
      }
      allRecords.push({ booking, user });
    }
  }

  // Filter with server-authoritative filter parameters
  const filteredRecords = filterBookingRecords(allRecords, {
    search: q,
    pujaSlug,
    status: statusParam,
    startDate,
    endDate,
    dateType,
    section,
  });

  // Sort newest first
  filteredRecords.sort(
    (a, b) =>
      new Date(b.booking.createdAt).getTime() - new Date(a.booking.createdAt).getTime()
  );

  const csvContent = generateBookingsExportCsv(filteredRecords, {
    includeStatusColumns: section === "orders",
  });
  const filename = getExportFilename(section, {
    status: statusParam,
    startDate,
    endDate,
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
