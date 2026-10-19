"use client";

import { SectionHeading } from "@/components/common";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import {
  getLocalizedTestimonialLocation,
  getLocalizedTestimonialName,
  getLocalizedTestimonialText,
  testimonials as defaultTestimonials,
} from "@/lib/data";
import { useCatalog } from "@/features/catalog";
import { useI18n } from "@/components/providers";

export default function Testimonials() {
  const { t, locale } = useI18n();
  const { testimonials: catalogTestimonials } = useCatalog();

  const activeTestimonials = (
    catalogTestimonials && catalogTestimonials.length > 0
      ? catalogTestimonials
      : defaultTestimonials
  ).filter((item) => item.active !== false);

  const deck =
    activeTestimonials.length % 2 === 0
      ? [...activeTestimonials, activeTestimonials[0]]
      : activeTestimonials;

  const items = deck.map((item, i) => ({
    id: `${item.name}-${i}`,
    quote: getLocalizedTestimonialText(item, locale),
    by: `${getLocalizedTestimonialName(item, locale)}, ${getLocalizedTestimonialLocation(item, locale)}`,
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
