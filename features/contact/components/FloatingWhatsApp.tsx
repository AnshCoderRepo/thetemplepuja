"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone,
  Mail,
  MessageCircle,
  X,
  ExternalLink,
  Copy,
  Check,
  Headphones,
} from "lucide-react";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";

export default function FloatingWhatsApp() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copiedType, setCopiedType] = useState<"phone" | "email" | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowTooltip(true), 1500);

    const handleOpenWidget = () => {
      setIsOpen(true);
      setShowTooltip(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("open-chat-widget", handleOpenWidget);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("open-chat-widget", handleOpenWidget);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close when clicking outside panel
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleCopy = (text: string, type: "phone" | "email") => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType((prev) => (prev === type ? null : prev));
    }, 2000);
  };

  if (!mounted) return null;

  return (
    <div
      ref={panelRef}
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end md:bottom-8 md:right-8 group"
    >
      {/* ─── Expandable "Chat with Us" Contact Card ─── */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat with Us & Contact Information"
          className="mb-3 w-[calc(100vw-2.5rem)] sm:w-[380px] max-w-[400px] overflow-hidden rounded-3xl bg-white shadow-2xl border border-saffron-200/90 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-maroon-900 via-maroon-800 to-saffron-800 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-xl backdrop-blur-sm shadow-inner">
                  🪔
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold leading-tight text-white flex items-center gap-2">
                    Chat with Us
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs text-amber-200/90 font-medium mt-0.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Devotee Support
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close Chat with Us"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-amber-100/80">
              Have questions regarding pooja bookings, pandit ji availability, gotra, or muhurat? Contact our coordinators directly:
            </p>
          </div>

          {/* Body: Direct Contact Details */}
          <div className="p-4 sm:p-5 space-y-3.5 bg-cream/30">
            {/* Phone & WhatsApp Card */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-soft transition-all hover:border-emerald-300 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  Phone & WhatsApp
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(SITE_CONFIG.contact.phoneRaw, "phone")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedType === "phone" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Number Display */}
              <p className="mt-1.5 font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
                {SITE_CONFIG.contact.phoneDisplay}
              </p>

              {/* Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#20bd5a] hover:shadow"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>

            {/* Email Card */}
            <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-soft transition-all hover:border-saffron-300 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-saffron-800">
                  <Mail className="h-3.5 w-3.5 text-saffron-600" />
                  Email Support
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(SITE_CONFIG.contact.email, "email")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-saffron-700 hover:text-saffron-900 transition-colors"
                  title="Copy Email"
                >
                  {copiedType === "email" ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mail Display */}
              <p className="mt-1.5 font-mono text-sm font-semibold tracking-tight text-ink break-all">
                {SITE_CONFIG.contact.email}
              </p>

              {/* Action */}
              <div className="mt-3">
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-saffron-200 bg-saffron-50 px-3 py-2 text-xs font-bold text-saffron-800 transition-all hover:bg-saffron-100"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>

            {/* Reassurance Footer */}
            <div className="flex items-center justify-between rounded-xl bg-saffron-50/60 px-3.5 py-2.5 text-[11px] text-ink-soft">
              <span className="flex items-center gap-1 font-medium text-ink">
                <span>🙏</span> 100% Certified Pandits
              </span>
              <span className="font-medium text-emerald-700">
                Avg. reply &lt; 5 mins
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Floating Trigger Button ─── */}
      <div className="relative flex items-center">
        {/* Tooltip (visible when closed) */}
        {!isOpen && (
          <div
            className={`pointer-events-none absolute right-full mr-3 hidden rounded-2xl bg-slate-950/95 px-3.5 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-md transition-all duration-300 md:block ${
              showTooltip
                ? "translate-x-0 opacity-100"
                : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>💬</span> Chat with Us
            </span>
            <div className="absolute top-1/2 -right-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-950/95" />
          </div>
        )}

        {/* Floating Action Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setShowTooltip(false);
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close Chat with Us" : "Chat with Us"}
          className={`relative flex items-center gap-2.5 rounded-full text-white shadow-2xl transition-all duration-300 focus:outline-none focus-visible:ring-4 active:scale-95 ${
            isOpen
              ? "h-12 px-4 bg-maroon-900 hover:bg-maroon-800 shadow-maroon-900/40 ring-2 ring-saffron-400"
              : "h-14 px-4 sm:px-5 bg-gradient-to-r from-[#128C7E] via-[#25D366] to-[#128C7E] shadow-emerald-600/50 hover:scale-105 hover:shadow-emerald-600/60 focus-visible:ring-[#25D366]/40"
          }`}
        >
          {/* Glowing pulse ring when closed */}
          {!isOpen && (
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40 duration-1000" />
          )}

          {isOpen ? (
            <>
              <X className="h-5 w-5" />
              <span className="text-xs font-bold tracking-wide">Close</span>
            </>
          ) : (
            <>
              {/* WhatsApp / Chat Icon */}
              <svg
                className="h-6 w-6 sm:h-7 sm:w-7 fill-current drop-shadow-md shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span className="font-bold text-xs sm:text-sm tracking-wide">
                Chat with Us
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
