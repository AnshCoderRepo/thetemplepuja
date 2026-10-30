import { STORAGE_KEYS } from "./constants";
import type { PackageTier } from "@/features/bookings/types/booking.types";

/**
 * Standard session timeout duration: 30 minutes of inactivity.
 * If user refreshes within this window, they remain on their active step with all data intact.
 * If inactivity exceeds 30 minutes, the active auto-open modal session expires,
 * but their draft remains safely preserved in the incomplete bookings store for their devotee panel.
 */
export const BOOKING_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export interface ActiveBookingSessionState {
  bookingId: string;
  poojaSlug: string;
  poojaTitle?: string;
  ritualType?: "temple" | "home";
  address?: string;
  step: 1 | 2 | 3 | 4;
  packageTier: PackageTier;
  addons: Record<string, number>;
  primaryName?: string;
  gotra?: string;
  partnerName?: string;
  partnerGotra?: string;
  familyMembers?: { id?: string; name: string; gotra: string }[];
  phone?: string;
  couponCode?: string | null;
  date?: string;
  time?: string;
  amount?: number;
  discount?: number;
  isOpen: boolean;
  lastActiveAt: number; // Unix timestamp in ms
}

/**
 * Retrieves the active in-progress booking session if not timed out.
 * Returns null if no session exists or if session timeout occurred (> 30 minutes).
 */
export function getActiveBookingSession(): ActiveBookingSessionState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      window.sessionStorage.getItem(STORAGE_KEYS.ACTIVE_BOOKING_SESSION) ||
      window.localStorage.getItem(STORAGE_KEYS.ACTIVE_BOOKING_SESSION);

    if (!raw) return null;

    const session = JSON.parse(raw) as ActiveBookingSessionState;
    if (!session || !session.poojaSlug) return null;

    // Check for session timeout
    const now = Date.now();
    const lastActive = Number(session.lastActiveAt) || 0;
    if (now - lastActive > BOOKING_SESSION_TIMEOUT_MS) {
      // Session has timed out — clear auto-open state from active session
      clearActiveBookingSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Saves or updates the active booking session in both sessionStorage and localStorage.
 * Automatically refreshes lastActiveAt to prevent timeout during active engagement.
 */
export function saveActiveBookingSession(data: Partial<ActiveBookingSessionState>): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getActiveBookingSession();
    const updated: ActiveBookingSessionState = {
      bookingId:
        data.bookingId ||
        existing?.bookingId ||
        `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      poojaSlug: data.poojaSlug || existing?.poojaSlug || "",
      poojaTitle: data.poojaTitle || existing?.poojaTitle || "",
      step: (data.step ?? existing?.step ?? 1) as 1 | 2 | 3 | 4,
      packageTier: data.packageTier || existing?.packageTier || "single",
      addons: data.addons !== undefined ? data.addons : (existing?.addons || {}),
      primaryName:
        data.primaryName !== undefined ? data.primaryName : (existing?.primaryName || ""),
      gotra: data.gotra !== undefined ? data.gotra : (existing?.gotra || ""),
      partnerName:
        data.partnerName !== undefined ? data.partnerName : (existing?.partnerName || ""),
      partnerGotra:
        data.partnerGotra !== undefined ? data.partnerGotra : (existing?.partnerGotra || ""),
      familyMembers:
        data.familyMembers !== undefined ? data.familyMembers : (existing?.familyMembers || []),
      phone: data.phone !== undefined ? data.phone : (existing?.phone || ""),
      couponCode:
        data.couponCode !== undefined ? data.couponCode : (existing?.couponCode || ""),
      date: data.date || existing?.date,
      time: data.time || existing?.time,
      amount: data.amount ?? existing?.amount,
      discount: data.discount ?? existing?.discount,
      isOpen: data.isOpen !== undefined ? data.isOpen : (existing?.isOpen ?? true),
      lastActiveAt: Date.now(),
    };

    const serialized = JSON.stringify(updated);
    window.sessionStorage.setItem(STORAGE_KEYS.ACTIVE_BOOKING_SESSION, serialized);
    window.localStorage.setItem(STORAGE_KEYS.ACTIVE_BOOKING_SESSION, serialized);
    window.dispatchEvent(new CustomEvent("booking-session-updated", { detail: updated }));
  } catch {
    // storage quota fallback
  }
}

/**
 * Clears the active booking session (e.g. upon successful booking confirmation or explicit cancel).
 */
export function clearActiveBookingSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_BOOKING_SESSION);
    window.localStorage.removeItem(STORAGE_KEYS.ACTIVE_BOOKING_SESSION);
    window.dispatchEvent(new Event("booking-session-updated"));
  } catch {
    // ignore
  }
}

/**
 * Returns true if an active non-timed-out session exists.
 */
export function isBookingSessionActive(): boolean {
  return getActiveBookingSession() !== null;
}
