import Link from "next/link";
import { CalendarDays, Clock, Users, Video } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { upcomingEvents } from "@/lib/data";

export default function UpcomingEvents() {
  return (
    <section id="events" className="section-pad relative bg-saffron-50">
      <div className="absolute inset-0 bg-mandala-fade" />
      <div className="container-px relative">
        <SectionHeading
          eyebrow="Live & Upcoming"
          title="Sacred Events & Live Poojas"
          subtitle="Book your spot in scheduled live group rituals before they fill up!"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event, i) => (
            <Reveal key={event.title} delay={i * 80}>
              <article className="group card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft">
                {/* Card banner */}
                <div
                  className={`relative h-36 bg-gradient-to-br ${event.gradient}`}
                >
                  <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />
                  <span className="absolute right-4 top-4 text-4xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
                    {event.emoji}
                  </span>
                  {event.live && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-maroon-700 shadow">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      Live
                    </span>
                  )}
                  <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs font-semibold text-white">
                    <CalendarDays className="h-4 w-4" />
                    {event.date} · {event.time}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {event.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-soft/70">
                    <Users className="h-3.5 w-3.5" />
                    {event.seats}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="font-display text-2xl font-bold text-saffron-600">
                      {event.price}
                    </span>
                    <Link
                      href={`/book/${event.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-saffron-100 px-4 py-2 text-xs font-semibold text-saffron-700 transition-all hover:bg-gradient-to-r hover:from-saffron-500 hover:to-saffron-600 hover:text-white"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Book Slot
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <Link href="/book" className="btn-outline">
            <Video className="h-4 w-4" />
            View All Live Events
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
