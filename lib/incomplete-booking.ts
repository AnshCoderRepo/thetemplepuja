import { STORAGE_KEYS } from "./constants";
import type { BookingAddonItem, BookingRecord, BookingStatus } from "./storage";
import { getDevoteePhone, getUsers } from "./storage";
import { getPoojaBannerImage } from "./data";
import { submitBooking } from "@/features/bookings/api/bookingApi";
import { isValidIndianPhone } from "./validation";

export interface IncompleteBooking {
  bookingId: string;
  receiptNumber?: string;
  poojaSlug: string;
  poojaTitle: string;
  poojaImageUrl?: string;
  poojaEmoji?: string;
  templeSlug?: string;
  templeName?: string;
  packageTier: "single" | "couple" | "family";
  amount: number;
  discount?: number;
  couponCode?: string | null;
  date: string;
  time: string;
  primaryName?: string;
  gotra?: string;
  phone?: string;
  city?: string;
  email?: string;
  partnerName?: string;
  partnerGotra?: string;
  familyMembers?: { id?: string; name: string; gotra: string }[];
  addons?: Record<string, number>;
  addonItems?: BookingAddonItem[];
  step: 1 | 2 | 3 | 4;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

/** Check if a status represents an incomplete/resumable booking */
export function isIncompleteStatus(status?: string): boolean {
  if (!status) return true;
  return (
    status === "checkout_incomplete" ||
    status === "pending_payment" ||
    status === "payment_processing" ||
    status === "payment_failed" ||
    status === "pending" ||
    status === "failed"
  );
}

const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days expiration

/** Get all valid incomplete bookings for client / authenticated user */
export function getIncompleteBookings(activePhone?: string | null): IncompleteBooking[] {
  if (typeof window === "undefined") return [];

  const draftsMap = new Map<string, IncompleteBooking>();
  const now = Date.now();
  const phone = (activePhone || getDevoteePhone())?.trim();

  // 1. Load from localStorage drafts cache
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.INCOMPLETE_BOOKINGS);
    if (raw) {
      const parsed = JSON.parse(raw) as IncompleteBooking[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!item.bookingId || !item.poojaSlug) continue;
          if (!isIncompleteStatus(item.status)) continue;
          const age = now - new Date(item.updatedAt || item.createdAt).getTime();
          if (age > DRAFT_MAX_AGE_MS) continue;

          // PRIVACY & SECURITY CHECK (Requirement 7):
          // If an authenticated phone is active, do not expose drafts belonging to other phone numbers!
          if (phone && item.phone && item.phone.trim() !== phone) {
            continue;
          }

          draftsMap.set(item.bookingId, item);
        }
      }
    }
  } catch {
    // ignore parse error
  }

  // 2. Load from authenticated devotee profile in storage
  if (phone) {
    try {
      const users = getUsers();
      const currentUser = users.find((u) => u.phone === phone);
      if (currentUser && Array.isArray(currentUser.bookings)) {
        for (const b of currentUser.bookings) {
          if (!isIncompleteStatus(b.status)) {
            // If server marked it confirmed/cancelled, ensure it's removed from drafts
            draftsMap.delete(b.bookingId);
            continue;
          }

          const age = now - new Date(b.createdAt).getTime();
          if (age > DRAFT_MAX_AGE_MS) continue;

          // Convert BookingRecord to IncompleteBooking if not already present
          const existing = draftsMap.get(b.bookingId);
          if (!existing) {
            const reconstructed: IncompleteBooking = {
              bookingId: b.bookingId,
              receiptNumber: b.receiptNumber,
              poojaSlug: b.poojaSlug,
              poojaTitle: b.poojaTitle,
              poojaImageUrl: getPoojaBannerImage({ slug: b.poojaSlug, title: b.poojaTitle }),
              templeSlug: b.templeSlug,
              templeName: b.templeName,
              packageTier: (b.packageTier as "single" | "couple" | "family") || "single",
              amount: b.amount,
              discount: b.discount,
              couponCode: b.couponCode,
              date: b.date,
              time: b.time,
              primaryName: currentUser.name || b.devotees?.[0]?.name,
              gotra: currentUser.gotra || b.gotra,
              phone: currentUser.phone,
              city: currentUser.city,
              email: currentUser.email,
              partnerName: b.partnerName,
              partnerGotra: b.partnerGotra,
              familyMembers: Array.isArray(b.familyMembers)
                ? (b.familyMembers as { id: string; name: string; gotra: string }[])
                : undefined,
              addonItems: b.addons,
              step: 4, // Was saved on server so reached payment step
              status: b.status,
              createdAt: b.createdAt,
              updatedAt: b.createdAt,
            };
            draftsMap.set(b.bookingId, reconstructed);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Final privacy filter ensuring strict ownership when authenticated
  const result = Array.from(draftsMap.values()).filter((item) => {
    if (phone && item.phone && item.phone.trim() !== phone) {
      return false;
    }
    return true;
  });

  // Sort descending by updated timestamp (most recent first)
  result.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  return result;
}

/** Save an incomplete booking draft in localStorage and sync with server when phone is present */
export function saveIncompleteBooking(draft: IncompleteBooking): void {
  if (typeof window === "undefined" || !draft.bookingId || !draft.poojaSlug) return;

  try {
    let existing: IncompleteBooking[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.INCOMPLETE_BOOKINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) existing = parsed;
      }
    } catch {
      existing = [];
    }

    const updatedDraft: IncompleteBooking = {
      ...draft,
      status: draft.status || "checkout_incomplete",
      updatedAt: draft.updatedAt || new Date().toISOString(),
      createdAt: draft.createdAt || new Date().toISOString(),
    };

    const map = new Map<string, IncompleteBooking>();
    for (const item of existing) {
      if (item && item.bookingId) {
        map.set(item.bookingId, item);
      }
    }
    // Update or append
    map.set(updatedDraft.bookingId, updatedDraft);

    const list = Array.from(map.values()).slice(0, 10); // keep at most 10 drafts
    window.localStorage.setItem(STORAGE_KEYS.INCOMPLETE_BOOKINGS, JSON.stringify(list));
    window.dispatchEvent(new Event("incomplete-bookings-updated"));

    // If valid phone number is entered, sync to backend database as an incomplete booking
    if (updatedDraft.phone && isValidIndianPhone(updatedDraft.phone)) {
      void syncDraftToServer(updatedDraft);
    }
  } catch {
    // storage fallback
  }
}

/** Remove an incomplete booking draft once confirmed or dismissed */
export function removeIncompleteBooking(bookingId: string): void {
  if (typeof window === "undefined" || !bookingId) return;

  try {
    const existing = getIncompleteBookings();
    const filtered = existing.filter((b) => b.bookingId !== bookingId);
    window.localStorage.setItem(STORAGE_KEYS.INCOMPLETE_BOOKINGS, JSON.stringify(filtered));
    window.dispatchEvent(new Event("incomplete-bookings-updated"));
  } catch {
    // ignore
  }
}

/** Background server synchronization for an incomplete booking draft */
async function syncDraftToServer(draft: IncompleteBooking): Promise<void> {
  if (!draft.phone || !isValidIndianPhone(draft.phone)) return;

  const bookingRecord: BookingRecord = {
    bookingId: draft.bookingId,
    receiptNumber: draft.receiptNumber,
    poojaSlug: draft.poojaSlug,
    poojaTitle: draft.poojaTitle,
    templeSlug: draft.templeSlug,
    templeName: draft.templeName,
    date: draft.date,
    time: draft.time,
    panditName: "Acharya Ji (Vedic Purohit)",
    reason: "General Well-being & Divine Blessings",
    packageTier: draft.packageTier,
    amount: draft.amount,
    discount: draft.discount || 0,
    couponCode: draft.couponCode || null,
    gotra: draft.gotra || "Kashyap",
    partnerName: draft.partnerName,
    partnerGotra: draft.partnerGotra,
    devotees: draft.primaryName
      ? [{ name: draft.primaryName, gotra: draft.gotra || "Kashyap" }]
      : undefined,
    familyMembers: draft.familyMembers,
    addons: draft.addonItems,
    addonCount: draft.addonItems ? draft.addonItems.length : 0,
    createdAt: draft.createdAt,
    status: draft.status || "checkout_incomplete",
  };

  try {
    await submitBooking({
      phone: draft.phone,
      name: draft.primaryName || "Devotee",
      gotra: draft.gotra || "Kashyap",
      city: draft.city || "India",
      email: draft.email || `${draft.phone.replace(/\D/g, "").slice(-10)}@templepujasewa.com`,
      booking: bookingRecord,
    });
  } catch {
    // silent catch for background sync
  }
}
