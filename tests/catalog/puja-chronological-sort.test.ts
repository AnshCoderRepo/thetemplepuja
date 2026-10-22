import { describe, expect, it } from "vitest";
import {
  getIndiaDateISO,
  parseTimeToMinutes,
  resolvePoojaScheduleInfo,
  sortPoojasChronologically,
  TIMEZONE_INDIA,
} from "@/lib/puja-sort";
import type { Pooja } from "@/lib/data";
import { DEMO_POOJA, poojas } from "@/lib/data";

function createMockPooja(overrides: Partial<Pooja> = {}): Pooja {
  return {
    slug: "mock-puja",
    title: "Mock Puja",
    hindiTitle: "मॉक पूजा",
    emoji: "🪔",
    gradient: "from-amber-400 to-orange-600",
    price: 1100,
    duration: "1 hour",
    bestMuhurat: "Morning",
    description: "Description",
    benefits: ["Benefit 1"],
    ...overrides,
  };
}

describe("Puja Chronological Sorting & Date Resolution (Asia/Kolkata)", () => {
  it("uses Asia/Kolkata timezone configuration", () => {
    expect(TIMEZONE_INDIA).toBe("Asia/Kolkata");
  });

  it("safely generates YYYY-MM-DD in Asia/Kolkata without UTC day drift", () => {
    // 2026-10-14 20:00:00 UTC is 2026-10-15 01:30:00 in Asia/Kolkata
    const lateUtc = new Date("2026-10-14T20:00:00.000Z");
    expect(getIndiaDateISO(lateUtc)).toBe("2026-10-15");

    // 2026-10-15 19:00:00 UTC is 2026-10-16 00:30:00 in Asia/Kolkata (past midnight in India)
    const midnightBoundaryUtc = new Date("2026-10-15T19:00:00.000Z");
    expect(getIndiaDateISO(midnightBoundaryUtc)).toBe("2026-10-16");
  });

  it("parses diverse time formats correctly into minutes from midnight", () => {
    expect(parseTimeToMinutes("Live Today (Instant)")).toBe(0);
    expect(parseTimeToMinutes("instant")).toBe(0);
    expect(parseTimeToMinutes("5:00 AM IST")).toBe(300);
    expect(parseTimeToMinutes("08:00 AM IST")).toBe(480);
    expect(parseTimeToMinutes("10:00 AM IST")).toBe(600);
    expect(parseTimeToMinutes("12:00 PM IST")).toBe(720);
    expect(parseTimeToMinutes("1:30 PM IST")).toBe(810);
    expect(parseTimeToMinutes("6:30 PM IST")).toBe(1110);
    expect(parseTimeToMinutes("7:00 PM IST")).toBe(1140);
    expect(parseTimeToMinutes("9:00 PM IST")).toBe(1260);
    expect(parseTimeToMinutes("11:59 PM")).toBe(1439);
    expect(parseTimeToMinutes("12:00 AM")).toBe(0);
    expect(parseTimeToMinutes("14:30")).toBe(870);
    expect(parseTimeToMinutes("invalid-time")).toBe(9999);
    expect(parseTimeToMinutes("")).toBe(9999);
    expect(parseTimeToMinutes(undefined)).toBe(9999);
  });

  it("orders today's pujas first, tomorrow's second, and later dates in ascending order", () => {
    const todayISO = "2026-10-15";

    const mockPoojas: Pooja[] = [
      createMockPooja({
        slug: "future-oct-20",
        title: "Future Puja Oct 20",
        startDate: "2026-10-20",
        eventTime: "8:00 AM IST",
      }),
      createMockPooja({
        slug: "today-evening",
        title: "Today Evening Puja",
        startDate: "2026-10-15",
        eventTime: "6:30 PM IST",
      }),
      createMockPooja({
        slug: "tomorrow-evening",
        title: "Tomorrow Evening Puja",
        startDate: "2026-10-16",
        eventTime: "7:00 PM IST",
      }),
      createMockPooja({
        slug: "today-morning",
        title: "Today Morning Puja",
        startDate: "2026-10-15",
        eventTime: "8:00 AM IST",
      }),
      createMockPooja({
        slug: "tomorrow-morning",
        title: "Tomorrow Morning Puja",
        startDate: "2026-10-16",
        eventTime: "5:00 AM IST",
      }),
    ];

    const sorted = sortPoojasChronologically(mockPoojas, new Date("2026-10-15T10:00:00Z"), todayISO);

    expect(sorted.map((p) => p.slug)).toEqual([
      "today-morning",    // Today 8:00 AM
      "today-evening",    // Today 6:30 PM
      "tomorrow-morning", // Tomorrow 5:00 AM
      "tomorrow-evening", // Tomorrow 7:00 PM
      "future-oct-20",    // Later: Oct 20
    ]);
  });

  it("handles same-day pujas with different start times properly", () => {
    const todayISO = "2026-10-15";

    const sameDayPoojas: Pooja[] = [
      createMockPooja({
        slug: "p-night",
        title: "Night",
        startDate: "2026-10-15",
        eventTime: "9:00 PM IST",
      }),
      createMockPooja({
        slug: "p-early-dawn",
        title: "Early Dawn",
        startDate: "2026-10-15",
        eventTime: "5:00 AM IST",
      }),
      createMockPooja({
        slug: "p-afternoon",
        title: "Afternoon",
        startDate: "2026-10-15",
        eventTime: "12:30 PM IST",
      }),
      createMockPooja({
        slug: "p-morning",
        title: "Morning",
        startDate: "2026-10-15",
        eventTime: "8:00 AM IST",
      }),
    ];

    const sorted = sortPoojasChronologically(sameDayPoojas, new Date("2026-10-15T12:00:00Z"), todayISO);
    expect(sorted.map((p) => p.slug)).toEqual([
      "p-early-dawn", // 5:00 AM
      "p-morning",    // 8:00 AM
      "p-afternoon",  // 12:30 PM
      "p-night",      // 9:00 PM
    ]);
  });

  it("puts past pujas after upcoming pujas, and undated pujas at the very end", () => {
    const todayISO = "2026-10-15";

    const mixedPoojas: Pooja[] = [
      createMockPooja({
        slug: "past-puja-1",
        title: "Past Puja Oct 10",
        startDate: "2026-10-10",
        eventTime: "8:00 AM IST",
      }),
      createMockPooja({
        slug: "undated-puja",
        title: "Undated Puja",
        startDate: "invalid-date",
        eventTime: "8:00 AM IST",
      }),
      createMockPooja({
        slug: "today-puja",
        title: "Today Puja",
        startDate: "2026-10-15",
        eventTime: "8:00 AM IST",
      }),
      createMockPooja({
        slug: "future-puja",
        title: "Future Puja",
        startDate: "2026-10-18",
        eventTime: "8:00 AM IST",
      }),
    ];

    const sorted = sortPoojasChronologically(mixedPoojas, new Date("2026-10-15T00:00:00Z"), todayISO);
    expect(sorted.map((p) => p.slug)).toEqual([
      "today-puja",    // 1. Today
      "future-puja",   // 2. Future
      "past-puja-1",   // 3. Past
      "undated-puja",  // 4. Undated/Invalid
    ]);
  });

  it("maintains stable sorting when multiple pujas have the exact same date and time", () => {
    const todayISO = "2026-10-15";

    const identicalSchedulePoojas: Pooja[] = [
      createMockPooja({
        slug: "first-registered",
        title: "First Registered",
        startDate: "2026-10-15",
        eventTime: "8:00 AM IST",
        price: 1000,
      }),
      createMockPooja({
        slug: "second-registered",
        title: "Second Registered",
        startDate: "2026-10-15",
        eventTime: "8:00 AM IST",
        price: 2000,
      }),
      createMockPooja({
        slug: "third-registered",
        title: "Third Registered",
        startDate: "2026-10-15",
        eventTime: "8:00 AM IST",
        price: 3000,
      }),
    ];

    const sorted = sortPoojasChronologically(identicalSchedulePoojas, new Date("2026-10-15T00:00:00Z"), todayISO);
    expect(sorted.map((p) => p.slug)).toEqual([
      "first-registered",
      "second-registered",
      "third-registered",
    ]);
  });

  it("sorts DEMO_POOJA (daysFromToday: 0, Live Instant) at the very top for today", () => {
    const list = [
      ...poojas.slice(0, 3),
      DEMO_POOJA,
    ];

    const sorted = sortPoojasChronologically(list);
    // DEMO_POOJA is scheduled for today with instant/live start time (0 minutes),
    // so it should be prioritized first among today's events!
    expect(sorted[0].slug).toBe("demo-pooja");
  });
});
