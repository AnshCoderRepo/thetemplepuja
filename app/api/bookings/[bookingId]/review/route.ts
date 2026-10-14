import { NextRequest, NextResponse } from "next/server";
import { findBookingById, saveBookingReview } from "@/lib/server-store";
import { normalizePhone } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await req.json().catch(() => ({}));
    const { rating, review, phone } = body as {
      rating?: unknown;
      review?: unknown;
      phone?: string;
    };

    // 1. Validate rating
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a valid whole number between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // 2. Validate review text (optional, up to 1000 chars)
    let cleanReview: string | undefined;
    if (typeof review === "string" && review.trim()) {
      cleanReview = review.trim().slice(0, 1000);
    }

    // 3. Find booking & verify ownership
    const found = await findBookingById(bookingId);
    if (!found) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Devotee phone check: if phone is provided, it must match the booking owner
    if (phone && normalizePhone(found.user.phone) !== normalizePhone(phone)) {
      return NextResponse.json(
        { error: "Unauthorized: You may only review your own booking." },
        { status: 403 }
      );
    }

    // 4. Save review
    const result = await saveBookingReview(
      bookingId,
      numRating,
      cleanReview,
      found.user.phone
    );

    if (!result.ok || !result.booking) {
      return NextResponse.json(
        { error: "Failed to save booking review." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      booking: result.booking,
      message: "Thank you for sharing your sacred experience and blessings!",
    });
  } catch (error) {
    console.error("[review] unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving your review." },
      { status: 500 }
    );
  }
}
