import { NextRequest, NextResponse } from "next/server";
import {
  findUserByPhone,
  hashPassword,
  updateUserPassword,
  verifyDevoteeSessionToken,
  verifyUserPassword,
} from "@/lib/server-store";

/**
 * POST /api/users/change-password
 * Body: { currentPassword: string, newPassword: string }
 *
 * Authenticated devotee changes their password.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("devotee_session")?.value;
    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const token = cookieToken || bearerToken;

    if (!token) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const phone = verifyDevoteeSessionToken(token);
    if (!phone) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword.trim() : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const isMatch = await verifyUserPassword(phone, currentPassword);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password." }, { status: 401 });
    }

    const hash = await hashPassword(newPassword);
    await updateUserPassword(phone, hash);

    return NextResponse.json({ ok: true, message: "Password updated successfully." });
  } catch (err) {
    console.error("[change-password] error:", err);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
