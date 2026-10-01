import { NextRequest, NextResponse } from "next/server";
import {
  isValidSessionToken,
  hashPassword,
  findUserByPhone,
  updateUserPassword,
} from "@/lib/server-store";
import { normalizePhone, isValidIndianPhone } from "@/lib/validation";

/**
 * POST /api/admin/users/reset-password
 * Headers: Authorization: Bearer <token>
 * Body: { phone: string, newPassword: string }
 *
 * Admin action: reset a devotee's password. Requires valid admin session.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin session
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!(await isValidSessionToken(token))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const phone = normalizePhone(body.phone ?? "");
    const newPassword = body.newPassword ?? "";

    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: "No devotee found with this number." },
        { status: 404 }
      );
    }

    // Hash and save new password
    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(phone, passwordHash);

    return NextResponse.json({
      ok: true,
      message: `Password reset for ${user.name} (${phone}).`,
    });
  } catch (err) {
    console.error("[admin-reset-password] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
