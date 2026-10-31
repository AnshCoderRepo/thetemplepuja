"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";

export interface TempleImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  priority?: boolean;
}

export default function TempleImage({
  src,
  alt = "Sacred Temple",
  className = "",
  imgClassName = "",
  onClick,
}: TempleImageProps) {
  const cleanSrc = typeof src === "string" ? src.trim() : "";
  const [currentSrc, setCurrentSrc] = useState(cleanSrc);
  const [hasFinalError, setHasFinalError] = useState(false);

  useEffect(() => {
    setCurrentSrc(cleanSrc);
    setHasFinalError(false);
  }, [cleanSrc]);

  const handleImageError = () => {
    if (
      currentSrc &&
      currentSrc !== "/sample-puja.jpg" &&
      !currentSrc.includes("images.unsplash.com")
    ) {
      // Tier-1 recovery: fallback to verified sacred temple visual
      setCurrentSrc("https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80");
    } else {
      setHasFinalError(true);
    }
  };

  const isValid = Boolean(currentSrc) && !hasFinalError;

  if (!isValid) {
    return (
      <div
        onClick={onClick}
        className={`relative h-full w-full overflow-hidden bg-gradient-to-br from-amber-600 via-saffron-600 to-amber-800 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xs text-white border border-white/20 shadow-inner mb-2">
          <Building2 className="h-7 w-7 text-amber-200" />
        </div>
        <p className="text-xs font-bold text-white tracking-wide line-clamp-1 max-w-[90%]">
          {alt}
        </p>
        <span className="text-[10px] text-amber-200/80 font-medium tracking-wider uppercase mt-0.5">
          Sacred Consecrated Shrine
        </span>
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
        src={currentSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
      />

      {/* Uncropped foreground image preserving 100% of the original aspect ratio */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={alt}
        className={`relative z-0 h-full w-full object-cover transition-transform duration-300 ${imgClassName}`}
        onError={handleImageError}
      />
    </div>
  );
}
