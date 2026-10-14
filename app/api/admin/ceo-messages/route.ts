import { NextRequest, NextResponse } from "next/server";
import {
  isValidSessionToken,
  listCeoMessages,
  updateCeoMessageStatus,
} from "@/lib/server-store";

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return req.headers.get("x-admin-token") || null;
}

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await listCeoMessages();
  return NextResponse.json({ ok: true, messages });
}

export async function PATCH(req: NextRequest) {
  const token = extractToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: unknown; status?: unknown };

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Message id is required" }, { status: 400 });
  }

  if (status !== "new" && status !== "read" && status !== "responded") {
    return NextResponse.json(
      { error: "Status must be 'new', 'read', or 'responded'" },
      { status: 400 }
    );
  }

  const updated = await updateCeoMessageStatus(id.trim(), status);
  if (!updated) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
