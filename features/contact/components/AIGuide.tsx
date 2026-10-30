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
import { useBookingModal, useI18n } from "@/components/providers";

interface Message {
  from: "bot" | "user";
  text: string;
  time?: string;
  isError?: boolean;
}

const LOCALIZED_GUIDE_CONFIG: Record<
  string,
  {
    greeting: string;
    suggestions: string[];
    placeholder: string;
    badge: string;
    subBadge: string;
    humanHelp: string;
    chatWithHuman: string;
  }
> = {
  en: {
    greeting:
      "🙏 Namaste! I am your Pandit AI Spiritual Guide. Ask me anything about our Vedic poojas, temple sevas, dakshina/pricing, chadhava add-ons, or booking status!",
    suggestions: [
      "What poojas do you offer?",
      "What are the pricing & packages?",
      "How do I book online?",
      "Check my booking status",
      "Is physical presence required?",
      "What chadhava items are available?",
    ],
    placeholder: "Ask about pooja, muhurat, pricing...",
    badge: "Pandit AI Guide",
    subBadge: "Online • 24/7 Spiritual Guidance",
    humanHelp: "Need human assistance?",
    chatWithHuman: "WhatsApp Support",
  },
  hi: {
    greeting:
      "🙏 नमस्ते! मैं आपका पंडित एआई आध्यात्मिक मार्गदर्शक हूँ। हमारी वैदिक पूजाओं, मंदिर सेवा, दक्षिणा/मूल्य, चढ़ावा या बुकिंग स्थिति के बारे में कुछ भी पूछें!",
    suggestions: [
      "कौन सी पूजाएँ उपलब्ध हैं?",
      "पूजा की दक्षिणा और पैकेज क्या हैं?",
      "ऑनलाइन संकल्प कैसे होता है?",
      "मेरी बुकिंग स्थिति जांचें",
      "क्या शारीरिक उपस्थिति अनिवार्य है?",
      "कौन से चढ़ावे उपलब्ध हैं?",
    ],
    placeholder: "पूजा, मुहूर्त, दक्षिणा के बारे में पूछें...",
    badge: "पंडित एआई गाइड",
    subBadge: "ऑनलाइन • 24/7 आध्यात्मिक मार्गदर्शन",
    humanHelp: "सहायता चाहिए?",
    chatWithHuman: "व्हाट्सएप सहायता",
  },
  te: {
    greeting:
      "🙏 నమస్కారం! నేను మీ పండిట్ AI ఆధ్యాత్మిక మార్గదర్శకుడిని. మా వేద పూజలు, ఆలయ సేవలు, దక్షిణ/ధరలు, చఢావా లేదా బుకింగ్ స్థితి గురించి ఏదైనా అడగండి!",
    suggestions: [
      "ఏ పూజలు అందుబాటులో ఉన్నాయి?",
      "పూజ ధరలు మరియు ప్యాకేజీలు ఏమిటి?",
      "ఆన్‌లైన్ సంకల్పం ఎలా పనిచేస్తుంది?",
      "నా బుకింగ్ స్థితిని తనిఖీ చేయండి",
      "ప్రత్యక్ష హాజరు తప్పనిసరా?",
      "ఏయే చఢావా సేవలు అందుబాటులో ఉన్నాయి?",
    ],
    placeholder: "పూజ, ముహూర్తం, దక్షిణ గురించి అడగండి...",
    badge: "పండిట్ AI గైడ్",
    subBadge: "ఆన్‌లైన్ • 24/7 వేద మార్గదర్శకత్వం",
    humanHelp: "సహాయం కావాలా?",
    chatWithHuman: "వాట్సాప్ సపోర్ట్",
  },
  ta: {
    greeting:
      "🙏 வணக்கம்! நான் உங்கள் பண்டிட் AI ஆன்மீக வழிகாட்டி. எங்கள் வேத பூஜைகள், கோயில் சேவைகள், தட்சிணை/கட்டணம், காணிக்கை அல்லது முன்பதிவு நிலை பற்றி எது வேண்டுமானாலும் கேளுங்கள்!",
    suggestions: [
      "என்னென்ன பூஜைகள் உள்ளன?",
      "பூஜை கட்டணம் மற்றும் தொகுப்புகள் யாவை?",
      "ஆன்லைன் சங்கல்பம் எவ்வாறு செய்யப்படுகிறது?",
      "என் முன்பதிவு நிலையை சரிபார்க்கவும்",
      "நேரில் வருவது அவசியமா?",
      "என்னென்ன காணிக்கைகள் உள்ளன?",
    ],
    placeholder: "பூஜை, முஹூர்த்தம், கட்டணம் பற்றி கேளுங்கள்...",
    badge: "பண்டிட் AI வழிகாட்டி",
    subBadge: "ஆன்லைன் • 24/7 ஆன்மீக வழிகாட்டுதல்",
    humanHelp: "உதவி தேவையா?",
    chatWithHuman: "வாட்ஸ்அப் ஆதரவு",
  },
};

