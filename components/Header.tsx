"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { navLinks } from "@/lib/data";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-cream/90 shadow-soft backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      {/* Top bar */}
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
              href="tel:+919278163908"
              className="flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Phone className="h-3.5 w-3.5" />
              +91 92781 63908
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="container-px flex items-center justify-between py-4">
        <a href="#home" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-saffron-400 via-saffron-500 to-maroon-600 text-xl shadow-glow transition-transform duration-300 group-hover:rotate-12">
            🕉️
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold tracking-wide text-ink">
              The Temple <span className="text-saffron-600">Puja</span>
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft/70">
              Digital Spiritual Platform
            </span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-all hover:bg-saffron-50 hover:text-saffron-700"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/book"
            className="btn-primary hidden !px-5 !py-2.5 text-xs sm:inline-flex"
          >
            Book Pooja
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-saffron-200 bg-white text-ink transition-colors hover:bg-saffron-50 lg:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden bg-cream/95 backdrop-blur-md transition-all duration-300 lg:hidden ${
          open ? "max-h-[480px] border-b border-saffron-100 shadow-soft" : "max-h-0"
        }`}
      >
        <div className="container-px flex flex-col gap-1 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-700"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/book"
            onClick={() => setOpen(false)}
            className="btn-primary mt-2 !w-full"
          >
            Book Pooja
          </Link>
        </div>
      </div>
    </header>
  );
}
