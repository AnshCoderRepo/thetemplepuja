import { beforeEach, describe, expect, it } from "vitest";
import { couponDiscount, couponProblem } from "../lib/coupons";
import { isCouponActive, poojas, type Coupon } from "../lib/data";
import { computeOrderAmount } from "../lib/razorpay";
import { upsertBooking, type BookingRecord } from "../lib/storage";

function booking(over: Partial<BookingRecord> = {}): BookingRecord {
  return {
    bookingId: "BK1",
    poojaSlug: "hanuman-pooja",
    poojaTitle: "Hanuman Pooja",
    date: "Fri, 14 Aug",
    time: "7:00 PM IST",
    panditName: "Assigned by templepujasewa",

    amount: 501,
    discount: 0,
    couponCode: null,
    addonCount: 0,
    createdAt: "2026-08-07T10:00:00.000Z",
    status: "confirmed",
    ...over,
  };
}

const details = {
  phone: "9876543210",
  name: "Aarav Sharma",
  gotra: "Kashyap",
  city: "New Delhi",
  email: "",
};

/** Context helper: price + (optionally) a phone number. */
const ctx = (price: number, phone = "9876543210") => ({
  phone,
  price,
  poojaTitle: "Hanuman Pooja",
});

beforeEach(() => {
  window.localStorage.clear();
});

describe("isCouponActive — default and explicit status", () => {
  it("treats existing coupons without explicit active flag as active by default", () => {
    const legacyCoupon: Coupon = {
      kind: "percent",
      label: "Legacy Coupon",
      description: "No active field present",
      value: 15,
    };
    expect(isCouponActive(legacyCoupon)).toBe(true);
  });

  it("returns true when active or isActive is true", () => {
    expect(
      isCouponActive({
        kind: "percent",
        label: "Active Coupon",
        description: "",
        active: true,
      })
    ).toBe(true);
    expect(
      isCouponActive({
        kind: "benefit",
        label: "Active Benefit",
        description: "",
        isActive: true,
      })
    ).toBe(true);
  });

  it("returns false when active or isActive is explicitly false", () => {
    expect(
      isCouponActive({
        kind: "percent",
        label: "Inactive Coupon",
        description: "",
        active: false,
      })
    ).toBe(false);
    expect(
      isCouponActive({
        kind: "benefit",
        label: "Inactive Benefit",
        description: "",
        isActive: false,
      })
    ).toBe(false);
  });
});

describe("couponProblem — eligibility rules & active/inactive status", () => {
  it("rejects unknown coupon codes", () => {
    expect(couponProblem("NOPE123", ctx(501))).toContain("not a valid coupon");
  });

  it("rejects an inactive coupon even if all other conditions match", () => {
    const customMap: Record<string, Coupon> = {
      OFF20: {
        kind: "percent",
        value: 20,
        label: "20% off",
        description: "Deactivated coupon",
        active: false,
      },
      BENEFIT_OFF: {
        kind: "benefit",
        label: "Free Prashad",
        description: "Inactive perk",
        isActive: false,
      },
    };
    expect(couponProblem("OFF20", ctx(1000), customMap)).toContain("currently inactive");
    expect(couponProblem("BENEFIT_OFF", ctx(1000), customMap)).toContain("currently inactive");
  });

  it("allows a coupon once activated", () => {
    const couponMap: Record<string, Coupon> = {
      PROMO10: {
        kind: "percent",
        value: 10,
        label: "10% off",
        description: "Promo",
        active: false,
      },
    };
    expect(couponProblem("PROMO10", ctx(1000), couponMap)).toContain("currently inactive");

    // Admin activates coupon
    couponMap.PROMO10.active = true;
    couponMap.PROMO10.isActive = true;
    expect(couponProblem("PROMO10", ctx(1000), couponMap)).toBeNull();
  });

  it("TEMPLE30 is valid for a fresh phone number", () => {
    expect(couponProblem("TEMPLE30", ctx(501))).toBeNull();
  });

  it("TEMPLE30 is rejected once the phone already has a confirmed booking", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(couponProblem("TEMPLE30", ctx(501))).toContain(
      "only for your first booking"
    );
  });

  it("TEMPLE30 asks for the mobile number before checking eligibility", () => {
    expect(couponProblem("TEMPLE30", ctx(501, ""))).toContain(
      "10-digit mobile number first"
    );
  });

  it("BUNDLE20 needs 3+ poojas including this one", () => {
    // No prior bookings → 0 + 1 = 1, under 3 → rejected.
    expect(couponProblem("BUNDLE20", ctx(1101))).toContain("3+ poojas");
    // Two prior confirmed bookings → 2 + 1 = 3 → valid.
    upsertBooking({
      ...details,
      booking: booking({ bookingId: "B1" }),
    });
    upsertBooking({
      ...details,
      booking: booking({ bookingId: "B2" }),
    });
    expect(couponProblem("BUNDLE20", ctx(1101))).toBeNull();
  });

  it("BUNDLE20 asks for the mobile number before checking booking count", () => {
    expect(couponProblem("BUNDLE20", ctx(1101, ""))).toContain(
      "10-digit mobile number first"
    );
  });

  it("TEMPLEKUNDLI enforces the ₹1,500 minimum pooja price", () => {
    expect(couponProblem("TEMPLEKUNDLI", ctx(501))).toContain("₹1,500");
    expect(couponProblem("TEMPLEKUNDLI", ctx(1501))).toBeNull();
  });

  it("MUHURAT is always valid (benefit coupon)", () => {
    expect(couponProblem("MUHURAT", ctx(501))).toBeNull();
    expect(couponProblem("MUHURAT", ctx(0))).toBeNull();
  });
});

