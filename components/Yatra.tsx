import { MapPin, Clock3, Star, Check } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { yatras } from "@/lib/data";

export default function Yatra() {
  return (
    <section id="yatra" className="section-pad relative overflow-hidden bg-maroon-900">
      {/* Decorative pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffdca1 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-saffron-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-maroon-600/60 blur-3xl" />

      <div className="container-px relative">
        <SectionHeading
          dark
          eyebrow="Sacred Tirtha Yatra"
          title="The Temple Puja Tours"
          subtitle="Dharmic destinations guided by expert pandits — complete pilgrimage arrangements"
        />

        <div className="grid gap-6 md:grid-cols-3">
          {yatras.map((yatra, i) => (
            <Reveal key={yatra.title} delay={i * 100}>
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                {/* Banner */}
                <div className={`relative h-44 bg-gradient-to-br ${yatra.gradient}`}>
                  <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-0" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl drop-shadow-xl transition-transform duration-500 group-hover:scale-110">
                    {yatra.emoji}
                  </span>
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-maroon-700 shadow">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {yatra.rating}
                  </div>
                  <div className="absolute bottom-3 right-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink shadow">
                    {yatra.price}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {yatra.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-saffron-600" />
                      {yatra.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5 text-saffron-600" />
                      {yatra.duration}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {yatra.description}
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {yatra.highlights.map((h) => (
                      <li
                        key={h}
                        className="flex items-center gap-2 text-xs font-medium text-ink"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </span>
                        {h}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className="btn-outline mt-6 !w-full !py-3 text-xs"
                  >
                    Book This Yatra
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
