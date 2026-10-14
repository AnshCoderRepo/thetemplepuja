import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { JsonLd } from "@/components/common";
import { PoojaCatalog } from "@/features/catalog";
import { activePoojas, poojas } from "@/lib/data";
import { itemListLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Book Pooja Online | templepujasewa",
  description:
    "Choose from 50+ poojas — Satyanarayan Katha, Rudrabhishek, Griha Pravesh, Shani Dev Pooja, Navgraha Shanti and more. Book certified pandits online with secure payment.",
};


import Link from "next/link";

export default function BookPage() {
  return (
    <>
      <JsonLd data={itemListLd(activePoojas(poojas))} />
      <BookPageHeader />
      <section className="section-pad bg-cream">
        <div className="container-px mx-auto max-w-6xl mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-amber-50 via-saffron-50/60 to-rose-50 border border-amber-200/90 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-saffron-500 text-white text-xl shadow-xs">
                🪔
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-ink">
                    Test Demo Pooja (₹1)
                  </h3>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-xs">
                    Live Demo
                  </span>
                </div>
                <p className="text-xs text-ink-soft">
                  Test live booking, sankalp registration, and online payments end-to-end for just ₹1.
                </p>
              </div>
            </div>
            <Link
              href="/book/demo-pooja"
              className="btn-primary text-xs shrink-0 whitespace-nowrap shadow-xs"
            >
              Book for ₹1 →
            </Link>
          </div>
        </div>
        <PoojaCatalog />
      </section>
    </>
  );
}
