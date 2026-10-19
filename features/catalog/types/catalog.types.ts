import type {
  Coupon,
  FestivalEvent,
  Pooja,
  PoojaDate,
  Temple,
  UpcomingEventSpec,
  Testimonial,
} from "@/lib/data";
import type { PlatformSettings } from "@/lib/chatbot-types";

export interface ResolvedCatalog {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
  platformSettings?: PlatformSettings;
  testimonials?: Testimonial[];
}

export type CatalogSection =
  | "poojas"
  | "events"
  | "festivals"
  | "coupons"
  | "poojaDates"
  | "temples"
  | "testimonials";
