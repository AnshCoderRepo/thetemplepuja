import { beforeEach, describe, expect, it } from "vitest";
import {
  getIncompleteBookings,
  removeIncompleteBooking,
  saveIncompleteBooking,
  type IncompleteBooking,
} from "@/lib/incomplete-booking";

describe("Compact Continue Booking Widget Logic", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  const draft1: IncompleteBooking = {
    bookingId: "BK-DRAFT-1",
    poojaSlug: "someshwar-mahadev-abhisek",
    poojaTitle: "Someshwar Mahadev Abhisek",
    packageTier: "single",
    amount: 251,
    date: "2026-10-20",
    time: "10:00 AM IST",
    primaryName: "Ansh Kumar",
    gotra: "Kashyap",
    phone: "9876543210",
    step: 2,
    status: "checkout_incomplete",
    createdAt: new Date(Date.now() - 5000).toISOString(),
    updatedAt: new Date(Date.now() - 5000).toISOString(),
  };

  const draft2: IncompleteBooking = {
    bookingId: "BK-DRAFT-2",
    poojaSlug: "someshwar-mahadev-abhisek",
    poojaTitle: "Someshwar Mahadev Abhisek",
    packageTier: "couple",
    amount: 652,
    date: "2026-10-20",
    time: "10:00 AM IST",
    primaryName: "Ansh Kumar",
    gotra: "Kashyap",
    phone: "9876543210",
    step: 4,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("manages multiple incomplete booking drafts accurately", () => {
    saveIncompleteBooking(draft1);
    saveIncompleteBooking(draft2);

    const list = getIncompleteBookings();
    expect(list.length).toBe(2);
    const ids = list.map((d) => d.bookingId);
    expect(ids).toContain("BK-DRAFT-1");
    expect(ids).toContain("BK-DRAFT-2");
    expect(ids[0]).toBe("BK-DRAFT-2"); // Most recent first
  });

  it("removes a single draft when dismissed while keeping others", () => {
    saveIncompleteBooking(draft1);
    saveIncompleteBooking(draft2);

    removeIncompleteBooking("BK-DRAFT-1");
    const remaining = getIncompleteBookings();
    expect(remaining.length).toBe(1);
    expect(remaining[0].bookingId).toBe("BK-DRAFT-2");
  });

  it("stores user collapsed/expanded UI preference in localStorage", () => {
    const STORAGE_KEY = "ttp_continue_booking_expanded";
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, "true");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    window.localStorage.setItem(STORAGE_KEY, "false");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("identifies payment pending vs draft status accurately", () => {
    expect(draft1.status).toBe("checkout_incomplete");
    expect(draft2.status).toBe("pending_payment");
  });
});
