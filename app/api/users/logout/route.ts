import { NextResponse } from "next/server";

/**
 * POST /api/users/logout
 * Clears devotee session and phone cookies.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true, message: "Logged out successfully." });

  res.cookies.set("devotee_session", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    expires: new Date(0),
  });

  res.cookies.set("devotee_phone", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    expires: new Date(0),
  });

  return res;
}
