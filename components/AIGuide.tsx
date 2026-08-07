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
      "🔮 Book any pooja above ₹1,500 and get a FREE kundli reading! Use code TEMPLEKUNDLI at checkout. Our AI guide can also recommend poojas based on your rashi & nakshatra.",
  },
  {
    match: /(darshan|live|stream)/i,
    answer:
      "🎥 You can watch live darshan from Kashi Vishwanath, Tirupati & Kedarnath! Your private streaming link is unlocked instantly after payment — just book any live pooja.",
  },
  {
    match: /(kit|samagri|deliver)/i,
    answer:
      "📦 Blessed pooja kits are delivered anywhere in India within 2–5 business days. Every kit is blessed by our pandits before shipping!",
  },
  {
    match: /(price|cost|fee|charge|₹)/i,
    answer:
      "💰 Prices start at ₹501. Use code TEMPLE30 for 30% off your first pooja, or BUNDLE20 for 20% off when you book 3+ poojas together!",
  },
  {
    match: /(contact|phone|email|whatsapp|help|support)/i,
    answer:
      "📞 Reach us anytime! WhatsApp +91 87653 01563, Phone +91 87653 01563, or email supportsatyakarm@gmail.com. Our team is available 24/7.",
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
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, typing, open]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { from: "bot", text: getBotReply(text) }]);
      setTyping(false);
    }, 900);
  };

  const quickChips = ["Which pooja should I do?", "Book a live darshan", "Pooja kit delivery"];

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-saffron-500 to-maroon-600 px-5 py-4 text-sm font-bold text-white shadow-glow transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        aria-label="Open AI Spiritual Guide"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline">AI Guide</span>
          </>
        )}
      </button>

      {/* Chat window */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[min(92vw,380px)] origin-bottom-right overflow-hidden rounded-3xl border border-saffron-200 bg-white shadow-2xl transition-all duration-300 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 scale-90 opacity-0"
        }`}
        role="dialog"
        aria-label="The Temple Puja AI Guide chat"
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-saffron-500 via-saffron-600 to-maroon-600 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl backdrop-blur">
              🕉️
            </span>
            <div>
              <div className="text-sm font-bold text-white">
                The Temple Puja AI Guide
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                Online — Spiritual Advisor
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={bodyRef}
          className="flex h-80 flex-col gap-3 overflow-y-auto bg-cream p-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.from === "bot"
                  ? "self-start rounded-bl-sm bg-white text-ink shadow-soft"
                  : "self-end rounded-br-sm bg-gradient-to-r from-saffron-500 to-saffron-600 text-white"
              }`}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="self-start flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-soft">
              <span className="h-2 w-2 animate-bounce rounded-full bg-saffron-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-saffron-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-saffron-400 [animation-delay:300ms]" />
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div className="flex gap-2 overflow-x-auto border-t border-saffron-100 bg-white px-4 py-2.5">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setMessages((m) => [...m, { from: "user", text: chip }]);
                setTyping(true);
                setTimeout(() => {
                  setMessages((m) => [
                    ...m,
                    { from: "bot", text: getBotReply(chip) },
                  ]);
                  setTyping(false);
                }, 800);
              }}
              className="shrink-0 rounded-full border border-saffron-200 bg-saffron-50 px-3 py-1.5 text-[11px] font-semibold text-saffron-700 transition-colors hover:bg-saffron-100"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={send}
          className="flex items-center gap-2 border-t border-saffron-100 bg-white p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about poojas…"
            className="flex-1 rounded-full border border-saffron-100 bg-cream px-4 py-2.5 text-sm outline-none transition-all focus:border-saffron-400 focus:ring-2 focus:ring-saffron-200"
          />
          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow transition-transform hover:scale-110"
            aria-label="Send message"
          >
            ➤
          </button>
        </form>
      </div>
    </>
  );
}
