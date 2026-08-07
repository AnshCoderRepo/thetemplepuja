"use client";

import { useState, type FormEvent } from "react";
import { Send, MessageCircle } from "lucide-react";
import Reveal from "./Reveal";
import { contactInfo } from "@/lib/data";

export default function Contact() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <section id="contact" className="section-pad relative bg-cream">
      <div className="container-px">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">
            <span className="text-saffron-500">🙏</span>
            Get in Touch
          </span>
          <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl md:text-5xl">
            We&apos;re here to guide you on your{" "}
            <span className="shimmer-text">spiritual journey</span>.
          </h2>
        </Reveal>

        {/* Contact cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((c, i) => (
            <Reveal key={c.label} delay={i * 70}>
              {c.href ? (
                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                  className="group card-hover flex h-full flex-col items-center rounded-3xl border border-saffron-100 bg-white p-6 text-center shadow-soft"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-saffron-100 to-amber-50 text-2xl shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    {c.icon}
                  </span>
                  <span className="mt-3 text-xs font-bold uppercase tracking-widest text-ink-soft/70">
                    {c.label}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-ink transition-colors group-hover:text-saffron-600">
                    {c.value}
                  </span>
                </a>
              ) : (
                <div className="group flex h-full flex-col items-center rounded-3xl border border-saffron-100 bg-white p-6 text-center shadow-soft">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-saffron-100 to-amber-50 text-2xl shadow-soft transition-transform duration-300 group-hover:scale-110">
                    {c.icon}
                  </span>
                  <span className="mt-3 text-xs font-bold uppercase tracking-widest text-ink-soft/70">
                    {c.label}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-ink">
                    {c.value}
                  </span>
                </div>
              )}
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-5">
          {/* WhatsApp CTA */}
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-white shadow-card">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
                💬
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold">
                Prefer instant replies?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
                Chat directly with our team on WhatsApp for quick answers,
                booking help, and event updates — available 24/7.
              </p>
              <a
                href="https://wa.me/918765301563"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-emerald-700 shadow transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>
          </Reveal>

          {/* Message form */}
          <Reveal delay={120} className="lg:col-span-3">
            <div className="rounded-3xl border border-saffron-100 bg-white p-8 shadow-card">
              {sent ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                  <span className="flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-50 text-4xl">
                    🙏
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-bold text-ink">
                    Message Sent!
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                    Thank you for reaching out. Our spiritual care team will
                    get back to you shortly. Om Shanti!
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="btn-outline mt-6 !py-2.5 text-xs"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                      >
                        Your Name *
                      </label>
                      <input
                        id="name"
                        required
                        placeholder="e.g. Aarav Sharma"
                        className="w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      placeholder="Tell us about the pooja you'd like to book or ask us anything…"
                      className="w-full resize-none rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200"
                    />
                  </div>
                  <button type="submit" className="btn-primary !w-full sm:!w-auto">
                    <Send className="h-4 w-4" />
                    Send us a Message
                  </button>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
