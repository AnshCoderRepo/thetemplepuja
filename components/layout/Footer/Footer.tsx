"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers";
import { SITE_CONFIG, getWhatsAppChannelUrl } from "@/lib/config";
import { useCatalog } from "@/features/catalog";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function Footer() {
  const { t } = useI18n();
  const { platformSettings } = useCatalog();
  const channelUrl = platformSettings?.whatsappChannelUrl || getWhatsAppChannelUrl();

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
              {t("footer.description") ||
                "Connecting devotees worldwide with authentic Vedic rituals, sacred temples, and verified certified pandits."}
            </p>
            {/* Official WhatsApp Channel - Small Icon */}
            <div className="pt-1">
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Join WhatsApp Channel"
                aria-label="Join WhatsApp Channel"
                className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
              >
                <WhatsAppIcon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              {t("footer.quickLinks") || "Explore Sevas"}
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
            <ul className="space-y-2.5 text-xs text-cream/70">
              <li>
                <Link href="/login" className="hover:text-saffron-400 transition-colors">
                  Devotee Login
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-saffron-400 transition-colors">
                  My Bookings & Receipts
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-saffron-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-saffron-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Spiritual Care & Helpline */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              24/7 Helpline & Care
            </h4>
            <p className="text-xs text-cream/70 leading-relaxed mb-4">
              Speak with our spiritual coordinators on WhatsApp for personalized muhurat guidance and pooja bookings.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget"))}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-soft border border-cream/15 px-3.5 py-2.5 text-xs font-semibold text-white hover:border-saffron-400 hover:text-saffron-300 transition-all cursor-pointer shadow-soft"
              >
                <span>💬 Chat with Support</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Bottom Copyright Row ─── */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-cream/10 pt-6 text-xs text-cream/50">
          <div>
            © {new Date().getFullYear()} {SITE_CONFIG.brandName}. {t("footer.rights")} {t("footer.madeWith")}
          </div>
          <div className="flex items-center gap-4 text-cream/60">
            <Link href="/privacy" className="hover:text-saffron-400 transition-colors">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-saffron-400 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

