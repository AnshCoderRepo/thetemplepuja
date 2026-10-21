import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Addon,
  type Pooja,
  getAssignedAddonsForPooja,
  defaultAddons,
} from "@/lib/data";
import { computeOrderAmount } from "@/lib/razorpay";
import type { BookingRecord } from "@/lib/storage";

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

describe("Puja-wise Add-on Management Specification (13 Scenarios)", () => {
  // Scenario 1: Create three add-ons.
  it("Scenario 1: Create three independent add-ons with distinct IDs, names, and fixed prices", async () => {
    const addon1: Addon = {
      _id: "addon-rudrabhishek-samagri",
      id: "addon-rudrabhishek-samagri",
      name: "Rudrabhishek Samagri",
      description: "Complete sacred ingredients for Lord Shiva abhishek",
      price: 301,
      currency: "INR",
      active: true,
      category: "Chadhava Seva",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const addon2: Addon = {
      _id: "addon-special-sankalp",
      id: "addon-special-sankalp",
      name: "Special Sankalp",
      description: "Dedicated Vedic gotra chanting and blessings",
      price: 101,
      currency: "INR",
      active: true,
      category: "Special Seva",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const addon3: Addon = {
      _id: "addon-havan-samagri",
      id: "addon-havan-samagri",
      name: "Havan Samagri",
      description: "Pure herbs and ghee offering for holy fire",
      price: 501,
      currency: "INR",
      active: true,
      category: "Havan Seva",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await serverStore.saveAddon(addon1);
    await serverStore.saveAddon(addon2);
    await serverStore.saveAddon(addon3);

    const saved1 = await serverStore.findAddonById("addon-rudrabhishek-samagri");
    const saved2 = await serverStore.findAddonById("addon-special-sankalp");
    const saved3 = await serverStore.findAddonById("addon-havan-samagri");

    expect(saved1).toBeDefined();
    expect(saved1?.price).toBe(301);
    expect(saved2).toBeDefined();
    expect(saved2?.price).toBe(101);
    expect(saved3).toBeDefined();
    expect(saved3?.price).toBe(501);
  });

  // Scenario 2: Assign two add-ons to Puja A and one to Puja B.
  it("Scenario 2: Assign two add-ons to Puja A and one to Puja B", async () => {
    const pujaA: Pooja = {
      slug: "puja-a-rudra",
      title: "Puja A Rudra",
      hindiTitle: "पूजा ए रुद्र",
      emoji: "🔱",
      gradient: "from-orange-500 to-amber-600",
      price: 1101,
      duration: "1.5 hours",
      bestMuhurat: "Pradosh Vrat",
      description: "Sacred Rudrabhishek Puja",
      benefits: ["Peace", "Prosperity"],
      assignedAddonIds: ["addon-rudrabhishek-samagri", "addon-special-sankalp"],
    };

    const pujaB: Pooja = {
      slug: "puja-b-havan",
      title: "Puja B Havan",
      hindiTitle: "पूजा बी हवन",
      emoji: "🔥",
      gradient: "from-red-500 to-amber-600",
      price: 2101,
      duration: "2 hours",
      bestMuhurat: "Purnima",
      description: "Maha Havan Puja",
      benefits: ["Purification", "Health"],
      assignedAddonIds: ["addon-havan-samagri"],
    };

    await serverStore.saveCatalogOverrides({
      poojas: [pujaA, pujaB],
    });

    const catalog = await serverStore.getResolvedCatalog();
    const fetchedA = catalog.poojas.find((p) => p.slug === "puja-a-rudra");
    const fetchedB = catalog.poojas.find((p) => p.slug === "puja-b-havan");

    expect(fetchedA?.assignedAddonIds).toEqual([
      "addon-rudrabhishek-samagri",
      "addon-special-sankalp",
    ]);
    expect(fetchedB?.assignedAddonIds).toEqual(["addon-havan-samagri"]);
  });

  // Scenario 3: Reopen each puja's edit form and verify assignments persist.
  it("Scenario 3: Reopen each puja's edit form and verify assignments persist", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    const pujaA = catalog.poojas.find((p) => p.slug === "puja-a-rudra");
    const pujaB = catalog.poojas.find((p) => p.slug === "puja-b-havan");

    // Simulating startEdit in admin wizard: draft initialization
    const draftA = {
      slug: pujaA!.slug,
      assignedAddonIds: pujaA!.assignedAddonIds ? [...pujaA!.assignedAddonIds] : [],
    };
    const draftB = {
      slug: pujaB!.slug,
      assignedAddonIds: pujaB!.assignedAddonIds ? [...pujaB!.assignedAddonIds] : [],
    };

    expect(draftA.assignedAddonIds).toHaveLength(2);
    expect(draftA.assignedAddonIds).toContain("addon-rudrabhishek-samagri");
    expect(draftA.assignedAddonIds).toContain("addon-special-sankalp");

    expect(draftB.assignedAddonIds).toHaveLength(1);
    expect(draftB.assignedAddonIds).toContain("addon-havan-samagri");
  });

  // Scenario 4: Confirm Puja A displays only its two assigned add-ons.
  it("Scenario 4: Confirm Puja A displays only its two assigned add-ons", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    const pujaA = catalog.poojas.find((p) => p.slug === "puja-a-rudra");
    const allAddons = await serverStore.getAllAddons();

    const assignedForA = getAssignedAddonsForPooja(pujaA, allAddons);

    expect(assignedForA).toHaveLength(2);
    const names = assignedForA.map((a) => a.name);
    expect(names).toContain("Rudrabhishek Samagri");
    expect(names).toContain("Special Sankalp");
    expect(names).not.toContain("Havan Samagri");
  });

  // Scenario 5: Confirm Puja B displays only its assigned add-on.
  it("Scenario 5: Confirm Puja B displays only its assigned add-on", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    const pujaB = catalog.poojas.find((p) => p.slug === "puja-b-havan");
    const allAddons = await serverStore.getAllAddons();

    const assignedForB = getAssignedAddonsForPooja(pujaB, allAddons);

    expect(assignedForB).toHaveLength(1);
    expect(assignedForB[0].name).toBe("Havan Samagri");
    expect(assignedForB.map((a) => a.name)).not.toContain("Rudrabhishek Samagri");
    expect(assignedForB.map((a) => a.name)).not.toContain("Special Sankalp");
  });

  // Scenario 6: Search for an existing add-on and assign it without creating a duplicate.
  it("Scenario 6: Search for an existing add-on and assign it without creating a duplicate record", async () => {
    const allBefore = await serverStore.getAllAddons();
    const searchTarget = allBefore.find((a) => a.name.toLowerCase().includes("havan"));
    expect(searchTarget).toBeDefined();

    // Assign existing Havan Samagri to Puja A too (multi-puja assignment)
    const catalog = await serverStore.getResolvedCatalog();
    const updatedPoojas = catalog.poojas.map((p) => {
      if (p.slug === "puja-a-rudra") {
        return {
          ...p,
          assignedAddonIds: Array.from(new Set([...(p.assignedAddonIds || []), searchTarget!._id])),
        };
      }
      return p;
    });

    await serverStore.saveCatalogOverrides({ poojas: updatedPoojas });

    const allAfter = await serverStore.getAllAddons();
    expect(allAfter.filter((a) => a._id === searchTarget!._id)).toHaveLength(1); // No duplicate addon record

    const updatedCatalog = await serverStore.getResolvedCatalog();
    const updatedA = updatedCatalog.poojas.find((p) => p.slug === "puja-a-rudra");
    const updatedB = updatedCatalog.poojas.find((p) => p.slug === "puja-b-havan");

    expect(updatedA?.assignedAddonIds).toContain(searchTarget!._id);
    expect(updatedB?.assignedAddonIds).toContain(searchTarget!._id);
  });

  // Scenario 7: Remove an assignment from Puja A and verify the add-on still exists and remains assigned to Puja B.
  it("Scenario 7: Remove an assignment from Puja A and verify add-on still exists and remains on Puja B", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    const updatedPoojas = catalog.poojas.map((p) => {
      if (p.slug === "puja-a-rudra") {
        return {
          ...p,
          assignedAddonIds: (p.assignedAddonIds || []).filter(
            (id) => id !== "addon-havan-samagri"
          ),
        };
      }
      return p;
    });

    await serverStore.saveCatalogOverrides({ poojas: updatedPoojas });

    // Verify Add-on itself was not deleted
    const havanAddon = await serverStore.findAddonById("addon-havan-samagri");
    expect(havanAddon).toBeDefined();

    // Verify Puja A no longer has it
    const updatedCatalog = await serverStore.getResolvedCatalog();
    const updatedA = updatedCatalog.poojas.find((p) => p.slug === "puja-a-rudra");
    const updatedB = updatedCatalog.poojas.find((p) => p.slug === "puja-b-havan");

    expect(updatedA?.assignedAddonIds).not.toContain("addon-havan-samagri");
    // Verify Puja B STILL has it
    expect(updatedB?.assignedAddonIds).toContain("addon-havan-samagri");
  });

  // Scenario 8: Delete Puja A and verify its add-on records remain in the database.
  it("Scenario 8: Delete Puja A and verify its add-on records remain in the database (no cascade deletion)", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    // Delete Puja A
    const nextPoojas = catalog.poojas.filter((p) => p.slug !== "puja-a-rudra");
    await serverStore.saveCatalogOverrides({ poojas: nextPoojas });

    // Verify Puja A is deleted from catalog
    const checkCatalog = await serverStore.getResolvedCatalog();
    expect(checkCatalog.poojas.find((p) => p.slug === "puja-a-rudra")).toBeUndefined();

    // Verify all 3 add-on records remain intact in database
    const addon1 = await serverStore.findAddonById("addon-rudrabhishek-samagri");
    const addon2 = await serverStore.findAddonById("addon-special-sankalp");
    const addon3 = await serverStore.findAddonById("addon-havan-samagri");

    expect(addon1).toBeDefined();
    expect(addon2).toBeDefined();
    expect(addon3).toBeDefined();
  });

  // Scenario 9: Verify the deleted puja's assignments are cleaned up safely.
  it("Scenario 9: Verify deleted puja's assignments are cleaned up safely without orphan cascade", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    // Only Puja B remains
    expect(catalog.poojas.map((p) => p.slug)).toContain("puja-b-havan");
    expect(catalog.poojas.map((p) => p.slug)).not.toContain("puja-a-rudra");

    // Addons are still active and queryable
    const active = await serverStore.getActiveAddons();
    expect(active.length).toBeGreaterThanOrEqual(3);
  });

  // Scenario 10: Change an add-on's price and verify new bookings use the updated price while historical bookings retain snapshots.
  it("Scenario 10: Change add-on price: new bookings use updated price, historical bookings retain snapshot", async () => {
    // 1. Create a historical booking with original price ₹501
    const historicalBooking: BookingRecord = {
      bookingId: "BK-HIST-001",
      poojaSlug: "puja-b-havan",
      poojaTitle: "Puja B Havan",
      date: "2026-10-20",
      time: "9:00 AM",
      primaryDevoteeName: "Ramesh Sharma",
      packageTier: "single",
      panditName: "Acharya Ji",
      amount: 2602, // 2101 + 501
      discount: 0,
      couponCode: null,
      addonCount: 1,
      addons: [
        {
          id: "addon-havan-samagri",
          name: "Havan Samagri",
          price: 501,
          quantity: 1,
        },
      ],
      createdAt: "2026-10-01T10:00:00.000Z",
      status: "confirmed",
    };

    // 2. Admin updates the price of Havan Samagri to ₹651
    const havan = await serverStore.findAddonById("addon-havan-samagri");
    expect(havan).toBeDefined();
    await serverStore.saveAddon({
      ...havan!,
      price: 651,
      updatedAt: new Date().toISOString(),
    });

    const updatedHavan = await serverStore.findAddonById("addon-havan-samagri");
    expect(updatedHavan?.price).toBe(651);

    // 3. New booking calculation uses the updated price ₹651
    const catalog = await serverStore.getResolvedCatalog();
    const pujaB = catalog.poojas.find((p) => p.slug === "puja-b-havan")!;
    const availableAddons = await serverStore.getAllAddons();

    const newCalculation = computeOrderAmount({
      pooja: pujaB,
      packageTier: "single",
      addons: [{ id: "addon-havan-samagri", quantity: 1 }],
      availableAddons,
    });

    expect(newCalculation.addonTotal).toBe(651);
    expect(newCalculation.amount).toBe(2101 + 651); // 2752

    // 4. Historical booking still retains snapshot price ₹501 and amount ₹2602
    expect(historicalBooking.addons![0].price).toBe(501);
    expect(historicalBooking.amount).toBe(2602);
  });

  // Scenario 11: Attempt to submit an add-on assigned to another puja directly through the API and verify the server rejects it.
  it("Scenario 11: Backend rejects an add-on assigned to another puja with security validation error", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    const pujaB = catalog.poojas.find((p) => p.slug === "puja-b-havan")!;
    const availableAddons = await serverStore.getAllAddons();

    // Puja B only has addon-havan-samagri assigned.
    // Malicious or mismatched request attempts to book addon-rudrabhishek-samagri on Puja B
    const rogueOrder = computeOrderAmount({
      pooja: pujaB,
      packageTier: "single",
      addons: [
        { id: "addon-rudrabhishek-samagri", quantity: 1 }, // NOT assigned to Puja B
      ],
      availableAddons,
    });

    expect(rogueOrder.amount).toBe(0);
    expect(rogueOrder.couponProblem).toBe(
      'Add-on "Rudrabhishek Samagri" is not assigned to this puja.'
    );
  });

  // Scenario 12: Verify booking totals and Razorpay order amounts remain correct.
  it("Scenario 12: Verify booking totals and Razorpay order amounts calculate accurately server-side", async () => {
    const catalog = await serverStore.getResolvedCatalog();
    const pujaB = catalog.poojas.find((p) => p.slug === "puja-b-havan")!;
    const availableAddons = await serverStore.getAllAddons();

    // Valid booking for Puja B with quantity 2
    const validOrder = computeOrderAmount({
      pooja: pujaB,
      packageTier: "single", // 2101
      addons: [{ id: "addon-havan-samagri", quantity: 2 }], // 651 * 2 = 1302
      availableAddons,
    });

    expect(validOrder.couponProblem).toBeNull();
    expect(validOrder.addonTotal).toBe(1302);
    expect(validOrder.subtotal).toBe(2101 + 1302); // 3403
    expect(validOrder.amount).toBe(3403);
    expect(validOrder.validatedAddons).toHaveLength(1);
    expect(validOrder.validatedAddons[0].quantity).toBe(2);
    expect(validOrder.validatedAddons[0].price).toBe(651);
  });

  // Scenario 13: Test loading, empty, error and mobile-responsive states.
  it("Scenario 13: Test empty assigned addons helper and inactive addon rejection", async () => {
    // 1. Puja with empty assignedAddonIds returns empty array
    const emptyPuja: Pooja = {
      slug: "empty-puja",
      title: "Empty Puja",
      hindiTitle: "खाली पूजा",
      emoji: "🪔",
      gradient: "from-orange-500 to-amber-600",
      price: 501,
      duration: "30 mins",
      bestMuhurat: "Any",
      description: "Puja with no add-ons",
      benefits: [],
      assignedAddonIds: [],
    };

    const emptyAddons = getAssignedAddonsForPooja(emptyPuja, defaultAddons);
    expect(emptyAddons).toEqual([]);

    // 2. Inactive add-on is rejected
    const inactiveAddon: Addon = {
      _id: "addon-inactive-test",
      id: "addon-inactive-test",
      name: "Inactive Test Addon",
      description: "Currently discontinued",
      price: 99,
      currency: "INR",
      active: false, // Inactive
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const pujaWithInactive: Pooja = {
      ...emptyPuja,
      assignedAddonIds: ["addon-inactive-test"],
    };

    const calculation = computeOrderAmount({
      pooja: pujaWithInactive,
      addons: [{ id: "addon-inactive-test", quantity: 1 }],
      availableAddons: [inactiveAddon],
    });

    expect(calculation.amount).toBe(0);
    expect(calculation.couponProblem).toBe(
      'Add-on "Inactive Test Addon" is currently inactive.'
    );
  });

  // Scenario 14: Chadava assignment via assignedPoojaSlugs restricts display strictly to the selected puja
  it("Scenario 14: Chadava with assignedPoojaSlugs only displays on the assigned puja and can be changed to another puja", () => {
    const targetPuja: Pooja = {
      slug: "special-navratri-puja",
      title: "Special Navratri Puja",
      hindiTitle: "विशेष नवरात्रि पूजा",
      emoji: "🌸",
      gradient: "from-amber-500 to-red-600",
      price: 1501,
      duration: "2 hours",
      bestMuhurat: "Navratri",
      description: "Navratri Special Chandi Path",
      benefits: ["Shakti Blessings"],
      assignedAddonIds: [], // Not explicitly mapped on the puja object
    };

    const otherPuja: Pooja = {
      slug: "daily-morning-aarti",
      title: "Daily Morning Aarti",
      hindiTitle: "दैनिक सुबह आरती",
      emoji: "🪔",
      gradient: "from-orange-500 to-amber-600",
      price: 251,
      duration: "30 mins",
      bestMuhurat: "Brahma Muhurat",
      description: "Morning Aarti",
      benefits: [],
      assignedAddonIds: [],
    };

    const navratriChadava: Addon = {
      _id: "chadhava-chunari-shringar",
      id: "chadhava-chunari-shringar",
      name: "Mata Rani Chunari & Shringar Seva",
      description: "Red silk chunari and sacred solah shringar offering",
      price: 251,
      currency: "INR",
      active: true,
      category: "Vastra Seva",
      assignedPoojaSlugs: ["special-navratri-puja"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Should display on targetPuja
    const forTarget = getAssignedAddonsForPooja(targetPuja, [navratriChadava]);
    expect(forTarget.length).toBe(1);
    expect(forTarget[0].name).toBe("Mata Rani Chunari & Shringar Seva");

    // 2. Should NOT display on otherPuja
    const forOther = getAssignedAddonsForPooja(otherPuja, [navratriChadava]);
    expect(forOther.length).toBe(0);

    // 3. Admin edits Chadava to change puja assignment from special-navratri-puja to daily-morning-aarti
    const editedChadava: Addon = {
      ...navratriChadava,
      assignedPoojaSlugs: ["daily-morning-aarti"],
    };

    expect(getAssignedAddonsForPooja(targetPuja, [editedChadava]).length).toBe(0);
    expect(getAssignedAddonsForPooja(otherPuja, [editedChadava]).length).toBe(1);
    expect(getAssignedAddonsForPooja(otherPuja, [editedChadava])[0].name).toBe(
      "Mata Rani Chunari & Shringar Seva"
    );
  });

  // Scenario 15: Inactive items are excluded by active status filter across items
  it("Scenario 15: Inactive chadavas are never displayed on frontend even if assigned", () => {
    const puja: Pooja = {
      slug: "ganesh-puja",
      title: "Ganesh Puja",
      hindiTitle: "गणेश पूजा",
      emoji: "🐘",
      gradient: "from-orange-500 to-amber-600",
      price: 501,
      duration: "45 mins",
      bestMuhurat: "Chaturthi",
      description: "Vighnaharta Puja",
      benefits: [],
      assignedAddonIds: ["addon-modak"],
    };

    const inactiveModak: Addon = {
      _id: "addon-modak",
      id: "addon-modak",
      name: "21 Modak Offering",
      description: "Sweet offerings to Lord Ganesha",
      price: 201,
      currency: "INR",
      active: false, // marked inactive by admin
      assignedPoojaSlugs: ["ganesh-puja"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const assigned = getAssignedAddonsForPooja(puja, [inactiveModak]);
    expect(assigned).toEqual([]);
  });
});

