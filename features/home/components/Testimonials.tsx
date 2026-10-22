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

  const candidateList =
    catalogTestimonials && catalogTestimonials.length > 0
      ? catalogTestimonials
      : defaultTestimonials;

  // Filter to active and valid testimonials with a name
  let activeTestimonials = (candidateList || []).filter(
    (item): item is typeof defaultTestimonials[number] => Boolean(item && item.name && item.active !== false)
  );

  // If dynamic catalog has no active testimonials, fallback to default active testimonials
  if (activeTestimonials.length === 0) {
    activeTestimonials = (defaultTestimonials || []).filter(
      (item): item is typeof defaultTestimonials[number] => Boolean(item && item.name && item.active !== false)
    );
  }

  // If still empty, safely do not render the section
  if (activeTestimonials.length === 0) {
    return null;
  }

  // StaggerTestimonials centers around an odd-count deck. Only duplicate if non-empty and even.
  const deck =
    activeTestimonials.length % 2 === 0
      ? [...activeTestimonials, activeTestimonials[0]]
      : activeTestimonials;

  const items = deck
    .filter((item): item is typeof defaultTestimonials[number] => Boolean(item && item.name))
    .map((item, i) => ({
      id: `${item.id || item.name}-${i}`,
      quote: getLocalizedTestimonialText(item, locale),
      by: `${getLocalizedTestimonialName(item, locale)}, ${getLocalizedTestimonialLocation(item, locale)}`,
      avatar: item.avatar || (item.name ? item.name.slice(0, 2).toUpperCase() : "🪔"),
      avatarColor: item.color || "from-rose-400 to-pink-600",
    }));

  if (items.length === 0) {
    return null;
  }

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
