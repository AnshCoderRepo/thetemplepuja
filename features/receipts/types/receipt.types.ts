import type { BookingRecord } from "@/lib/storage";

export interface BookingHolder {
  name: string;
  phone: string;
  gotra: string;
  city: string;
}

export interface BookingReceiptData {
  booking: BookingRecord;
  holder: BookingHolder;
}

export type ReceiptPageState =
  | { kind: "gate" }
  | { kind: "loading" }
  | { kind: "found"; booking: BookingRecord; holder: BookingHolder }
  | { kind: "missing" };
