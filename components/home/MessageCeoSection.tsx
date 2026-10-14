"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Sparkles, Mail, User, Phone, ShieldCheck } from "lucide-react";

export default function MessageCeoSection() {
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
            <span>Direct Leadership Communication</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
            A Message to Our CEO
          </h2>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-ink-soft leading-relaxed">
            Have a suggestion, experience to share, or need assistance? We maintain an open, transparent line directly to our executive leadership team. Every communication is read with earnest care.
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
                Message Received by Our Leadership Desk
              </h3>
              <p className="mx-auto max-w-md text-xs sm:text-sm text-ink-soft leading-relaxed">
                {successMsg}
              </p>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                className="mt-4 rounded-xl border border-saffron-300 bg-saffron-50 px-6 py-2.5 text-xs font-bold text-saffron-800 hover:bg-saffron-100 transition-all shadow-2xs"
              >
                Send Another Message
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
                    Your Name <span className="text-red-500">*</span>
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
                      placeholder="e.g. Ramesh Chandra Sharma"
                      className="w-full rounded-2xl border border-saffron-200 bg-white py-3 pl-10 pr-4 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Devotee Contact (Phone or Email) */}
                <div>
                  <label htmlFor="ceo-contact" className="block text-xs font-bold text-ink mb-1.5">
                    Phone Number or Email <span className="text-red-500">*</span>
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
                      placeholder="e.g. +91 98765 43210 or yourname@gmail.com"
                      className="w-full rounded-2xl border border-saffron-200 bg-white py-3 pl-10 pr-4 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="ceo-subject" className="block text-xs font-bold text-ink mb-1.5">
                  Subject / Topic
                </label>
                <input
                  id="ceo-subject"
                  type="text"
                  value={subject}
                  maxLength={150}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Suggestion regarding Temple Darshan / Pooja Inquiry / Feedback"
                  className="w-full rounded-2xl border border-saffron-200 bg-white py-3 px-4 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="ceo-message" className="block text-xs font-bold text-ink">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {message.length}/2,500 characters
                  </span>
                </div>
                <textarea
                  id="ceo-message"
                  required
                  rows={4}
                  value={message}
                  maxLength={2500}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your detailed message, thoughts, or suggestions directly to our CEO..."
                  className="w-full rounded-2xl border border-saffron-200 bg-white p-3.5 text-xs text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-300/50 shadow-2xs"
                />
              </div>

              {/* Confidentiality & Submit */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Confidential direct delivery to leadership desk.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 via-saffron-600 to-amber-600 hover:from-saffron-600 hover:to-amber-700 disabled:opacity-60 text-white font-bold px-7 py-3.5 text-sm shadow-soft transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? "Delivering..." : "Submit to CEO"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
