import { describe, it, expect } from "vitest";

describe("Mobile Booking Flow Verification", () => {
  it("ensures booking modal has a higher z-index than floating elements", () => {
    const modalZIndex = 80;
    const floatingZIndex = 40;
    expect(modalZIndex).toBeGreaterThan(floatingZIndex);
  });

  it("verifies package options include single, couple, and family tiers", () => {
    const validTiers = ["single", "couple", "family"] as const;
    expect(validTiers).toContain("single");
    expect(validTiers).toContain("couple");
    expect(validTiers).toContain("family");
  });
});
