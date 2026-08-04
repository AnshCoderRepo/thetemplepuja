import type { Metadata } from "next";
import BookPageHeader from "@/components/BookPageHeader";
import BookingFlow from "@/components/BookingFlow";

export const metadata: Metadata = {
  title: "Book Pooja Online | The Temple Puja",
  description:
    "Book a pooja in under 2 minutes. Choose your prayer, share your details and the reason for the pooja, and pay securely via Razorpay.",
};

interface Props {
  searchParams: Promise<{ date?: string; time?: string }>;
}

export default async function BookFormPage({ searchParams }: Props) {
  const sp = await searchParams;

  return (
    <>
      <BookPageHeader
        crumb="Book Pooja"
        eyebrow="🪔 Pooja Booking"
        title={
          <>
            Book Your <span className="text-amber-200">Sacred Pooja</span>
          </>
        }
        subtitle="Choose your prayer, tell us why you're performing it, and complete secure payment — your booking is confirmed instantly."
        facts={[
          { icon: "🪔", label: "12+ Sacred Poojas" },
          { icon: "🙏", label: "Certified Pandits" },
          { icon: "💳", label: "Razorpay Secure" },
          { icon: "🔒", label: "100% SSL Encrypted" },
        ]}
      />
      <BookingFlow initialDate={sp.date ?? null} initialTime={sp.time ?? null} />
    </>
  );
}
