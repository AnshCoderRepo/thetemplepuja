import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp";
import { sendWhatsApp, devoteeWhatsAppNumber } from "@/lib/whatsapp";
import { getUserByPhone } from "@/lib/server-store";
import { normalizePhone, isValidIndianPhone } from "@/lib/validation";

/**
 * POST /api/users/forgot-password
 * Body: { phone: string }
 *
 * Sends a 6-digit OTP to the user's WhatsApp. Returns 200 even if WhatsApp
 * fails (to prevent phone-number enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone ?? "");

    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Check if user exists (but don't reveal this in the response)
    const user = await getUserByPhone(phone);

    if (!user) {
      // Return success to prevent phone-number enumeration
      return NextResponse.json({
        ok: true,
        message: "If an account exists with this number, an OTP has been sent.",
      });
    }

    // Generate OTP
    const otp = generateOtp(phone);

    // Send OTP via WhatsApp
    const whatsappNumber = devoteeWhatsAppNumber(phone);
    if (whatsappNumber) {
      const text = [
        `🔐 Your verification code for The Temple Puja is: ${otp}`,
        "",
        "This code expires in 10 minutes.",
        "Do not share this code with anyone.",
        "",
        "If you didn't request this, please ignore this message.",
      ].join("\n");

      // Fire-and-forget — don't block the response
      void sendWhatsApp(whatsappNumber, text);
    }

    // Always return the same message to prevent enumeration
    return NextResponse.json({
      ok: true,
      message: "If an account exists with this number, an OTP has been sent.",
    });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
