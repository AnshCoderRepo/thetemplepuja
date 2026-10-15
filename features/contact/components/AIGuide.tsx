"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  X,
  Sparkles,
  Send,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Bot,
  User,
  ShieldCheck,
} from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import { getWhatsAppUrl } from "@/lib/config";

interface Message {
  from: "bot" | "user";
  text: string;
  time?: string;
  isError?: boolean;
}

const DEFAULT_GREETING =
  "🙏 Namaste! I am your Pandit AI Spiritual Guide. Ask me anything about our Vedic poojas, temple sevas, dakshina/pricing, chadhava add-ons, or booking status!";

const SUGGESTIONS = [
  "What poojas do you offer?",
  "What are the pricing & packages?",
  "How do I book online?",
  "Check my booking status",
  "Is physical presence required?",
  "What chadhava items are available?",
];

// Simple, safe Markdown-like formatter for bot replies (bold, links, bullet points)
function formatBotText(text: string) {
  // Split lines
  const lines = text.split("\n");

  return lines.map((line, idx) => {
    // Bullet point
    const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
    const cleanLine = isBullet ? line.replace(/^[\s•-]+/, "").trim() : line;

    // Parse bold text **bold**
    const parts = cleanLine.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\)|`.*?`)/g);

    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={pIdx} className="font-bold text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={pIdx}
            className="rounded-md bg-saffron-100/70 px-1.5 py-0.5 font-mono text-[10px] text-saffron-900 font-semibold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const linkText = part.slice(1, part.indexOf("]("));
        const linkHref = part.slice(part.indexOf("](") + 2, -1);
        const isExternal = linkHref.startsWith("http");
        return (
          <a
            key={pIdx}
            href={linkHref}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="font-bold text-saffron-600 underline underline-offset-2 hover:text-saffron-700 inline-flex items-center gap-0.5"
          >
            <span>{linkText}</span>
            {isExternal && <ExternalLink className="h-2.5 w-2.5 inline" />}
          </a>
        );
      }
      return <span key={pIdx}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1">
          <span className="text-saffron-500 font-bold">•</span>
          <span className="flex-1">{renderedParts}</span>
        </div>
      );
    }

    if (!cleanLine.trim()) {
      return <div key={idx} className="h-1.5" />;
    }

    return (
      <p key={idx} className="my-0.5">
        {renderedParts}
      </p>
    );
  });
}

export default function AIGuide() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: DEFAULT_GREETING,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      from: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(
        nextMessages.map((m) => ({ from: m.from, text: m.text }))
      );

      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: !res.ok,
        },
      ]);
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: "🙏 Namaste. I had a brief network delay. Please connect directly with our coordinators on WhatsApp.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        from: "bot",
        text: DEFAULT_GREETING,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!mounted) return null;

  const whatsappSupportUrl = getWhatsAppUrl();

  return (
    <>
      {/* ─── Floating Launcher Button (Bottom-Left: small icon button) ─── */}
      <div className="fixed bottom-6 left-6 z-40 flex items-center select-none">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label="Ask Pandit AI Guide"
          title="Ask Pandit AI"
          className="group relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-amber-300/60 bg-gradient-to-tr from-saffron-600 via-amber-500 to-saffron-500 text-white shadow-xl shadow-saffron-500/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-saffron-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-saffron-300 active:scale-95"
        >
          {/* Subtle pulsating glow */}
          <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-r from-saffron-400 to-amber-300 opacity-60 blur-xs transition-opacity duration-300 group-hover:opacity-100 animate-pulse" />

          {/* Active online green status indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border border-white" />
          </span>

          {open ? (
            <X className="h-5 w-5 text-white transition-transform" />
          ) : (
            <span className="text-xl sm:text-2xl drop-shadow-xs select-none">🪔</span>
          )}
        </button>
      </div>

      {/* ─── Responsive Chat Modal / Drawer ─── */}
      {open && (
        <div className="fixed bottom-20 left-4 sm:left-6 z-50 flex h-[540px] max-h-[85vh] w-[calc(100vw-32px)] max-w-[390px] flex-col overflow-hidden rounded-3xl border border-saffron-200 bg-white shadow-2xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#3a0808] via-maroon-900 to-[#3a0808] px-4 py-3.5 text-white shadow-sm border-b border-saffron-500/20">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-amber-600 text-lg shadow-sm border border-white/20">
                🪔
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold tracking-tight text-white">
                    Pandit AI Guide
                  </h3>
                  <span className="rounded-md bg-saffron-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-200 border border-saffron-400/30">
                    Vedic AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-200/90 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online • 24/7 Spiritual Guidance</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Restart Conversation"
                className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close Chat"
                className="rounded-xl p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-cream/70 px-3 py-2 border-b border-saffron-100 scrollbar-none text-[11px]">
            <Sparkles className="h-3 w-3 text-saffron-600 shrink-0" />
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(suggestion)}
                className="rounded-full bg-white border border-saffron-200/80 px-2.5 py-1 text-ink-soft whitespace-nowrap hover:bg-saffron-50 hover:text-saffron-700 hover:border-saffron-300 transition-all font-medium shrink-0 shadow-2xs"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div className="flex-1 space-y-3.5 overflow-y-auto bg-gradient-to-b from-cream/30 to-cream/60 p-4 text-xs">
            {messages.map((m, i) => {
              const isUser = m.from === "user";
              return (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-xs border border-saffron-200 mb-0.5">
                      🪔
                    </span>
                  )}
                  <div className="flex flex-col max-w-[85%]">
                    <div
                      className={`rounded-2xl p-3 leading-relaxed shadow-xs text-xs ${
                        isUser
                          ? "rounded-br-xs bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-medium shadow-saffron-500/10"
                          : "rounded-bl-xs border border-saffron-100/80 bg-white text-ink"
                      }`}
                    >
                      {isUser ? m.text : formatBotText(m.text)}
                    </div>
                    {m.time && (
                      <span
                        className={`text-[9px] text-ink-soft/60 px-1 mt-0.5 ${
                          isUser ? "text-right" : "text-left"
                        }`}
                      >
                        {m.time}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-saffron-100 text-xs border border-saffron-200 mb-0.5">
                  🪔
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-xs border border-saffron-100 bg-white px-3.5 py-2.5 text-ink-soft shadow-xs">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron-500" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron-500 [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-saffron-500 [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick WhatsApp Escalation Banner */}
          <div className="flex items-center justify-between border-t border-saffron-100 bg-cream/40 px-3.5 py-1.5 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Need human assistance?</span>
            </span>
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>WhatsApp Support</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>

          {/* Input Box */}
          <div className="border-t border-saffron-100 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about pooja, muhurat, pricing..."
                disabled={loading}
                className="flex-1 rounded-full border border-saffron-100 bg-cream/40 px-4 py-2.5 text-xs text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