describe("couponDiscount — price math with active/inactive handling", () => {
  it("gives 30% off with TEMPLE30, rounded to the nearest rupee", () => {
    expect(couponDiscount("TEMPLE30", 501)).toBe(150); // 150.3 → 150
    expect(couponDiscount("TEMPLE30", 1101)).toBe(330); // 330.3 → 330
  });

  it("gives 20% off with BUNDLE20", () => {
    expect(couponDiscount("BUNDLE20", 1101)).toBe(220); // 220.2 → 220
  });

  it("returns ₹0 discount when a percentage coupon is inactive", () => {
    const customMap: Record<string, Coupon> = {
      INACTIVE50: {
        kind: "percent",
        value: 50,
        label: "50% off",
        description: "Inactive",
        active: false,
      },
    };
    expect(couponDiscount("INACTIVE50", 1000, customMap)).toBe(0);
  });

  it("benefit coupons give no cash discount", () => {
    expect(couponDiscount("MUHURAT", 1101)).toBe(0);
    expect(couponDiscount("TEMPLEKUNDLI", 2501)).toBe(0);
  });

  it("unknown codes give no discount", () => {
    expect(couponDiscount("NOPE", 1101)).toBe(0);
  });
});

describe("computeOrderAmount — server-side order calculation with coupon status", () => {
  const testPooja = {
    ...poojas[0],
    price: 1100,
  };

  it("rejects inactive coupon and applies ₹0 discount during checkout amount calculation", () => {
    const customMap: Record<string, Coupon> = {
      SAVE20: {
        kind: "percent",
        value: 20,
        label: "20% off",
        description: "",
        active: false,
      },
    };

    const res = computeOrderAmount({
      pooja: testPooja,
      couponCode: "SAVE20",
      couponMap: customMap,
    });

    expect(res.couponProblem).toContain("currently inactive");
    expect(res.discount).toBe(0);
    expect(res.amount).toBe(1100);
  });

  it("applies discount when coupon is active", () => {
    const customMap: Record<string, Coupon> = {
      SAVE20: {
        kind: "percent",
        value: 20,
        label: "20% off",
        description: "",
        active: true,
      },
    };

    const res = computeOrderAmount({
      pooja: testPooja,
      couponCode: "SAVE20",
      couponMap: customMap,
    });

    expect(res.couponProblem).toBeNull();
    expect(res.discount).toBe(220);
    expect(res.amount).toBe(880);
  });
});
