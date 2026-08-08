import { describe, expect, it } from "vitest";
import {
  getCatalogCoupons,
  getCatalogEventSpecs,
  getCatalogPooja,
  getCatalogPoojas,
  resetCatalogCoupons,
  resetCatalogEventSpecs,
  resetCatalogPoojas,
  saveCatalogCoupons,
  saveCatalogEventSpecs,
  saveCatalogPoojas,
} from "../lib/catalog";
import { couponDiscount, couponProblem } from "../lib/coupons";
import type { Coupon, Pooja, UpcomingEventSpec } from "../lib/data";

describe("catalog (admin-managed overrides)", () => {
  it("falls back to the static catalog when no override has been saved", () => {
    expect(getCatalogPoojas().length).toBe(12);
    expect(getCatalogPooja("hanuman-pooja")?.price).toBe(501);
    expect(getCatalogPooja("does-not-exist")).toBeUndefined();
    expect(Object.keys(getCatalogCoupons()).sort()).toEqual([
      "BUNDLE20",
      "MUHURAT",
      "TEMPLE30",
      "TEMPLEKUNDLI",
    ]);
    expect(getCatalogEventSpecs().length).toBe(6);
  });

  it("saves, reads back and resets poojas", () => {
    const extra: Pooja = {
      slug: "ganesh-pooja",
      title: "Ganesh Pooja",
      hindiTitle: "गणेश पूजा",
      emoji: "🐘",
      gradient: "from-saffron-500 to-saffron-700",
      price: 1101,
      duration: "1.5 hours",
      bestMuhurat: "Wednesday",
      description: "Worship of Lord Ganesha.",
      benefits: ["Removal of obstacles"],
    };
    saveCatalogPoojas([...getCatalogPoojas(), extra]);
    expect(getCatalogPoojas()).toHaveLength(13);
    expect(getCatalogPooja("ganesh-pooja")?.price).toBe(1101);

    resetCatalogPoojas();
    expect(getCatalogPoojas()).toHaveLength(12);
    expect(getCatalogPooja("ganesh-pooja")).toBeUndefined();
  });

  it("saves, reads back and resets event specs", () => {
    const extra: UpcomingEventSpec = {
      title: "Ganesh Utsav Pooja",
      slug: "ganesh-pooja",
      daysFromToday: 5,
      time: "7:00 PM IST",
      seats: "20 spots open",
      live: true,
      price: "₹1,101",
      emoji: "🐘",
      gradient: "from-saffron-500 to-saffron-700",
    };
    saveCatalogEventSpecs([...getCatalogEventSpecs(), extra]);
    expect(getCatalogEventSpecs()).toHaveLength(7);
    expect(getCatalogEventSpecs().some((e) => e.slug === "ganesh-pooja")).toBe(true);

    resetCatalogEventSpecs();
    expect(getCatalogEventSpecs()).toHaveLength(6);
  });

  it("saves, reads back and resets coupons", () => {
    const adminCoupons: Record<string, Coupon> = {
      ...getCatalogCoupons(),
      GANESHA10: {
        kind: "percent",
        value: 10,
        label: "10% off Ganesh poojas",
        description: "Ganesh Utsav special.",
      },
    };
    saveCatalogCoupons(adminCoupons);
    expect(Object.keys(getCatalogCoupons())).toContain("GANESHA10");

    resetCatalogCoupons();
    expect(Object.keys(getCatalogCoupons())).not.toContain("GANESHA10");
  });

  it("coupon helpers honour an admin-supplied coupon map", () => {
    const adminCoupons: Record<string, Coupon> = {
      ...getCatalogCoupons(),
      GANESHA10: {
        kind: "percent",
        value: 10,
        label: "10% off Ganesh poojas",
        description: "Ganesh Utsav special.",
      },
    };
    const ctx = { phone: "9876543210", price: 1000, poojaTitle: "Ganesh Pooja" };

    // A coupon added by the admin is recognised and discounted when the map is passed.
    expect(couponProblem("GANESHA10", ctx, adminCoupons)).toBeNull();
    expect(couponDiscount("GANESHA10", 1000, adminCoupons)).toBe(100);

    // Without the map (default static catalog) the code is unknown.
    expect(couponProblem("GANESHA10", ctx)).toContain("not a valid coupon");
    expect(couponDiscount("GANESHA10", 1000)).toBe(0);
  });

  it("default-map behaviour is unchanged for built-in coupons", () => {
    expect(
      couponProblem("TEMPLE30", { phone: "9876543210", price: 501, poojaTitle: "Hanuman Pooja" })
    ).toBeNull();
    expect(couponDiscount("TEMPLE30", 501)).toBe(150);
    expect(
      couponProblem("MUHURAT", { phone: "9876543210", price: 501, poojaTitle: "Hanuman Pooja" })
    ).toBeNull();
    expect(couponDiscount("MUHURAT", 501)).toBe(0);
  });
});
