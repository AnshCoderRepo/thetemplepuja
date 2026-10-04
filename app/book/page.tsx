import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { JsonLd } from "@/components/common";
import { PoojaCatalog } from "@/features/catalog";
import { activePoojas, poojas } from "@/lib/data";
import { itemListLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Book Pooja Online | The Temple Puja",
  description:
    "Choose from 50+ poojas — Satyanarayan Katha, Rudrabhishek, Griha Pravesh, Shani Dev Pooja, Navgraha Shanti and more. Book certified pandits online with secure Razorpay payment.",
};

export default function BookPage() {
  return (
    <>
      <JsonLd data={itemListLd(activePoojas(poojas))} />
      <BookPageHeader />
      <section className="section-pad bg-cream">
        <PoojaCatalog />
      </section>
    </>
  );
}
