import { describe, expect, it } from "vitest";
import {
  activePoojas,
  getPoojaSchedule,
  poojas,
  sortPoojasByRecent,
  type Pooja,
} from "../lib/data";

describe("Pooja Schedule & Landing Page Limiting (8 poojas, 4 per row, recent first)", () => {
  it("computes authentic date, time and fullSchedule for all 12 default poojas", () => {
    expect(poojas).toHaveLength(12);

    for (const p of poojas) {
      const schedule = getPoojaSchedule(p);
      expect(schedule.date).toBeTruthy();
      expect(schedule.time).toBeTruthy();
      expect(schedule.dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(schedule.fullSchedule).toContain(schedule.date);
      expect(schedule.fullSchedule).toContain(schedule.time);
    }
  });

  it("respects explicit startDate and eventTime if specified on a pooja", () => {
    const customPooja: Pooja = {
      slug: "special-navratri-chandi-path",
      title: "Special Navratri Chandi Path",
      emoji: "🔱",
      gradient: "from-red-500 to-amber-600",
      price: 5100,
      duration: "3 hours",
      startDate: "2026-10-25",
      eventTime: "04:30 AM IST",
      description: "Grand Chandi Homa",
      benefits: ["Ultimate protection"],
    };

    const schedule = getPoojaSchedule(customPooja);
    expect(schedule.dateISO).toBe("2026-10-25");
    expect(schedule.time).toBe("04:30 AM IST");
    expect(schedule.fullSchedule).toContain("04:30 AM IST");
  });

  it("gracefully generates auspicious dates for new poojas (e.g. up to 35+ poojas) without dates", () => {
    const mockAddedPooja: Pooja = {
      slug: "newly-added-rudra-havan",
      title: "Newly Added Rudra Havan",
      emoji: "🔥",
      gradient: "from-amber-500 to-orange-600",
      price: 2100,
      duration: "2 hours",
      bestMuhurat: "Pradosh Kaal Evening",
      description: "Auspicious havan",
      benefits: ["Peace & prosperity"],
    };

    const schedule = getPoojaSchedule(mockAddedPooja);
    expect(schedule.date).toBeTruthy();
    expect(schedule.time).toBe("06:30 PM IST");
    expect(schedule.dateISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("limits landing page catalog to exactly 8 poojas (4 on each row)", () => {
    const list = activePoojas(poojas);
    const landingDisplayed = list.slice(0, 8);
    expect(landingDisplayed).toHaveLength(8);

    // 8 poojas = 2 rows of 4 cards
    const row1 = landingDisplayed.slice(0, 4);
    const row2 = landingDisplayed.slice(4, 8);
    expect(row1).toHaveLength(4);
    expect(row2).toHaveLength(4);

    // All-poojas page (/book) receives the entire catalog
    expect(list.length).toBeGreaterThanOrEqual(12);
  });

  it("ensures the most recently added pooja is shown at the very top of both landing and all-poojas page", () => {
    const newlyAddedPooja: Pooja = {
      slug: "baglamukhi-shatru-shanti-pooja",
      title: "Maa Baglamukhi Shatru Shanti Pooja",
      emoji: "🛡️",
      gradient: "from-yellow-500 to-amber-700",
      price: 3100,
      duration: "2 hours",
      description: "Auspicious protection ritual",
      benefits: ["Victory and peace"],
    };

    // When the new pooja is added to the catalog array:
    const catalogWithNew = [...poojas, newlyAddedPooja];
    const sorted = activePoojas(catalogWithNew);

    // The newly added pooja must be #1
    expect(sorted[0].slug).toBe("baglamukhi-shatru-shanti-pooja");

    // On the landing page (top 8), it is shown in slot #1
    const landingPoojas = sorted.slice(0, 8);
    expect(landingPoojas[0].slug).toBe("baglamukhi-shatru-shanti-pooja");
    expect(landingPoojas).toHaveLength(8);

    // On the all-poojas page (/book), it is also shown in slot #1
    expect(sorted[0].slug).toBe("baglamukhi-shatru-shanti-pooja");
  });

  it("sorts by createdAt descending when multiple new poojas have timestamps", () => {
    const poojaOld: Pooja = {
      slug: "older-pooja",
      title: "Older Added Pooja",
      emoji: "📿",
      gradient: "from-amber-400 to-orange-500",
      price: 1100,
      duration: "1 hour",
      createdAt: "2026-10-01T10:00:00Z",
      description: "Old",
      benefits: ["Peace"],
    };

    const poojaNewest: Pooja = {
      slug: "brand-new-pooja",
      title: "Brand New Added Pooja",
      emoji: "✨",
      gradient: "from-rose-400 to-red-500",
      price: 2100,
      duration: "1.5 hours",
      createdAt: "2026-10-06T00:00:00Z",
      description: "New",
      benefits: ["Success"],
    };

    const sorted = sortPoojasByRecent([...poojas, poojaOld, poojaNewest]);
    expect(sorted[0].slug).toBe("brand-new-pooja");
    expect(sorted[1].slug).toBe("older-pooja");
  });
});
