"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Heart,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { useI18n } from "@/components/providers";

const FEEDBACK_CONTENT = {
  hi: {
    badge: "आपकी आस्था, हमारा सौभाग्य",
    title: "अपना पावन अनुभव व सुझाव साझा करें",
    subtitle:
      "पूजा अनुष्ठान, पंडितजी की सेवा या दर्शन से जुड़ा अपना आध्यात्मिक अनुभव हमारे साथ साझा करें। आपकी समीक्षा अन्य भक्तों को प्रेरित करती है।",
    ratingLabel: "आपकी रेटिंग (Rating)",
    nameLabel: "आपका पूरा नाम *",
    namePlaceholder: "उदा. राहुल शर्मा",
    phoneLabel: "मोबाइल नंबर (वैकल्पिक)",
    phonePlaceholder: "उदा. 9876543210",
    emailLabel: "ईमेल पता (वैकल्पिक)",
    emailPlaceholder: "उदा. rahul@example.com",
    messageLabel: "आपका अनुभव या सुझाव *",
    messagePlaceholder: "पूजा सेवा, संकल्प या प्रसाद वितरण को लेकर अपना विस्तृत अनुभव यहाँ लिखें...",
    submit: "फीडबैक सबमिट करें",
    submitting: "सबमिट हो रहा है...",
    successTitle: "आपका फीडबैक सफलतापूर्वक प्राप्त हुआ!",
    successDesc: "हम आपके पावन अनुभव की सराहना करते हैं। टीम द्वारा समीक्षा के पश्चात यह वेबसाइट पर प्रदर्शित होगा।",
    sendAnother: "एक और अनुभव साझा करें",
    chars: "अक्षर",
  },
  te: {
    badge: "మీ భక్తి, మా అదృష్టం",
    title: "మీ ఆధ్యాత్మిక అనుభవాన్ని పంచుకోండి",
    subtitle:
      "పూజా సేవలు, పండితుల విధి లేదా ప్రసాదం గురించి మీ అనుభవాన్ని మాతో పంచుకోండి.",
    ratingLabel: "మీ రేటింగ్ (Rating)",
    nameLabel: "మీ పూర్తి పేరు *",
    namePlaceholder: "ఉదా. రమేష్ వర్మ",
    phoneLabel: "మొబైల్ నంబర్ (ఐచ్ఛికం)",
    phonePlaceholder: "ఉదా. 9876543210",
    emailLabel: "ఈమెయిల్ చిరునామా (ఐచ్ఛికం)",
    emailPlaceholder: "ఉదా. ramesh@example.com",
    messageLabel: "మీ అనుభవం లేదా సలహా *",
    messagePlaceholder: "మీ పూజా అనుభవాన్ని ఇక్కడ వివరించండి...",
    submit: "ఫీడ్‌బ్యాక్ సమర్పించండి",
    submitting: "సమర్పిస్తున్నాము...",
    successTitle: "ధన్యవాదాలు! మీ సమీక్ష అందింది",
    successDesc: "మా బృందం సమీక్షించిన తర్వాత ఇది వెబ్‌సైట్‌లో ప్రదర్శించబడుతుంది.",
    sendAnother: "మరొక అనుభవాన్ని పంచుకోండి",
    chars: "అక్షరాలు",
  },
  ta: {
    badge: "உங்கள் பக்தி, எங்கள் பாக்கியம்",
    title: "உங்கள் ஆன்மீக அனுபவத்தை பகிரவும்",
    subtitle:
      "பூஜை சேவைகள், சங்கல்பம் அல்லது பிரசாதம் பற்றிய உங்கள் அனுபவத்தை எங்களுடன் பகிர்ந்து கொள்ளுங்கள்.",
    ratingLabel: "உங்கள் மதிப்பீடு (Rating)",
    nameLabel: "முழு பெயர் *",
    namePlaceholder: "உதா. கார்த்திக்",
    phoneLabel: "மொபைல் எண் (விருப்பத்தேர்வு)",
    phonePlaceholder: "உதா. 9876543210",
    emailLabel: "மின்னஞ்சல் (விருப்பத்தேர்வு)",
    emailPlaceholder: "உதா. karthik@example.com",
    messageLabel: "உங்கள் கருத்து அல்லது அனுபவம் *",
    messagePlaceholder: "உங்கள் அனுபவத்தை இங்கே பகிருங்கள்...",
    submit: "கருத்தை சமர்ப்பிக்கவும்",
    submitting: "சமர்ப்பிக்கப்படுகிறது...",
    successTitle: "உங்கள் கருத்து பெறப்பட்டது!",
    successDesc: "நிர்வாகக் குழுவின் மதிப்பாய்வுக்குப் பிறகு இது தளத்தில் வெளியிடப்படும்.",
    sendAnother: "மற்றொரு கருத்து பகிரவும்",
    chars: "எழுத்துக்கள்",
  },
  en: {
    badge: "Devotee Experiences & Reviews",
    title: "Share Your Sacred Feedback",
    subtitle:
      "Have you performed a puja, hawan, or online ritual through TemplePujaSewa? Share your experience, divine blessings, and suggestions with our temple community.",
    ratingLabel: "Your Rating",
    nameLabel: "Full Name *",
    namePlaceholder: "e.g. Rajesh Kumar",
    phoneLabel: "Mobile Number (Optional)",
    phonePlaceholder: "e.g. 9876543210",
    emailLabel: "Email Address (Optional)",
    emailPlaceholder: "e.g. rajesh@example.com",
    messageLabel: "Your Experience or Feedback *",
    messagePlaceholder: "Share how the Vedic ritual, panditji chanting, or prasad delivery made you feel...",
    submit: "Submit Feedback",
    submitting: "Submitting...",
    successTitle: "Thank You for Your Feedback!",
    successDesc: "Your review has been successfully submitted and will appear in our Devotee Reviews section upon review by our team.",
    sendAnother: "Share Another Review",
    chars: "characters",
  },
};

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent Experience",
};

