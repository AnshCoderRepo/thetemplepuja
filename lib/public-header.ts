/**
 * Determines whether the public navigation header should be rendered.
 * Returns false for any admin route (/admin, /admin/*) to completely isolate
 * the administration panel from public navigation.
 */
export function shouldRenderPublicHeader(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) return false;
  return true;
}
