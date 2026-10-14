import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164, isValidMobileNumber } from "@/lib/phone";
import { verifyOtpChallenge } from "@/lib/otp-service";
import { verifyFirebaseIdToken } from "@/lib/firebase";
import { getUserByPhone } from "@/lib/server-store";

/**
 * POST /api/users/reset-password/verify-otp
 * Body: { phone: string, otp?: string, firebaseIdToken?: string }
 *
 * Validates OTP or Firebase Phone token before allowing password reset.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone ?? "";
    const phone = normalizeToE164(rawPhone);
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken.trim() : "";

    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }

    if (!otp && !firebaseIdToken) {
      return NextResponse.json({ error: "Please provide the 6-digit OTP." }, { status: 400 });
    }

    // Verify user exists
    const user = await getUserByPhone(phone);
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

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
      return NextResponse.json({ ok: true, verified: true });
    }

    const otpResult = await verifyOtpChallenge(phone, otp, "password_reset");
    if (!otpResult.ok) {
      return NextResponse.json({ error: otpResult.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, verified: true });
  } catch (err) {
    console.error("[reset-password-verify-otp] error:", err);
    return NextResponse.json({ error: "Failed to verify OTP." }, { status: 500 });
  }
}
