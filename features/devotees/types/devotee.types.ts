import type { BookingRecord, UserProfile } from "@/lib/storage";

export type { BookingRecord, UserProfile };

export interface DevoteeMediaInput {
  title: string;
  url: string;
  description?: string;
  poojaTitle?: string;
  bookingId?: string;
}
