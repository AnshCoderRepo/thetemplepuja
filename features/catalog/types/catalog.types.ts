import type { Coupon, Pooja, PoojaDate, Temple, UpcomingEventSpec } from "@/lib/data";

export interface ResolvedCatalog {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
}

export type CatalogSection = "poojas" | "events" | "coupons" | "poojaDates" | "temples";
