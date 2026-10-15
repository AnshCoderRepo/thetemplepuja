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
  onAspectRatioChange?: (ratio: number) => void;
}

export default function PoojaImage({
  src,
  alt = "Puja Ceremony",
  className = "",
  imgClassName = "",
  fallbackSize = "md",
  showBrandText = true,
  onClick,
  onAspectRatioChange,
}: PoojaImageProps) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = typeof src === "string" ? src.trim() : "";

  // Reset error state if the image source changes (e.g. admin uploads a new file)
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Measure natural dimensions as soon as image source is available or loaded
  useEffect(() => {
    if (!cleanSrc || !onAspectRatioChange) return;
    const img = new Image();
    img.src = cleanSrc;
    const reportRatio = () => {
      if (img.naturalWidth && img.naturalHeight) {
        onAspectRatioChange(img.naturalWidth / img.naturalHeight);
      }
    };
    if (img.complete && img.naturalWidth) {
      reportRatio();
    } else {
      img.onload = reportRatio;
    }
  }, [cleanSrc, onAspectRatioChange]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight && onAspectRatioChange) {
      onAspectRatioChange(naturalWidth / naturalHeight);
    }
  };

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
        onLoad={handleImageLoad}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
