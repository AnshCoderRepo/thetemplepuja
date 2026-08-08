"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import Reveal from "./Reveal";
import { activePoojas } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useCatalog } from "./useCatalog";

export default function PoojaCatalog({ notice }: { notice?: string }) {
  // Static defaults on first render (SSR-safe); swaps to the server catalog.
  // Inactive poojas (admin toggle) are hidden from visitors.
  const { poojas } = useCatalog();
  const list = activePoojas(poojas);

  return (
    <div className="container-px pb-24">
      {notice && (
        <div className="mx-auto mb-10 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center text-sm font-medium text-amber-800">
          {notice}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 3) * 80}>
            <Link
              href={`/book/${p.slug}`}
              className="group card-hover flex h-full flex-col overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-soft"
            >
              <div className={`relative h-28 bg-gradient-to-br ${p.gradient}`}>
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
                <span className="absolute right-5 top-4 text-4xl drop-shadow-lg transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6">
                  {p.emoji}
                </span>
                <span className="absolute left-5 top-4 font-devanagari text-sm font-semibold text-white/90">
                  {p.hindiTitle}
                </span>
                <span className="absolute bottom-3 left-5 flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Clock className="h-3.5 w-3.5" />
                  {p.duration}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-bold text-ink">{p.title}</h3>
                <p className="mt-1.5 flex-1 text-xs leading-relaxed text-ink-soft">
                  {p.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.benefits.slice(0, 2).map((b) => (
                    <li
                      key={b}
                      className="rounded-full bg-saffron-50 px-2.5 py-1 text-[10px] font-semibold text-saffron-700"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between border-t border-dashed border-saffron-100 pt-4">
                  <div>
                    <span className="font-display text-xl font-bold text-saffron-600">
                      {formatINR(p.price)}
                    </span>
                    <span className="text-[11px] font-medium text-ink-soft/60"> onwards</span>
                  </div>
                  <span className="btn-primary !px-5 !py-2.5 text-xs">
                    Book Now
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
