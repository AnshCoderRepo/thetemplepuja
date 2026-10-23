"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "../Navbar/Navbar";
import { useI18n } from "@/components/providers";

import { SITE_CONFIG } from "@/lib/config";

function InstagramIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const isHomePage = pathname === "/" || pathname === "";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On home page, transparent until scrolled so hero looks beautiful.
  // On all other pages (inner pages), solid cream background with backdrop blur so content beneath is cleanly separated.
  const hasSolidBackground = scrolled || !isHomePage;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        hasSolidBackground
          ? "bg-cream/95 shadow-soft backdrop-blur-md border-b border-saffron-100/70"
          : "bg-transparent"
      }`}
    >
      {/* Top Maroon Announcement Bar */}
      <div
        className={`hidden overflow-hidden transition-all duration-300 md:block ${
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <div className="bg-gradient-to-r from-maroon-800 via-maroon-700 to-maroon-800 border-b border-amber-500/20">
          <div className="container-px flex items-center justify-between py-1.5 text-xs text-amber-100">
            <p className="flex items-center gap-2">
              <span className="font-devanagari text-sm">{t("header.greeting")}</span>
              <span className="opacity-40">|</span>
              <span className="tracking-wide hidden sm:inline">{t("header.tagline")}</span>
              <span className="hidden lg:inline text-amber-200/80">
                {locale === "hi"
                  ? "🙏 100% प्रमाणित वैदिक पंडित"
                  : locale === "te"
                  ? "🙏 100% ధృవీకరించబడిన వేద పండితులు"
                  : locale === "ta"
                  ? "🙏 100% சான்றளிக்கப்பட்ட வேத பண்டிதர்கள்"
                  : "🙏 100% Certified Vedic Pandits"}
              </span>
            </p>
            <div className="flex items-center gap-3.5 text-amber-200/90 font-medium text-[11px]">
              <a
                href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title={`Call Pooja Helpline: ${SITE_CONFIG.contact.phoneDisplay}`}
              >
                <span>📞</span>
                <span className="font-semibold">{SITE_CONFIG.contact.phoneDisplay}</span>
              </a>
              <span className="opacity-40">|</span>
              <a
                href={`mailto:${SITE_CONFIG.contact.email}`}
                className="hidden xl:flex items-center gap-1 hover:text-white transition-colors"
                title={`Email: ${SITE_CONFIG.contact.email}`}
              >
                <span>✉️</span>
                <span className="font-semibold">{SITE_CONFIG.contact.email}</span>
              </a>
              <span className="opacity-40 hidden xl:inline">|</span>
              <div className="flex items-center gap-2">
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors p-0.5"
                  title="Follow on Instagram (@templepujasewa)"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={SITE_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors p-0.5"
                  title="Connect on Facebook"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-3.5 w-3.5" />
                </a>
                <a
                  href={SITE_CONFIG.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors p-0.5"
                  title="Subscribe on YouTube (@TEMPLEPUJASEWA)"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <Navbar hasSolidBackground={hasSolidBackground} />
    </header>
  );
}
