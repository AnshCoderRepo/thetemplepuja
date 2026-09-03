import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — runs on every matched request. Two responsibilities:
 *
 * 1. **Security headers** — applied to all routes.
 * 2. **Admin API protection** — /api/admin/* (except /api/admin/login and
 *    /api/admin/config) require a valid Bearer token. The token is checked
 *    server-side via the existing isValidSessionToken function.
 *
 * NOTE: The /admin *page* itself lives in sessionStorage (no cookie), so
 * middleware cannot gate it. The page's React code handles auth state and
 * renders the login form when there is no valid session. The API routes are
 * the real protection layer — even if someone loads the page, all data
 * mutations go through the guarded API.
 */

// Paths that should skip the admin token check.
const ADMIN_API_WHITELIST = ["/api/admin/login", "/api/admin/config"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── Security headers ────────────────────────────────────────────────
  // Prevent the page from being embedded in an iframe (clickjacking).
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME-type sniffing.
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Referrer policy — don't leak full URLs to third parties.
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy — disable camera, microphone, geolocation by default.
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  // Strict-Transport-Security — force HTTPS for 1 year (only respected over HTTPS).
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  // Content-Security-Policy — restrictive baseline; adjust image/font sources as needed.
  // 'unsafe-inline' is required for Next.js inline scripts and framer-motion.
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "media-src 'self' https://videos.pexels.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.razorpay.com",
      "frame-src https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // ── Admin API auth ──────────────────────────────────────────────────
  // Protect /api/admin/* routes that are not in the whitelist.
  if (
    pathname.startsWith("/api/admin") &&
    !ADMIN_API_WHITELIST.includes(pathname)
  ) {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "").trim();

    // Basic structural check — the token must look like a session token.
    // Full cryptographic validation happens inside each route handler
    // (isValidSessionToken hits the database / store), but this avoids
    // sending obviously invalid requests to the server at all.
    if (!token || !token.startsWith("tok_")) {
      return NextResponse.json(
        { error: "Unauthorized — please sign in again." },
        { status: 401 }
      );
    }
  }

  // ── Cron endpoint protection ────────────────────────────────────────
  if (pathname.startsWith("/api/cron")) {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      // CRON_SECRET not configured — refuse to run in production.
      return NextResponse.json(
        {
          error:
            "Cron endpoint is not configured. Set CRON_SECRET in your environment.",
        },
        { status: 503 }
      );
    }
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
