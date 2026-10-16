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
    const title = pooja.title || (pooja as any).name || "";
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

// ── External AI Provider Execution (Gemini / OpenAI) ──
async function callExternalAI(
  systemPrompt: string,
  messages: ChatMessage[],
  geminiKey?: string,
  openAiKey?: string
): Promise<string | null> {
  // 1. Google Gemini Flash
  if (geminiKey) {
    try {
      const contents = [
        {
          role: "user",
          parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }],
        },
        ...messages.map((m) => ({
          role: m.from === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (res.ok) {
        const data = await res.json();
        const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate && typeof candidate === "string" && candidate.trim()) {
          return candidate.trim();
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. OpenAI (if key provided)
  if (openAiKey) {
    try {
      const url = "https://api.openai.com/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({
              role: m.from === "user" ? "user" : "assistant",
              content: m.text,
            })),
          ],
          temperature: 0.3,
          max_tokens: 450,
        }),
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

  if (!userText) {
    return NextResponse.json({
      reply: "Namaste! How may I assist you with your sacred pooja today?",
      ok: true,
    });
  }

  // 3. Check for Devotee Booking Status Query (Requires Authentication / Phone)
  const isBookingLookup =
    /(booking|status|order|track|receipt|my pooja|my puja|reservation|slot)/i.test(
      userText
    );

  const phoneCandidate =
    body.phone?.toString()?.trim() || extractPhone(userText);

  if (isBookingLookup || (phoneCandidate && phoneCandidate.length === 10)) {
    if (phoneCandidate) {
      const cleanPhone = phoneCandidate.replace(/\D/g, "").slice(-10);
      const user = await findUserByPhone(cleanPhone);

      if (user && user.bookings && user.bookings.length > 0) {
        const latest = [...user.bookings].reverse();
        const bookingSummaries = latest.slice(0, 3).map((b, i) => {
          return `${i + 1}. **${b.poojaTitle}**\n   • Booking ID: \`${b.bookingId}\`\n   • Date & Time: ${b.date} at ${b.time}\n   • Status: **${b.status.toUpperCase()}**\n   • Dakshina: ₹${b.amount}`;
        });

        const reply = `🙏 **Devotee Records Verified for ${user.name}**\n\nHere are your recent pooja bookings:\n\n${bookingSummaries.join("\n\n")}\n\nTo view full receipts or recordings, please visit your [Devotee Profile](/profile) or message our coordinators on WhatsApp.`;

        return NextResponse.json({
          reply,
          ok: true,
          bookingFound: true,
        });
      } else if (phoneCandidate && isBookingLookup) {
        const whatsappUrl = getWhatsAppUrl();
        const reply = `🙏 We could not find any active bookings under mobile number **+91 ${phoneCandidate}**.\n\nIf you completed payment via UPI QR recently, our team may take 5–10 minutes to verify your UTR reference. You can connect with our support team on WhatsApp here: [WhatsApp Support](${whatsappUrl}).`;
        return NextResponse.json({
          reply,
          ok: true,
          bookingFound: false,
        });
      }
    } else if (isBookingLookup) {
      return NextResponse.json({
        reply:
          "🔒 To protect your privacy and securely check your booking details, please provide your **10-digit registered mobile number** (e.g. *Status for 9876543210*).",
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

  // 5. Try External AI Model (Gemini / OpenAI) if key is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (geminiKey || openAiKey) {
    const businessKnowledgePrompt = knowledge
      .map(
        (k) =>
          `[Category: ${k.category.toUpperCase()}] ${k.title}\nQ: ${k.question || k.title}\nA: ${k.answer}`
      )
      .join("\n\n");

    const poojasSummary = catalog.poojas
      .map((p) => `- ${p.title || (p as any).name} (Price from ₹${p.price || 501})`)
      .join("\n");

    const templesSummary = catalog.temples
      .map((t) => `- ${t.name} (${t.city || t.state})`)
      .join("\n");

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

IMPORTANT RULES:
- Only answer based on the verified business knowledge and catalog above.
- Do not invent nonexistent poojas, fake prices, or false guarantees.
- For queries outside this knowledge, politely explain that you don't have that information and invite the devotee to message our coordinators on WhatsApp: ${getWhatsAppUrl()}`;

    const aiReply = await callExternalAI(
      fullSystemPrompt,
      rawMessages,
      geminiKey,
      openAiKey
    );

    if (aiReply) {
      return NextResponse.json({ reply: aiReply, ok: true });
    }
  }

  // 6. Intelligent Spiritual RAG Fallback (Zero external dependencies)
  const matched = matchLocalKnowledge(userText, knowledge, catalog);
  if (matched) {
    return NextResponse.json({ reply: matched.answer, ok: true });
  }

  // 7. General Fallback with Direct WhatsApp Support
  const whatsappUrl = getWhatsAppUrl();
  const fallback = `${settings.fallbackMessage || "🪔 That is a sacred inquiry! For personalized muhurat guidance or questions not covered here, please connect directly with our temple coordinators on WhatsApp."}\n\n👉 [Click here to chat on WhatsApp](${whatsappUrl}) or call us at **${settings.supportPhone || "+91 96210 14155"}**.`;

  return NextResponse.json({
    reply: fallback,
    ok: true,
  });
}
