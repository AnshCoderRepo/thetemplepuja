import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164, isValidMobileNumber } from "@/lib/phone";
import { findUserByPhone } from "@/lib/server-store";
import { createOtpChallenge } from "@/lib/otp-service";

/**
 * POST /api/users/activate/request-otp
 * Body: { phone: string }
 *
 * Initiates an SMS OTP challenge for account activation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone ?? "";
    const phone = normalizeToE164(rawPhone);

    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this mobile number. Please register or complete your booking first." },
        { status: 404 }
      );
    }

    if (user.isActivated && user.status === "active") {
      return NextResponse.json({
        ok: true,
        alreadyActive: true,
        message: "Your account is already activated. You can sign in directly with your password.",
      });
    }

    const result = await createOtpChallenge(phone, "activation");
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, resendAfterSec: result.resendAfterSec },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "An activation OTP has been dispatched to your mobile number.",
      expiresInSec: result.expiresInSec,
      resendAfterSec: result.resendAfterSec,
      // For local testing convenience when Firebase live SMS is pending
      ...(process.env.NODE_ENV !== "production" || !process.env.FIREBASE_API_KEY ? { testCode: result.rawCode } : {}),
    });
  } catch (err) {
    console.error("[activate-request-otp] error:", err);
    return NextResponse.json({ error: "Failed to request activation OTP." }, { status: 500 });
  }
}
