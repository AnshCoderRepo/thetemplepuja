import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
  serverExternalPackages: ["mongodb"],
  images: {
    remotePatterns: [
      // Scroll-expansion hero backgrounds / posters (demo puja media).
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // ── Security headers ──────────────────────────────────────────────
  // These are also set by middleware.ts on every response (defense-in-depth).
  // Keep both in sync if you change values here.
  headers: async () => [
    {
      // Apply to every route.
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        {
          key: "Content-Security-Policy",
          value: [
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
          ].join("; "),
        },
      ],
    },
  ],
};

export default nextConfig;
