import { describe, expect, it } from "vitest";
import { coupons, getPooja, getUpcomingEvents, poojas } from "../lib/data";

describe("pooja catalog", () => {
  it("has 12 poojas with unique slugs and positive prices", () => {
    expect(poojas).toHaveLength(12);
    const slugs = new Set(poojas.map((p) => p.slug));
    expect(slugs.size).toBe(12);
    for (const p of poojas) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  it("getPooja finds a pooja by slug and returns undefined for unknown slugs", () => {
    expect(getPooja("hanuman-pooja")?.price).toBe(501);
    expect(getPooja("satyanarayan-katha")?.title).toBe("Satyanarayan Katha");
    expect(getPooja("does-not-exist")).toBeUndefined();
  });
});

describe("coupon registry integrity", () => {
  it("defines every coupon the UI advertises", () => {
    expect(Object.keys(coupons).sort()).toEqual([
      "BUNDLE20",
      "DAILYDARSHAN",
      "TEMPLE30",
      "TEMPLEKUNDLI",
    ]);
  });

  it("TEMPLE30 is a 30% first-booking-only discount", () => {
    expect(coupons.TEMPLE30.kind).toBe("percent");
    expect(coupons.TEMPLE30.value).toBe(30);
    expect(coupons.TEMPLE30.firstBookingOnly).toBe(true);
  });

  it("BUNDLE20 requires 3+ bookings", () => {
    expect(coupons.BUNDLE20.kind).toBe("percent");
    expect(coupons.BUNDLE20.value).toBe(20);
    expect(coupons.BUNDLE20.minBookings).toBe(3);
  });

  it("TEMPLEKUNDLI is a benefit with a ₹1,500 minimum", () => {
    expect(coupons.TEMPLEKUNDLI.kind).toBe("benefit");
    expect(coupons.TEMPLEKUNDLI.minAmount).toBe(1500);
  });

  it("DAILYDARSHAN is a free benefit with no restrictions", () => {
    expect(coupons.DAILYDARSHAN.kind).toBe("benefit");
    expect(coupons.DAILYDARSHAN.firstBookingOnly).toBeUndefined();
    expect(coupons.DAILYDARSHAN.minBookings).toBeUndefined();
    expect(coupons.DAILYDARSHAN.minAmount).toBeUndefined();
  });
});

describe("upcoming events", () => {
  // Fixed "today" so results are deterministic no matter when the tests run.
  const today = new Date("2026-08-07T12:00:00");

  it("never returns a past date", () => {
    for (const e of getUpcomingEvents(today)) {
      expect(e.dateISO >= "2026-08-07").toBe(true);
    }
  });

  it("returns events sorted soonest-first", () => {
    const dates = getUpcomingEvents(today).map((e) => e.dateISO);
    expect([...dates].sort()).toEqual(dates);
  });

  it("computes dates from the daysFromToday offsets", () => {
    const events = getUpcomingEvents(today);
    expect(events.find((e) => e.slug === "hanuman-pooja")?.dateISO).toBe(
      "2026-08-15" // today + 8 days
    );
    expect(events.find((e) => e.slug === "satyanarayan-katha")?.dateISO).toBe(
      "2026-08-17" // today + 10 days
    );
  });

  it("is deterministic for the same input date", () => {
    expect(getUpcomingEvents(today)).toEqual(getUpcomingEvents(today));
  });

  it("drops specs whose computed date has already passed", () => {
    const spec = (slug: string, daysFromToday: number) => ({
      title: `${slug} Pooja`,
      slug,
      daysFromToday,
      time: "9:00 AM IST",
      seats: "open",
      live: true,
      price: "₹501",
      emoji: "🪔",
      gradient: "from-saffron-500 to-maroon-700",
    });
    const events = getUpcomingEvents(today, [
      spec("past", -2),
      spec("today", 0),
      spec("future", 5),
    ]);
    expect(events.map((e) => e.slug)).toEqual(["today", "future"]);
  });
});
