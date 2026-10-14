import { NextRequest, NextResponse } from "next/server";
import { verifyOtpChallenge } from "@/lib/otp-service";
import { verifyFirebaseIdToken } from "@/lib/firebase";
import { hashPassword, getUserByPhone, updateUserPassword } from "@/lib/server-store";
import { normalizeToE164, isValidMobileNumber } from "@/lib/phone";

/**
 * POST /api/users/reset-password
 * Body: { phone: string, otp?: string, firebaseIdToken?: string, newPassword: string }
 *
 * Verifies the OTP or Firebase Token and sets the new password. Returns 200 on success.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone ?? "";
    const phone = normalizeToE164(rawPhone);
    const otp = (body.otp ?? "").trim();
    const firebaseIdToken = (body.firebaseIdToken ?? "").trim();
    const newPassword = body.newPassword ?? "";

    // Validate inputs
    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    if (!otp && !firebaseIdToken) {
      return NextResponse.json(
        { error: "Please provide the 6-digit OTP or phone verification token." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Verify User Exists
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this mobile number." },
        { status: 404 }
      );
    }

    // Verify OTP or Firebase Token
    if (firebaseIdToken) {
      const fbResult = await verifyFirebaseIdToken(firebaseIdToken);
      if (!fbResult.ok) {
        return NextResponse.json({ error: fbResult.error }, { status: 400 });
      }
      const verifiedPhone = normalizeToE164(fbResult.phone);
      if (verifiedPhone !== phone) {
        return NextResponse.json(
          { error: "Verified mobile number does not match requested account." },
          { status: 400 }
        );
      }
    } else {
      const otpResult = await verifyOtpChallenge(phone, otp, "password_reset");
      if (!otpResult.ok) {
        return NextResponse.json(
          { error: otpResult.error },
          { status: 400 }
        );
      }
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

