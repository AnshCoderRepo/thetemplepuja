"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";

export default function Footer() {
  const { t } = useI18n();

  const navLinks = [
    { label: t("nav.home"), href: "#home" },
    { label: t("nav.bookPooja"), href: "#poojas" },
    { label: t("nav.whyUs"), href: "#why-us" },
    { label: t("nav.reviews"), href: "#testimonials" },
    { label: t("nav.faq"), href: "#faq" },
  ];
  return (
    <footer id="contact" className="relative overflow-hidden bg-ink pt-16 text-cream">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffdca1 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="container-px relative pb-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-xl font-bold text-white shadow-soft">
                🪔
              </span>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-tight text-white">
                  {SITE_CONFIG.brandName}
                </span>
                <span className="text-[10px] font-semibold text-saffron-400 tracking-wider uppercase">
                  {t("header.tagline")}
                </span>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-cream/70">
              Connecting devotees worldwide with authentic Vedic rituals, sacred temples, and verified certified pandits.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              Explore Sevas
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-cream/70 transition-colors hover:text-saffron-400"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Account */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              Devotee Care
            </h4>
            <ul className="space-y-2 text-xs text-cream/70">
              <li>
                <Link href="/login" className="hover:text-saffron-400">
                  Devotee Login
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-saffron-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-saffron-400">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Spiritual Care */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              24/7 Helpline
            </h4>
            <p className="text-xs text-cream/70 leading-relaxed mb-4">
              Speak with our spiritual advisors anytime on WhatsApp for personalized muhurat advice.
            </p>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget"))}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
            >
              <span>💬 Chat with Us</span>
            </button>
          </div>
        </div>

        <div className="mt-12 border-t border-cream/10 pt-6 text-center text-xs text-cream/50">
          © {new Date().getFullYear()} {SITE_CONFIG.brandName}. All rights reserved. Made with devotion.
        </div>
      </div>
    </footer>
  );
}
