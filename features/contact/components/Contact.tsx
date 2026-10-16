"use client";

import { useState, type FormEvent } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/common";
import { contactInfo } from "@/lib/data";
import { useI18n } from "@/components/providers";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const { t } = useI18n();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    // Deliver the enquiry straight to the team's WhatsApp
    const text =
      `🙏 New enquiry — ${SITE_CONFIG.brandName}\n\n` +
      `Name: ${name || "—"}\n` +
      `Message: ${message}`;
    window.open(
      getWhatsAppUrl(text),
      "_blank",
      "noopener,noreferrer"
    );
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <section id="contact" className="section-pad bg-cream">
      <div className="container-px">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Contact info */}
          <Reveal>
            <div>
              <span className="eyebrow">{t("contact.title")}</span>
              <h2 className="font-display mt-2 text-3xl font-bold text-ink sm:text-4xl">
                {t("contact.title")}{" "}
                <span className="text-saffron-500">{t("contact.titleHighlight")}</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
                {t("contact.subtitle")}
              </p>

              <div className="mt-8 space-y-4">
                {contactInfo.map((info) => (
                  <a
                    key={info.label}
                    href={info.href}
                    target={info.href.startsWith("http") ? "_blank" : undefined}
                    rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="card flex items-center justify-between p-4 group transition-all hover:border-saffron-300 hover:shadow-card cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl transition-transform group-hover:scale-110">
                        {info.icon}
                      </span>
                      <div>
                        <div className="text-xs text-ink-soft">{info.label}</div>
                        <div className="text-sm font-bold text-ink group-hover:text-saffron-600 transition-colors">
                          {info.value}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-saffron-600 group-hover:translate-x-1 transition-transform">
                      Connect &rarr;
                    </span>
                  </a>
                ))}

                <div className="card flex items-start gap-4 p-4">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="text-xs text-ink-soft">Registered Office</div>
                    <div className="text-sm font-semibold text-ink">
                      Varanasi / Haridwar Sacred Teerth Kshetra, India
                    </div>
                  </div>
                </div>

                {/* Social Community Channels Card */}
                <div className="card p-4 space-y-3 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-saffron-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink uppercase tracking-wider">
                      Sacred Community Channels
                    </span>
                    <span className="text-[11px] text-saffron-600 font-semibold">
                      Daily Darshan &amp; Muhurats
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <a
                      href={SITE_CONFIG.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-pink-200/80 hover:border-pink-500 hover:shadow-xs transition-all"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">📷</span>
                      <span className="text-xs font-bold text-ink group-hover:text-pink-600 mt-1">Instagram</span>
                      <span className="text-[10px] text-ink-soft">@templepujasewa</span>
                    </a>
                    <a
                      href={SITE_CONFIG.social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-blue-200/80 hover:border-blue-500 hover:shadow-xs transition-all"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">👍</span>
                      <span className="text-xs font-bold text-ink group-hover:text-blue-600 mt-1">Facebook</span>
                      <span className="text-[10px] text-ink-soft">Share &amp; Connect</span>
                    </a>
                    <a
                      href={SITE_CONFIG.social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center p-2.5 rounded-xl bg-white border border-red-200/80 hover:border-red-500 hover:shadow-xs transition-all"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">▶️</span>
                      <span className="text-xs font-bold text-ink group-hover:text-red-600 mt-1">YouTube</span>
                      <span className="text-[10px] text-ink-soft">@TEMPLEPUJASEWA</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Message form */}
          <Reveal delay={150}>
            <div className="card p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-ink">
                Send Us a Sacred Enquiry
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                Fill the form below to chat directly with our temple coordinators.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-ink">
                    {t("contact.form.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="input-field mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-ink">
                    {t("contact.form.message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    placeholder="Tell us about the pooja you want to organize..."
                    className="input-field mt-1"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Chat on WhatsApp Now
                </button>

                {sent && (
                  <p className="text-center text-xs font-semibold text-emerald-600">
                    ✓ Opening WhatsApp with your enquiry...
                  </p>
                )}
              </form>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
