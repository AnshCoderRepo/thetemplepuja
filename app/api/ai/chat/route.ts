import { NextRequest, NextResponse } from "next/server";
import {
  findUserByPhone,
  getChatbotKnowledge,
  getChatbotSettings,
  getPlatformSettings,
  getResolvedCatalog,
} from "@/lib/server-store";
import { createRequestLimiter } from "@/lib/rate-limit";
import { getWhatsAppUrl } from "@/lib/config";
import type { ChatbotKnowledgeEntry } from "@/lib/chatbot-types";
import { translateText } from "@/lib/translate-service";

export const dynamic = "force-dynamic";

// Rate limit: 40 messages per minute per client IP
const chatLimiter = createRequestLimiter({
  limit: 40,
  windowMs: 60 * 1000,
});

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

function extractPhone(text: string): string | null {
  const match = text.match(/(?:(?:\+?91|0)?\s*([6-9]\d{4}\s*\d{5}))/);
  if (match) {
    const digits = match[1].replace(/\s+/g, "");
    if (digits.length === 10) return digits;
  }
  const anyDigits = text.match(/\b([6-9]\d{9})\b/);
  return anyDigits ? anyDigits[1] : null;
}

function detectLanguage(text: string, clientLocale?: string): "hi" | "te" | "ta" | "en" {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0C00-\u0C7F]/.test(text)) return "te";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (clientLocale && ["hi", "te", "ta", "en"].includes(clientLocale.toLowerCase())) {
    return clientLocale.toLowerCase() as "hi" | "te" | "ta" | "en";
  }
  return "en";
}

// ── Fallback RAG Engine (Local Semantic & Keyword Matcher) ──
function matchLocalKnowledge(
  query: string,
  knowledge: ChatbotKnowledgeEntry[],
  catalog: Awaited<ReturnType<typeof getResolvedCatalog>>
): { answer: string; confidence: number } | null {
  const q = query.toLowerCase();
  // Normalize common phonetic variations so "pooja" matches "puja", "pricing" matches "price"
  const normalizedQuery = q
    .replace(/\bpoojas?\b/g, "puja")
    .replace(/\bpricing\b/g, "price")
    .replace(/\bcosts?\b/g, "price")
    .replace(/\bdakshina\b/g, "price");

  const qWords = normalizedQuery
    .split(/[\s,?.!;:—–/]+/)
    .filter(
      (w) =>
        w.length > 2 &&
        !["what", "when", "where", "which", "your", "with", "have", "about", "tell", "please", "the", "are"].includes(w)
    );

  let bestEntry: ChatbotKnowledgeEntry | null = null;
  let maxScore = 0;

  for (const entry of knowledge) {
    let score = 0;
    const titleLower = entry.title.toLowerCase().replace(/\bpoojas?\b/g, "puja").replace(/\bpricing\b/g, "price");
    const qLower = (entry.question || "").toLowerCase().replace(/\bpoojas?\b/g, "puja").replace(/\bpricing\b/g, "price");
    const answerLower = entry.answer.toLowerCase();
    const keywords = (entry.keywords || []).map((k) =>
      k.toLowerCase().replace(/\bpoojas?\b/g, "puja").replace(/\bpricing\b/g, "price")
    );

    // Exact question match
    if (qLower && (normalizedQuery.includes(qLower) || qLower.includes(normalizedQuery))) {
      score += 20;
    }

    // Direct keyword match
    for (const kw of keywords) {
      if (normalizedQuery.includes(kw)) {
        score += 10;
      }
    }

    // Word overlap (skip generic words like "puja" if others exist)
    for (const word of qWords) {
      if (word === "puja" && qWords.length > 1) {
        // Less weight to the generic word "puja" when paired with specific terms like "price" or "cancel"
        if (titleLower.includes(word)) score += 1;
        continue;
      }
      if (titleLower.includes(word)) score += 5;
      if (qLower.includes(word)) score += 4;
      if (answerLower.includes(word)) score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestEntry = entry;
    }
  }

  // Also check dynamic catalog if query mentions specific poojas
  for (const pooja of catalog.poojas) {
    const title =
      pooja.title ||
      ("name" in pooja && typeof (pooja as { name?: unknown }).name === "string"
        ? ((pooja as { name: string }).name)
        : "");
    const titleLower = title.toLowerCase();
    if (titleLower && (q.includes(titleLower) || qWords.some((w) => titleLower.includes(w) && w.length > 3))) {
      const priceText = pooja.price ? `starting at ₹${pooja.price}` : "custom dakshina";
      const poojaAnswer = `🙏 **${title}**\n${pooja.description || ""}\n\n• Dakshina: ${priceText}\n• Ritual: Personal Vedic Sankalp with certified pandits, HD video recording, and consecrated prasad delivery.`;
      if (maxScore < 8) {
        return { answer: poojaAnswer, confidence: 9 };
      }
    }
  }

  // Check temples catalog
  for (const temple of catalog.temples) {
    const tName = (temple.name || "").toLowerCase();
    if (tName && (q.includes(tName) || (temple.city && q.includes(temple.city.toLowerCase())))) {
      const templeAnswer = `🛕 **${temple.name} (${temple.city || temple.state || "Sacred Shrine"})**\n${temple.description || "Ancient consecrated shrine of divine spiritual energy."}\n\nWe facilitate sacred archana and personalized offerings on your behalf directly with local temple priests.`;
      if (maxScore < 8) {
        return { answer: templeAnswer, confidence: 9 };
      }
    }
  }

  if (bestEntry && maxScore >= 4) {
    return { answer: bestEntry.answer, confidence: maxScore };
  }

  return null;
}

