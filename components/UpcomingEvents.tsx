"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarX2, Clock, Video } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { getUpcomingEvents } from "@/lib/data";
import {
  CoverflowCarousel,
  type CoverflowSlide,
} from "@/components/ui/coverflow-carousel";


export default function UpcomingEvents() {
  const [today, setToday] = useState<Date | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Compute "today" only after mount so server and client renders match.
  useEffect(() => {
    setToday(new Date());
  }, []);

  const events = today ? getUpcomingEvents(today) : [];

  const slides: CoverflowSlide[] = events.map((event) => ({
    // Emoji + gradient tiles, like the original event cards.
    alt: event.title,
    emoji: event.emoji,
    gradient: event.gradient,
    live: event.live,
    // Muhurat stamp on the tile; caption stays title + meta only.
    dateLabel: `${event.date} · ${event.time}`,
    title: event.title,
    meta: [
      { label: "Seats", value: event.seats },
      { label: "Price", value: event.price },
      { label: "Status", value: event.live ? "🔴 Live" : "Upcoming" },
    ],
  }));

  const active = events[activeIndex] ?? events[0];

  return (
    <section id="events" className="section-pad relative bg-saffron-50">
      <div className="absolute inset-0 bg-mandala-fade" />
      <div className="container-px relative">
        <SectionHeading
          eyebrow="Live & Upcoming"
          title="Sacred Events & Live Poojas"
          subtitle="Swipe through our scheduled live group rituals and book your spot before they fill up!"
        />

        {today === null ? (
          /* Skeleton while the date is being computed post-mount —
             keeps SSR HTML free of a misleading empty state. */
          <div
            className="mx-auto flex h-[340px] max-w-2xl items-center justify-center"
            aria-hidden
          >
            <div className="h-24 w-24 animate-pulse rounded-full bg-saffron-100" />
          </div>
        ) : events.length === 0 ? (
          <Reveal>
            <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-10 text-center shadow-soft">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50 text-3xl">
                <CalendarX2 className="h-8 w-8 text-saffron-400" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-ink">
                No Upcoming Events Right Now
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                New live poojas are added every week. Meanwhile, browse our full
                catalogue and book at your own muhurat.
              </p>
              <Link href="/book" className="btn-primary mt-6">
                Browse All Poojas
              </Link>
            </div>
          </Reveal>
        ) : (
          <Reveal>
            <CoverflowCarousel
              slides={slides}
              loop
              showCaption
              showPagination
              label="Upcoming live poojas"
              onSlideChange={setActiveIndex}
              className="mx-auto max-w-5xl"
            />

            {/* Book Slot for whichever pooja is in the centre of the rake */}
            {active && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <Link
                  href={`/book/${active.slug}?date=${active.dateISO}&time=${encodeURIComponent(active.time)}`}
                  className="btn-primary"
                >
                  <Clock className="h-4 w-4" />
                  Book Slot — {active.title}
                </Link>
                <p className="text-xs font-medium text-ink-soft/70">
                  Drag or use the arrows to pick your pooja · {events.length}{" "}
                  live events
                </p>
              </div>
            )}
          </Reveal>
        )}

        {today !== null && events.length > 0 && (
          <Reveal className="mt-10 text-center">
            <Link href="/book" className="btn-outline">
              <Video className="h-4 w-4" />
              View All Live Events
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
