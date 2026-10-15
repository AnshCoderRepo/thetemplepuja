"use client";

import { usePathname } from "next/navigation";
import Header from "../Header/Header";
import { shouldRenderPublicHeader } from "@/lib/public-header";

/**
 * PublicHeader:
 * Renders the shared public navigation header and announcement bar across all
 * customer-facing pages.
 *
 * Excludes all administrative routes (/admin, /admin/*) completely from the DOM.
 */
export default function PublicHeader() {
  const pathname = usePathname();

  if (!shouldRenderPublicHeader(pathname)) {
    return null;
  }

  return <Header />;
}
