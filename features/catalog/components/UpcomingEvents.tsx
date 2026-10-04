"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX2, Clock, Video } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/common";
import { useI18n } from "@/components/providers";
import {
  getUpcomingEvents,
  isEventFull,
  poojasAsEvents,
  seatsLabel,
  getLocalizedPoojaTitle,
} from "@/lib/data";
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";
import { useCatalog } from "../hooks/useCatalog";

export default function UpcomingEvents() {
  const [today, setToday] = useState<Date | null>(null);
  const { poojas: catalogPoojas, loaded } = useCatalog();
  const { locale } = useI18n();

  useEffect(() => {
    setToday(new Date());
  }, []);

  const poojaEvents = poojasAsEvents(catalogPoojas);
  const events = today
    ? getUpcomingEvents(today, poojaEvents.length > 0 ? poojaEvents : undefined)
    : [];

  const slides: CoverflowSlide[] = events.map((event) => {
    const matchedPooja = catalogPoojas.find((p) => p.slug === event.slug);
    const localizedTitle = matchedPooja
      ? getLocalizedPoojaTitle(matchedPooja, locale)
      : event.title;
    const full = isEventFull(event);

    return {
      src: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=900&auto=format&fit=crop",
      alt: localizedTitle,
      emoji: event.emoji,
      gradient: event.gradient,
      live: event.live,
      dateLabel: `${event.date} • ${event.time}`,
      title: localizedTitle,
      subtitle: `${event.date} • ${event.time}`,
      meta: [
        { label: "Status", value: full ? "Full" : seatsLabel(event) },
        { label: "Dakshina", value: event.price },
      ],
    };
  });

  if (!loaded || !today || events.length === 0) {
    return (
      <section id="events" className="section-pad relative overflow-hidden bg-cream">
        <div className="container-px">
          <SectionHeading
            eyebrow="AUSPICIOUS EVENTS"
            title="Upcoming Sacred Rituals"
            subtitle="Join live online poojas on upcoming auspicious muhurats."
          />
          <div className="rounded-3xl border border-saffron-100 bg-white p-12 text-center shadow-card">
            <CalendarX2 className="mx-auto h-12 w-12 text-saffron-300" />
            <h3 className="mt-4 font-display text-lg font-bold text-ink">
              No Upcoming Events Right Now
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              Check back soon for new auspicious dates and live temple events.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="section-pad relative overflow-hidden bg-cream">
      <div className="container-px">
        <SectionHeading
          eyebrow="AUSPICIOUS EVENTS"
          title="Upcoming Sacred Rituals"
          subtitle="Join live online poojas on upcoming auspicious muhurats."
        />

        <div className="mt-8">
          <CoverflowCarousel slides={slides} />
        </div>
      </div>
    </section>
  );
}
