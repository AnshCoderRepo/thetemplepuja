"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useI18n } from "@/components/providers";
import { SUPPORTED_LANGUAGES, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { trackCustomEvent } from "@/lib/meta-pixel";

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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === locale) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === DEFAULT_LOCALE) ||
    SUPPORTED_LANGUAGES[0];

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Select language (Current: ${currentLang.nativeName})`}
        className="flex items-center gap-1.5 rounded-full border border-saffron-200 bg-white/95 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-ink shadow-xs backdrop-blur-md transition-all hover:border-saffron-400 hover:bg-saffron-50 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-saffron-400/50"
      >
        <Globe className="h-3.5 w-3.5 text-saffron-600 shrink-0" />
        <span className="font-medium text-ink">{currentLang.nativeName}</span>
        <ChevronDown
          className={`h-3 w-3 text-ink-soft transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 z-[100] mt-2 w-48 origin-top-right rounded-2xl border border-saffron-200/90 bg-white p-1.5 shadow-2xl backdrop-blur-md animate-fadeIn"
        >
          <div className="px-2.5 py-1.5 border-b border-saffron-100 text-[10px] font-bold uppercase tracking-wider text-saffron-700">
            Language / भाषा
          </div>
          <div className="mt-1 space-y-0.5">
            {[...SUPPORTED_LANGUAGES]
              .sort((a, b) => (a.code === "hi" ? -1 : b.code === "hi" ? 1 : 0))
              .map((lang) => {
              const isSelected = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLocale(lang.code as Locale);
                    trackCustomEvent("LanguageChange", { language: lang.code, language_name: lang.label });
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-gradient-to-r from-saffron-600 to-saffron-700 font-bold text-white shadow-xs"
                      : "text-ink hover:bg-saffron-50 hover:text-saffron-900"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-xs leading-tight">{lang.nativeName}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? "text-amber-100" : "text-ink-soft"
                      }`}
                    >
                      {lang.label}
                    </span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
