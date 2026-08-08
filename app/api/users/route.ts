import { NextRequest, NextResponse } from "next/server";
import {
  getAllUsers,
  isValidSessionToken,
  findUserByPhone,
} from "@/lib/server-store";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim() || null;
}

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();

  // Public single-profile lookup (the devotee's phone number is their ID).
  if (phone) {
    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }
    return NextResponse.json({ user });
  }

  // Admin-only: the full list for the dashboard.
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }
  return NextResponse.json({ users: await getAllUsers() });
}
