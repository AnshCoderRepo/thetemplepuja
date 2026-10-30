// Dedicated translation service with in-memory caching, multi-engine AI cascade,
// and resilient upstream translation for sacred Indian languages (en, hi, te, ta).

const MAX_CACHE_SIZE = 5000;
const translationCache = new Map<string, string>();

function getCacheKey(text: string, sl: string, tl: string): string {
  return `${sl.toLowerCase()}:${tl.toLowerCase()}:${text.trim()}`;
}

function setCache(key: string, val: string) {
  if (translationCache.size >= MAX_CACHE_SIZE) {
    // Evict oldest 500 entries
    const iter = translationCache.keys();
    for (let i = 0; i < 500; i++) {
      const nextKey = iter.next().value;
      if (nextKey) translationCache.delete(nextKey);
    }
  }
  translationCache.set(key, val);
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
};

/**
 * 1. Google Gemini Flash Translation Engine (Active when GEMINI_API_KEY is present)
 */
async function translateWithGemini(
  text: string,
  sl: string,
  tl: string,
  apiKey: string
): Promise<string | null> {
  const fromLang = LANGUAGE_NAMES[sl] || sl;
  const toLang = LANGUAGE_NAMES[tl] || tl;

  const prompt = `You are an expert Vedic and Indian spiritual language translator.
Translate the following text accurately from ${fromLang} to ${toLang}.
Preserve sacred Vedic terms (such as Puja, Sankalp, Gotra, Prasad, Pandit, Chadhava, Muhurat, Hawan, Aarti), devotional warmth, and natural Indian phrasing.
Return ONLY the raw translated text with NO additional explanation, commentary, or quotes.

Text to translate:
${text}`;

  const models = ["gemini-1.5-flash", "gemini-2.0-flash"];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate && typeof candidate === "string" && candidate.trim()) {
          return candidate.trim().replace(/^["'`]|["'`]$/g, "");
        }
      }
    } catch {
      // Try next model or fallback
    }
  }
  return null;
}

/**
 * 2. Groq Llama 3.3 Translation Engine (Active when GROQ_API_KEY is present)
 */
async function translateWithGroq(
  text: string,
  sl: string,
  tl: string,
  apiKey: string
): Promise<string | null> {
  const fromLang = LANGUAGE_NAMES[sl] || sl;
  const toLang = LANGUAGE_NAMES[tl] || tl;

  const url = "https://api.groq.com/openai/v1/chat/completions";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert Vedic and Indian spiritual language translator. Translate accurately from ${fromLang} to ${toLang}. Preserve sacred Vedic terms (such as Puja, Sankalp, Gotra, Prasad, Pandit, Chadhava, Muhurat). Return ONLY the translated text with NO commentary or quotes.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (reply && typeof reply === "string" && reply.trim()) {
      return reply.trim().replace(/^["'`]|["'`]$/g, "");
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * 2. OpenAI Translation Engine (Active when OPENAI_API_KEY is present)
 */
async function translateWithOpenAI(
  text: string,
  sl: string,
  tl: string,
  apiKey: string
): Promise<string | null> {
  const fromLang = LANGUAGE_NAMES[sl] || sl;
  const toLang = LANGUAGE_NAMES[tl] || tl;

  const url = "https://api.openai.com/v1/chat/completions";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert Vedic and spiritual translator. Translate from ${fromLang} to ${toLang}. Return ONLY the translated text.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (reply && typeof reply === "string" && reply.trim()) {
      return reply.trim().replace(/^["'`]|["'`]$/g, "");
    }
  } catch {
    // Fallback to next engine
  }
  return null;
}

/**
 * 3. Google Chrome Extension Translation Client (Fast, high-fidelity, unblocked)
 */
async function translateWithGoogleChrome(
  text: string,
  sl: string,
  tl: string
): Promise<string | null> {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${encodeURIComponent(
    sl
  )}&tl=${encodeURIComponent(tl)}&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (Array.isArray(data)) {
      if (typeof data[0] === "string") {
        return data.join("");
      }
      if (Array.isArray(data[0]) && typeof data[0][0] === "string") {
        return data[0].map((item: unknown) => (Array.isArray(item) ? item[0] : item)).join("");
      }
    }
    if (typeof data === "string") return data;
  } catch {
    // Fallback to next engine
  }
  return null;
}

/**
 * 4. MyMemory Translation API (Resilient public translation backup)
 */
async function translateWithMyMemory(
  text: string,
  sl: string,
  tl: string
): Promise<string | null> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text
  )}&langpair=${encodeURIComponent(sl)}|${encodeURIComponent(tl)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && typeof translated === "string" && !translated.includes("MYMEMORY WARNING")) {
      return translated;
    }
  } catch {
    // Fallback to next engine
  }
  return null;
}

