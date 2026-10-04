"use client";

import { MessageCircle } from "lucide-react";
import InteractiveImageAccordion, {
  type ImageAccordionItem,
} from "@/components/ui/interactive-image-accordion";
import { Reveal, SectionHeading } from "@/components/common";
import { faqs } from "@/lib/data";
import { useI18n } from "@/components/providers";
import { getWhatsAppUrl } from "@/lib/config";

// Atmospheric imagery for the FAQ tiles (verified Unsplash photos).
const faqImages = [
  "https://images.unsplash.com/photo-1519810755548-39cd217da494?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=900&auto=format&fit=crop",
];

export default function FAQ() {
  const { t } = useI18n();

  const accordionItems: ImageAccordionItem[] = faqs.map((faq, i) => ({
    id: i + 1,
    title: faq.q,
    answer: faq.a,
    imageUrl: faqImages[i % faqImages.length],
  }));

  return (
    <section id="faq" className="section-pad bg-cream relative overflow-hidden">
      <div className="container-px relative">
        <SectionHeading
          eyebrow={t("faq.title")}
          title={`${t("faq.title")} ${t("faq.titleHighlight")}`}
          subtitle={t("faq.subtitle")}
        />

        <div className="mt-8">
          <InteractiveImageAccordion items={accordionItems} />
        </div>

        {/* WhatsApp support card */}
        <Reveal delay={200}>
          <div className="mx-auto mt-12 max-w-xl text-center">
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
              <span className="text-3xl">💬</span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">
                Still have questions?
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                Talk directly with our temple coordinators on WhatsApp. We are here to assist you.
              </p>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-[#20bd5a] transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
