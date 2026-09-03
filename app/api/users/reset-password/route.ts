import { NextRequest, NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { hashPassword, getUserByPhone, updateUserPassword } from "@/lib/server-store";
import { normalizePhone, isValidIndianPhone } from "@/lib/validation";

/**
 * POST /api/users/reset-password
 * Body: { phone: string, otp: string, newPassword: string }
 *
 * Verifies the OTP and sets the new password. Returns 200 on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone ?? "");
    const otp = (body.otp ?? "").trim();
    const newPassword = body.newPassword ?? "";

    // Validate inputs
    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { error: "Please enter the 6-digit OTP." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Verify OTP
    const otpResult = verifyOtp(phone, otp);
    if (!otpResult.ok) {
      return NextResponse.json(
        { error: otpResult.error },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this number." },
        { status: 404 }
      );
    }

    // Hash and save new password
    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(phone, passwordHash);

    return NextResponse.json({
      ok: true,
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (err) {
    console.error("[reset-password] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
