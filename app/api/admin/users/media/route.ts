import { NextRequest, NextResponse } from "next/server";
import {
  addCustomerMediaRecord,
  deleteCustomerMediaRecord,
  isValidSessionToken,
} from "@/lib/server-store";

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
    action?: "add" | "delete";
    userId?: string;
    mediaId?: string;
    media?: {
      title: string;
      url: string;
      description?: string;
      poojaTitle?: string;
      bookingId?: string;
    };
  };

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    return NextResponse.json({ error: "Missing customer userId." }, { status: 400 });
  }

  if (body.action === "delete") {
    const mediaId = typeof body.mediaId === "string" ? body.mediaId.trim() : "";
    if (!mediaId) {
      return NextResponse.json({ error: "Missing mediaId." }, { status: 400 });
    }
    const res = await deleteCustomerMediaRecord(userId, mediaId);
    return NextResponse.json(res);
  }

  // Add media
  if (!body.media || !body.media.title || !body.media.url) {
    return NextResponse.json(
      { error: "Missing media title or video URL." },
      { status: 400 }
    );
  }

  const res = await addCustomerMediaRecord(userId, body.media);
  return NextResponse.json(res);
}
