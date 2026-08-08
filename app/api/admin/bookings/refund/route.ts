import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken, refundUserBooking } from "@/lib/server-store";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim() || null;
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }
  const body = (await req.json().catch(() => ({}))) as {
    userId?: unknown;
    bookingId?: unknown;
  };
  if (typeof body.userId !== "string" || typeof body.bookingId !== "string") {
    return NextResponse.json(
      { error: "Missing user id or booking id." },
      { status: 400 }
    );
  }
  const res = await refundUserBooking(body.userId, body.bookingId);
  if (!res.ok) {
    return NextResponse.json(
      { error: "This booking can no longer be refunded." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, user: res.user });
}
