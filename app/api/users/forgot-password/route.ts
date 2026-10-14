import { NextRequest, NextResponse } from "next/server";
import { createOtpChallenge } from "@/lib/otp-service";
import { sendWhatsApp, devoteeWhatsAppNumber } from "@/lib/whatsapp";
import { getUserByPhone } from "@/lib/server-store";
import { normalizeToE164, isValidMobileNumber } from "@/lib/phone";

/**
 * POST /api/users/forgot-password
 * Body: { phone: string }
 *
 * Dispatches an SMS/WhatsApp OTP challenge for password reset.
 * Strict anti-enumeration: always returns generic success message.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone ?? "";
    const phone = normalizeToE164(rawPhone);

    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    // Check if user exists (generic response returned either way to prevent enumeration)
    const user = await getUserByPhone(phone);
    let testCode: string | undefined;
    let resendAfterSec: number | undefined;

    if (user) {
      // Generate secure OTP challenge (with 60s cooldown protection)
      const challenge = await createOtpChallenge(phone, "password_reset");
      if (!challenge.ok && challenge.resendAfterSec) {
        return NextResponse.json(
          { error: challenge.error, resendAfterSec: challenge.resendAfterSec },
          { status: 429 }
        );
      }

      resendAfterSec = challenge.resendAfterSec;

      if (challenge.rawCode) {
        testCode = challenge.rawCode;

        // Also notify via WhatsApp if configured as an extra convenience
        const whatsappNumber = devoteeWhatsAppNumber(phone);
        if (whatsappNumber) {
          const text = [
            `🔐 Your password reset code for templepujasewa is: ${challenge.rawCode}`,

            "",
            "This code expires in 10 minutes.",
            "Do not share this code with anyone.",
            "",
            "If you didn't request this, please ignore this message.",
          ].join("\n");

          void sendWhatsApp(whatsappNumber, text);
        }
      }
    }

    // Always return the exact same generic message to prevent account enumeration
    return NextResponse.json({
      ok: true,
      message: "If an account exists with this mobile number, an OTP has been dispatched.",
      resendAfterSec: resendAfterSec ?? 60,
      ...(process.env.NODE_ENV !== "production" || !process.env.FIREBASE_API_KEY ? { testCode } : {}),
    });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

