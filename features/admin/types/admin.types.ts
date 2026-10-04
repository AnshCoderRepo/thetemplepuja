import type { Users } from "lucide-react";

export type AdminTab =
  | "analytics"
  | "poojas"
  | "festivals"
  | "temples"
  | "bookings"
  | "orders"
  | "devotees"
  | "dates"
  | "coupons"
  | "account";

export interface NavItem {
  id: AdminTab;
  label: string;
  icon: typeof Users;
  badge?: string;
  group?: string;
}
