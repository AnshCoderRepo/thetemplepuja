import type { BookingAddonItem, BookingInput, BookingRecord, RescheduleInput, UserProfile } from "@/lib/storage";
import type { AppliedCoupon } from "@/features/payments/types/payment.types";

export type PackageTier = "single" | "couple" | "family";

export interface PoojaPackageOption {
  id: PackageTier;
  title: string;
  hindiTitle: string;
  description: string;
  priceMultiplier: number;
  fixedPrice?: number;
  badge?: string;
  devoteeLimit: number;
  features: string[];
}

export interface ConfirmedBooking {
  id: string;
  receiptNumber?: string;
  total: number;
  subtotal?: number;
  addonTotal?: number;
  discount: number;
  coupon: AppliedCoupon | null;
  addons?: BookingAddonItem[];
  date: string;
  time: string;
  panditName: string | null;
  name: string;
  poojaTitle: string;
  reason: string;
  packageTier?: PackageTier;
  partnerName?: string;
  familyMembers?: string[];
  address?: string;
  credentials: { username: string; password: string; email: string };
}

export interface BookingFormData {
  name: string;
  gotra: string;
  city: string;
  phone: string;
  email: string;
  reason: string;
  packageTier: PackageTier;
  partnerName?: string;
  familyMembers: string[];
  address?: string;
}

export type {
  BookingAddonItem,
  BookingInput,
  BookingRecord,
  RescheduleInput,
  UserProfile,
};
