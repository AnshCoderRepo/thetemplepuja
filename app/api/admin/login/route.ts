import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyAdminLogin } from "@/lib/server-store";
import { loginRateLimiter } from "@/lib/rate-limit";

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const key = `login:${ip}`;

  if (!loginRateLimiter.allowed(key)) {
    return NextResponse.json(
      {
        error: "Too many failed attempts. Please wait a few minutes and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(loginRateLimiter.retryAfterSec(key)) },
      }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    password?: unknown;
  };
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const ok = await verifyAdminLogin(email, password);
  if (!ok) {
    loginRateLimiter.hit(key);
    return NextResponse.json(
      { error: "Incorrect email or password. Try again." },
      { status: 401 }
    );
  }

  loginRateLimiter.clear(key);
  return NextResponse.json({ ok: true, token: await createSessionToken() });
}
