/**
 * Checks whether an image URL matches Next.js configured remotePatterns
 * or is a local asset path, enabling Next.js <Image /> automatic optimization.
 */
export function isConfiguredImageSource(src?: string | null): boolean {
  if (!src) return false;
  const clean = src.trim();
  if (clean.startsWith("/") || clean.startsWith("./")) return true;
  if (clean.startsWith("data:") || clean.startsWith("blob:")) return false;

  try {
    const parsed = new URL(clean);
    const host = parsed.hostname.toLowerCase();
    const allowedHosts = [
      "images.unsplash.com",
      "images.pexels.com",
      "cdn.pixabay.com",
      "upload.wikimedia.org",
      "res.cloudinary.com",
      "img.youtube.com",
      "i.ytimg.com",
    ];
    return allowedHosts.some((h) => host === h || host.endsWith(".googleusercontent.com"));
  } catch {
    return false;
  }
}
