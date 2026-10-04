"use client";

import { useEffect, useRef, useState } from "react";
import { X, Sparkles } from "lucide-react";

interface Message {
  from: "bot" | "user";
  text: string;
}

const replies: { match: RegExp; answer: string }[] = [
  {
    match: /(pooja|puja|book|ritual)/i,
    answer:
      "🙏 Wonderful! We offer Satyanarayan Katha, Griha Pravesh, Rudrabhishek, Shani Dev Pooja, Navgraha Shanti & more. Check out our upcoming events or browse the full catalogue and pick the one that speaks to you!",
  },
  {
    match: /(kundli|rashi|nakshatra|astrolog)/i,
    answer:
      "🔮 Book any pooja above ₹1,500 and get a FREE kundli reading with your booking! Our AI guide can also recommend poojas based on your rashi & nakshatra.",
  },
  {
    match: /(record|video|watch)/i,
    answer:
      "📹 Every pooja is recorded in HD and the recording link is shared with you right after the ritual — relive the blessings from anywhere, anytime!",
  },
  {
    match: /(kit|samagri|deliver)/i,
    answer:
      "📦 Blessed pooja kits are delivered anywhere in India within 2–5 business days. Every kit is blessed by our pandits before shipping!",
  },
  {
    match: /(price|cost|fee|charge|₹)/i,
    answer:
      "💰 Prices start at ₹501. Keep an eye out for special offers — apply your coupon at the secure checkout for extra savings!",
  },
  {
    match: /(contact|phone|email|whatsapp|help|support)/i,
    answer:
      "📞 Reach us anytime on WhatsApp +91 87653 01563. Our team is available 24/7.",
  },
];

const greeting =
  "🙏 Namaste! I'm your AI Spiritual Guide. Ask me anything about poojas, upcoming events, or which ritual is right for you!";

function getBotReply(input: string): string {
  for (const r of replies) {
    if (r.match.test(input)) return r.answer;
  }
  return "🪔 That's a lovely question! I'd recommend speaking with our team — you can reach us on WhatsApp at +91 87653 01563 for personalised guidance. Om Shanti!";
}

export default function AIGuide() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: "bot", text: greeting },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: userMsg }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const reply = getBotReply(userMsg);
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
      setTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating launcher trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI Spiritual Guide"
        className="fixed bottom-24 right-6 z-40 flex items-center gap-2 rounded-full border border-amber-300/40 bg-gradient-to-r from-amber-500 to-saffron-600 px-4 py-2.5 text-xs font-bold text-white shadow-soft transition-all duration-300 hover:scale-105 hover:shadow-hover md:bottom-26 md:right-8"
      >
        <Sparkles className="h-4 w-4 animate-spin-slow" />
        <span>Ask Pandit AI</span>
      </button>

      {/* Chat drawer */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-[90vw] max-w-[360px] flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card animate-scale-in md:bottom-8 md:right-8">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-maroon-900 to-maroon-800 p-4 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron-500/30 text-base">
                🪔
              </span>
              <div>
                <h3 className="font-display text-sm font-bold">
                  Pandit AI Guide
                </h3>
                <span className="flex items-center gap-1 text-[10px] text-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-cream/40 p-4 text-xs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 leading-relaxed ${
                    m.from === "user"
                      ? "rounded-br-xs bg-saffron-500 text-white"
                      : "rounded-bl-xs border border-saffron-100 bg-white text-ink shadow-xs"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-xs border border-saffron-100 bg-white p-3 text-ink-soft shadow-xs">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron-500 [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron-500 [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-saffron-100 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about poojas, muhurat..."
                className="flex-1 rounded-full border border-saffron-100 bg-cream/30 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-500"
              />
              <button
                type="submit"
                className="rounded-full bg-saffron-500 px-4 py-2 font-display text-xs font-bold text-white transition-colors hover:bg-saffron-600"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
