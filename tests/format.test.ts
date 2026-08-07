import { describe, expect, it } from "vitest";
import { formatINR } from "../lib/format";

describe("formatINR", () => {
  it("formats small amounts without separators", () => {
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(501)).toBe("₹501");
  });

  it("adds a thousands separator", () => {
    expect(formatINR(1101)).toBe("₹1,101");
    expect(formatINR(25001)).toBe("₹25,001");
  });

  it("uses Indian lakh/crore grouping", () => {
    expect(formatINR(12345678)).toBe("₹1,23,45,678");
  });

  it("passes fractional amounts through untouched", () => {
    expect(formatINR(150.5)).toBe("₹150.5");
  });

  it("handles negative amounts", () => {
    expect(formatINR(-100)).toBe("₹-100");
  });
});
