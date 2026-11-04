import { NextRequest, NextResponse } from "next/server";
import {
  findUserByPhone,
  getPujaSessionVideos,
  verifyDevoteeSessionToken,
} from "@/lib/server-store";
import type { PujaSessionVideo } from "@/lib/persistence";

export const dynamic = "force-dynamic";

function normalizeDateStr(str?: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function datesMatch(dateA?: string, dateB?: string): boolean {
  if (!dateA || !dateB) return false;
  const a = dateA.trim().toLowerCase();
  const b = dateB.trim().toLowerCase();
  if (a === b) return true;

  const normA = normalizeDateStr(a);
  const normB = normalizeDateStr(b);
  if (normA && normB && (normA.includes(normB) || normB.includes(normA))) {
    return true;
  }
  return false;
}

/**
 * GET /api/devotee/videos
 * Returns session ceremony videos for an authenticated devotee who has confirmed bookings
 * matching the Puja and ceremony date.
 * Zero duplicate video records stored per user; zero mutation of existing booking records.
 */
export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get("devotee_session")?.value;
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const token = cookieToken || bearerToken;

  if (!token) {
    return NextResponse.json({ authenticated: false, error: "Not logged in." }, { status: 401 });
  }

  const phone = verifyDevoteeSessionToken(token);
  if (!phone) {
    return NextResponse.json(
      { authenticated: false, error: "Invalid or expired session. Please log in again." },
      { status: 401 }
    );
  }

  try {
    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ authenticated: false, error: "Devotee account not found." }, { status: 404 });
    }

    const confirmedBookings = (user.bookings || []).filter(
      (b) => b.status === "confirmed"
    );

    if (confirmedBookings.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        message: "No confirmed puja bookings found.",
      });
    }

    const allSessionVideos = await getPujaSessionVideos();
    const activeVideos = allSessionVideos.filter((v) => v.active !== false);

    // Filter to videos that match any of the devotee's confirmed bookings
    const eligibleVideos: (PujaSessionVideo & { matchedBookingId: string })[] = [];

    for (const video of activeVideos) {
      const match = confirmedBookings.find((b) => {
        const slugMatch =
          b.poojaSlug?.trim().toLowerCase() === video.poojaSlug?.trim().toLowerCase() ||
          b.poojaTitle?.trim().toLowerCase() === video.poojaTitle?.trim().toLowerCase();

        if (!slugMatch) return false;

        const dateMatches =
          datesMatch(b.date, video.date) ||
          datesMatch(b.eventDateISO, video.date) ||
          datesMatch(b.createdAt?.slice(0, 10), video.date);

        return dateMatches;
      });

      if (match) {
        eligibleVideos.push({
          ...video,
          matchedBookingId: match.bookingId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      videos: eligibleVideos,
    });
  } catch (err: unknown) {
    console.error("[devotee-videos] GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve puja ceremony recordings." },
      { status: 500 }
    );
  }
}

