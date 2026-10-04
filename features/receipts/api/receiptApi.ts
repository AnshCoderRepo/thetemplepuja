import type { BookingRecord } from "@/lib/storage";
import { getUsers } from "@/lib/storage";
import { normalizePhone } from "@/lib/validation";
import type { BookingReceiptData } from "../types/receipt.types";

export async function fetchBooking(
  bookingId: string,
  phone: string
): Promise<BookingReceiptData | null> {
  const id = bookingId.trim().toUpperCase();
  const p = phone.trim();
  if (!id || !p) return null;
  try {
    const res = await fetch(
      `/api/bookings/${encodeURIComponent(id)}?phone=${encodeURIComponent(p)}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("lookup failed");
    const body = (await res.json()) as {
      booking?: BookingRecord;
      holder?: { name: string; phone: string; gotra: string; city: string };
    };
    if (body.booking && body.holder) {
      return { booking: body.booking, holder: body.holder };
    }
    return null;
  } catch {
    for (const u of getUsers()) {
      if (normalizePhone(u.phone) !== normalizePhone(p)) continue;
      const booking = u.bookings.find((b) => b.bookingId === id);
      if (booking) {
        return {
          booking,
          holder: { name: u.name, phone: u.phone, gotra: u.gotra, city: u.city },
        };
      }
    }
    return null;
  }
}
