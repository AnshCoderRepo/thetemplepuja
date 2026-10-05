import { beforeEach, describe, expect, it } from "vitest";
import {
  COMMON_GOTRAS,
  type DevoteeMember,
  type PackageTier,
} from "../features/bookings/types/booking.types";
import {
  upsertBooking,
  type BookingRecord,
  findUserByPhone,
} from "../lib/storage";
import { isValidIndianPhone } from "../lib/validation";

describe("Booking Flow Plans & Devotee Gotra Validation", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  function makeBooking(over: Partial<BookingRecord> = {}): BookingRecord {
    return {
      bookingId: "BK" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      poojaSlug: "satyanarayan-katha",
      poojaTitle: "Shree Satyanarayan Katha",
      date: "2026-10-15",
      time: "10:00 AM IST",
      panditName: "Acharya Ji (Vedic Purohit)",
      amount: 1101,
      discount: 0,
      couponCode: null,
      addonCount: 0,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      ...over,
    };
  }

  it("exposes standard Vedic gotras list including Kashyap", () => {
    expect(COMMON_GOTRAS).toContain("Kashyap");
    expect(COMMON_GOTRAS).toContain("Bharadwaj");
    expect(COMMON_GOTRAS).toContain("Vashishta");
    expect(COMMON_GOTRAS.length).toBeGreaterThanOrEqual(15);
  });

  describe("Single Plan", () => {
    it("persists 1 devotee name and 1 gotra with exactly 1 phone number", () => {
      const devotee: DevoteeMember = { name: "Aarav Sharma", gotra: "Kashyap" };
      const singlePhone = "9876543210";

      expect(isValidIndianPhone(singlePhone)).toBe(true);
      expect(devotee.name.trim()).toBeTruthy();
      expect(devotee.gotra.trim()).toBeTruthy();

      const user = upsertBooking({
        phone: singlePhone,
        name: devotee.name,
        gotra: devotee.gotra,
        city: "Varanasi",
        email: `${singlePhone}@templepujasewa.com`,
        booking: makeBooking({
          packageTier: "single",
          gotra: devotee.gotra,
          devotees: [devotee],
        }),
      });

      expect(user.phone).toBe(singlePhone);
      expect(user.name).toBe("Aarav Sharma");
      expect(user.gotra).toBe("Kashyap");
      expect(user.bookings[0].packageTier).toBe("single");
      expect(user.bookings[0].devotees).toHaveLength(1);
      expect(user.bookings[0].devotees?.[0]).toEqual({
        name: "Aarav Sharma",
        gotra: "Kashyap",
      });
    });
  });

  describe("Couple Plan", () => {
    it("persists 2 names and 2 gotras with only 1 phone number", () => {
      const couplePhone = "9812345678";
      const devotee1: DevoteeMember = { name: "Rohan Verma", gotra: "Bharadwaj" };
      const devotee2: DevoteeMember = { name: "Pooja Verma", gotra: "Kashyap" };

      expect(isValidIndianPhone(couplePhone)).toBe(true);
      expect(devotee1.name).toBeTruthy();
      expect(devotee1.gotra).toBeTruthy();
      expect(devotee2.name).toBeTruthy();
      expect(devotee2.gotra).toBeTruthy();

      const combinedName = `${devotee1.name} & ${devotee2.name}`;
      const combinedGotra = `${devotee1.gotra} / ${devotee2.gotra}`;

      const user = upsertBooking({
        phone: couplePhone,
        name: combinedName,
        gotra: combinedGotra,
        city: "Ayodhya",
        email: `${couplePhone}@templepujasewa.com`,
        booking: makeBooking({
          packageTier: "couple",
          gotra: combinedGotra,
          partnerName: devotee2.name,
          partnerGotra: devotee2.gotra,
          devotees: [devotee1, devotee2],
        }),
      });

      expect(user.phone).toBe(couplePhone);
      expect(user.name).toBe("Rohan Verma & Pooja Verma");
      expect(user.bookings[0].packageTier).toBe("couple");
      expect(user.bookings[0].partnerName).toBe("Pooja Verma");
      expect(user.bookings[0].partnerGotra).toBe("Kashyap");
      expect(user.bookings[0].devotees).toHaveLength(2);
      expect(user.bookings[0].devotees?.[0]).toEqual({
        name: "Rohan Verma",
        gotra: "Bharadwaj",
      });
      expect(user.bookings[0].devotees?.[1]).toEqual({
        name: "Pooja Verma",
        gotra: "Kashyap",
      });
    });
  });

  describe("Family Plan", () => {
    it("persists multiple people (as many as entered) with names and gotras, and only 1 phone number", () => {
      const familyPhone = "9765432109";
      const familyMembers: DevoteeMember[] = [
        { id: "1", name: "Suresh Gupta", gotra: "Gautam" },
        { id: "2", name: "Sunita Gupta", gotra: "Gautam" },
        { id: "3", name: "Amit Gupta", gotra: "Gautam" },
        { id: "4", name: "Neha Gupta", gotra: "Kashyap" },
        { id: "5", name: "Rameshwar Gupta", gotra: "Gautam" },
        { id: "6", name: "Shanti Gupta", gotra: "Gautam" },
      ];

      expect(isValidIndianPhone(familyPhone)).toBe(true);
      expect(familyMembers.length).toBe(6); // Beyond any old 5-person cap!

      // Each member has both name and gotra
      familyMembers.forEach((m) => {
        expect(m.name.trim()).toBeTruthy();
        expect(m.gotra.trim()).toBeTruthy();
      });

      const primaryName = `${familyMembers[0].name} & Family (${familyMembers.length} Members)`;
      const primaryGotra = familyMembers[0].gotra;

      const user = upsertBooking({
        phone: familyPhone,
        name: primaryName,
        gotra: primaryGotra,
        city: "Haridwar",
        email: `${familyPhone}@templepujasewa.com`,
        booking: makeBooking({
          packageTier: "family",
          gotra: primaryGotra,
          devotees: familyMembers,
          familyMembers: familyMembers,
        }),
      });

      expect(user.phone).toBe(familyPhone);
      expect(user.bookings[0].packageTier).toBe("family");
      expect(user.bookings[0].devotees).toHaveLength(6);
      expect(user.bookings[0].familyMembers).toHaveLength(6);
      expect(user.bookings[0].devotees?.[3].name).toBe("Neha Gupta");
      expect(user.bookings[0].devotees?.[3].gotra).toBe("Kashyap");
    });
  });

  describe("Phone Requirement in All Cases", () => {
    it("requires only 1 phone number whether single, couple, or family", () => {
      const validPhone = "9876543210";
      const invalidPhone1 = "12345";
      const invalidPhone2 = "abcdefghij";

      expect(isValidIndianPhone(validPhone)).toBe(true);
      expect(isValidIndianPhone(invalidPhone1)).toBe(false);
      expect(isValidIndianPhone(invalidPhone2)).toBe(false);
    });
  });
});
