// Dedicated translation service with in-memory caching and resilient upstream translation.

const translationCache = new Map<string, string>();

function getCacheKey(text: string, sl: string, tl: string): string {
  return `${sl}:${tl}:${text.trim()}`;
}

export async function translateText(
  text: string,
  sl: string,
  tl: string
): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";
  if (sl === tl) return clean;

  const cacheKey = getCacheKey(clean, sl, tl);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(clean)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.warn(`[translate-service] Google API returned ${res.status}`);
      return clean;
    }

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: unknown[]) => item[0]).join("");
      if (translated) {
        translationCache.set(cacheKey, translated);
        return translated;
      }
    }
    return clean;
  } catch (err) {
    console.warn(`[translate-service] Translation error (${sl}->${tl}):`, err);
    return clean;
  }
}

export async function translateFields(
  fields: Record<string, string>,
  source: string,
  targets: string[]
): Promise<Record<string, Record<string, string>>> {
  const keys = Object.keys(fields);
  const results: Record<string, Record<string, string>> = {};

  for (const tl of targets) {
    results[tl] = {};
    for (const k of keys) {
      results[tl][k] = await translateText(fields[k] || "", source, tl);
    }
  }

  return results;
}
