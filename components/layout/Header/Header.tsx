"use client";

import { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import { useI18n } from "@/components/providers";

export default function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/95 shadow-soft backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      {/* Top Maroon Announcement Bar */}
      <div
        className={`hidden overflow-hidden transition-all duration-300 md:block ${
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <div className="bg-gradient-to-r from-maroon-800 via-maroon-700 to-maroon-800">
          <div className="container-px flex items-center justify-between py-2 text-xs text-amber-100">
            <p className="flex items-center gap-2">
              <span className="font-devanagari text-sm">{t("header.greeting")}</span>
              <span className="opacity-40">|</span>
              <span className="tracking-wide">{t("header.tagline")}</span>
            </p>
            <p className="flex items-center gap-2 text-amber-200/90 font-medium">
              <span>🙏 100% Certified Vedic Pandits & Authentic Temples</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar />
    </header>
  );
}
