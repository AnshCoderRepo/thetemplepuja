import type { AdminTab } from "@/features/admin/types/admin.types";

export function normalizeAdminTab(section?: string | null): AdminTab {
  if (!section) return "analytics";
  const s = section.toLowerCase().trim();
  if (s === "analytics" || s === "dashboard" || s === "overview") return "analytics";
  if (s === "poojas" || s === "pujas" || s === "puja" || s === "catalog") return "poojas";
  if (s === "festivals" || s === "events") return "festivals";
  if (s === "temples" || s === "temple") return "temples";
  if (s === "bookings" || s === "booking") return "bookings";
  if (s === "orders" || s === "order" || s === "payments") return "orders";
  if (
    s === "devotees" ||
    s === "devotee" ||
    s === "users" ||
    s === "customers" ||
    s === "profiles"
  ) {
    return "devotees";
  }
  if (
    s === "chatbot" ||
    s === "ai" ||
    s === "ai-guide" ||
    s === "ai-chatbot" ||
    s === "training"
  ) {
    return "chatbot";
  }
  if (s === "dates" || s === "muhurats" || s === "muhurat") return "dates";
  if (s === "coupons" || s === "coupon" || s === "discounts") return "coupons";
  if (s === "account" || s === "settings" || s === "profile") return "account";
  return "analytics";
}
