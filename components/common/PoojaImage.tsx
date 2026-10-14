"use client";

import { useState, useEffect } from "react";
import PoojaImageFallback from "./PoojaImageFallback";

export interface PoojaImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallbackSize?: "sm" | "md" | "lg" | "full";
  showBrandText?: boolean;
  onClick?: () => void;
  priority?: boolean;
}

export default function PoojaImage({
  src,
  alt = "Puja Ceremony",
  className = "",
  imgClassName = "",
  fallbackSize = "md",
  showBrandText = true,
  onClick,
}: PoojaImageProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the image source changes (e.g. admin uploads a new file)
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanSrc = typeof src === "string" ? src.trim() : "";
  const isValid = Boolean(cleanSrc) && !hasError;

  if (!isValid) {
    return (
      <div
        onClick={onClick}
        className={`relative h-full w-full overflow-hidden ${className}`}
      >
        <PoojaImageFallback
          size={fallbackSize}
          alt={alt}
          showBrandText={showBrandText}
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative h-full w-full overflow-hidden bg-slate-950 flex items-center justify-center ${className}`}
    >
      {/* Ambient blurred backdrop to softly fill letterbox without clipping or distortion */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cleanSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
      />

      {/* Uncropped foreground image preserving 100% of the original aspect ratio */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cleanSrc}
        alt={alt}
        className={`relative z-0 h-full w-full object-contain transition-transform duration-300 ${imgClassName}`}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
