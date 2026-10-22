import { describe, expect, it } from "vitest";
import { DEMO_POOJA, isDemoSlug } from "@/lib/data";
import { getCatalogPooja } from "@/lib/catalog";
import { computeOrderAmount } from "@/lib/razorpay";

describe("Test Demo Pooja (1 Rupee)", () => {
  it("has price exactly 1 rupee and is active", () => {
    expect(DEMO_POOJA.price).toBe(1);
    expect(DEMO_POOJA.slug).toBe("demo-pooja");
    expect(DEMO_POOJA.title).toContain("Test Demo Pooja");
    expect(DEMO_POOJA.active).not.toBe(false);
    expect(DEMO_POOJA.online).toBe(true);
    expect(DEMO_POOJA.packages).toBeDefined();
    expect(DEMO_POOJA.packages?.every((pkg) => pkg.price === 1)).toBe(true);
  });

  it("recognises all demo slug aliases", () => {
    expect(isDemoSlug("demo-pooja")).toBe(true);
    expect(isDemoSlug("demo-puja")).toBe(true);
    expect(isDemoSlug("test-demo-pooja")).toBe(true);
    expect(isDemoSlug("test-demo-puja")).toBe(true);
    expect(isDemoSlug("test-pooja")).toBe(true);
    expect(isDemoSlug("test-puja")).toBe(true);
    expect(isDemoSlug("test-pooja-1-rupee")).toBe(true);
    expect(isDemoSlug("satyanarayan-katha")).toBe(false);
  });

  it("resolves via getCatalogPooja", () => {
    const found = getCatalogPooja("demo-pooja");
    expect(found).toBeDefined();
    expect(found?.price).toBe(1);
    expect(found?.slug).toBe("demo-pooja");
  });

  it("computes 1 rupee (100 paise) order amount in computeOrderAmount across all tiers", () => {
    const single = computeOrderAmount({ pooja: DEMO_POOJA, packageTier: "single" });
    expect(single.amount).toBe(1);
    expect(single.subtotal).toBe(1);

    const couple = computeOrderAmount({ pooja: DEMO_POOJA, packageTier: "couple" });
    expect(couple.amount).toBe(1);
    expect(couple.subtotal).toBe(1);

    const family = computeOrderAmount({ pooja: DEMO_POOJA, packageTier: "family" });
    expect(family.amount).toBe(1);
    expect(family.subtotal).toBe(1);
  });
});
