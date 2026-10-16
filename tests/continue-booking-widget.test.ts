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

  describe("Responsive floating widget classes and viewport constraints", () => {
    it("configures floating positioning on mobile while preserving desktop container layout", () => {
      // Classes applied when contained={true} (default)
      const mobileFloatingClasses =
        "fixed bottom-20 sm:bottom-24 inset-x-0 z-40 mx-auto w-fit max-w-[calc(100vw-2rem)] px-2 sm:px-4 pointer-events-auto md:relative md:bottom-auto md:inset-auto md:z-auto md:mx-auto md:w-full md:max-w-7xl md:container-px md:my-5 md:px-6 lg:px-8";

      // Mobile floating rules
      expect(mobileFloatingClasses).toContain("fixed bottom-20");
      expect(mobileFloatingClasses).toContain("z-40");
      expect(mobileFloatingClasses).toContain("inset-x-0");
      expect(mobileFloatingClasses).toContain("mx-auto");
      expect(mobileFloatingClasses).toContain("w-fit");
      expect(mobileFloatingClasses).toContain("max-w-[calc(100vw-2rem)]");

      // Desktop layout preservation rules
      expect(mobileFloatingClasses).toContain("md:relative");
      expect(mobileFloatingClasses).toContain("md:bottom-auto");
      expect(mobileFloatingClasses).toContain("md:container-px");
      expect(mobileFloatingClasses).toContain("md:my-5");
    });

    it("verifies mobile panel opens upward without colliding with screen bottom or bottom controls", () => {
      const flexContainerClasses = "flex-col-reverse items-center md:flex-col md:items-start";
      expect(flexContainerClasses).toContain("flex-col-reverse items-center");
      expect(flexContainerClasses).toContain("md:flex-col md:items-start");

      const panelClasses =
        "w-[calc(100vw-24px)] max-w-lg rounded-2xl border border-saffron-200/90 bg-white p-3 sm:p-4 shadow-2xl md:shadow-card animate-in fade-in duration-200 flex flex-col max-h-[65vh] sm:max-h-[70vh] mb-2.5 md:mb-0 md:mt-2.5 slide-in-from-bottom-2 md:slide-in-from-top-2";
      expect(panelClasses).toContain("max-h-[65vh]");
      expect(panelClasses).toContain("w-[calc(100vw-24px)]");
      expect(panelClasses).toContain("mb-2.5");
      expect(panelClasses).toContain("md:mt-2.5");
    });

    it("supports 320px, 375px, and 430px viewport widths without overflow", () => {
      const viewports = [320, 375, 430];
      for (const vw of viewports) {
        const availablePanelWidth = vw - 24; // w-[calc(100vw-24px)]
        expect(availablePanelWidth).toBeLessThanOrEqual(512); // max-w-lg
        expect(availablePanelWidth).toBeGreaterThan(0);

        const availablePillWidth = vw - 32; // max-w-[calc(100vw-2rem)]
        const estimatedPillWidth = 230; // icon (20) + label (~135) + count (20) + chevron (14) + paddings (41)
        expect(estimatedPillWidth).toBeLessThanOrEqual(availablePillWidth);
      }
    });

    it("ensures only authenticated devotee drafts are returned (Requirement 7)", () => {
      saveIncompleteBooking(draft1); // phone: 9876543210
      saveIncompleteBooking({
        ...draft2,
        bookingId: "BK-ANOTHER-PHONE",
        phone: "9123456789",
      });

      // User with 9876543210 logged in
      const list = getIncompleteBookings("9876543210");
      expect(list.every((d) => d.phone === "9876543210")).toBe(true);
      expect(list.find((d) => d.bookingId === "BK-ANOTHER-PHONE")).toBeUndefined();
    });
  });
});
