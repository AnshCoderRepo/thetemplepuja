import { describe, expect, it } from "vitest";
import { computeAnalytics } from "../lib/analytics";
import type { UserProfile } from "../lib/storage";

describe("computeAnalytics", () => {
  const mockUsers: UserProfile[] = [
    {
      id: "U1",
      name: "Ramesh Sharma",
      gotra: "Kashyap",
      city: "Varanasi",
      phone: "9876543210",
      email: "ramesh@example.com",
      createdAt: "2026-09-25T10:00:00.000Z",
      bookings: [
        {
          bookingId: "BKG001",
          poojaSlug: "satyanarayan-katha",
          poojaTitle: "Satyanarayan Katha",
          date: "Sun, 28 Sep",
          time: "7:00 PM IST",
          panditName: "Pt. Sharma",
          amount: 1101,
          discount: 100,
          couponCode: "PUJA100",
          addonCount: 0,
          createdAt: "2026-09-25T10:05:00.000Z",
          status: "confirmed",
        },
        {
          bookingId: "BKG002",
          poojaSlug: "rudrabhishek",
          poojaTitle: "Maha Rudrabhishek",
          date: "Mon, 29 Sep",
          time: "6:00 AM IST",
          panditName: "Pt. Shastri",
          amount: 2101,
          discount: 0,
          couponCode: null,
          addonCount: 0,
          createdAt: "2026-09-26T12:00:00.000Z",
          status: "confirmed",
        },
      ],
    },
    {
      id: "U2",
      name: "Pooja Verma",
      gotra: "Bhardwaj",
      city: "New Delhi",
      phone: "9811122233",
      email: "pooja@example.com",
      createdAt: "2026-09-20T08:00:00.000Z",
      bookings: [
        {
          bookingId: "BKG003",
          poojaSlug: "rudrabhishek",
          poojaTitle: "Maha Rudrabhishek",
          date: "Wed, 24 Sep",
          time: "8:00 AM IST",
          panditName: "Pt. Shastri",
          amount: 2101,
          discount: 0,
          couponCode: null,
          addonCount: 0,
          createdAt: "2026-09-20T08:15:00.000Z",
          status: "cancelled",
        },
        {
          bookingId: "BKG004",
          poojaSlug: "hanuman-pooja",
          poojaTitle: "Hanuman Pooja",
          date: "Tue, 23 Sep",
          time: "7:00 PM IST",
          panditName: "Pt. Tiwari",
          amount: 501,
          discount: 50,
          couponCode: "SAVE50",
          addonCount: 0,
          createdAt: "2026-09-21T09:30:00.000Z",
          status: "refunded",
        },
      ],
    },
  ];

  it("calculates total revenue, active bookings, and cancellations accurately", () => {
    const stats = computeAnalytics(mockUsers, 30);
    expect(stats.totalBookings).toBe(4);
    expect(stats.activeBookings).toBe(2);
    expect(stats.cancelledBookings).toBe(1);
    expect(stats.refundedBookings).toBe(1);
    expect(stats.totalRevenue).toBe(3202); // 1101 + 2101
    expect(stats.averageOrderValue).toBe(1601);
  });

  it("computes popular poojas metrics with breakdown", () => {
    const stats = computeAnalytics(mockUsers, 30);
    const rudra = stats.popularPoojas.find((p) => p.slug === "rudrabhishek");
    expect(rudra).toBeDefined();
    expect(rudra?.count).toBe(2);
    expect(rudra?.revenue).toBe(2101);
    expect(rudra?.cancelledCount).toBe(1);
  });

  it("aggregates demographic data by city and gotra", () => {
    const stats = computeAnalytics(mockUsers, 30);
    expect(stats.cityMetrics.length).toBe(2);
    const varanasi = stats.cityMetrics.find((c) => c.city === "Varanasi");
    expect(varanasi?.devoteeCount).toBe(1);
    expect(varanasi?.bookingCount).toBe(2);
    expect(varanasi?.revenue).toBe(3202);

    expect(stats.gotraMetrics.some((g) => g.gotra === "Kashyap")).toBe(true);
  });

  it("ranks top devotees by spend and booking count", () => {
    const stats = computeAnalytics(mockUsers, 30);
    expect(stats.topDevotees[0].name).toBe("Ramesh Sharma");
    expect(stats.topDevotees[0].totalSpent).toBe(3202);
  });

  it("computes discount & promo code impact", () => {
    const stats = computeAnalytics(mockUsers, 30);
    expect(stats.totalDiscountsGiven).toBe(150); // 100 + 50
    expect(stats.couponBookingsCount).toBe(2);
  });
});
