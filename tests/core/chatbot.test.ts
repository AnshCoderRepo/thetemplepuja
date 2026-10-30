import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHATBOT_KNOWLEDGE,
  DEFAULT_CHATBOT_SETTINGS,
} from "@/lib/chatbot-types";
import {
  getChatbotKnowledge,
  getChatbotSettings,
  getPlatformSettings,
  saveChatbotKnowledge,
  saveChatbotSettings,
  savePlatformSettings,
} from "@/lib/server-store";

describe("AI Chatbot Knowledge & Persona System", () => {
  it("provides comprehensive default knowledge covering all 7 business categories", () => {
    expect(DEFAULT_CHATBOT_KNOWLEDGE.length).toBeGreaterThanOrEqual(10);
    const categories = new Set(DEFAULT_CHATBOT_KNOWLEDGE.map((k) => k.category));
    expect(categories.has("pujas")).toBe(true);
    expect(categories.has("temples")).toBe(true);
    expect(categories.has("bookings")).toBe(true);
    expect(categories.has("payments")).toBe(true);
    expect(categories.has("chadhava")).toBe(true);
    expect(categories.has("events")).toBe(true);
    expect(categories.has("faqs")).toBe(true);
  });

  it("loads and persists chatbot knowledge updates in the server store", async () => {
    const initial = await getChatbotKnowledge();
    expect(initial.length).toBeGreaterThan(0);

    const customEntry = {
      id: "kb-test-kundli",
      title: "Free Kundli Consultation",
      category: "pujas" as const,
      question: "Do you offer kundli matching?",
      answer: "Yes, free kundli reading is offered with bookings above ₹1,500.",
      keywords: ["kundli", "astrology", "horoscope"],
      updatedAt: new Date().toISOString(),
    };

    await saveChatbotKnowledge([customEntry, ...initial]);
    const after = await getChatbotKnowledge();
    expect(after[0].id).toBe("kb-test-kundli");
    expect(after[0].title).toBe("Free Kundli Consultation");

    // Clean up
    await saveChatbotKnowledge(initial);
  });

  it("persists and updates chatbot system settings & persona instructions", async () => {
    const current = await getChatbotSettings();
    expect(current.systemInstructions).toContain("Pandit AI");

    const updated = {
      ...current,
      welcomeMessage: "🙏 Welcome to templepujasewa!",
      supportPhone: "+91 99999 88888",
    };

    await saveChatbotSettings(updated);
    const retrieved = await getChatbotSettings();
    expect(retrieved.welcomeMessage).toBe("🙏 Welcome to templepujasewa!");

    expect(retrieved.supportPhone).toBe("+91 99999 88888");

    // Revert
    await saveChatbotSettings(current);
  });

  it("persists official WhatsApp Channel URL dynamically", async () => {
    const testChannelUrl = "https://whatsapp.com/channel/0029VaCustomTempleChannel";
    await savePlatformSettings({ whatsappChannelUrl: testChannelUrl });

    const platform = await getPlatformSettings();
    expect(platform.whatsappChannelUrl).toBe(testChannelUrl);
  });

  describe("Chat API endpoint (/api/ai/chat)", () => {
    it("answers questions using business knowledge and catalog", async () => {
      const { POST } = await import("@/app/api/ai/chat/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ from: "user", text: "What is the price of pooja?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.reply).toMatch(/501|price|package|₹/i);
    });

    it("requires phone number before returning booking details", async () => {
      const { POST } = await import("@/app/api/ai/chat/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ from: "user", text: "Where is my booking status?" }],
        }),
      });

      const res = await POST(req);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.requiresPhone).toBe(true);
      expect(json.reply).toContain("10-digit registered mobile number");
    });

    it("returns polite fallback with WhatsApp support for unknown queries", async () => {
      const { POST } = await import("@/app/api/ai/chat/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ from: "user", text: "xyzfoobar completely unknown topic question 9988" }],
        }),
      });

      const res = await POST(req);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.reply).toContain("WhatsApp");
    });

    it("detects Indic script in user query and translates response to devotee language", async () => {
      const { POST } = await import("@/app/api/ai/chat/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [{ from: "user", text: "पूजा की कीमत क्या है?" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      // Hindi response should contain Devanagari characters
      expect(/[\u0900-\u097F]/.test(json.reply)).toBe(true);
    });
  });
});
