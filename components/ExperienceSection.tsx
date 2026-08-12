"use client";

import Link from "next/link";
import PoojaExperience from "@/components/PoojaExperience";

export default function ExperienceSection() {
  return (
    <div id="experience">
      <PoojaExperience title="Experience a Sacred Pooja">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-amber-200 backdrop-blur">
            🙏 Watch Before You Book
          </span>
          <h3 className="mt-6 font-display text-3xl font-bold text-white md:text-4xl">
            This is what a live pooja looks like
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/70 md:text-base">
            Every ritual on The Temple Puja is performed by certified pandits
            exactly like this — with Vedic chants, sacred lamps and authentic
            samagri. Scroll up to replay the experience, then book your own
            pooja and receive the HD video recording right after the ritual.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/book/form" className="btn-primary">
              🪔 Book Your Pooja
            </Link>
            <Link href="#events" className="btn-outline">
              Explore Live Events
            </Link>
          </div>
        </div>
      </PoojaExperience>
    </div>
  );
}
