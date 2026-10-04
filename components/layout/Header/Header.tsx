"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import Navbar from "../Navbar/Navbar";

export default function Header() {
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
              <span className="font-devanagari text-sm">श्री गणेशाय नमः</span>
              <span className="opacity-40">|</span>
              <span className="tracking-wide">Digital Spiritual Platform</span>
            </p>
            <a
              href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              {SITE_CONFIG.contact.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar />
    </header>
  );
}