const DEFAULT_GREETING = LOCALIZED_GUIDE_CONFIG.en.greeting;
const SUGGESTIONS = LOCALIZED_GUIDE_CONFIG.en.suggestions;

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
  const { locale } = useI18n();
  const guideConfig = LOCALIZED_GUIDE_CONFIG[locale] || LOCALIZED_GUIDE_CONFIG.en;

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: (LOCALIZED_GUIDE_CONFIG[locale] || LOCALIZED_GUIDE_CONFIG.en).greeting,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { isOpen: isBookingModalOpen } = useBookingModal();

  // Synchronize initial greeting when locale changes if user hasn't chatted yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].from === "bot") {
        return [
          {
            from: "bot",
            text: guideConfig.greeting,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [locale, guideConfig.greeting]);

  // Auto-close AI guide if booking modal is opened
  useEffect(() => {
    if (isBookingModalOpen && open) {
      setOpen(false);
    }
  }, [isBookingModalOpen, open]);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const handleOpenAiGuide = () => {
      setOpen(true);
    };
    window.addEventListener("open-ai-guide", handleOpenAiGuide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("open-ai-guide", handleOpenAiGuide);
    };
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, messages, loading]);

  // Click-outside and keyboard dismissal for top-right anchored panel
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleCloseEvent = () => {
      setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("close-ai-guide", handleCloseEvent);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("close-ai-guide", handleCloseEvent);
    };
  }, [open]);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(new CustomEvent("close-mobile-menu"));
      }
      return next;
    });
  };

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
        nextMessages.map((m) => ({ from: m.from, text: m.text })),
        undefined,
        locale
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
          text:
            locale === "hi"
              ? "🙏 नमस्ते। नेटवर्क में कुछ विलंब हुआ है। कृपया त्वरित सहायता के लिए व्हाट्सएप पर हमारे मंदिर समन्वयकों से संपर्क करें।"
              : locale === "te"
              ? "🙏 నమస్కారం. నెట్‌వర్క్ జాప్యం జరిగింది. తక్షణ సహాయం కోసం దయచేసి వాట్సాప్‌లో మా ఆలయ సమన్వయకర్తలను సంప్రదించండి."
              : locale === "ta"
              ? "🙏 வணக்கம். நெட்வொர்க் தாமதம் ஏற்பட்டது. உடனடி உதவிக்கு வாட்ஸ்அப்பில் எங்கள் கோயில் ஒருங்கிணைப்பாளர்களைத் தொடர்பு கொள்ளவும்."
              : "🙏 Namaste. I had a brief network delay. Please connect directly with our coordinators on WhatsApp.",
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
        text: guideConfig.greeting,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  if (!mounted) return null;

  const whatsappSupportUrl = getWhatsAppUrl();

  return (
    <div className="relative flex items-center select-none shrink-0">
      {/* ─── Integrated Navbar Launcher Button ─── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label="Ask Pandit AI Guide"
        title="Ask Pandit AI Guide"
        className="group relative flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-amber-300/70 bg-gradient-to-tr from-saffron-600 via-amber-500 to-saffron-500 text-white shadow-md shadow-saffron-500/25 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-saffron-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 active:scale-95 shrink-0"
      >
        {/* Subtle pulsating glow */}
        <span className="absolute -inset-0.5 -z-10 rounded-full bg-gradient-to-r from-saffron-400 to-amber-300 opacity-60 blur-xs transition-opacity duration-300 group-hover:opacity-100 animate-pulse" />

        {/* Active online green status indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 border border-white" />
        </span>

        {open ? (
          <X className="h-4 w-4 sm:h-5 sm:w-5 text-white transition-transform" />
        ) : (
          <span className="text-base sm:text-lg md:text-xl drop-shadow-xs select-none">🪔</span>
        )}
      </button>

      {/* ─── Responsive Chat Modal / Drawer (Anchored below Navbar) ─── */}
      {open && (
        <div
          ref={panelRef}
          className={`fixed right-3 sm:right-5 md:right-8 z-50 flex h-[520px] max-h-[calc(100dvh-5rem)] sm:max-h-[calc(100dvh-6rem)] w-[calc(100vw-24px)] max-w-[380px] sm:max-w-[390px] flex-col overflow-hidden rounded-3xl border border-saffron-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 origin-top-right duration-200 text-left transition-all ${
            scrolled ? "top-16 sm:top-18 md:top-22" : "top-16 sm:top-18 md:top-28"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#3a0808] via-maroon-900 to-[#3a0808] px-4 py-3.5 text-white shadow-sm border-b border-saffron-500/20">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-amber-600 text-lg shadow-sm border border-white/20">
                🪔
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold tracking-tight text-white">
                    {guideConfig.badge}
                  </h3>
                  <span className="rounded-md bg-saffron-500/30 px-1.5 py-0.2 text-[9px] font-bold text-amber-200 border border-saffron-400/30">
                    Vedic AI
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-200/90 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{guideConfig.subBadge}</span>
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
            {guideConfig.suggestions.map((suggestion, i) => (
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
              <span>{guideConfig.humanHelp}</span>
            </span>
            <a
              href={whatsappSupportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:text-emerald-700"
            >
              <span>{guideConfig.chatWithHuman}</span>
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
                placeholder={guideConfig.placeholder}
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
    </div>
  );
}
