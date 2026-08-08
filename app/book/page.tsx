import type { Metadata } from "next";
import BookPageHeader from "@/components/BookPageHeader";
import PoojaCatalog from "@/components/PoojaCatalog";

export const metadata: Metadata = {
  title: "Book Pooja Online | The Temple Puja",
  description:
    "Choose from 50+ poojas — Satyanarayan Katha, Rudrabhishek, Griha Pravesh, Shani Dev Pooja, Navgraha Shanti and more. Book certified pandits online with secure Razorpay payment.",
};

export default function BookPage() {
  return (
    <>
      <BookPageHeader
        eyebrow="🪔 Pooja Booking"
        title={
          <>
            Choose Your <span className="text-amber-200">Sacred Pooja</span>
          </>
        }
        subtitle="Select the ritual that speaks to your heart — every pooja is performed by certified pandits following ancient scriptures, with video recording and sankalp on your behalf."
        facts={[
          { icon: "🕉️", label: "50+ Poojas" },
          { icon: "🙏", label: "200+ Certified Pandits" },
          { icon: "💳", label: "Razorpay Secure" },
          { icon: "🔒", label: "100% SSL Encrypted" },
        ]}
      />
      <section className="section-pad bg-cream">
        <PoojaCatalog />
      </section>
    </>
  );
}
