import { NextRequest, NextResponse } from "next/server";
import {
  findUserByPhone,
  verifyDevoteeSessionToken,
} from "@/lib/server-store";

/**
 * GET /api/users/me
 * Retrieves current authenticated devotee profile using secure session cookie or Bearer header.
 */
export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get("devotee_session")?.value;
  const authHeader = req.headers.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const token = cookieToken || bearerToken;

  if (!token) {
    return NextResponse.json({ authenticated: false, error: "Not logged in." }, { status: 401 });
  }

  const phone = verifyDevoteeSessionToken(token);
  if (!phone) {
    return NextResponse.json(
      { authenticated: false, error: "Invalid or expired session. Please log in again." },
      { status: 401 }
    );
  }

  const user = await findUserByPhone(phone);
  if (!user) {
    return NextResponse.json(
      { authenticated: false, error: "Devotee account not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      gotra: user.gotra,
      city: user.city,
      email: user.email,
      isActivated: user.isActivated ?? true,
      status: user.status ?? "active",
      role: user.role ?? "devotee",
      createdAt: user.createdAt,
      bookings: user.bookings || [],
      entitlements: user.entitlements || [],
    },
  });
}
