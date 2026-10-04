import type { Metadata } from "next";
import { BookPageHeader } from "@/components/layout";
import { BookingFlow } from "@/features/bookings";

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
      <BookPageHeader />
      <BookingFlow initialDate={sp.date ?? null} initialTime={sp.time ?? null} />
    </>
  );
}
