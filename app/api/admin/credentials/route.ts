import { NextRequest, NextResponse } from "next/server";
import {
  getAdminCreds,
  hashPassword,
  isValidSessionToken,
  saveAdminCreds,
  verifyPassword,
} from "@/lib/server-store";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim() || null;
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    reset?: unknown;
    currentPassword?: unknown;
    email?: unknown;
    newPassword?: unknown;
  };

  // Reset to the default demo credentials.
  if (body.reset === true) {
    await saveAdminCreds(
      "admin@thetemplepuja.com",
      await hashPassword("admin123")
    );
    return NextResponse.json({ ok: true });
  }

  const currentPassword =
    typeof body.currentPassword === "string" ? body.currentPassword : "";
  const current = await getAdminCreds();
  const currentOk = await verifyPassword(currentPassword, current.passwordHash);
  if (!currentOk) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 403 }
    );
  }
  // Migrate a legacy djb2 hash to bcrypt while we're here.
  if (!current.passwordHash.startsWith("$2")) {
    await saveAdminCreds(current.email, await hashPassword(currentPassword));
  }

  const nextEmail =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim().toLowerCase()
      : current.email;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nextEmail)) {
    return NextResponse.json(
      { error: "Enter a valid admin email address." },
      { status: 400 }
    );
  }

  const newPassword =
    typeof body.newPassword === "string" && body.newPassword
      ? await hashPassword(body.newPassword)
      : current.passwordHash;
  await saveAdminCreds(nextEmail, newPassword);

  return NextResponse.json({ ok: true });
}
