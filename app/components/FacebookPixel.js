"use client";

// Deprecated legacy wrapper: Re-exports centralized MetaPixel to avoid duplicate script injection
import MetaPixel from "@/components/analytics/MetaPixel";

export default function FacebookPixel() {
  return <MetaPixel />;
}