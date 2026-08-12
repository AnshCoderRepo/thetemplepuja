/** @type {import('next').NextConfig} */
const nextConfig = {
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
