import type { Users } from "lucide-react";

export type AdminTab =
  | "analytics"
  | "poojas"
  | "festivals"
  | "temples"
  | "blogs"
  | "bookings"
  | "orders"
  | "refunds"
  | "devotees"
  | "dates"
  | "coupons"
  | "chatbot"
  | "addons"
  | "gallery"
  | "account";

export interface NavItem {
  id: AdminTab;
  label: string;
  icon: typeof Users;
  badge?: string;
  group?: string;
}
