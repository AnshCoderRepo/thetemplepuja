import Link from "next/link";
import { Check } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { services } from "@/lib/data";

export default function Services() {
  return (
    <section id="services" className="section-pad relative bg-cream">
      <div className="container-px">
        <SectionHeading
          eyebrow="Our Services"
          title="Sacred Services for Every Devotee"
          subtitle="Authentic rituals, live participation, and blessed samagri — all from the comfort of your home."
        />

        <div className="grid gap-8 md:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.title} delay={i * 100}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-card">
                {/* top accent */}
                <div
                  className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${service.gradient}`}
                />
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${service.gradient} text-3xl shadow-soft transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}
                >
                  {service.icon}
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink">
                  {service.title}
                </h3>
                <p className={`mt-1 text-sm font-semibold ${service.accent}`}>
                  {service.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {service.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {service.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm font-medium text-ink"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-saffron-100">
                        <Check className="h-3 w-3 text-saffron-600" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/book"
                  className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-saffron-600 transition-all hover:gap-3 hover:text-saffron-700"
                >
                  Book Now <span aria-hidden>→</span>
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
