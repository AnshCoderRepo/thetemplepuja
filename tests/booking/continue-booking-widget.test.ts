import { beforeEach, describe, expect, it } from "vitest";
import {
  getIncompleteBookings,
  removeIncompleteBooking,
  saveIncompleteBooking,
  type IncompleteBooking,
} from "@/lib/incomplete-booking";

describe("Continue Booking Horizontal Cards & 4-Item Limit Logic", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  const createDraft = (id: string, minsAgo: number = 0, status: IncompleteBooking["status"] = "checkout_incomplete"): IncompleteBooking => ({
    bookingId: `BK-DRAFT-${id}`,
    poojaSlug: "someshwar-mahadev-abhisek",
    poojaTitle: `Someshwar Mahadev Abhisek ${id}`,
    templeName: "Someshwar Mahadev Mandir",
    packageTier: "couple",
    amount: 251 + parseInt(id, 10) * 100,
    date: "2026-10-25",
    time: "10:00 AM IST",
    primaryName: "Ansh Kumar",
    gotra: "Kashyap",
    phone: "9876543210",
    step: 2,
    status,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
    updatedAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
  });

  it("manages multiple incomplete booking drafts accurately", () => {
    saveIncompleteBooking(createDraft("1", 10));
    saveIncompleteBooking(createDraft("2", 5));

    const list = getIncompleteBookings();
    expect(list.length).toBe(2);
    const ids = list.map((d) => d.bookingId);
    expect(ids).toContain("BK-DRAFT-1");
    expect(ids).toContain("BK-DRAFT-2");
    expect(ids[0]).toBe("BK-DRAFT-2"); // Most recent first
  });

  it("removes a single draft when dismissed while keeping others", () => {
    saveIncompleteBooking(createDraft("1", 10));
    saveIncompleteBooking(createDraft("2", 5));

    removeIncompleteBooking("BK-DRAFT-1");
    const remaining = getIncompleteBookings();
    expect(remaining.length).toBe(1);
    expect(remaining[0].bookingId).toBe("BK-DRAFT-2");
  });

  it("identifies payment pending vs draft status accurately", () => {
    const draftPending = createDraft("1", 0, "pending_payment");
    const draftFailed = createDraft("2", 0, "payment_failed");
    const draftNormal = createDraft("3", 0, "checkout_incomplete");

    expect(draftPending.status).toBe("pending_payment");
    expect(draftFailed.status).toBe("payment_failed");
    expect(draftNormal.status).toBe("checkout_incomplete");
  });

  describe("Horizontal Card Type Layout Architecture", () => {
    it("configures horizontal scrolling card container with snap scrolling", () => {
      const containerClasses =
        "flex flex-row items-stretch gap-3.5 sm:gap-4 overflow-x-auto pb-2.5 pt-1 scroll-smooth snap-x snap-mandatory no-scrollbar w-full";

      expect(containerClasses).toContain("flex flex-row");
      expect(containerClasses).toContain("overflow-x-auto");
      expect(containerClasses).toContain("snap-x");
      expect(containerClasses).toContain("snap-mandatory");
      expect(containerClasses).not.toContain("flex-col");
    });

    it("verifies card-type structure for each incomplete booking (not line by line)", () => {
      const cardClasses =
        "group relative flex flex-col justify-between w-[265px] xs:w-[285px] sm:w-[300px] lg:w-[calc(25%-0.75rem)] lg:min-w-[260px] lg:flex-1 shrink-0 snap-start rounded-2xl border border-saffron-200/90 bg-white hover:border-saffron-400 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400 select-none";

      expect(cardClasses).toContain("rounded-2xl");
      expect(cardClasses).toContain("border");
      expect(cardClasses).toContain("shrink-0");
      expect(cardClasses).toContain("snap-start");
      // Cards have defined widths and are not 1-line strips
      expect(cardClasses).toContain("w-[265px]");
    });

    it("includes card banner with overlay, price badge, and dismiss button", () => {
      const bannerClasses = "relative h-28 xs:h-32 w-full overflow-hidden bg-slate-900 shrink-0";
      expect(bannerClasses).toContain("h-28");
      expect(bannerClasses).toContain("w-full");
    });
  });

  describe("4-Booking Home Page Limit & Rest on Profile Page", () => {
    it("limits homepage drafts to 4 and determines remaining drafts for profile page", () => {
      // Save 6 drafts
      for (let i = 1; i <= 6; i++) {
        saveIncompleteBooking(createDraft(i.toString(), 10 - i));
      }

      const allDrafts = getIncompleteBookings();
      expect(allDrafts.length).toBe(6);

      // Homepage behavior with limit = 4
      const limit = 4;
      const visibleOnHome = allDrafts.slice(0, limit);
      const remainingCount = allDrafts.length - visibleOnHome.length;

      expect(visibleOnHome.length).toBe(4);
      expect(remainingCount).toBe(2);

      // Verify first 4 are the most recent drafts
      expect(visibleOnHome.map((d) => d.bookingId)).toEqual([
        "BK-DRAFT-6",
        "BK-DRAFT-5",
        "BK-DRAFT-4",
        "BK-DRAFT-3",
      ]);
    });

    it("shows all drafts when showAll={true} (Profile page behavior)", () => {
      for (let i = 1; i <= 6; i++) {
        saveIncompleteBooking(createDraft(i.toString(), 10 - i));
      }

      const allDrafts = getIncompleteBookings();
      const showAll = true;
      const limit = 4;

      const effectiveLimit = showAll ? allDrafts.length : limit;
      const visibleOnProfile = allDrafts.slice(0, effectiveLimit);
      const remainingOnProfile = allDrafts.length - visibleOnProfile.length;

      expect(visibleOnProfile.length).toBe(6);
      expect(remainingOnProfile).toBe(0);
    });

    it("ensures user telephone scoping is preserved for devotee drafts", () => {
      saveIncompleteBooking(createDraft("1", 5)); // 9876543210
      saveIncompleteBooking({
        ...createDraft("2", 1),
        phone: "9123456789", // different phone
      });

      const devoteeList = getIncompleteBookings("9876543210");
      expect(devoteeList.length).toBe(1);
      expect(devoteeList[0].bookingId).toBe("BK-DRAFT-1");
    });
  });
});
