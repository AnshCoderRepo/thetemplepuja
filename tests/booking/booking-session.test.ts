import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  BOOKING_SESSION_TIMEOUT_MS,
  clearActiveBookingSession,
  getActiveBookingSession,
  isBookingSessionActive,
  saveActiveBookingSession,
  type ActiveBookingSessionState,
} from "@/lib/booking-session";
import {
  getIncompleteBookings,
  removeIncompleteBooking,
  saveIncompleteBooking,
  type IncompleteBooking,
} from "@/lib/incomplete-booking";

describe("Active Booking Session & Refresh Persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when no active booking session exists", () => {
    expect(getActiveBookingSession()).toBeNull();
    expect(isBookingSessionActive()).toBe(false);
  });

  it("persists active booking step and all details across simulated refresh", () => {
    saveActiveBookingSession({
      bookingId: "BK-REFRESH-101",
      poojaSlug: "satyanarayan-katha",
      poojaTitle: "Shri Satyanarayan Puja",
      step: 3,
      packageTier: "couple",
      addons: { "ghee-diya": 2, "special-prasad": 1 },
      primaryName: "Ramesh Sharma",
      gotra: "Kashyap",
      partnerName: "Sunita Sharma",
      partnerGotra: "Vashistha",
      familyMembers: [{ id: "1", name: "Ramesh Sharma", gotra: "Kashyap" }],
      phone: "9876543210",
      couponCode: "SHIV20",
      isOpen: true,
    });

    expect(isBookingSessionActive()).toBe(true);

    const session = getActiveBookingSession();
    expect(session).not.toBeNull();
    expect(session?.bookingId).toBe("BK-REFRESH-101");
    expect(session?.poojaSlug).toBe("satyanarayan-katha");
    expect(session?.step).toBe(3);
    expect(session?.packageTier).toBe("couple");
    expect(session?.addons).toEqual({ "ghee-diya": 2, "special-prasad": 1 });
    expect(session?.primaryName).toBe("Ramesh Sharma");
    expect(session?.gotra).toBe("Kashyap");
    expect(session?.partnerName).toBe("Sunita Sharma");
    expect(session?.partnerGotra).toBe("Vashistha");
    expect(session?.phone).toBe("9876543210");
    expect(session?.couponCode).toBe("SHIV20");
    expect(session?.isOpen).toBe(true);
  });

  it("persists on Step 4 (payment step) so refreshing keeps user on payment without data loss", () => {
    saveActiveBookingSession({
      bookingId: "BK-PAYMENT-404",
      poojaSlug: "someshwar-mahadev-abhisek",
      step: 4,
      packageTier: "family",
      phone: "9123456789",
      amount: 2101,
      isOpen: true,
    });

    const session = getActiveBookingSession();
    expect(session?.step).toBe(4);
    expect(session?.amount).toBe(2101);
  });

  it("automatically expires active session when inactivity exceeds 30-minute timeout", () => {
    vi.useFakeTimers();
    const startTime = Date.now();
    vi.setSystemTime(startTime);

    saveActiveBookingSession({
      bookingId: "BK-TIMEOUT-TEST",
      poojaSlug: "satyanarayan-katha",
      step: 2,
      isOpen: true,
    });

    // 10 minutes later: still active
    vi.setSystemTime(startTime + 10 * 60 * 1000);
    expect(getActiveBookingSession()).not.toBeNull();

    // 29 minutes later: still active
    vi.setSystemTime(startTime + 29 * 60 * 1000);
    expect(getActiveBookingSession()).not.toBeNull();

    // 31 minutes later (> 30-minute timeout): session expires!
    vi.setSystemTime(startTime + 31 * 60 * 1000);
    expect(getActiveBookingSession()).toBeNull();
    expect(isBookingSessionActive()).toBe(false);
  });

  it("preserves draft in incomplete bookings store even AFTER session timeout occurs", () => {
    vi.useFakeTimers();
    const startTime = Date.now();
    vi.setSystemTime(startTime);

    // Devotee starts booking
    const draft: IncompleteBooking = {
      bookingId: "BK-RESUME-DRAFT-99",
      poojaSlug: "rudrabhishek",
      poojaTitle: "Maha Rudrabhishek",
      packageTier: "single",
      amount: 1101,
      date: "2026-10-25",
      time: "08:00 AM IST",
      primaryName: "Anand Verma",
      gotra: "Bhardwaj",
      phone: "9876543210",
      step: 3,
      status: "checkout_incomplete",
      createdAt: new Date(startTime).toISOString(),
      updatedAt: new Date(startTime).toISOString(),
    };

    saveIncompleteBooking(draft);
    saveActiveBookingSession({
      bookingId: draft.bookingId,
      poojaSlug: draft.poojaSlug,
      step: draft.step,
      primaryName: draft.primaryName,
      phone: draft.phone,
      isOpen: true,
    });

    // Time progresses past the 30-minute session timeout (e.g. 2 hours later)
    vi.setSystemTime(startTime + 2 * 60 * 60 * 1000);

    // Active auto-open modal session is timed out
    expect(getActiveBookingSession()).toBeNull();

    // Devotee logs in to their panel with their phone number -> draft is STILL accessible!
    const panelDrafts = getIncompleteBookings("9876543210");
    expect(panelDrafts.length).toBeGreaterThan(0);
    expect(panelDrafts[0].bookingId).toBe("BK-RESUME-DRAFT-99");
    expect(panelDrafts[0].poojaSlug).toBe("rudrabhishek");
    expect(panelDrafts[0].step).toBe(3);
    expect(panelDrafts[0].primaryName).toBe("Anand Verma");
  });

  it("clears active session cleanly when payment succeeds", () => {
    saveActiveBookingSession({
      bookingId: "BK-PAID-SUCCESS",
      poojaSlug: "satyanarayan-katha",
      step: 4,
      isOpen: true,
    });

    expect(isBookingSessionActive()).toBe(true);

    clearActiveBookingSession();

    expect(getActiveBookingSession()).toBeNull();
    expect(isBookingSessionActive()).toBe(false);
  });
});