interface FormattedGeminiContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

function formatGeminiContents(messages: ChatMessage[]): FormattedGeminiContent[] {
  const formatted: FormattedGeminiContent[] = [];

  for (const m of messages) {
    const text = m.text?.trim();
    if (!text) continue;
    const role: "user" | "model" = m.from === "user" ? "user" : "model";

    // Gemini API rejects contents starting with "model"
    if (formatted.length === 0 && role === "model") {
      continue;
    }

    // Combine consecutive turns of the same role
    if (formatted.length > 0 && formatted[formatted.length - 1].role === role) {
      formatted[formatted.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      formatted.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Ensure at least one user message
  if (formatted.length === 0) {
    const lastUser = [...messages].reverse().find((m) => m.from === "user");
    formatted.push({
      role: "user",
      parts: [{ text: lastUser?.text?.trim() || "Namaste" }],
    });
  }

  // If the last message was "model", append the user's latest query
  if (formatted[formatted.length - 1].role !== "user") {
    const lastUser = [...messages].reverse().find((m) => m.from === "user");
    if (lastUser?.text?.trim()) {
      formatted.push({
        role: "user",
        parts: [{ text: lastUser.text.trim() }],
      });
    }
  }

  return formatted;
}

// ── External AI Provider Execution (Gemini / Groq / OpenAI) ──
async function callExternalAI(
  systemPrompt: string,
  messages: ChatMessage[],
  geminiKey?: string,
  groqKey?: string,
  openAiKey?: string
): Promise<string | null> {
  // 1. Google Gemini Flash (Primary)
  if (geminiKey) {
    const formattedContents = formatGeminiContents(messages);
    const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: formattedContents,
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 600,
            },
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data = await res.json();
          const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidate && typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
          }
        }
      } catch {
        // Continue to fallback
      }
    }
  }

  // 2. Groq LLM (High-speed Llama 3.3 70B)
  if (groqKey) {
    try {
      const url = "https://api.groq.com/openai/v1/chat/completions";
      const sanitizedMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages
          .filter((m) => m.text && m.text.trim())
          .map((m) => ({
            role: m.from === "user" ? ("user" as const) : ("assistant" as const),
            content: m.text.trim(),
          })),
      ];

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: sanitizedMessages,
          temperature: 0.3,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && typeof reply === "string") return reply.trim();
      }
    } catch {
      // Fallback
    }
  }

  // 3. OpenAI GPT-4o-mini
  if (openAiKey) {
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const sanitizedMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages
          .filter((m) => m.text && m.text.trim())
          .map((m) => ({
            role: m.from === "user" ? ("user" as const) : ("assistant" as const),
            content: m.text.trim(),
          })),
      ];

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: sanitizedMessages,
          temperature: 0.3,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content;
        if (reply && typeof reply === "string") return reply.trim();
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const { allowed, retryAfterSec } = chatLimiter.consume(ip);
  if (!allowed) {
    return NextResponse.json(
      {
        reply: `🙏 You have sent several messages quickly. Please pause for ${retryAfterSec} seconds before sending another message.`,
        ok: false,
      },
      { status: 429 }
    );
  }

  // 2. Parse & Validate Payload
  const body = await req.json().catch(() => ({}));
  const rawMessages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
    : [];

  if (rawMessages.length === 0) {
    return NextResponse.json(
      { error: "Invalid payload: 'messages' array required." },
      { status: 400 }
    );
  }

  const lastUserMsg = [...rawMessages].reverse().find((m) => m.from === "user");
  const userText = lastUserMsg?.text?.trim() || "";

  const requestedLocale = typeof body.locale === "string" ? body.locale : undefined;
  const devoteeLang = detectLanguage(userText, requestedLocale);

  if (!userText) {
    let emptyGreeting = "Namaste! How may I assist you with your sacred pooja today?";
    if (devoteeLang !== "en") {
      emptyGreeting = await translateText(emptyGreeting, "en", devoteeLang);
    }
    return NextResponse.json({
      reply: emptyGreeting,
      ok: true,
    });
  }

  // Pre-translate Indic query to English for high-precision semantic matching & booking detection
  let englishQuery = userText;
  if (devoteeLang !== "en") {
    try {
      const translated = await translateText(userText, devoteeLang, "en");
      if (translated && translated.trim()) {
        englishQuery = translated.trim();
      }
    } catch {
      // Keep userText
    }
  }

  // 3. Check for Devotee Booking Status Query (Requires Authentication / Phone)
  const isBookingLookup =
    /(booking|status|order|track|receipt|my pooja|my puja|reservation|slot|बुकिंग|स्थिति|स्टेटस|रसीद|ఆర్డర్|బుకింగ్|முன்பதிவு)/i.test(
      userText
    ) || /(booking|status|order|track|receipt|my pooja|my puja|reservation|slot)/i.test(englishQuery);

  const phoneCandidate =
    body.phone?.toString()?.trim() || extractPhone(userText) || extractPhone(englishQuery);

  if (isBookingLookup || (phoneCandidate && phoneCandidate.length === 10)) {
    if (phoneCandidate) {
      const cleanPhone = phoneCandidate.replace(/\D/g, "").slice(-10);
      const user = await findUserByPhone(cleanPhone);

      if (user && user.bookings && user.bookings.length > 0) {
        const latest = [...user.bookings].reverse();
        const bookingSummaries = latest.slice(0, 3).map((b, i) => {
          return `${i + 1}. **${b.poojaTitle}**\n   • Booking ID: \`${b.bookingId}\`\n   • Date & Time: ${b.date} at ${b.time}\n   • Status: **${b.status.toUpperCase()}**\n   • Dakshina: ₹${b.amount}`;
        });

        let reply = `🙏 **Devotee Records Verified for ${user.name}**\n\nHere are your recent pooja bookings:\n\n${bookingSummaries.join("\n\n")}\n\nTo view full receipts or recordings, please visit your [Devotee Profile](/profile) or message our coordinators on WhatsApp.`;
        if (devoteeLang !== "en") {
          reply = await translateText(reply, "en", devoteeLang);
        }

        return NextResponse.json({
          reply,
          ok: true,
          bookingFound: true,
        });
      } else if (phoneCandidate && isBookingLookup) {
        const whatsappUrl = getWhatsAppUrl();
        let reply = `🙏 We could not find any active bookings under mobile number **+91 ${phoneCandidate}**.\n\nIf you completed payment via UPI QR recently, our team may take 5–10 minutes to verify your UTR reference. You can connect with our support team on WhatsApp here: [WhatsApp Support](${whatsappUrl}).`;
        if (devoteeLang !== "en") {
          reply = await translateText(reply, "en", devoteeLang);
        }
        return NextResponse.json({
          reply,
          ok: true,
          bookingFound: false,
        });
      }
    } else if (isBookingLookup) {
      let reply = "🔒 To protect your privacy and securely check your booking details, please provide your **10-digit registered mobile number** (e.g. *Status for 9876543210*).";
      if (devoteeLang !== "en") {
        reply = await translateText(reply, "en", devoteeLang);
      }
      return NextResponse.json({
        reply,
        ok: true,
        requiresPhone: true,
      });
    }
  }

  // 4. Load Business Knowledge & Catalog
  const [knowledge, settings, catalog, platformSettings] = await Promise.all([
    getChatbotKnowledge(),
    getChatbotSettings(),
    getResolvedCatalog(),
    getPlatformSettings(),
  ]);

  // 5. Try External AI Model (Gemini / Groq / OpenAI) if key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey || groqKey || openAiKey) {
    const businessKnowledgePrompt = knowledge
      .map(
        (k) =>
          `[Category: ${k.category.toUpperCase()}] ${k.title}\nQ: ${k.question || k.title}\nA: ${k.answer}`
      )
      .join("\n\n");

    const poojasSummary = catalog.poojas
      .map((p) => {
        const pTitle =
          p.title ||
          ("name" in p && typeof (p as { name?: unknown }).name === "string"
            ? ((p as { name: string }).name)
            : "Sacred Pooja");
        return `- ${pTitle} (Price from ₹${p.price || 501})`;
      })
      .join("\n");

    const templesSummary = catalog.temples
      .map((t) => `- ${t.name} (${t.city || t.state})`)
      .join("\n");

    const langNames: Record<string, string> = {
      hi: "Hindi (हिंदी)",
      te: "Telugu (తెలుగు)",
      ta: "Tamil (தமிழ்)",
      en: "English",
    };

    const fullSystemPrompt = `${settings.systemInstructions}

CURRENT LIVE BUSINESS CATALOG & PRICING:
Available Poojas:
${poojasSummary}

Partnered Sacred Temples:
${templesSummary}

OFFICIAL TRAINED BUSINESS KNOWLEDGE & FAQS:
${businessKnowledgePrompt}

WhatsApp Channel: ${platformSettings.whatsappChannelUrl || "Available on website"}
Customer Support: WhatsApp link or call ${settings.supportPhone || "+91 96210 14155"}

LANGUAGE REQUIREMENT:
- The devotee is speaking/browsing in ${langNames[devoteeLang] || "English"}.
- You MUST respond in ${langNames[devoteeLang] || "English"} using sacred, respectful Indian devotional terminology.

IMPORTANT RULES:
- Only answer based on the verified business knowledge and catalog above.
- Do not invent nonexistent poojas, fake prices, or false guarantees.
- For queries outside this knowledge, politely explain that you don't have that information and invite the devotee to message our coordinators on WhatsApp: ${getWhatsAppUrl()}`;

    const aiReply = await callExternalAI(
      fullSystemPrompt,
      rawMessages,
      geminiKey,
      groqKey,
      openAiKey
    );

    if (aiReply) {
      return NextResponse.json({ reply: aiReply, ok: true });
    }
  }

  // 6. Intelligent Spiritual RAG Fallback (Zero external dependencies)
  const matched =
    matchLocalKnowledge(englishQuery, knowledge, catalog) ||
    (englishQuery !== userText ? matchLocalKnowledge(userText, knowledge, catalog) : null);

  if (matched) {
    let reply = matched.answer;
    if (devoteeLang !== "en") {
      reply = await translateText(reply, "en", devoteeLang);
    }
    return NextResponse.json({ reply, ok: true });
  }

  // 7. General Fallback with Direct WhatsApp Support
  const whatsappUrl = getWhatsAppUrl();
  let fallback = `${settings.fallbackMessage || "🪔 That is a sacred inquiry! For personalized muhurat guidance or questions not covered here, please connect directly with our temple coordinators on WhatsApp."}\n\n👉 [Click here to chat on WhatsApp](${whatsappUrl}) or call us at **${settings.supportPhone || "+91 96210 14155"}**.`;
  if (devoteeLang !== "en") {
    fallback = await translateText(fallback, "en", devoteeLang);
  }

  return NextResponse.json({
    reply: fallback,
    ok: true,
  });
}
