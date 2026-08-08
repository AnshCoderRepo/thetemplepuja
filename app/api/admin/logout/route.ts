import { NextRequest, NextResponse } from "next/server";
import { invalidateSessionToken } from "@/lib/server-store";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { token?: unknown };
  if (typeof body.token === "string") {
    await invalidateSessionToken(body.token);
  }
  return NextResponse.json({ ok: true });
}
