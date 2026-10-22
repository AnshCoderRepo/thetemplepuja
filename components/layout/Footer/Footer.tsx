"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MessageCircle, ExternalLink } from "lucide-react";
import { useI18n } from "@/components/providers";
import { SITE_CONFIG, getWhatsAppChannelUrl, getWhatsAppUrl } from "@/lib/config";
import { useCatalog } from "@/features/catalog";
import { getCatalogSiteContent } from "@/lib/catalog";

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function Footer() {
  const { locale, t } = useI18n();
  const { platformSettings } = useCatalog();
  const channelUrl = platformSettings?.whatsappChannelUrl || getWhatsAppChannelUrl();

  const [siteContent, setSiteContent] = useState(() => getCatalogSiteContent());

  useEffect(() => {
    const handleUpdate = () => {
      setSiteContent(getCatalogSiteContent());
    };
    window.addEventListener("catalog-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("catalog-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const aboutText =
    siteContent?.footer?.aboutText ||
    t("footer.description") ||
    "Connecting devotees worldwide with authentic Vedic rituals, sacred temples, and verified certified pandits.";

  const helplinePhone = siteContent?.footer?.phone || SITE_CONFIG.contact.phoneDisplay;
  const helplinePhoneRaw = siteContent?.footer?.phone
    ? siteContent.footer.phone.replace(/\s+/g, "")
    : SITE_CONFIG.contact.phoneRaw;
  const supportEmail = siteContent?.footer?.email || SITE_CONFIG.contact.email;
  const copyrightText =
    siteContent?.footer?.copyrightText ||
    `© ${new Date().getFullYear()} ${SITE_CONFIG.brandName}. ${t("footer.rights")} ${t("footer.madeWith")}`;

  const navLinks = [
    { label: t("nav.home"), href: "/#home" },
    { label: t("nav.bookPooja"), href: "/#poojas" },
    { label: t("nav.temples"), href: "/temples" },
    { label: "Our Gallery", href: "/our-gallery" },
    { label: "Spiritual Blog", href: "/blog" },
    { label: "Message CEO", href: "/#message-ceo" },
    { label: t("nav.whyUs"), href: "/#why-us" },
    { label: t("nav.reviews"), href: "/#testimonials" },
    { label: t("nav.faq"), href: "/#faq" },
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
          {/* Brand & Socials */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-soft shrink-0 border border-saffron-300/40">
                <Image
                  src="/logo.jpeg"
                  alt={SITE_CONFIG.brandName}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </span>
              <div className="flex flex-col">
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-saffron-300 transition-colors">
                  {SITE_CONFIG.brandName}
                </span>
                <span className="text-[10px] font-semibold text-saffron-400 tracking-wider uppercase">
                  {t("header.tagline")}
                </span>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-cream/70">
              {aboutText}
            </p>

            {/* Official Social Media Community Links */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-300/90 block mb-2.5">
                Sacred Community &amp; Updates
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Instagram */}
                <a
                  href={SITE_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Follow on Instagram (@templepujasewa)"
                  aria-label="Instagram - @templepujasewa"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-pink-500/30 active:scale-95"
                >
                  <InstagramIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                </a>

                {/* Facebook */}
                <a
                  href={SITE_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Connect on Facebook"
                  aria-label="Facebook - Temple Puja Sewa"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-blue-500/30 active:scale-95"
                >
                  <FacebookIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                </a>

                {/* YouTube */}
                <a
                  href={SITE_CONFIG.social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Subscribe on YouTube (@TEMPLEPUJASEWA)"
                  aria-label="YouTube - @TEMPLEPUJASEWA"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF0000] text-white shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-red-500/30 active:scale-95"
                >
                  <YouTubeIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                </a>

                {/* WhatsApp Channel */}
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Join Official WhatsApp Channel"
                  aria-label="Join WhatsApp Channel"
                  className="group inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md hover:shadow-emerald-500/30 active:scale-95"
                >
                  <WhatsAppIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              {t("footer.quickLinks") || "Explore Sevas"}
            </h4>
            <ul className="space-y-2 text-xs">
              {navLinks.map((item) => {
                const isInternal = item.href.startsWith("/") && !item.href.startsWith("/#");
                return (
                  <li key={item.label}>
                    {isInternal ? (
                      <Link
                        href={item.href}
                        prefetch={true}
                        className="text-cream/70 transition-colors hover:text-saffron-400"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-cream/70 transition-colors hover:text-saffron-400"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                );
              })}
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
                  My Bookings &amp; Receipts
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-saffron-400 transition-colors">
                  Privacy &amp; Policy
                </Link>
              </li>
              <li className="pt-2 border-t border-cream/10">
                <span className="text-[11px] font-semibold text-saffron-300/80 block mb-1.5 uppercase tracking-wider">
                  Official Channels
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <a
                    href={SITE_CONFIG.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-saffron-400 transition-colors"
                  >
                    <span>📷 Instagram</span>
                    <span className="text-cream/40">(@templepujasewa)</span>
                  </a>
                  <a
                    href={SITE_CONFIG.social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-saffron-400 transition-colors"
                  >
                    <span>▶️ YouTube</span>
                    <span className="text-cream/40">(@TEMPLEPUJASEWA)</span>
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Spiritual Care & Direct Helpline */}
          <div>
            <h4 className="font-display text-sm font-bold text-white mb-4">
              24/7 Helpline &amp; Care
            </h4>
            <p className="text-xs text-cream/70 leading-relaxed mb-3">
              Reach our spiritual coordinators directly for sacred muhurat guidance, customized rituals, and verified pandit bookings.
            </p>

            <div className="flex flex-col gap-2">
              {/* Direct Phone Helpline */}
              <a
                href={`tel:${helplinePhoneRaw}`}
                className="flex items-center gap-3 rounded-xl bg-cream/[0.06] border border-cream/10 px-3 py-2 text-cream transition-all hover:border-saffron-400 hover:bg-saffron-500/10 hover:text-white group"
                title={`Call ${helplinePhone}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Phone className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-cream/50 uppercase tracking-wider font-semibold">Pooja Helpline</span>
                  <span className="font-bold text-xs text-white group-hover:text-saffron-300 transition-colors">
                    {helplinePhone}
                  </span>
                </div>
              </a>

              {/* Direct Support Email */}
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-3 rounded-xl bg-cream/[0.06] border border-cream/10 px-3 py-2 text-cream transition-all hover:border-saffron-400 hover:bg-saffron-500/10 hover:text-white group"
                title={`Email ${supportEmail}`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-500/20 text-saffron-400 shrink-0 group-hover:bg-saffron-500 group-hover:text-white transition-colors">
                  <Mail className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-cream/50 uppercase tracking-wider font-semibold">Devotee Care Email</span>
                  <span className="font-bold text-xs text-white group-hover:text-saffron-300 transition-colors truncate">
                    {supportEmail}
                  </span>
                </div>
              </a>

              {/* Direct WhatsApp Chat */}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-cream/[0.06] border border-cream/10 px-3 py-2 text-cream transition-all hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-white group"
                title="Chat with coordinators on WhatsApp"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/20 text-[#25D366] shrink-0 group-hover:bg-[#25D366] group-hover:text-white transition-colors">
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-cream/50 uppercase tracking-wider font-semibold">WhatsApp Chat</span>
                  <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition-colors">
                    +91 96210 14155
                  </span>
                </div>
              </a>

              {/* Live Chat with Pandit AI button */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget"))}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-ink-soft border border-cream/15 px-3 py-2 text-xs font-semibold text-white hover:border-saffron-400 hover:text-saffron-300 transition-all cursor-pointer shadow-soft"
              >
                <MessageCircle className="h-3.5 w-3.5 text-saffron-400" />
                <span>Chat with Pandit AI</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Bottom Copyright Row ─── */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-cream/10 pt-6 text-xs text-cream/50">
          <div>
            {copyrightText}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-cream/60">
            <a
              href={`tel:${helplinePhoneRaw}`}
              className="hover:text-saffron-400 transition-colors"
            >
              📞 {helplinePhone}
            </a>
            <span className="opacity-30">•</span>
            <a
              href={`mailto:${supportEmail}`}
              className="hover:text-saffron-400 transition-colors"
            >
              ✉️ {supportEmail}
            </a>
            <span className="opacity-30">•</span>
            <Link href="/privacy-policy" className="hover:text-saffron-400 transition-colors">
              Privacy &amp; Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


