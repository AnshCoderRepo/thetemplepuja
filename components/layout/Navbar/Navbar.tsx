"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, Menu, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { useI18n } from "@/components/providers";
import LanguageToggle from "@/components/common/LanguageToggle/LanguageToggle";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";

export const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Pujas", href: "#poojas" },
  { label: "Contact Us", href: "#contact" },
];

export default function Navbar() {
  const { t, locale, setLocale } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNavLinks = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.bookPooja"), href: "#poojas" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  return (
    <>
      {/* Main Navbar */}
      <nav className="container-px flex items-center justify-between gap-3 py-2.5 sm:py-3.5 md:py-4">
        {/* Existing Logo */}
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
          {activeNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                if (link.href === "#contact") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-chat-widget"));
                }
              }}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-all hover:bg-saffron-50 hover:text-saffron-700"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Action & Mobile Menu Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Language Switcher in Navbar */}
          <LanguageToggle />

          <Link
            href="/login"
            className="btn-outline hidden !px-4 !py-2.5 text-xs sm:inline-flex"
          >
            {t("nav.login")}
          </Link>

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
        className={`overflow-hidden bg-cream/95 backdrop-blur-md transition-all duration-300 lg:hidden ${
          mobileMenuOpen ? "max-h-[32rem] border-b border-saffron-200" : "max-h-0"
        }`}
      >
        <div className="container-px flex flex-col gap-2 py-4">
          {activeNavLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (link.href === "#contact") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-chat-widget"));
                }
              }}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-saffron-50 hover:text-saffron-700"
            >
              {link.label}
            </a>
          ))}

          {/* Quick Language Selector for Mobile Drawer */}
          <div className="mt-2 rounded-xl border border-saffron-200/80 bg-white/80 p-2.5">
            <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2 flex items-center gap-1.5 px-1">
              <Globe className="h-3.5 w-3.5 text-saffron-600" />
              <span>Language / भाषा</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === locale;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLocale(lang.code);
                    }}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-saffron-600 to-saffron-700 text-white shadow-xs"
                        : "bg-saffron-50/70 text-ink hover:bg-saffron-100/70"
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className={`text-[10px] ${isSelected ? "text-amber-100" : "text-ink-soft"}`}>
                      {lang.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-1">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-outline !w-full text-center text-xs block py-2.5"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
