import { describe, expect, it } from "vitest";
import { reviewIn, type UserProfile, type BookingRecord } from "@/lib/storage";

function makeTestUser(bookingId = "BK-TEST-1"): UserProfile {
  const booking: BookingRecord = {
    bookingId,
    poojaSlug: "satyanarayan-katha",
    poojaTitle: "Satyanarayan Katha",
    date: "Thu, 15 Oct",
    time: "6:00 PM IST",
    panditName: "Acharya Shastri",
    amount: 1101,
    discount: 0,
    couponCode: null,
    addonCount: 0,
    createdAt: new Date().toISOString(),
    status: "confirmed",
  };

  return {
    id: "user-1",
    name: "Aakash Verma",
    phone: "9876543210",
    gotra: "Kashyap",
    city: "Varanasi",
    email: "aakash@example.com",
    createdAt: new Date().toISOString(),
    bookings: [booking],
  };
}

describe("Booking Reviews & Ratings (reviewIn)", () => {
  it("records a 5-star rating and review text on an existing confirmed booking", () => {
    const user = makeTestUser("BK-100");
    const { ok, booking } = reviewIn(
      [user],
      "BK-100",
      5,
      "Divine sankalp and pristine recitation by pandit ji.",
      "9876543210"
    );

    expect(ok).toBe(true);
    expect(booking?.rating).toBe(5);
    expect(booking?.review).toBe("Divine sankalp and pristine recitation by pandit ji.");
    expect(booking?.reviewedAt).toBeDefined();
  });

  it("clamps out-of-range ratings to 1..5 stars", () => {
    const user = makeTestUser("BK-200");
    const resLow = reviewIn([user], "BK-200", -2, "Review", "9876543210");
    expect(resLow.booking?.rating).toBe(1);

    const resHigh = reviewIn([user], "BK-200", 10, "Review", "9876543210");
    expect(resHigh.booking?.rating).toBe(5);
  });

  it("allows updating/editing an existing review", () => {
    const user = makeTestUser("BK-300");
    reviewIn([user], "BK-300", 4, "Great experience", "9876543210");

    const updated = reviewIn([user], "BK-300", 5, "Updated: Truly transcendent experience!", "9876543210");
    expect(updated.ok).toBe(true);
    expect(updated.booking?.rating).toBe(5);
    expect(updated.booking?.review).toBe("Updated: Truly transcendent experience!");
  });

  it("returns ok: false for a non-existent booking ID", () => {
    const user = makeTestUser("BK-400");
    const result = reviewIn([user], "NON-EXISTENT", 5, "Test", "9876543210");
    expect(result.ok).toBe(false);
    expect(result.booking).toBeUndefined();
  });

  it("returns ok: false if the phone does not match the booking owner", () => {
    const user = makeTestUser("BK-500");
    const result = reviewIn([user], "BK-500", 5, "Test", "9999999999");
    expect(result.ok).toBe(false);
  });
});
