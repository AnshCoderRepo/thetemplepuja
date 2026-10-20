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
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  // ── Security headers ──────────────────────────────────────────────
  // Security headers (CSP, HSTS, X-Frame-Options, etc.) are set by
  // middleware.ts on every response. We keep them ONLY in middleware
  // because next.config headers apply to ALL routes including _next/static,
  // which interferes with CSS/JS serving in dev mode (MIME type errors).
  // Middleware correctly excludes _next/static via its matcher.
};

export default nextConfig;