/**
 * 5. Google Translate Single API (GTX)
 */
async function translateWithGoogleGtx(
  text: string,
  sl: string,
  tl: string
): Promise<string | null> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sl
  )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0].map((item: unknown[]) => item[0]).join("");
      if (translated) return translated;
    }
  } catch {
    // Fallback
  }
  return null;
}

/**
 * Translate a piece of text from source language (sl) to target language (tl).
 * Uses multi-engine AI & translation cascade:
 * 1. Cache
 * 2. Gemini Flash AI (if GEMINI_API_KEY is present)
 * 3. OpenAI GPT-4o-mini (if OPENAI_API_KEY is present)
 * 4. Google Chrome Neural Client (Fast, accurate, unblocked)
 * 5. MyMemory Neural Translation
 * 6. Google GTX fallback
 * 7. Original text if all upstream fail
 */
export async function translateText(
  text: string,
  sl: string,
  tl: string
): Promise<string> {
  const clean = text.trim();
  if (!clean) return "";
  if (sl.toLowerCase() === tl.toLowerCase()) return clean;

  const cacheKey = getCacheKey(clean, sl, tl);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 1. Try Gemini AI if API key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const aiResult = await translateWithGemini(clean, sl, tl, geminiKey);
    if (aiResult) {
      setCache(cacheKey, aiResult);
      return aiResult;
    }
  }

  // 2. Try Groq AI if API key is configured
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const aiResult = await translateWithGroq(clean, sl, tl, groqKey);
    if (aiResult) {
      setCache(cacheKey, aiResult);
      return aiResult;
    }
  }

  // 3. Try OpenAI if API key is configured
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    const aiResult = await translateWithOpenAI(clean, sl, tl, openAiKey);
    if (aiResult) {
      setCache(cacheKey, aiResult);
      return aiResult;
    }
  }

  // 3. Try Google Chrome Neural Client
  const chromeResult = await translateWithGoogleChrome(clean, sl, tl);
  if (chromeResult) {
    setCache(cacheKey, chromeResult);
    return chromeResult;
  }

  // 4. Try MyMemory Neural API
  const myMemoryResult = await translateWithMyMemory(clean, sl, tl);
  if (myMemoryResult) {
    setCache(cacheKey, myMemoryResult);
    return myMemoryResult;
  }

  // 5. Try Google GTX
  const gtxResult = await translateWithGoogleGtx(clean, sl, tl);
  if (gtxResult) {
    setCache(cacheKey, gtxResult);
    return gtxResult;
  }

  // 6. Graceful fallback
  console.warn(`[translate-service] All translation engines exhausted for ${sl}->${tl}: "${clean.slice(0, 30)}..."`);
  return clean;
}

/**
 * Translate a dictionary of fields from source language to multiple target languages in parallel.
 */
export async function translateFields(
  fields: Record<string, string>,
  source: string,
  targets: string[]
): Promise<Record<string, Record<string, string>>> {
  const keys = Object.keys(fields);
  const results: Record<string, Record<string, string>> = {};

  await Promise.all(
    targets.map(async (tl) => {
      results[tl] = {};
      await Promise.all(
        keys.map(async (k) => {
          const val = fields[k] || "";
          results[tl][k] = await translateText(val, source, tl);
        })
      );
    })
  );

  return results;
}
