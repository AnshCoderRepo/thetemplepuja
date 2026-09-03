"use client";

import { Globe } from "lucide-react";
import { useI18n } from "./I18nProvider";
import type { Locale } from "@/lib/i18n";

export default function LanguageToggle({
  className = "",
}: {
  className?: string;
}) {
  const { locale, setLocale } = useI18n();

  const toggle = () => {
    setLocale(locale === "en" ? "hi" : "en");
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 rounded-full border border-saffron-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:bg-saffron-50 hover:border-saffron-300 ${className}`}
      aria-label={`Switch to ${locale === "en" ? "Hindi" : "English"}`}
      title={`Switch to ${locale === "en" ? "हिन्दी" : "English"}`}
    >
      <Globe className="h-3.5 w-3.5 text-saffron-600" />
      <span>{locale === "en" ? "हिन्दी" : "EN"}</span>
    </button>
  );
}
