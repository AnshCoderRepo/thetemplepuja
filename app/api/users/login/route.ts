import { NextRequest, NextResponse } from "next/server";
import {
  verifyUserPassword,
  userHasPassword,
  findUserByPhone,
  createDevoteeSessionToken,
} from "@/lib/server-store";
import { normalizeToE164, isValidMobileNumber } from "@/lib/phone";

/**
 * POST /api/users/login
 * Body: { phone: string, password: string }
 *
 * Verifies the devotee's password, rejects unactivated accounts,
 * and sets a secure HttpOnly session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = body.phone ?? "";
    const phone = normalizeToE164(rawPhone);

    if (!isValidMobileNumber(rawPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (!password) {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await findUserByPhone(phone);
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this mobile number." },
        { status: 404 }
      );
    }

    // Check activation status: unactivated accounts must verify OTP first
    if (user.isActivated === false && user.status === "pending_activation") {
      return NextResponse.json(
        {
          error: "Your account is pending activation. Please verify your mobile number with OTP to activate.",
          requireActivation: true,
          phone: user.phone,
        },
        { status: 403 }
      );
    }

    // Check if user has a password set
    const hasPw = await userHasPassword(phone);
    if (!hasPw) {
      return NextResponse.json(
        {
          error:
            "This account doesn't have a password set yet. Please activate your account or use forgot password to set one.",
          requireActivation: true,
          phone: user.phone,
        },
        { status: 400 }
      );
    }

    // Verify password against stored hash
    const valid = await verifyUserPassword(phone, password);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Issue session token
    const token = createDevoteeSessionToken(user.phone);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        gotra: user.gotra,
        city: user.city,
        email: user.email,
        isActivated: user.isActivated ?? true,
        bookings: user.bookings,
        entitlements: user.entitlements,
      },
      token,
    });

    // Set secure HttpOnly session cookie (30 days validity)
    response.cookies.set("devotee_session", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set("devotee_phone", user.phone, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("[user-login] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

