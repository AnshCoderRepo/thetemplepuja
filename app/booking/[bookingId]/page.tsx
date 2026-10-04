import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingReceiptPage } from "@/features/receipts";

export const metadata: Metadata = {
  title: "Booking Receipt | The Temple Puja",
  description: "Official pooja booking confirmation and tax invoice receipt.",
};

export default function BookingReceiptRoute() {
  return (
    <Suspense
      fallback={
        <section className="section-pad bg-cream">
          <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-saffron-100/60" />
        </section>
      }
    >
      <BookingReceiptPage />
    </Suspense>
  );
}
