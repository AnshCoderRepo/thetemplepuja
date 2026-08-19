import { Star } from "lucide-react";
import Reveal from "./Reveal";
import { stats, heroCtas } from "@/lib/data";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-cream pt-32 md:pt-44"
    >
      {/* Background video */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          poster="https://images.unsplash.com/photo-1604948501466-4e9c339b9c24?q=80&w=1920&auto=format&fit=crop"
        >
          <source
            src="https://videos.pexels.com/video-files/28884117/12503838_1920_1080_50fps.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-cream/80 via-cream/60 to-cream/90" />
        {/* Floating ornaments */}
        <span className="absolute left-[8%] top-40 animate-float text-4xl opacity-25">🪔</span>
        <span className="absolute right-[10%] top-56 animate-float text-5xl opacity-20 [animation-delay:1.5s]">🕉️</span>
        <span className="absolute bottom-24 left-[16%] animate-float text-3xl opacity-20 [animation-delay:3s]">🔔</span>
        <span className="absolute bottom-32 right-[18%] animate-float text-3xl opacity-20 [animation-delay:2s]">📿</span>
      </div>

      <div className="container-px relative pb-20 md:pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-saffron-700 shadow-soft backdrop-blur">
              <span className="text-base">🙏</span>
              विश्वास, पवित्रता और भक्ति का संगम
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.12] tracking-tight text-ink sm:text-6xl md:text-7xl">
              Book Trusted Pooja
              <br />
              <span className="shimmer-text">& Sacred Rituals</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              Experience the divine from anywhere in the world. Certified
              pandits. Authentic Vedic rituals. Pure devotion.
            </p>
          </Reveal>

          {/* Rating */}
          <Reveal delay={300}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
                <span className="text-sm">🙏</span>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                Rating 4.9 / 5.0
              </span>
            </div>
          </Reveal>

          {/* Stats */}
          <Reveal delay={400}>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="group rounded-2xl border border-saffron-100 bg-white/90 px-4 py-5 shadow-soft backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-saffron-300 hover:shadow-card"
                >
                  <div className="text-2xl transition-transform duration-300 group-hover:scale-125">
                    {stat.icon}
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs font-medium text-ink-soft">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CTA buttons */}
          <Reveal delay={500}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {heroCtas.map((cta) =>
                cta.primary ? (
                  <a key={cta.label} href={cta.href} className="btn-primary">
                    {cta.label}
                    <span aria-hidden>→</span>
                  </a>
                ) : (
                  <a key={cta.label} href={cta.href} className="btn-outline">
                    {cta.label}
                  </a>
                )
              )}
            </div>
          </Reveal>
        </div>

        {/* Scroll hint */}
        <a
          href="#events"
          className="absolute bottom-0 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs font-medium text-ink-soft/60 transition-colors hover:text-saffron-600 md:flex"
        >
          Scroll
          <span className="flex h-8 w-5 items-start justify-center rounded-full border border-ink-soft/30 p-1">
            <span className="h-2 w-1 animate-bounce rounded-full bg-saffron-500" />
          </span>
        </a>
      </div>

      {/* Bottom decorative wave */}
      <div className="relative h-10 w-full overflow-hidden bg-gradient-to-b from-transparent to-saffron-50" />
    </section>
  );
}
