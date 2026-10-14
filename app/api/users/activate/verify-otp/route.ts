import { NextRequest, NextResponse } from "next/server";
import { normalizeToE164, isValidMobileNumber } from "@/lib/phone";
import {
  findUserByPhone,
  activateUserAccount,
  createDevoteeSessionToken,
} from "@/lib/server-store";
import { verifyOtpChallenge } from "@/lib/otp-service";
import { verifyFirebaseIdToken } from "@/lib/firebase";

/**
 * POST /api/users/activate/verify-otp
 * Body: { phone: string, otp?: string, firebaseIdToken?: string, password?: string }
 *
 * Verifies the activation OTP (via Firebase Phone Auth token or server challenge),
 * sets devotee password, activates the account, and creates a secure session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone ?? "";
    const phone = normalizeToE164(rawPhone);
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const firebaseIdToken = typeof body.firebaseIdToken === "string" ? body.firebaseIdToken.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json({ error: "Please enter a valid mobile number." }, { status: 400 });
    }

    if (!otp && !firebaseIdToken) {
      return NextResponse.json(
        { error: "Please enter the 6-digit OTP or provide phone verification proof." },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 1. Verify Phone Ownership
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
      const otpResult = await verifyOtpChallenge(phone, otp, "activation");
      if (!otpResult.ok) {
        return NextResponse.json({ error: otpResult.error }, { status: 400 });
      }
    }

    // 2. Activate Account & Set Password
    const activation = await activateUserAccount(phone, password || undefined);
    if (!activation.ok || !activation.user) {
      return NextResponse.json({ error: activation.error || "Failed to activate account." }, { status: 400 });
    }

    // 3. Issue Session Token & Set Cookie
    const token = createDevoteeSessionToken(activation.user.phone);

    const response = NextResponse.json({
      ok: true,
      message: "Account activated successfully. Welcome to templepujasewa!",
      user: {

        id: activation.user.id,
        phone: activation.user.phone,
        name: activation.user.name,
        gotra: activation.user.gotra,
        city: activation.user.city,
        email: activation.user.email,
        isActivated: true,
        status: "active",
        bookings: activation.user.bookings,
        entitlements: activation.user.entitlements,
      },
      token,
    });

    response.cookies.set("devotee_session", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set("devotee_phone", activation.user.phone, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("[activate-verify-otp] error:", err);
    return NextResponse.json({ error: "Something went wrong during activation." }, { status: 500 });
  }
}
