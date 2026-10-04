"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { LanguageToggle } from "@/components/common";
import { useBookingModal } from "@/components/providers";
import { SITE_CONFIG } from "@/lib/config";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openBooking } = useBookingModal();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Book Pooja", href: "#poojas" },
    { label: "Events", href: "#events" },
    { label: "Why Us", href: "#why-us" },
    { label: "Reviews", href: "#testimonials" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-cream/95 shadow-soft backdrop-blur-md"
          : "bg-transparent"
        }`}
    >
      {/* Top Maroon Announcement Bar */}
      <div
        className={`hidden overflow-hidden transition-all duration-300 md:block ${scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
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
      <nav className="container-px flex items-center justify-between gap-3 py-2.5 sm:py-3.5 md:py-4">
        <Link
          href="#home"
          className="group flex items-center shrink-0 min-w-0"
          aria-label={SITE_CONFIG.brandName}
        >
          <div className="relative flex items-center shrink-0">
            <Image
              src="/logo.jpeg"
              alt={SITE_CONFIG.brandName}
              width={300}
              height={90}
              className="h-10 w-auto sm:h-11 md:h-12 lg:h-14 max-w-[145px] sm:max-w-[175px] md:max-w-[205px] lg:max-w-[230px] rounded-lg bg-white object-contain p-1 sm:p-1.5 shadow-soft transition-transform duration-300 group-hover:scale-105 shrink-0 select-none"
              style={{
                height: "clamp(2.5rem, 4vw + 1.25rem, 3.75rem)",
                maxWidth: "clamp(145px, 18vw + 80px, 230px)",
                width: "auto",
              }}
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-all hover:bg-saffron-50 hover:text-saffron-700"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Actions & Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="hidden sm:flex">
            <LanguageToggle />
          </div>

          <Link
            href="/login"
            className="btn-outline hidden !px-4 !py-2.5 text-xs sm:inline-flex"
          >
            Login
          </Link>

          <button
            type="button"
            onClick={() => openBooking()}
            className="btn-primary hidden !px-5 !py-2.5 text-xs sm:inline-flex"
          >
            Book Pooja
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-saffron-200 bg-white text-ink transition-colors hover:bg-saffron-50 lg:hidden shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`overflow-hidden bg-cream/95 backdrop-blur-md transition-all duration-300 lg:hidden ${mobileMenuOpen ? "max-h-96 border-b border-saffron-200" : "max-h-0"
          }`}
      >
        <div className="container-px flex flex-col gap-1 py-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-700"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-outline !w-full text-center text-xs"
            >
              Login
            </Link>
          </div>
          <div className="mt-2 flex gap-2">
            <div className="flex-1">
              <LanguageToggle />
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openBooking();
              }}
              className="btn-primary flex-1 text-center text-xs"
            >
              Book Pooja
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
