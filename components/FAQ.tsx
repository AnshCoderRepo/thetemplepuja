"use client";

import { MessageCircle } from "lucide-react";
import InteractiveImageAccordion, {
  type ImageAccordionItem,
} from "./ui/interactive-image-accordion";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { faqs } from "@/lib/data";

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
  const items: ImageAccordionItem[] = faqs.map((faq, i) => ({
    id: i + 1,
    title: faq.q,
    answer: faq.a,
    imageUrl: faqImages[i % faqImages.length],
  }));

  return (
    <section id="faq" className="section-pad relative bg-saffron-50">
      <div className="container-px">
        <SectionHeading
          eyebrow="Got Questions?"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about The Temple Puja"
        />

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_1.3fr]">
          {/* Left: intro + contact CTA */}
          <Reveal>
            <div className="flex h-full flex-col justify-center rounded-3xl bg-gradient-to-br from-saffron-500 to-maroon-700 p-8 text-white shadow-card lg:sticky lg:top-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                🪔
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold">
                Still have a question?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/85">
                Our spiritual care team is available 24/7 on WhatsApp — ask
                anything about poojas, muhurats, pandits or your booking.
              </p>
              <a
                href="https://wa.me/918765301563"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-maroon-700 shadow transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
              <p className="mt-4 text-xs text-cream/60">
                📞 +91 87653 01563 · replies within minutes
              </p>
            </div>
          </Reveal>

          {/* Right: image accordion of questions */}
          <Reveal delay={100}>
            <InteractiveImageAccordion items={items} defaultActive={0} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
