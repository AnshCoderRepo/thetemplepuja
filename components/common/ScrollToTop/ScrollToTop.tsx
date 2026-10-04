"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      setScrollProgress(0);
      return;
    }
    // Normalise to 0-1 range; button only appears after scrolling past ~30%
    const raw = scrollY / docHeight;
    const mapped = Math.max(0, Math.min((raw - 0.3) / 0.3, 1));
    setScrollProgress(mapped);
  }, []);

  // Ensure page starts at top on fresh load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isVisible = scrollProgress > 0.05;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1) translateY(0)" : "scale(0.7) translateY(20px)",
        pointerEvents: isVisible ? "auto" : "none",
      }}
      className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-saffron-300 bg-white/95 text-saffron-600 shadow-xl backdrop-blur-md transition-all duration-300 hover:bg-saffron-500 hover:text-white active:scale-95 sm:bottom-8 sm:left-8"
    >
      {/* Circular SVG progress ring */}
      <svg
        className="absolute inset-0 -rotate-90 pointer-events-none"
        width="48"
        height="48"
        viewBox="0 0 48 48"
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          className="text-saffron-200"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeDasharray={125.6}
          strokeDashoffset={125.6 * (1 - scrollProgress)}
          strokeLinecap="round"
          className="text-saffron-600 transition-all duration-150"
        />
      </svg>
      <ArrowUp className="h-5 w-5 stroke-[2.5]" />
    </button>
  );
}
