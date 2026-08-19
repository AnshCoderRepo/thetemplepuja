"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    // Normalise to 0-1 range; button only appears after scrolling past ~40%
    const raw = scrollY / docHeight;
    const mapped = Math.max(0, Math.min((raw - 0.4) / 0.3, 1));
    setScrollProgress(mapped);
  }, []);

  // Ensure page starts at the top (Hero section) on fresh load
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

  // Derived animation values – mirrors the hero's expand/contract pattern
  const opacity = scrollProgress;
  const scale = 0.6 + scrollProgress * 0.4; // 0.6 → 1
  const translateY = (1 - scrollProgress) * 20; // slides up as it appears
  const rotate = (1 - scrollProgress) * -90; // subtle rotate-in

  return (
    <AnimatePresence>
      {scrollProgress > 0.01 && (
        <motion.button
          key="scroll-to-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500 to-maroon-500 text-white shadow-glow backdrop-blur-sm transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 focus-visible:ring-offset-2 md:bottom-10 md:right-10 md:h-14 md:w-14"
          initial={{ opacity: 0, scale: 0.4, y: 40 }}
          animate={{
            opacity,
            scale,
            y: translateY,
            rotate,
          }}
          exit={{ opacity: 0, scale: 0.4, y: 40 }}
          transition={{
            duration: 0.15,
            ease: "easeOut",
          }}
          whileHover={{
            scale: 1.15,
            boxShadow: "0 8px 40px -8px rgba(249, 125, 20, 0.6)",
          }}
          whileTap={{ scale: 0.92 }}
        >
          <ArrowUp className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
