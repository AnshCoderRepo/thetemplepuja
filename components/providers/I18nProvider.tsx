"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  translations,
  DEFAULT_LOCALE,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_KEY = "ttp_locale";
const USER_SELECTED_KEY = "ttp_locale_user_selected";

function getStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const isUserSelected = localStorage.getItem(USER_SELECTED_KEY) === "true";
    const saved = localStorage.getItem(LOCALE_KEY);
    // If the user explicitly picked a language, honor their choice
    if (isUserSelected && (saved === "en" || saved === "hi" || saved === "te" || saved === "ta")) {
      return saved as Locale;
    }
  } catch {
    // ignore
  }
  try {
    const cookieSelected = document.cookie.includes("ttp_locale_user_selected=true");
    const match = document.cookie.match(/(?:^|;\s*)ttp_locale=([^;]+)/);
    if (
      cookieSelected &&
      match &&
      (match[1] === "en" || match[1] === "hi" || match[1] === "te" || match[1] === "ta")
    ) {
      return match[1] as Locale;
    }
  } catch {
    // ignore
  }
  // Default to Hindi for all new/unspecified sessions
  return null;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Load saved locale from localStorage or cookie on mount
  useEffect(() => {
    const saved = getStoredLocale();
    if (saved) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    } else {
      document.documentElement.lang = DEFAULT_LOCALE;
    }
  }, []);

  // Listen for storage changes across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_KEY && e.newValue) {
        if (
          e.newValue === "en" ||
          e.newValue === "hi" ||
          e.newValue === "te" ||
          e.newValue === "ta"
        ) {
          setLocaleState(e.newValue as Locale);
          document.documentElement.lang = e.newValue;
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(USER_SELECTED_KEY, "true");
      localStorage.setItem(LOCALE_KEY, newLocale);
    } catch {
      // ignore
    }
    try {
      document.cookie = `ttp_locale_user_selected=true;path=/;max-age=31536000;SameSite=Lax`;
      document.cookie = `${LOCALE_KEY}=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // ignore
    }
    // Set html lang attribute for accessibility
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  // Ensure html lang matches current locale
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const activeDict = translations[locale] as Record<string, string> | undefined;
      const hiDict = translations.hi as Record<string, string>;
      const enDict = translations.en as Record<string, string>;
      return activeDict?.[key] ?? hiDict?.[key] ?? enDict[key] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}
