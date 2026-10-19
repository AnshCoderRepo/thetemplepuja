"use client";

import { MessageCircle } from "lucide-react";
import InteractiveImageAccordion, {
  type ImageAccordionItem,
} from "@/components/ui/interactive-image-accordion";
import { Reveal, SectionHeading } from "@/components/common";
import { faqs, getLocalizedFaqQ, getLocalizedFaqA } from "@/lib/data";
import { useI18n } from "@/components/providers";

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
  const { t, locale } = useI18n();

  const accordionItems: ImageAccordionItem[] = faqs.map((faq, i) => ({
    id: i + 1,
    title: getLocalizedFaqQ(faq, locale),
    answer: getLocalizedFaqA(faq, locale),
    imageUrl: faqImages[i % faqImages.length],
  }));

  const supportContent = {
    hi: {
      title: "कोई अन्य प्रश्न है?",
      subtitle: "WhatsApp पर सीधे हमारे मंदिर समन्वयकों से बात करें। हम आपकी सेवा में सदैव तत्पर हैं।",
      btn: "व्हाट्सएप पर बात करें",
    },
    te: {
      title: "ఇంకా సందేహాలు ఉన్నాయా?",
      subtitle: "WhatsApp ద్వారా మా ప్రతినిధులతో నేరుగా మాట్లాడండి. మేము మీకు సహాయం చేయడానికి సిద్ధంగా ఉన్నాము.",
      btn: "మాతో చాట్ చేయండి",
    },
    ta: {
      title: "மேலும் கேள்விகள் உள்ளதா?",
      subtitle: "WhatsApp மூலம் எங்கள் கோயில் ஒருங்கிணைப்பாளர்களுடன் நேரடியாகப் பேசுங்கள். உதவ நாங்கள் தயாராக உள்ளோம்.",
      btn: "எங்களுடன் பேசுங்கள்",
    },
    en: {
      title: "Still have questions?",
      subtitle: "Talk directly with our temple coordinators on WhatsApp. We are here to assist you.",
      btn: "Chat with Us",
    },
  }[locale] || {
    title: "Still have questions?",
    subtitle: "Talk directly with our temple coordinators on WhatsApp. We are here to assist you.",
    btn: "Chat with Us",
  };

  return (
    <section id="faq" className="section-pad bg-cream relative overflow-hidden">
      <div className="container-px relative">
        <SectionHeading
          eyebrow={t("faq.title")}
          title={`${t("faq.title")} ${t("faq.titleHighlight")}`}
          subtitle={t("faq.subtitle")}
        />

        {/* Full-width Interactive Image Accordion */}
        <div className="mt-8 sm:mt-12 w-full">
          <InteractiveImageAccordion items={accordionItems} />
        </div>

        {/* Support card */}
        <Reveal delay={200}>
          <div className="mx-auto mt-12 max-w-xl text-center">
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
              <span className="text-3xl">💬</span>
              <h3 className="mt-3 font-display text-lg font-bold text-ink">
                {supportContent.title}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                {supportContent.subtitle}
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget"))}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-bold text-white shadow-soft hover:bg-[#20bd5a] transition-all cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                {supportContent.btn}
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
