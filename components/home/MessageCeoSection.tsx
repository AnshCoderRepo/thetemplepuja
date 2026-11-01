"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers";

const CEO_CONTENT = {
  hi: {
    badge: "नेतृत्व से सीधा संवाद",
    title: "सीईओ (CEO) को अपना संदेश भेजें",
    subtitle:
      "कोई सुझाव, आध्यात्मिक अनुभव या प्रार्थना? हमारी संस्था के नेतृत्व से सीधा संपर्क करें। प्रत्येक संदेश को पूर्ण आदर व प्राथमिकता से पढ़ा जाता है।",
    singleBoxLabel: "सीईओ को अपना संदेश (A Message to CEO)",
    messagePlaceholder: "यहाँ अपना संदेश, सुझाव, अनुभव या प्रार्थना लिखें...",
    confidential: "पूर्णतः गोपनीय व सीधे नेतृत्व तक प्रेषित।",
    submit: "सीईओ को भेजें",
    submitting: "संदेश भेजा जा रहा है...",
    successTitle: "संदेश नेतृत्व तक पहुंच गया है",
    sendAnother: "एक और संदेश भेजें",
    chars: "अक्षर",
  },
  te: {
    badge: "నాయకత్వంతో ప్రత్యక్ష సంభాషణ",
    title: "మా సీఈఓ (CEO) కు మీ సందేశం పంపండి",
    subtitle:
      "ఏదైనా సలహా, ఆధ్యాత్మిక అనుభవం లేదా సహాయం కావాలా? మా నాయకత్వంతో నేరుగా సంప్రదించండి.",
    singleBoxLabel: "సీఈఓ కు మీ సందేశం (A Message to CEO)",
    messagePlaceholder: "మీ వివరణాత్మక సందేశాన్ని ఇక్కడ రాయండి...",
    confidential: "పూర్తిగా గోప్యంగా నేరుగా కార్యాలయానికి చేరుతుంది.",
    submit: "సీఈఓ కు పంపండి",
    submitting: "పంపుతున్నాము...",
    successTitle: "సందేశం విజయవంతంగా చేరింది",
    sendAnother: "మరొక సందేశం పంపండి",
    chars: "అక్షరాలు",
  },
  ta: {
    badge: "தலைமையுடன் நேரடி தொடர்பு",
    title: "எங்கள் சிஇஓ (CEO)-விற்கு உங்கள் செய்தி",
    subtitle:
      "ஏதேனும் கருத்துக்கள், ஆன்மீக அனுபவம் அல்லது உதவி தேவையா? எங்கள் நிர்வாக தலைமைக்கு நேரடியாக செய்தி அனுப்புங்கள்.",
    singleBoxLabel: "சிஇஓ-விற்கு உங்கள் செய்தி (A Message to CEO)",
    messagePlaceholder: "உங்கள் விரிவான செய்தியை இங்கே பதிவு செய்க...",
    confidential: "முழு இரகசியத்துடன் தலைமைக்கு நேரடியாக சமர்ப்பிக்கப்படுகிறது.",
    submit: "சிஇஓ-விற்கு அனுப்புக",
    submitting: "அனுப்பப்படுகிறது...",
    successTitle: "செய்தி நிர்வாகத்தை அடைந்தது",
    sendAnother: "மற்றொரு செய்தி அனுப்புக",
    chars: "எழுத்துக்கள்",
  },
  en: {
    badge: "Direct Leadership Communication",
    title: "A Message to Our CEO",
    subtitle:
      "Have a suggestion, spiritual experience to share, or need guidance? We maintain an open, transparent line directly to our executive leadership team. Every communication is read with earnest care.",
    singleBoxLabel: "A Message to Our CEO",
    messagePlaceholder: "Write your message, prayers, thoughts, or suggestions directly to our CEO...",
    confidential: "Confidential direct delivery to leadership desk.",
    submit: "Send Message to CEO",
    submitting: "Delivering...",
    successTitle: "Message Received by Our Leadership Desk",
    sendAnother: "Send Another Message",
    chars: "characters",
  },
};

export default function MessageCeoSection() {
  const { locale } = useI18n();
  const c = CEO_CONTENT[locale] || CEO_CONTENT.en;

  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot spam trap

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate single text box
    const trimmed = message.trim();
    if (!trimmed || trimmed.length < 5) {
      setErrorMsg("Please write a message with at least 5 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact/ceo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          name: "Devotee",
          contact: "Devotee (Direct Website Message)",
          subject: "A Message to Our CEO",
          honeypot: honeypot.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Unable to send message at this time.");
      }

      setSuccessMsg(
        data.message ||
          "Your message has been directly submitted to our CEO's desk. We deeply appreciate your devotion and valuable feedback!"
      );
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending message.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="message-ceo" className="section-pad relative overflow-hidden bg-gradient-to-b from-cream via-amber-50/40 to-cream">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-96 w-[600px] rounded-full bg-saffron-300/20 blur-3xl" />

      <div className="container-px relative mx-auto max-w-3xl">
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron-300/80 bg-saffron-50 px-4 py-1.5 text-xs font-bold text-saffron-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
            <span>{c.badge}</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
            {c.title}
          </h2>

          <p className="mx-auto max-w-xl text-xs sm:text-sm text-ink-soft leading-relaxed">
            {c.subtitle}
          </p>
        </div>

        {/* Message Form Card — Single Text Box */}
        <div className="rounded-3xl border border-saffron-200/90 bg-white/95 p-6 sm:p-8 md:p-10 shadow-card backdrop-blur-md">
          {successMsg ? (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-soft">
                <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                {c.successTitle}
              </h3>
              <p className="mx-auto max-w-md text-xs sm:text-sm text-ink-soft leading-relaxed">
                {successMsg}
              </p>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                className="mt-4 rounded-xl border border-saffron-300 bg-saffron-50 px-6 py-2.5 text-xs font-bold text-saffron-800 hover:bg-saffron-100 transition-all shadow-2xs cursor-pointer"
              >
                {c.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Anti-spam hidden honeypot */}
              <input
                type="text"
                name="favorite_deity_field"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Single Text Box: A Message to CEO */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="ceo-message" className="block text-sm font-bold text-ink">
                    {c.singleBoxLabel} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {message.length}/2,500 {c.chars}
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="ceo-message"
                    required
                    rows={6}
                    value={message}
                    maxLength={2500}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={c.messagePlaceholder}
                    className="w-full rounded-2xl border border-saffron-200/90 bg-amber-50/20 p-4 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs leading-relaxed transition-all"
                  />
                </div>
              </div>

              {/* Confidentiality badge & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{c.confidential}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 via-saffron-600 to-amber-600 hover:from-saffron-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold px-7 py-3 text-xs sm:text-sm shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? c.submitting : c.submit}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
