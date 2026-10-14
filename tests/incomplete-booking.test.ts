import { beforeEach, describe, expect, it } from "vitest";
import {
  isIncompleteStatus,
  getIncompleteBookings,
  saveIncompleteBooking,
  removeIncompleteBooking,
  type IncompleteBooking,
} from "../lib/incomplete-booking";
import { STORAGE_KEYS } from "../lib/constants";
import { upsertBooking, type BookingRecord } from "../lib/storage";

describe("Incomplete Booking Persistence & Resumption", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  const mockDraft: IncompleteBooking = {
    bookingId: "BK-TEST-123",
    poojaSlug: "satyanarayan-katha",
    poojaTitle: "Shree Satyanarayan Puja",
    packageTier: "couple",
    amount: 2100,
    date: "2026-10-20",
    time: "10:00 AM IST",
    primaryName: "Aditya Sharma",
    gotra: "Kashyap",
    phone: "9876543210",
    step: 3,
    status: "checkout_incomplete",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("correctly identifies incomplete and resumable statuses", () => {
    expect(isIncompleteStatus("checkout_incomplete")).toBe(true);
    expect(isIncompleteStatus("pending_payment")).toBe(true);
    expect(isIncompleteStatus("payment_processing")).toBe(true);
    expect(isIncompleteStatus("payment_failed")).toBe(true);
    expect(isIncompleteStatus("failed")).toBe(true);
    expect(isIncompleteStatus("pending")).toBe(true);
    expect(isIncompleteStatus(undefined)).toBe(true);

    expect(isIncompleteStatus("confirmed")).toBe(false);
    expect(isIncompleteStatus("completed")).toBe(false);
    expect(isIncompleteStatus("cancelled")).toBe(false);
  });

  it("saves draft to localStorage and retrieves it", () => {
    saveIncompleteBooking(mockDraft);

    const drafts = getIncompleteBookings();
    expect(drafts.length).toBe(1);
    expect(drafts[0].bookingId).toBe("BK-TEST-123");
    expect(drafts[0].poojaSlug).toBe("satyanarayan-katha");
    expect(drafts[0].packageTier).toBe("couple");
    expect(drafts[0].amount).toBe(2100);
    expect(drafts[0].primaryName).toBe("Aditya Sharma");
  });

  it("updates existing draft without duplicating bookingId", () => {
    saveIncompleteBooking(mockDraft);

    saveIncompleteBooking({
      ...mockDraft,
      amount: 2500,
      step: 4,
      status: "pending_payment",
    });

    const drafts = getIncompleteBookings();
    expect(drafts.length).toBe(1);
    expect(drafts[0].amount).toBe(2500);
    expect(drafts[0].step).toBe(4);
    expect(drafts[0].status).toBe("pending_payment");
  });

  it("removes draft when booking is confirmed or dismissed", () => {
    saveIncompleteBooking(mockDraft);
    expect(getIncompleteBookings().length).toBe(1);

    removeIncompleteBooking("BK-TEST-123");
    expect(getIncompleteBookings().length).toBe(0);
  });

  it("filters out confirmed bookings from devotee profile", () => {
    // Save draft in localStorage
    saveIncompleteBooking(mockDraft);

    // Later, the same bookingId is saved as confirmed in devotee profile
    const bookingRecord: BookingRecord = {
      bookingId: "BK-TEST-123",
      poojaSlug: "satyanarayan-katha",
      poojaTitle: "Shree Satyanarayan Puja",
      date: "2026-10-20",
      time: "10:00 AM IST",
      panditName: "Acharya Ji",
      amount: 2100,
      discount: 0,
      couponCode: null,
      addonCount: 0,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    };

    upsertBooking({
      phone: "9876543210",
      name: "Aditya Sharma",
      gotra: "Kashyap",
      city: "Haridwar",
      email: "aditya@example.com",
      booking: bookingRecord,
    });

    const drafts = getIncompleteBookings("9876543210");
    expect(drafts.length).toBe(0);
  });

  it("filters out drafts older than 7 days expiration", () => {
    const expiredTimestamp = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    saveIncompleteBooking({
      ...mockDraft,
      bookingId: "BK-EXPIRED-999",
      updatedAt: expiredTimestamp,
    });

    const drafts = getIncompleteBookings();
    expect(drafts.find((d) => d.bookingId === "BK-EXPIRED-999")).toBeUndefined();
  });
});
