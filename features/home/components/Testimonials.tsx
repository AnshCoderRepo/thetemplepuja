"use client";

import { SectionHeading } from "@/components/common";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { testimonials } from "@/lib/data";
import { useI18n } from "@/components/providers";

export default function Testimonials() {
  const { t } = useI18n();

  const deck = testimonials.length % 2 === 0
    ? [...testimonials, testimonials[0]]
    : testimonials;
  const items = deck.map((item, i) => ({
    id: `${item.name}-${i}`,
    quote: item.text,
    by: `${item.name}, ${item.location}`,
    avatar: item.avatar,
    avatarColor: item.color,
  }));

  return (
    <section
      id="testimonials"
      className="section-pad bg-gradient-to-b from-cream via-white to-cream overflow-hidden"
    >
      <div className="container-px">
        <SectionHeading
          eyebrow={t("testimonials.title")}
          title={`${t("testimonials.title")} ${t("testimonials.titleHighlight")}`}
          subtitle={t("testimonials.subtitle")}
        />

        <div className="mt-8">
          <StaggerTestimonials items={items} />
        </div>
      </div>
    </section>
  );
}
