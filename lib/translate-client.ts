// Client-side and universal helper for automatic cross-language synchronization.
// When content is edited in any language (en, hi, te, ta), this utility propagates
// accurate translations to all other supported languages.

export type SupportedLocale = "en" | "hi" | "te" | "ta";
export const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "hi", "te", "ta"];

export interface LocaleFieldResult {
  en: string;
  hi: string;
  te: string;
  ta: string;
}

/**
 * Translates a single piece of text from any source language to all other supported languages.
 * The source language's entry in the returned object is guaranteed to be the original trimmed text.
 */
export async function translateTextToAllLanguages(
  text: string,
  sourceLocale: SupportedLocale = "en"
): Promise<LocaleFieldResult> {
  const clean = text.trim();
  const baseResult: LocaleFieldResult = {
    en: sourceLocale === "en" ? clean : "",
    hi: sourceLocale === "hi" ? clean : "",
    te: sourceLocale === "te" ? clean : "",
    ta: sourceLocale === "ta" ? clean : "",
  };

  if (!clean) return baseResult;

  const targetLocales = SUPPORTED_LOCALES.filter((l) => l !== sourceLocale);

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clean,
        source: sourceLocale,
        targets: targetLocales,
      }),
    });

    if (!res.ok) {
      console.warn(`[translate-client] API returned status ${res.status}`);
      return baseResult;
    }

    const data = await res.json();
    if (data.ok && data.translations) {
      for (const tl of targetLocales) {
        if (data.translations[tl]) {
          baseResult[tl] = data.translations[tl];
        }
      }
    }
  } catch (err) {
    console.error("[translate-client] Network error during translation:", err);
  }

  return baseResult;
}

/**
 * Translates multiple fields simultaneously (e.g. Q&A or Title & Description)
 * from any source language to all other supported languages.
 */
export async function translateFieldsToAllLanguages(
  fields: Record<string, string>,
  sourceLocale: SupportedLocale = "en"
): Promise<Record<SupportedLocale, Record<string, string>>> {
  const result: Record<SupportedLocale, Record<string, string>> = {
    en: sourceLocale === "en" ? { ...fields } : {},
    hi: sourceLocale === "hi" ? { ...fields } : {},
    te: sourceLocale === "te" ? { ...fields } : {},
    ta: sourceLocale === "ta" ? { ...fields } : {},
  };

  const targetLocales = SUPPORTED_LOCALES.filter((l) => l !== sourceLocale);
  const hasContent = Object.values(fields).some((v) => Boolean(v && v.trim()));
  if (!hasContent) return result;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields,
        source: sourceLocale,
        targets: targetLocales,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.translations) {
        for (const tl of targetLocales) {
          result[tl] = { ...fields, ...(data.translations[tl] || {}) };
        }
      }
    }
  } catch (err) {
    console.error("[translate-client] Batch fields translation error:", err);
  }

  return result;
}
