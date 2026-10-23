"use client";

import dynamic from "next/dynamic";

const BookingModal = dynamic(
  () => import("@/features/bookings").then((m) => m.BookingModal),
  { ssr: false }
);

const FloatingWhatsApp = dynamic(
  () => import("@/features/contact").then((m) => m.FloatingWhatsApp),
  { ssr: false }
);

export default function GlobalClientModals() {
  return (
    <>
      <BookingModal />
      <FloatingWhatsApp />
    </>
  );
}
