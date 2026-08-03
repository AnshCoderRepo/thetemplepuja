import { Star, Quote } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { testimonials } from "@/lib/data";

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-pad relative overflow-hidden bg-maroon-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #ffdca1 1px, transparent 0)",
          backgroundSize: "26px 26px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-saffron-500/15 blur-3xl" />

      <div className="container-px relative">
        <SectionHeading
          dark
          eyebrow="Testimonials"
          title="Devotee Reviews"
          subtitle="Hear from thousands of satisfied devotees across India"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 90}>
              <figure className="group relative flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-saffron-400/40 hover:bg-white/[0.1]">
                <Quote className="absolute right-5 top-5 h-8 w-8 text-saffron-400/20 transition-colors group-hover:text-saffron-400/40" />
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-saffron-100/85">
                  “{t.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white shadow`}
                  >
                    {t.avatar}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t.name}
                    </div>
                    <div className="text-xs text-saffron-100/60">
                      {t.location}
                    </div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
