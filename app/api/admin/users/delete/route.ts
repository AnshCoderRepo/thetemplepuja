import { NextRequest, NextResponse } from "next/server";
import { deleteUserRecord, isValidSessionToken } from "@/lib/server-store";

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
  const body = (await req.json().catch(() => ({}))) as { id?: unknown };
  if (typeof body.id !== "string") {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }
  const res = await deleteUserRecord(body.id);
  return NextResponse.json({ ok: res.ok });
}
