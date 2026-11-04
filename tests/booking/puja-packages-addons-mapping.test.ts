import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type Addon,
  type Pooja,
  type PoojaPackage,
  getAssignedAddonsForPooja,
} from "@/lib/data";
import { computeOrderAmount } from "@/lib/razorpay";

const originalMongoUri = process.env.MONGODB_URI;
let serverStore: typeof import("@/lib/server-store");

beforeAll(async () => {
  process.env.TTP_STORE = "memory";
  delete process.env.MONGODB_URI;
  serverStore = await import("@/lib/server-store");
});

afterAll(() => {
  delete process.env.TTP_STORE;
  if (originalMongoUri) process.env.MONGODB_URI = originalMongoUri;
  else delete process.env.MONGODB_URI;
});

describe("Puja-Wise Packages and Add-ons Mapping in Booking Flow", () => {
  // Test Data Setup:
  const addonRudrabhishek: Addon = {
    _id: "addon-rudrabhishek-001",
    id: "addon-rudrabhishek-001",
    name: "Rudrabhishek Samagri",
    description: "Complete sacred ingredients for Lord Shiva abhishek",
    price: 301,
    currency: "INR",
    active: true,
    category: "Chadhava Seva",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const addonSpecialPrasad: Addon = {
    _id: "addon-prasad-002",
    id: "addon-prasad-002",
    name: "Special Mahaprasad Box",
    description: "Sanctified dry fruit prasad box",
    price: 201,
    currency: "INR",
    active: true,
    category: "Prasad Seva",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const addonFlowerOffering: Addon = {
    _id: "addon-flowers-003",
    id: "addon-flowers-003",
    name: "Pushpanjali Flower Offering",
    description: "Sacred fresh flowers and garlands",
    price: 151,
    currency: "INR",
    active: true,
    category: "Floral Seva",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allAddonsPool: Addon[] = [
    addonRudrabhishek,
    addonSpecialPrasad,
    addonFlowerOffering,
  ];

  // Puja A: 2 Packages (Basic ₹501, Premium ₹1101), 2 Add-ons (Rudrabhishek, Special Prasad)
  const pujaA: Pooja = {
    slug: "puja-a-maha-mrityunjaya",
    title: "Puja A: Maha Mrityunjaya Jaap",
    hindiTitle: "महामृत्युंजय जाप",
    emoji: "🕉️",
    gradient: "from-amber-500 to-orange-600",
    price: 501,
    duration: "2 hours",
    bestMuhurat: "Shravan Somwar",
    description: "Sacred Vedic health and longevity ceremony",
    benefits: ["Longevity", "Peace", "Protection"],
    packages: [
      { id: "basic", name: "Basic Vedic Chanting", price: 501, description: "1 Panditji, 1100 Mantras" },
      { id: "premium", name: "Premium Maha Havan", price: 1101, description: "3 Panditjis, 5100 Mantras + Havan" },
    ],
    assignedAddonIds: ["addon-rudrabhishek-001", "addon-prasad-002"],
  };

  // Puja B: 1 Package (Standard ₹751), 1 Add-on (Flower Offering)
  const pujaB: Pooja = {
    slug: "puja-b-saraswati-aradhana",
    title: "Puja B: Saraswati Aradhana",
    hindiTitle: "सरस्वती आराधना",
    emoji: "🪕",
    gradient: "from-yellow-500 to-amber-600",
    price: 751,
    duration: "1 hour",
    bestMuhurat: "Vasant Panchami",
    description: "Sacred knowledge and wisdom ceremony",
    benefits: ["Focus", "Wisdom", "Academic Success"],
    packages: [
      { id: "standard", name: "Standard Saraswati Archana", price: 751, description: "1 Panditji, Vidya Prapti Sankalp" },
    ],
    assignedAddonIds: ["addon-flowers-003"],
  };

  // Puja C: 0 Packages, 0 Add-ons (Standard base price ₹1501)
  const pujaC: Pooja = {
    slug: "puja-c-satyanarayan-simple",
    title: "Puja C: Simple Satyanarayan Katha",
    hindiTitle: "सत्यनारायण कथा",
    emoji: "📖",
    gradient: "from-orange-500 to-amber-600",
    price: 1501,
    duration: "1.5 hours",
    bestMuhurat: "Purnima",
    description: "Vedic story reciting ritual",
    benefits: ["Family Peace", "Prosperity"],
    packages: [],
    assignedAddonIds: [],
  };

  describe("Scenario 1: Puja A Mapping (2 packages, 2 add-ons)", () => {
    it("returns ONLY Puja A's configured packages and assigned add-ons", () => {
      expect(pujaA.packages).toHaveLength(2);
      expect(pujaA.packages?.[0].id).toBe("basic");
      expect(pujaA.packages?.[0].price).toBe(501);
      expect(pujaA.packages?.[1].id).toBe("premium");
      expect(pujaA.packages?.[1].price).toBe(1101);

      const mappedAddons = getAssignedAddonsForPooja(pujaA, allAddonsPool);
      expect(mappedAddons).toHaveLength(2);
      expect(mappedAddons.map((a) => a.id)).toEqual([
        "addon-rudrabhishek-001",
        "addon-prasad-002",
      ]);
      expect(mappedAddons.map((a) => a.id)).not.toContain("addon-flowers-003");
    });

    it("calculates correct server total for Puja A with Basic package and both add-ons", () => {
      const calculation = computeOrderAmount({
        pooja: pujaA,
        packageTier: "basic",
        addons: [
          { id: "addon-rudrabhishek-001", quantity: 1 },
          { id: "addon-prasad-002", quantity: 1 },
        ],
        availableAddons: allAddonsPool,
      });

      expect(calculation.couponProblem).toBeNull();
      // Base: ₹501, Addons: ₹301 + ₹201 = ₹502, Subtotal/Total: ₹1003
      expect(calculation.addonTotal).toBe(502);
      expect(calculation.subtotal).toBe(1003);
      expect(calculation.amount).toBe(1003);
      expect(calculation.validatedAddons).toHaveLength(2);
    });

    it("calculates correct server total for Puja A with Premium package and 1 add-on", () => {
      const calculation = computeOrderAmount({
        pooja: pujaA,
        packageTier: "premium",
        addons: [{ id: "addon-prasad-002", quantity: 2 }],
        availableAddons: allAddonsPool,
      });

      expect(calculation.couponProblem).toBeNull();
      // Base: ₹1101, Addons: ₹201 * 2 = ₹402, Subtotal/Total: ₹1503
      expect(calculation.addonTotal).toBe(402);
      expect(calculation.subtotal).toBe(1503);
      expect(calculation.amount).toBe(1503);
    });
  });

  describe("Scenario 2: Puja B Mapping (1 package, 1 add-on)", () => {
    it("returns ONLY Puja B's configured package and assigned add-on", () => {
      expect(pujaB.packages).toHaveLength(1);
      expect(pujaB.packages?.[0].id).toBe("standard");
      expect(pujaB.packages?.[0].price).toBe(751);

      const mappedAddons = getAssignedAddonsForPooja(pujaB, allAddonsPool);
      expect(mappedAddons).toHaveLength(1);
      expect(mappedAddons[0].id).toBe("addon-flowers-003");
      expect(mappedAddons[0].price).toBe(151);
    });

    it("calculates correct server total for Puja B with Standard package and Flower add-on", () => {
      const calculation = computeOrderAmount({
        pooja: pujaB,
        packageTier: "standard",
        addons: [{ id: "addon-flowers-003", quantity: 1 }],
        availableAddons: allAddonsPool,
      });

      expect(calculation.couponProblem).toBeNull();
      // Base: ₹751, Addons: ₹151, Subtotal/Total: ₹902
      expect(calculation.addonTotal).toBe(151);
      expect(calculation.subtotal).toBe(902);
      expect(calculation.amount).toBe(902);
    });
  });

  describe("Scenario 3: Puja C Clean Empty States (0 packages, 0 add-ons)", () => {
    it("returns exactly 0 add-ons and does NOT fallback to global defaults", () => {
      expect(pujaC.packages).toHaveLength(0);

      const mappedAddons = getAssignedAddonsForPooja(pujaC, allAddonsPool);
      expect(mappedAddons).toHaveLength(0);
      expect(mappedAddons).toEqual([]);
    });

    it("calculates correct server total for Puja C using base puja price", () => {
      const calculation = computeOrderAmount({
        pooja: pujaC,
        addons: [],
        availableAddons: allAddonsPool,
      });

      expect(calculation.couponProblem).toBeNull();
      expect(calculation.subtotal).toBe(1501);
      expect(calculation.addonTotal).toBe(0);
      expect(calculation.amount).toBe(1501);
      expect(calculation.validatedAddons).toHaveLength(0);
    });
  });

  describe("Scenario 4: Isolation & Edit Independence", () => {
    it("modifying Puja A's packages or add-ons does not alter Puja B or Puja C", () => {
      // Create deep clone of Puja A with modified packages and add-ons
      const editedPujaA: Pooja = {
        ...pujaA,
        packages: [
          ...(pujaA.packages || []),
          { id: "vip-archana", name: "VIP Vedic Archana", price: 2501 },
        ],
        assignedAddonIds: ["addon-rudrabhishek-001"], // removed special prasad
      };

      // Verify Puja A changed
      expect(editedPujaA.packages).toHaveLength(3);
      expect(getAssignedAddonsForPooja(editedPujaA, allAddonsPool)).toHaveLength(1);

      // Verify Puja B remains untouched
      expect(pujaB.packages).toHaveLength(1);
      expect(pujaB.packages?.[0].id).toBe("standard");
      expect(getAssignedAddonsForPooja(pujaB, allAddonsPool)).toHaveLength(1);
      expect(getAssignedAddonsForPooja(pujaB, allAddonsPool)[0].id).toBe("addon-flowers-003");

      // Verify Puja C remains untouched
      expect(pujaC.packages).toHaveLength(0);
      expect(getAssignedAddonsForPooja(pujaC, allAddonsPool)).toHaveLength(0);
    });
  });

  describe("Scenario 5: Duplication Independence", () => {
    it("duplicating Puja A creates completely independent package and add-on lists", () => {
      const duplicatedPuja: Pooja = {
        ...pujaA,
        slug: "puja-a-copy",
        title: "Puja A (Copy)",
        packages: (pujaA.packages || []).map((pkg) => ({ ...pkg })),
        assignedAddonIds: [...(pujaA.assignedAddonIds || [])],
      };

      // Mutate duplicated Puja
      duplicatedPuja.packages?.push({ id: "custom-seva", name: "Custom Seva", price: 3100 });
      duplicatedPuja.assignedAddonIds?.push("addon-flowers-003");

      // Verify original Puja A was not mutated
      expect(pujaA.packages).toHaveLength(2);
      expect(pujaA.assignedAddonIds).toEqual(["addon-rudrabhishek-001", "addon-prasad-002"]);

      // Verify duplicate has new items
      expect(duplicatedPuja.packages).toHaveLength(3);
      expect(duplicatedPuja.assignedAddonIds).toHaveLength(3);
    });
  });

  describe("Scenario 6: Cross-contamination & Backend Rejection", () => {
    it("rejects an add-on belonging to Puja A when booking Puja B", () => {
      const result = computeOrderAmount({
        pooja: pujaB,
        packageTier: "standard",
        addons: [{ id: "addon-rudrabhishek-001", quantity: 1 }], // belongs to Puja A, not Puja B
        availableAddons: allAddonsPool,
      });

      expect(result.amount).toBe(0);
      expect(result.couponProblem).toContain("is not assigned to this puja");
    });

    it("rejects an add-on when booking Puja C (which has no add-ons)", () => {
      const result = computeOrderAmount({
        pooja: pujaC,
        addons: [{ id: "addon-flowers-003", quantity: 1 }],
        availableAddons: allAddonsPool,
      });

      expect(result.amount).toBe(0);
      expect(result.couponProblem).toContain("is not assigned to this puja");
    });

    it("rejects a package tier belonging to Puja A when booking Puja B", () => {
      const result = computeOrderAmount({
        pooja: pujaB,
        packageTier: "premium", // belongs to Puja A, not Puja B
        addons: [{ id: "addon-flowers-003", quantity: 1 }],
        availableAddons: allAddonsPool,
      });

      expect(result.amount).toBe(0);
      expect(result.couponProblem).toContain("is not available for this puja");
    });

    it("rejects an inactive add-on even if assigned", () => {
      const inactiveAddon: Addon = {
        ...addonRudrabhishek,
        _id: "addon-inactive",
        id: "addon-inactive",
        active: false,
      };

      const pujaWithInactive: Pooja = {
        ...pujaA,
        assignedAddonIds: ["addon-inactive"],
      };

      const result = computeOrderAmount({
        pooja: pujaWithInactive,
        packageTier: "basic",
        addons: [{ id: "addon-inactive", quantity: 1 }],
        availableAddons: [inactiveAddon],
      });

      expect(result.amount).toBe(0);
      expect(result.couponProblem).toContain("is currently inactive");
    });
  });

  describe("Scenario 7: Server Price Integrity & Tamper Proofing", () => {
    it("strictly recalculates prices from catalog definitions regardless of caller data", () => {
      // Devotee tries to claim basic package costs ₹1 and add-on costs ₹1
      const calculation = computeOrderAmount({
        pooja: pujaA,
        packageTier: "basic",
        addons: [{ id: "addon-rudrabhishek-001", quantity: 2 }],
        availableAddons: allAddonsPool,
      });

      // Server enforces official package price ₹501 and add-on price ₹301 * 2 = ₹602
      expect(calculation.addonTotal).toBe(602);
      expect(calculation.subtotal).toBe(1103);
      expect(calculation.amount).toBe(1103);
    });
  });
});
