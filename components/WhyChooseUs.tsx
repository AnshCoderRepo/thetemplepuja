"use client";

import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { useI18n } from "@/components/I18nProvider";

export default function WhyChooseUs() {
  const { t } = useI18n();

  const whyUs = [
    { icon: "🕉️", title: t("whyUs.1.title"), description: t("whyUs.1.desc") },
    { icon: "💳", title: t("whyUs.2.title"), description: t("whyUs.2.desc") },
    { icon: "📱", title: t("whyUs.3.title"), description: t("whyUs.3.desc") },
    { icon: "📹", title: t("whyUs.4.title"), description: t("whyUs.4.desc") },
  ];

  return (
    <section id="why-us" className="section-pad relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="container-px relative">
        <SectionHeading
          eyebrow={t("whyUs.title")}
          title={`${t("whyUs.title")} ${t("whyUs.titleHighlight")}`}
          subtitle={t("whyUs.subtitle")}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyUs.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div className="group card-hover flex h-full items-start gap-4 rounded-2xl border border-saffron-100 bg-white/90 p-6 shadow-soft backdrop-blur">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-100 to-amber-50 text-2xl shadow-soft transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  {item.icon}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
