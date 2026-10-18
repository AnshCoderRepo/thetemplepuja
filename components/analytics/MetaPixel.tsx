"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FB_PIXEL_ID, pageview } from "@/lib/meta-pixel";

function MetaPixelTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Exclude admin dashboard operations from tracking
    if (pathname && pathname.startsWith("/admin")) {
      return;
    }

    // Initial page load is handled by the official base script in <head>.
    // Subsequent client-side navigations trigger pageview().
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    pageview();
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  if (!FB_PIXEL_ID) return null;

  return (
    <Suspense fallback={null}>
      <MetaPixelTracker />
    </Suspense>
  );
}
