import { describe, expect, it } from "vitest";
import {
  defaultTemples,
  getTempleForPooja,
  poojas,
  resolvePoojaTemple,
  type Pooja,
} from "@/lib/data";
import { type BookingRecord, type BookingInput, upsertInto } from "@/lib/storage";

describe("Temple Puja vs Home Puja Business Logic Suite", () => {
  const sampleTemple = defaultTemples[0]; // Kashi Vishwanath Temple

  const templePuja: Pooja = {
    slug: "shiva-rudrabhishek-temple",
    title: "Maha Rudrabhishek Seva",
    hindiTitle: "महा रुद्राभिषेक सेवा",
    emoji: "🔱",
    gradient: "from-amber-600 to-orange-700",
    price: 2100,
    duration: "2 hours",
    bestMuhurat: "Pradosh Kaal",
    description: "Sacred Rudrabhishek performed at temple.",
    benefits: ["Spiritual peace", "Divine blessings"],
    type: "temple",
    templeId: sampleTemple.id,
    templeSlug: sampleTemple.slug,
    templeName: sampleTemple.name,
    templeSlugs: [sampleTemple.slug],
  };

  const homePuja: Pooja = {
    slug: "satyanarayan-katha-home",
    title: "Griha Satyanarayan Katha",
    hindiTitle: "गृह सत्यनारायण कथा",
    emoji: "🏡",
    gradient: "from-blue-600 to-indigo-700",
    price: 3100,
    duration: "3 hours",
    bestMuhurat: "Purnima",
    description: "Vedic Panditji arrives at your home for Satyanarayan Katha.",
    benefits: ["Family harmony", "Prosperity"],
    type: "home",
  };

  describe("1 & 2 & 4. Temple Association Logic & Admin Form Constraints", () => {
    it("associates temple for Temple Puja", () => {
      const resolved = resolvePoojaTemple(templePuja, defaultTemples);
      expect(resolved).not.toBeNull();
      expect(resolved?.slug).toBe(sampleTemple.slug);

      const helperTemple = getTempleForPooja(templePuja, defaultTemples);
      expect(helperTemple).not.toBeNull();
      expect(helperTemple?.name).toBe(sampleTemple.name);
    });

    it("NEVER associates a temple with Home Puja (returns null, no fallback to Kashi)", () => {
      const resolved = resolvePoojaTemple(homePuja, defaultTemples);
      expect(resolved).toBeNull();

      const helperTemple = getTempleForPooja(homePuja, defaultTemples);
      expect(helperTemple).toBeNull();
    });

    it("clears all temple associations when converting Temple Puja to Home Puja", () => {
      // Simulate draft edit converting Temple to Home
      const convertedDraft: Pooja = {
        ...templePuja,
        type: "home",
        templeId: undefined,
        templeSlug: undefined,
        templeName: undefined,
        templeSlugs: [],
      };

      expect(convertedDraft.type).toBe("home");
      expect(convertedDraft.templeId).toBeUndefined();
      expect(convertedDraft.templeSlug).toBeUndefined();
      expect(convertedDraft.templeName).toBeUndefined();
      expect(convertedDraft.templeSlugs).toEqual([]);

      // Ensure getTempleForPooja resolves to null
      expect(getTempleForPooja(convertedDraft, defaultTemples)).toBeNull();
      expect(resolvePoojaTemple(convertedDraft, defaultTemples)).toBeNull();
    });
  });

  describe("3 & 7. Unified Public Puja Catalog", () => {
    it("contains both Temple and Home pujas in the same unified list", () => {
      const catalog = [...poojas, templePuja, homePuja];

      // Public site displays unified list
      expect(catalog.some((p) => p.type === "home")).toBe(true);
      expect(catalog.some((p) => p.type === "temple" || !p.type)).toBe(true);

      // Verify counts calculate correctly
      const templeCount = catalog.filter((p) => p.type === "temple" || !p.type).length;
      const homeCount = catalog.filter((p) => p.type === "home").length;
      const totalCount = catalog.length;

      expect(templeCount + homeCount).toBe(totalCount);
      expect(homeCount).toBeGreaterThanOrEqual(1);
      expect(templeCount).toBeGreaterThanOrEqual(1);
    });

    it("filters correctly by ritual type without splitting into different catalogs", () => {
      const catalog = [templePuja, homePuja];

      const allFilter = catalog.filter(() => true);
      const templeFilter = catalog.filter((p) => p.type === "temple" || !p.type);
      const homeFilter = catalog.filter((p) => p.type === "home");

      expect(allFilter).toHaveLength(2);
      expect(templeFilter).toHaveLength(1);
      expect(templeFilter[0].slug).toBe("shiva-rudrabhishek-temple");
      expect(homeFilter).toHaveLength(1);
      expect(homeFilter[0].slug).toBe("satyanarayan-katha-home");
    });
  });

  describe("5 & 6. Booking Flow Conditional Logic & Address Validation", () => {
    it("creates a Temple Puja booking with Name, Gotra, Sankalp and Temple info without requiring address", () => {
      const templeBooking: BookingRecord = {
        bookingId: "BK-TEMPLE-001",
        poojaSlug: templePuja.slug,
        poojaTitle: templePuja.title,
        ritualType: "temple",
        templeSlug: sampleTemple.slug,
        templeName: sampleTemple.name,
        date: "2026-11-05",
        time: "06:30 PM IST",
        panditName: "Acharya Ji",
        reason: "Spiritual Prosperity & Health",
        packageTier: "single",
        gotra: "Kashyap",
        amount: 2100,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: new Date().toISOString(),
        status: "confirmed",
      };

      const input: BookingInput = {
        phone: "9876543210",
        name: "Rahul Sharma",
        gotra: "Kashyap",
        city: sampleTemple.city,
        email: "9876543210@templepujasewa.com",
        ritualType: "temple",
        booking: templeBooking,
      };

      const { users, user } = upsertInto([], input);
      expect(users).toHaveLength(1);
      expect(user.bookings).toHaveLength(1);
      expect(user.bookings[0].ritualType).toBe("temple");
      expect(user.bookings[0].templeSlug).toBe(sampleTemple.slug);
      expect(user.bookings[0].address).toBeUndefined();
    });

    it("creates a Home Puja booking with complete home address and unsets all temple info", () => {
      const devoteeHomeAddress = "Flat 402, Shiv Shakti Apts, MG Road, Varanasi, UP 221001";

      const homeBooking: BookingRecord = {
        bookingId: "BK-HOME-002",
        poojaSlug: homePuja.slug,
        poojaTitle: homePuja.title,
        ritualType: "home",
        address: devoteeHomeAddress,
        templeSlug: undefined,
        templeName: undefined,
        templeId: undefined,
        date: "2026-11-06",
        time: "10:00 AM IST",
        panditName: "Acharya Ji (Vedic Purohit)",
        reason: "Griha Shanti & Auspicious Beginnings",
        packageTier: "single",
        gotra: "Bharadwaj",
        amount: 3100,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: new Date().toISOString(),
        status: "confirmed",
      };

      const input: BookingInput = {
        phone: "9876543211",
        name: "Amit Verma",
        gotra: "Bharadwaj",
        city: "Varanasi",
        email: "9876543211@templepujasewa.com",
        address: devoteeHomeAddress,
        ritualType: "home",
        booking: homeBooking,
      };

      const { users, user } = upsertInto([], input);
      expect(users).toHaveLength(1);
      expect(user.bookings).toHaveLength(1);
      expect(user.bookings[0].ritualType).toBe("home");
      expect(user.bookings[0].address).toBe(devoteeHomeAddress);
      expect(user.bookings[0].templeSlug).toBeUndefined();
      expect(user.bookings[0].templeName).toBeUndefined();
      expect(user.bookings[0].templeId).toBeUndefined();
    });
  });

  describe("8. Backward Compatibility with Existing Historical Orders", () => {
    it("preserves historical bookings that do not have ritualType or address", () => {
      const historicalBooking: BookingRecord = {
        bookingId: "BK-LEGACY-999",
        poojaSlug: "rudra-abhishek",
        poojaTitle: "Rudra Abhishek",
        date: "2025-01-15",
        time: "07:00 AM IST",
        panditName: "Pandit Ram Sharma",
        reason: "Peace of Mind",
        amount: 1101,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: "2025-01-14T10:00:00.000Z",
        status: "confirmed",
      };

      const input: BookingInput = {
        phone: "9876500000",
        name: "Legacy Devotee",
        gotra: "Vashishta",
        city: "Varanasi",
        email: "9876500000@templepujasewa.com",
        booking: historicalBooking,
      };

      const { users, user } = upsertInto([], input);
      expect(users).toHaveLength(1);
      expect(user.bookings[0].bookingId).toBe("BK-LEGACY-999");
      expect(user.bookings[0].amount).toBe(1101);
      expect(user.bookings[0].status).toBe("confirmed");
    });
  });

  describe("10. Backend Validation Logic", () => {
    it("validates server-side that Home Puja requires an address", () => {
      // Simulate backend validation function
      const validateBookingPayload = (p: Pooja, b: Partial<BookingRecord>) => {
        const isHome = p.type === "home";
        if (isHome) {
          if (!b.address || !b.address.trim()) {
            return { valid: false, error: "Devotee home address is required for Home Puja bookings." };
          }
        }
        return { valid: true };
      };

      expect(validateBookingPayload(homePuja, { address: "" })).toEqual({
        valid: false,
        error: "Devotee home address is required for Home Puja bookings.",
      });

      expect(validateBookingPayload(homePuja, { address: "123 Temple Road, Prayagraj" })).toEqual({
        valid: true,
      });

      // Temple puja does NOT require address
      expect(validateBookingPayload(templePuja, { address: "" })).toEqual({
        valid: true,
      });
    });
  });
});
