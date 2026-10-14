import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken, refundUserBooking } from "@/lib/server-store";
import { broadcastRealtime } from "@/lib/realtime";

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

  return NextResponse.json(
    {
      error:
        "Direct immediate refunds have been disabled. All refunds now require an approval workflow. Please submit a refund request for review from the Order Details modal.",
      code: "APPROVAL_REQUIRED",
    },
    { status: 403 }
  );
}
