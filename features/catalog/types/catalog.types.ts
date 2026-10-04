import type {
  Coupon,
  FestivalEvent,
  Pooja,
  PoojaDate,
  Temple,
  UpcomingEventSpec,
} from "@/lib/data";

export interface ResolvedCatalog {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
}

export type CatalogSection =
  | "poojas"
  | "events"
  | "festivals"
  | "coupons"
  | "poojaDates"
  | "temples";
