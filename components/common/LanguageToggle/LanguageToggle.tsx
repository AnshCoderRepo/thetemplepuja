"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useI18n } from "@/components/providers";
import { SUPPORTED_LANGUAGES, type Locale } from "@/lib/i18n";

export default function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === locale) || SUPPORTED_LANGUAGES[0];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Select website language"
        className="flex items-center gap-1.5 rounded-full border border-saffron-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-xs backdrop-blur transition-all hover:border-saffron-300 hover:bg-saffron-50"
      >
        <Globe className="h-3.5 w-3.5 text-saffron-600" />
        <span>{currentLang.label}</span>
        <ChevronDown className={`h-3 w-3 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-1.5 w-40 origin-top-right rounded-2xl border border-saffron-200 bg-white p-1.5 shadow-xl backdrop-blur-md animate-fadeIn"
        >
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLocale(lang.code as Locale);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-saffron-500 font-bold text-white shadow-xs"
                    : "text-ink hover:bg-saffron-50 hover:text-saffron-800"
                }`}
              >
                <span>{lang.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
