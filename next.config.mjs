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
};

export default nextConfig;