export default function ShareFeedbackSection() {
  const { locale } = useI18n();
  const c = FEEDBACK_CONTENT[locale] || FEEDBACK_CONTENT.en;

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Please enter your name (at least 2 characters).");
      return;
    }

    if (!message.trim() || message.trim().length < 5) {
      setErrorMsg("Please write your feedback message (minimum 5 characters).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
          rating,
          honeypot: honeypot.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to submit feedback at this time.");
      }

      setSuccessMsg(data.message || c.successDesc);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setRating(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting feedback.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const activeRatingDisplay = hoverRating || rating;

  return (
    <section
      id="feedback"
      className="section-pad relative overflow-hidden bg-gradient-to-b from-cream via-amber-50/50 to-cream"
    >
      {/* Anchor for backward compatibility with existing links */}
      <span id="message-ceo" className="absolute -top-24 pointer-events-none" />

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

        {/* Feedback Submission Card */}
        <div className="rounded-3xl border border-saffron-200/90 bg-white/95 p-6 sm:p-8 md:p-10 shadow-card backdrop-blur-md">
          {successMsg ? (
            <div className="py-8 text-center space-y-4 animate-fadeIn">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-soft">
                <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-ink">
                {c.successTitle}
              </h3>
              <p className="mx-auto max-w-md text-xs sm:text-sm text-ink-soft leading-relaxed">
                {successMsg}
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => setSuccessMsg(null)}
                  className="inline-flex items-center gap-2 rounded-xl border border-saffron-300 bg-saffron-50/70 px-5 py-2.5 text-xs font-bold text-saffron-800 hover:bg-saffron-100 transition-colors shadow-2xs"
                >
                  <Heart className="h-4 w-4 text-saffron-600" />
                  <span>{c.sendAnother}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Star Rating Selector */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  {c.ratingLabel}
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <div
                    className="flex items-center gap-1 bg-amber-50/70 border border-amber-200 px-3 py-1.5 rounded-xl"
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 text-amber-400 hover:text-amber-500 hover:scale-110 transition-transform focus:outline-none"
                        aria-label={`${star} Stars`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= activeRatingDisplay
                              ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                              : "text-slate-300 stroke-1"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-amber-900 bg-amber-100/60 px-2.5 py-1 rounded-lg">
                    {RATING_DESCRIPTIONS[activeRatingDisplay] || `${rating} Stars`}
                  </span>
                </div>
              </div>

              {/* Devotee Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="devotee-feedback-name" className="block text-xs font-bold text-ink mb-1.5">
                    {c.nameLabel}
                  </label>
                  <input
                    id="devotee-feedback-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={c.namePlaceholder}
                    maxLength={100}
                    required
                    className="w-full rounded-2xl border border-saffron-200 bg-cream/30 px-4 py-2.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="devotee-feedback-phone" className="block text-xs font-bold text-ink mb-1.5">
                    {c.phoneLabel}
                  </label>
                  <input
                    id="devotee-feedback-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={c.phonePlaceholder}
                    maxLength={20}
                    className="w-full rounded-2xl border border-saffron-200 bg-cream/30 px-4 py-2.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="devotee-feedback-email" className="block text-xs font-bold text-ink mb-1.5">
                  {c.emailLabel}
                </label>
                <input
                  id="devotee-feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={c.emailPlaceholder}
                  maxLength={120}
                  className="w-full rounded-2xl border border-saffron-200 bg-cream/30 px-4 py-2.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all font-medium"
                />
              </div>

              {/* Feedback Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="devotee-feedback-message" className="block text-xs font-bold text-ink">
                    {c.messageLabel}
                  </label>
                  <span className="text-[11px] text-ink-soft">
                    {message.length} / 3000 {c.chars}
                  </span>
                </div>

                <textarea
                  id="devotee-feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={c.messagePlaceholder}
                  rows={4}
                  maxLength={3000}
                  required
                  className="w-full rounded-2xl border border-saffron-200 bg-cream/30 p-4 text-xs sm:text-sm text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-100 transition-all font-medium leading-relaxed resize-y"
                />
              </div>

              {/* Bot Honeypot */}
              <input
                type="text"
                name="user_feedback_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Error Notice */}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50/80 p-3.5 text-xs font-medium text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !message.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-saffron-500/25 hover:from-saffron-600 hover:to-saffron-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{c.submitting}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{c.submit}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

