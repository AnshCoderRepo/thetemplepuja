import { NextResponse } from "next/server";
import { getAdminCreds } from "@/lib/server-store";

export async function GET() {
  const creds = await getAdminCreds();
  // Never reveal that credentials are still the defaults — doing so
  // tells an attacker exactly what to try. Always return false so the
  // login page never hints at default values.
  return NextResponse.json({
    email: creds.email,
    isDefault: false,
  });
}
