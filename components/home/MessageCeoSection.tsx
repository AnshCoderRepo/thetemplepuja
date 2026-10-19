"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, Mail, User, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/providers";

const CEO_CONTENT = {
  hi: {
    badge: "नेतृत्व से सीधा संवाद",
    title: "सीईओ (CEO) को अपना संदेश भेजें",
    subtitle:
      "कोई सुझाव, आध्यात्मिक अनुभव या सहायता? हमारी संस्था के नेतृत्व से सीधा संपर्क करें। प्रत्येक संदेश को पूर्ण आदर व प्राथमिकता से पढ़ा जाता है।",
    nameLabel: "आपका नाम",
    namePlaceholder: "उदा. रमेश शर्मा",
    contactLabel: "फ़ोन नंबर या ईमेल",
    contactPlaceholder: "उदा. +91 98765 43210 या आपका_ईमेल@gmail.com",
    subjectLabel: "विषय / प्रसंग",
    subjectPlaceholder: "उदा. मंदिर दर्शन सुझाव / पूजा पूछताछ / विचार",
    messageLabel: "आपका संदेश",
    messagePlaceholder: "सीईओ को अपना विस्तृत संदेश, सुझाव या अनुभव लिखें...",
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
    nameLabel: "మీ పేరు",
    namePlaceholder: "ఉదా. రమేష్ శర్మ",
    contactLabel: "ఫోన్ నంబర్ లేదా ఈమెయిల్",
    contactPlaceholder: "ఉదా. +91 98765 43210 లేదా email@gmail.com",
    subjectLabel: "విషయం",
    subjectPlaceholder: "ఉదా. దర్శన సలహా / పూజా విచారణ / అభిప్రాయం",
    messageLabel: "మీ సందేశం",
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
    nameLabel: "உங்கள் பெயர்",
    namePlaceholder: "उदा. ரமேஷ் சர்மா",
    contactLabel: "தொலைபேசி எண் அல்லது மின்னஞ்சல்",
    contactPlaceholder: "उदा. +91 98765 43210 அல்லது மின்னஞ்சல்",
    subjectLabel: "பொருள் / தலைப்பு",
    subjectPlaceholder: "उदा. தர்சன கருத்துக்கள் / பூஜை விசாரணை",
    messageLabel: "உங்கள் செய்தி",
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
      "Have a suggestion, experience to share, or need assistance? We maintain an open, transparent line directly to our executive leadership team. Every communication is read with earnest care.",
    nameLabel: "Your Name",
    namePlaceholder: "e.g. Ramesh Chandra Sharma",
    contactLabel: "Phone Number or Email",
    contactPlaceholder: "e.g. +91 98765 43210 or yourname@gmail.com",
    subjectLabel: "Subject / Topic",
    subjectPlaceholder: "e.g. Suggestion regarding Temple Darshan / Pooja Inquiry / Feedback",
    messageLabel: "Your Message",
    messagePlaceholder: "Write your detailed message, thoughts, or suggestions directly to our CEO...",
    confidential: "Confidential direct delivery to leadership desk.",
    submit: "Submit to CEO",
    submitting: "Delivering...",
    successTitle: "Message Received by Our Leadership Desk",
    sendAnother: "Send Another Message",
    chars: "characters",
  },
};

export default function MessageCeoSection() {
  const { locale } = useI18n();
  const c = CEO_CONTENT[locale] || CEO_CONTENT.en;

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot spam trap

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic client validation
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Please enter your full name.");
      return;
    }
    if (!contact.trim() || contact.trim().length < 5) {
      setErrorMsg("Please enter a valid mobile number or email address.");
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMsg("Please write a message with at least 10 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact/ceo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          subject: subject.trim(),
          message: message.trim(),
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
      setName("");
      setContact("");
      setSubject("");
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

      <div className="container-px relative mx-auto max-w-4xl">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-saffron-300/80 bg-saffron-50 px-4 py-1.5 text-xs font-bold text-saffron-800 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-saffron-600" />
            <span>{c.badge}</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
            {c.title}
          </h2>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-ink-soft leading-relaxed">
            {c.subtitle}
          </p>
        </div>

        {/* Message Form Card */}
        <div className="rounded-3xl border border-saffron-200/90 bg-white/95 p-6 sm:p-10 shadow-card backdrop-blur-md">
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
                className="mt-4 rounded-xl border border-saffron-300 bg-saffron-50 px-6 py-2.5 text-xs font-bold text-saffron-800 hover:bg-saffron-100 transition-all shadow-2xs"
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

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Devotee Name */}
                <div>
                  <label htmlFor="ceo-name" className="block text-xs font-bold text-ink mb-1.5">
                    {c.nameLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="ceo-name"
                      type="text"
                      required
                      value={name}
                      maxLength={100}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={c.namePlaceholder}
                      className="w-full rounded-2xl border border-saffron-200 bg-white py-3 pl-10 pr-4 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Devotee Contact (Phone or Email) */}
                <div>
                  <label htmlFor="ceo-contact" className="block text-xs font-bold text-ink mb-1.5">
                    {c.contactLabel} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="ceo-contact"
                      type="text"
                      required
                      value={contact}
                      maxLength={120}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder={c.contactPlaceholder}
                      className="w-full rounded-2xl border border-saffron-200 bg-white py-3 pl-10 pr-4 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="ceo-subject" className="block text-xs font-bold text-ink mb-1.5">
                  {c.subjectLabel}
                </label>
                <input
                  id="ceo-subject"
                  type="text"
                  value={subject}
                  maxLength={150}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={c.subjectPlaceholder}
                  className="w-full rounded-2xl border border-saffron-200 bg-white py-3 px-4 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="ceo-message" className="block text-xs font-bold text-ink">
                    {c.messageLabel} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {message.length}/2,500 {c.chars}
                  </span>
                </div>
                <textarea
                  id="ceo-message"
                  required
                  rows={4}
                  value={message}
                  maxLength={2500}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={c.messagePlaceholder}
                  className="w-full rounded-2xl border border-saffron-200 bg-white p-3.5 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                />
              </div>

              {/* Confidentiality & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{c.confidential}</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 via-saffron-600 to-amber-600 hover:from-saffron-600 hover:to-amber-700 disabled:opacity-60 text-white font-bold px-7 py-3.5 text-sm shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98]"
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
