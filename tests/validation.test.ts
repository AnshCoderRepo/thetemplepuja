import { describe, expect, it } from "vitest";
import { isValidIndianPhone, validateBookingInput } from "../lib/validation";

const validInput = {
  prayerSlug: "hanuman-pooja",
  name: "Aarav Sharma",
  gotra: "Kashyap",
  city: "New Delhi",
  reason: "For my daughter's wedding",
  phone: "9876543210",
};

describe("isValidIndianPhone", () => {
  it("accepts 10-digit numbers starting with 6–9", () => {
    expect(isValidIndianPhone("9876543210")).toBe(true);
    expect(isValidIndianPhone("6123456789")).toBe(true);
    expect(isValidIndianPhone(" 9876543210 ")).toBe(true); // trims whitespace
  });

  it("rejects invalid numbers", () => {
    expect(isValidIndianPhone("5876543210")).toBe(false); // starts with 5
    expect(isValidIndianPhone("987654321")).toBe(false); // 9 digits
    expect(isValidIndianPhone("98765432101")).toBe(false); // 11 digits
    expect(isValidIndianPhone("98765abc10")).toBe(false); // letters
    expect(isValidIndianPhone("")).toBe(false);
  });
});

describe("validateBookingInput", () => {
  it("accepts a complete, valid form", () => {
    expect(validateBookingInput(validInput)).toEqual([]);
  });

  it("lists every missing field for an empty form", () => {
    const missing = validateBookingInput({
      prayerSlug: "",
      name: "",
      gotra: "",
      city: "",
      reason: "",
      phone: "",
    });
    expect(missing).toEqual([
      "choose a prayer",
      "your name",
      "gotra",
      "city",
      "why you want this puja",
      "a valid 10-digit mobile number",
    ]);
  });

  it("does not require a date — the date comes from a fixed event slot", () => {
    expect(validateBookingInput(validInput)).toEqual([]);
  });

  it("enforces minimum lengths (name > 1, city > 1, reason > 2)", () => {
    expect(
      validateBookingInput({ ...validInput, name: "A", city: "X", reason: "ab" })
    ).toEqual(["your name", "city", "why you want this puja"]);
  });

  it("requires gotra to be non-empty", () => {
    expect(validateBookingInput({ ...validInput, gotra: "  " })).toEqual([
      "gotra",
    ]);
  });
});
