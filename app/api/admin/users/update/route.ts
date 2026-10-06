import { NextRequest, NextResponse } from "next/server";
import {
  isValidSessionToken,
  updateUserProfile,
} from "@/lib/server-store";
import { isValidIndianPhone, normalizePhone } from "@/lib/validation";

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
    userId?: string;
    phone?: string;
    name?: string;
    email?: string;
    gotra?: string;
    city?: string;
    password?: string;
  };

  const targetId = (body.userId || body.phone || "").trim();
  if (!targetId) {
    return NextResponse.json(
      { error: "Missing customer userId or phone number." },
      { status: 400 }
    );
  }

  if (body.phone && !isValidIndianPhone(normalizePhone(body.phone))) {
    return NextResponse.json(
      { error: "Please enter a valid 10-digit Indian phone number (starts with 6-9)." },
      { status: 400 }
    );
  }

  if (body.password && body.password.trim().length < 6) {
    return NextResponse.json(
      { error: "Devotee password must be at least 6 characters." },
      { status: 400 }
    );
  }

  const res = await updateUserProfile(targetId, {
    name: body.name,
    phone: body.phone ? normalizePhone(body.phone) : undefined,
    email: body.email,
    gotra: body.gotra,
    city: body.city,
    password: body.password?.trim() || undefined,
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: res.error || "Failed to update devotee profile." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, user: res.user });
}
