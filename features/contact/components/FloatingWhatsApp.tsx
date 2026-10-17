"use client";

import { useEffect, useRef, useState } from "react";
import {
  Phone,
  Mail,
  X,
  MessageCircle,
} from "lucide-react";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";
import { event as trackMetaEvent } from "@/lib/meta-pixel";
import { useBookingModal } from "@/components/providers";

function WhatsAppIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      className={`${className} fill-current drop-shadow-sm`}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export default function FloatingWhatsApp() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasStickyBottomBar, setHasStickyBottomBar] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isOpen: isBookingModalOpen } = useBookingModal();

  useEffect(() => {
    setMounted(true);

    const handleOpenWidget = () => {
      setIsOpen(true);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("open-chat-widget", handleOpenWidget);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-chat-widget", handleOpenWidget);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Monitor for sticky booking bar to dynamically float above it and prevent Book button collision
  useEffect(() => {
    const checkStickyBar = () => {
      const stickyBar = document.getElementById("book-now-sticky-bar");
      if (stickyBar) {
        const isHidden =
          stickyBar.getAttribute("aria-hidden") === "true" ||
          stickyBar.classList.contains("translate-y-full") ||
          stickyBar.classList.contains("pointer-events-none") ||
          stickyBar.classList.contains("opacity-0");
        setHasStickyBottomBar(!isHidden);
      } else {
        setHasStickyBottomBar(false);
      }
    };

    checkStickyBar();
    window.addEventListener("scroll", checkStickyBar, { passive: true });
    window.addEventListener("resize", checkStickyBar, { passive: true });

    const observer = new MutationObserver(checkStickyBar);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", checkStickyBar);
      window.removeEventListener("resize", checkStickyBar);
      observer.disconnect();
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Completely unmount/hide when booking modal is active to prevent any interference
  if (!mounted || isBookingModalOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed z-40 flex flex-col items-end select-none pointer-events-none transition-all duration-300 ease-in-out ${
        hasStickyBottomBar
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] sm:right-6"
          : "bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:bottom-6 right-[max(0.75rem,env(safe-area-inset-right,0px))] sm:right-6"
      }`}
    >
      {/* ─── Expanded Action Icons (Speed-Dial Stack) ─── */}
      <div
        className={`flex flex-col items-end gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-6 pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        {/* 1. Email Support Action */}
        <div className="flex items-center gap-2 sm:gap-3 group">
          <span className="rounded-xl bg-ink/90 backdrop-blur-md px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white shadow-lg transition-transform group-hover:scale-105 border border-white/10">
            Email Support
          </span>
          <a
            href={`mailto:${SITE_CONFIG.contact.email}`}
            title="Email Support"
            aria-label="Email Support"
            onClick={() => {
              trackMetaEvent("Contact", { method: "email" });
              setIsOpen(false);
            }}
            className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-amber-600 text-white shadow-xl shadow-saffron-500/30 transition-all duration-200 hover:scale-105 active:scale-95 border border-white/30 cursor-pointer pointer-events-auto"
          >
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
          </a>
        </div>

        {/* 2. Direct Call Action */}
        <div className="flex items-center gap-2 sm:gap-3 group">
          <span className="rounded-xl bg-ink/90 backdrop-blur-md px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white shadow-lg transition-transform group-hover:scale-105 border border-white/10">
            Call Helpline
          </span>
          <a
            href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
            title="Call Helpline"
            aria-label="Call Helpline"
            onClick={() => {
              trackMetaEvent("Contact", { method: "phone" });
              trackMetaEvent("Lead");
              setIsOpen(false);
            }}
            className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/30 transition-all duration-200 hover:scale-105 active:scale-95 border border-white/30 cursor-pointer pointer-events-auto"
          >
            <Phone className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:rotate-12" />
          </a>
        </div>

        {/* 3. WhatsApp Chat Action */}
        <div className="flex items-center gap-2 sm:gap-3 group">
          <span className="rounded-xl bg-ink/90 backdrop-blur-md px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white shadow-lg transition-transform group-hover:scale-105 border border-white/10">
            WhatsApp Chat
          </span>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
            onClick={() => {
              trackMetaEvent("Contact", { method: "whatsapp" });
              trackMetaEvent("Lead");
              setIsOpen(false);
            }}
            className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-[#128C7E] via-[#25D366] to-[#128C7E] text-white shadow-xl shadow-[#25D366]/35 transition-all duration-200 hover:scale-105 active:scale-95 border border-white/30 cursor-pointer pointer-events-auto"
          >
            <WhatsAppIcon className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
          </a>
        </div>
      </div>

      {/* ─── Single Floating Main Trigger Icon ─── */}
      <button
        type="button"
        id="floating-support-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close Support Menu" : "Contact Devotee Support"}
        title={isOpen ? "Close Support" : "Devotee Support"}
        className={`relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-4 active:scale-95 border-2 border-white/40 pointer-events-auto cursor-pointer touch-manipulation ${
          isOpen
            ? "bg-maroon-900 hover:bg-maroon-800 shadow-maroon-900/50 rotate-90"
            : "bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#128C7E] shadow-[#25D366]/40 hover:scale-105 hover:shadow-[#25D366]/60 focus-visible:ring-[#25D366]"
        }`}
      >
        {/* Glowing pulse ring when collapsed */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/20 duration-1000" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-white" />
            </span>
          </>
        )}

        {isOpen ? (
          <X className="h-6 w-6 sm:h-7 sm:w-7 transition-transform" />
        ) : (
          <WhatsAppIcon className="h-6 w-6 sm:h-7 sm:w-7 transition-transform" />
        )}
      </button>
    </div>
  );
}
