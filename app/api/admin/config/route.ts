import { NextResponse } from "next/server";
import { adminCredsAreDefault, getAdminCreds } from "@/lib/server-store";

export async function GET() {
  const creds = await getAdminCreds();
  return NextResponse.json({
    email: creds.email,
    isDefault: await adminCredsAreDefault(),
  });
}
