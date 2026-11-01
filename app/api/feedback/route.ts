import { NextRequest, NextResponse } from "next/server";
import { createFeedback, getPublicApprovedFeedback } from "@/lib/feedback-store";
import { broadcastRealtime } from "@/lib/realtime";

export const dynamic = "force-dynamic";

// In-memory rate limiting map: ip -> timestamp[]
const ipRateLimits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5;

  const timestamps = (ipRateLimits.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (timestamps.length >= maxRequests) {
    return false;
  }
  timestamps.push(now);
  ipRateLimits.set(ip, timestamps);
  return true;
}

/**
 * GET /api/feedback
 * Public endpoint: Returns approved devotee reviews/feedback for landing page.
 * Strictly filters out pending, rejected, and private information (phone, email).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const featuredOnly = searchParams.get("featured") === "true";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const feedback = await getPublicApprovedFeedback({ featuredOnly, limit });

    return NextResponse.json(
      { success: true, feedback },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: unknown) {
    console.error("[Public Feedback GET Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to load reviews." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback
 * Public endpoint: Allows visitors & devotees to submit feedback.
 * Validates inputs, sanitizes strings, checks honeypot, sets status='pending'.
 */
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many feedback submissions recently. Please wait a few minutes before submitting again.",
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, phone, email, message, rating, honeypot } = body as {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
      message?: unknown;
      rating?: unknown;
      honeypot?: unknown;
    };

    // Honeypot anti-spam check: if bot filled this hidden field, return success silently without saving
    if (honeypot) {
      return NextResponse.json({ success: true, message: "Thank you for your feedback!" });
    }

    // 1. Validate Devotee Name (required)
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your name (at least 2 characters)." },
        { status: 400 }
      );
    }

    // 2. Validate Message (required)
    if (typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please write your feedback message (minimum 5 characters)." },
        { status: 400 }
      );
    }

    // 3. Validate Rating (required: 1 to 5)
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { success: false, error: "Please select a star rating between 1 and 5." },
        { status: 400 }
      );
    }

    // 4. Save to store (defaults to status='pending', isFeatured=false)
    const saved = await createFeedback({
      name: name.trim(),
      phone: typeof phone === "string" ? phone.trim() : undefined,
      email: typeof email === "string" ? email.trim() : undefined,
      message: message.trim(),
      rating: Math.round(ratingNum),
    });

    // Notify connected admin sessions in realtime
    try {
      broadcastRealtime({
        type: "feedback_updated",
        section: "feedback",
      });
    } catch {
      // pass
    }

    return NextResponse.json({
      success: true,
      message:
        "Thank you for sharing your feedback! Your review has been received and will appear on our website once approved by our team.",
      id: saved.id,
    });
  } catch (err: unknown) {
    console.error("[Public Feedback POST Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback. Please try again later." },
      { status: 500 }
    );
  }
}

