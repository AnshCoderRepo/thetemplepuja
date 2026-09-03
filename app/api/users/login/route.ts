import { NextRequest, NextResponse } from "next/server";
import {
  verifyUserPassword,
  userHasPassword,
  findUserByPhone,
} from "@/lib/server-store";
import { normalizePhone, isValidIndianPhone } from "@/lib/validation";

/**
 * POST /api/users/login
 * Body: { phone: string, password: string }
 *
 * Verifies the devotee's password. Returns 200 on success.
 * If the user has no password set, returns 400 with a hint.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = normalizePhone(body.phone ?? "");
    const password = body.password ?? "";

    if (!isValidIndianPhone(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

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
        { error: "No account found with this number." },
        { status: 404 }
      );
    }

    // Check if user has a password set
    const hasPw = await userHasPassword(phone);
    if (!hasPw) {
      return NextResponse.json(
        {
          error:
            "This account doesn't have a password yet. Use your mobile number to login, or contact admin to set a password.",
        },
        { status: 400 }
      );
    }

    // Verify password
    const valid = await verifyUserPassword(phone, password);
    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[user-login] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
