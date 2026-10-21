import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  type Pooja,
  isPoojaActive,
  isPoojaInHero,
  isPoojaInHeroCard,
  isPoojaInCatalog,
  catalogPoojas,
  activePoojas,
  poojas as staticPoojas,
  DEMO_POOJA,
} from "@/lib/data";
import {
  getCatalogPooja,
  getCatalogPoojas,
  saveCatalogPoojas,
  resetCatalogPoojas,
} from "@/lib/catalog";
import { duplicatePooja } from "@/lib/pooja-duplicate";

describe("Puja Display Placement System (Acceptance Tests)", () => {
  beforeEach(() => {
    resetCatalogPoojas();
  });

  afterEach(() => {
    resetCatalogPoojas();
  });

  // Acceptance Test 1: A puja with Hero enabled appears under Featured Sacred Rituals
  describe("Test 1: Hero Section (Featured Sacred Rituals)", () => {
    it("includes active pujas with showInHero: true and excludes showInHero: false", () => {
      const heroPooja: Pooja = {
        ...DEMO_POOJA,
        slug: "test-hero-pooja",
        title: "Test Hero Ritual",
        active: true,
        showInHero: true,
        showInHeroCard: false,
        showInCatalog: false,
      };

      const nonHeroPooja: Pooja = {
        ...DEMO_POOJA,
        slug: "test-non-hero-pooja",
        title: "Test Non Hero Ritual",
        active: true,
        showInHero: false,
        showInHeroCard: false,
        showInCatalog: true,
      };

      expect(isPoojaInHero(heroPooja)).toBe(true);
      expect(isPoojaInHero(nonHeroPooja)).toBe(false);

      const ritualList = [heroPooja, nonHeroPooja].filter(
        (p) => isPoojaActive(p) && Boolean(p.showInHero)
      );

      expect(ritualList).toHaveLength(1);
      expect(ritualList[0].slug).toBe("test-hero-pooja");
    });
  });

  // Acceptance Test 2: A puja with Hero Card enabled appears in the right-side Hero card
  describe("Test 2: Hero Featured Puja Card", () => {
    it("includes active pujas with showInHeroCard: true and excludes showInHeroCard: false", () => {
      const cardPooja: Pooja = {
        ...DEMO_POOJA,
        slug: "test-card-pooja",
        title: "Test Hero Featured Card",
        active: true,
        showInHero: false,
        showInHeroCard: true,
        showInCatalog: false,
      };

      const nonCardPooja: Pooja = {
        ...DEMO_POOJA,
        slug: "test-non-card-pooja",
        title: "Test Non Card",
        active: true,
        showInHero: true,
        showInHeroCard: false,
        showInCatalog: true,
      };

      expect(isPoojaInHeroCard(cardPooja)).toBe(true);
      expect(isPoojaInHeroCard(nonCardPooja)).toBe(false);

      const heroCards = [cardPooja, nonCardPooja].filter(
        (p) => isPoojaActive(p) && Boolean(p.showInHeroCard)
      );

      expect(heroCards).toHaveLength(1);
      expect(heroCards[0].slug).toBe("test-card-pooja");
    });
  });

  // Acceptance Test 3: A puja with Catalog enabled appears in the Puja Catalog
  describe("Test 3: Puja Catalog Integration", () => {
    it("includes active pujas with showInCatalog: true and excludes showInCatalog: false", () => {
      const catalogPooja: Pooja = {
        ...DEMO_POOJA,
        slug: "test-catalog-pooja",
        title: "Test Catalog Pooja",
        active: true,
        showInHero: false,
        showInHeroCard: false,
        showInCatalog: true,
      };

      const hiddenFromCatalogPooja: Pooja = {
        ...DEMO_POOJA,
        slug: "test-hidden-catalog-pooja",
        title: "Test Hidden From Catalog",
        active: true,
        showInHero: true,
        showInHeroCard: true,
        showInCatalog: false,
      };

      expect(isPoojaInCatalog(catalogPooja)).toBe(true);
      expect(isPoojaInCatalog(hiddenFromCatalogPooja)).toBe(false);

      const catalogList = catalogPoojas([catalogPooja, hiddenFromCatalogPooja]);
      expect(catalogList).toHaveLength(1);
      expect(catalogList[0].slug).toBe("test-catalog-pooja");
    });
  });

  // Acceptance Test 4: Disabling one placement removes the puja only from that placement
  describe("Test 4: Independence of Placements", () => {
    it("allows independent placement combinations (Hero only, Card only, Catalog only, or combinations)", () => {
      const allThree: Pooja = {
        ...DEMO_POOJA,
        slug: "pooja-all",
        active: true,
        showInHero: true,
        showInHeroCard: true,
        showInCatalog: true,
      };

      expect(isPoojaInHero(allThree)).toBe(true);
      expect(isPoojaInHeroCard(allThree)).toBe(true);
      expect(isPoojaInCatalog(allThree)).toBe(true);

      // Disable hero only
      const noHero: Pooja = { ...allThree, showInHero: false };
      expect(isPoojaInHero(noHero)).toBe(false);
      expect(isPoojaInHeroCard(noHero)).toBe(true);
      expect(isPoojaInCatalog(noHero)).toBe(true);

      // Disable card only
      const noCard: Pooja = { ...allThree, showInHeroCard: false };
      expect(isPoojaInHero(noCard)).toBe(true);
      expect(isPoojaInHeroCard(noCard)).toBe(false);
      expect(isPoojaInCatalog(noCard)).toBe(true);

      // Disable catalog only
      const noCatalog: Pooja = { ...allThree, showInCatalog: false };
      expect(isPoojaInHero(noCatalog)).toBe(true);
      expect(isPoojaInHeroCard(noCatalog)).toBe(true);
      expect(isPoojaInCatalog(noCatalog)).toBe(false);
    });
  });

  // Acceptance Test 5: Editing and saving a puja preserves all its placement settings
  describe("Test 5: Editing & Saving Placement Persistence", () => {
    it("persists placement settings through saveCatalogPoojas and retrieves them identically", () => {
      const initialCatalog = getCatalogPoojas();
      const targetPooja = initialCatalog[0];

      const modifiedPooja: Pooja = {
        ...targetPooja,
        showInHero: true,
        showInHeroCard: true,
        showInCatalog: false,
      };

      const updatedList = initialCatalog.map((p) =>
        p.slug === targetPooja.slug ? modifiedPooja : p
      );

      saveCatalogPoojas(updatedList);

      const retrieved = getCatalogPooja(targetPooja.slug);
      expect(retrieved?.showInHero).toBe(true);
      expect(retrieved?.showInHeroCard).toBe(true);
      expect(retrieved?.showInCatalog).toBe(false);

      // Now toggle again to verify update
      const secondModification: Pooja = {
        ...retrieved!,
        showInHero: false,
        showInHeroCard: false,
        showInCatalog: true,
      };

      saveCatalogPoojas(
        initialCatalog.map((p) =>
          p.slug === targetPooja.slug ? secondModification : p
        )
      );

      const retrieved2 = getCatalogPooja(targetPooja.slug);
      expect(retrieved2?.showInHero).toBe(false);
      expect(retrieved2?.showInHeroCard).toBe(false);
      expect(retrieved2?.showInCatalog).toBe(true);
    });

    it("duplicatePooja preserves placement flags appropriately", () => {
      const source: Pooja = {
        ...DEMO_POOJA,
        slug: "source-pooja",
        showInHero: true,
        showInHeroCard: true,
        showInCatalog: false,
      };

      const duplicated = duplicatePooja(source, [source]);
      expect(duplicated.showInHero).toBe(true);
      expect(duplicated.showInHeroCard).toBe(true);
      expect(duplicated.showInCatalog).toBe(false);
    });
  });

  // Acceptance Test 6: Deactivated pujas never appear in public sections
  describe("Test 6: Deactivation Precedence", () => {
    it("ensures inactive pujas (active: false) are hidden from Hero, Hero Card, and Catalog regardless of placement flags", () => {
      const inactivePooja: Pooja = {
        ...DEMO_POOJA,
        slug: "inactive-pooja",
        active: false,
        showInHero: true,
        showInHeroCard: true,
        showInCatalog: true,
      };

      expect(isPoojaActive(inactivePooja)).toBe(false);
      expect(isPoojaInHero(inactivePooja)).toBe(false);
      expect(isPoojaInHeroCard(inactivePooja)).toBe(false);
      expect(isPoojaInCatalog(inactivePooja)).toBe(false);

      const catalogResults = catalogPoojas([inactivePooja]);
      expect(catalogResults).toHaveLength(0);

      const heroResults = [inactivePooja].filter(
        (p) => isPoojaActive(p) && Boolean(p.showInHero)
      );
      expect(heroResults).toHaveLength(0);

      const heroCardResults = [inactivePooja].filter(
        (p) => isPoojaActive(p) && Boolean(p.showInHeroCard)
      );
      expect(heroCardResults).toHaveLength(0);
    });
  });

  // Acceptance Test 7: Existing pujas remain compatible and do not unexpectedly disappear
  describe("Test 7: Backward Compatibility & Safe Defaults", () => {
    it("treats undefined showInCatalog as true for legacy records", () => {
      const legacyPooja: Pooja = {
        slug: "legacy-sacred-pooja",
        title: "Legacy Sacred Pooja",
        hindiTitle: "पुरातन पूजा",
        emoji: "🪔",
        gradient: "from-amber-500 to-orange-500",
        duration: "30 mins",
        bestMuhurat: "Morning",
        benefits: ["Peace", "Prosperity"],
        description: "Legacy pooja from existing database without placement fields",
        category: "Vedic",
        price: 1501,
        active: true,
        // Notice showInCatalog, showInHero, showInHeroCard are undefined!
      };

      // Legacy pooja must be visible in catalog by default
      expect(isPoojaInCatalog(legacyPooja)).toBe(true);
      expect(catalogPoojas([legacyPooja])).toHaveLength(1);

      // Generic legacy pooja safely defaults to false for Hero placements unless explicitly enabled
      expect(isPoojaInHero(legacyPooja)).toBe(false);
      expect(isPoojaInHeroCard(legacyPooja)).toBe(false);

      // Known existing legacy featured rituals preserve their visibility by default
      const legacySatyanarayan: Pooja = {
        ...legacyPooja,
        slug: "satyanarayan-katha",
      };
      expect(isPoojaInHero(legacySatyanarayan)).toBe(true);
      expect(isPoojaInHeroCard(legacySatyanarayan)).toBe(true);

      const legacyRudrabhishek: Pooja = {
        ...legacyPooja,
        slug: "rudrabhishek",
      };
      expect(isPoojaInHero(legacyRudrabhishek)).toBe(true);
      expect(isPoojaInHeroCard(legacyRudrabhishek)).toBe(false);

      // But if explicitly disabled by admin, explicit false is strictly honored
      const explicitlyDisabled: Pooja = {
        ...legacySatyanarayan,
        showInHero: false,
        showInHeroCard: false,
      };
      expect(isPoojaInHero(explicitlyDisabled)).toBe(false);
      expect(isPoojaInHeroCard(explicitlyDisabled)).toBe(false);
    });

    it("verifies static poojas dataset maintains catalog visibility", () => {
      const activeList = activePoojas(staticPoojas);
      const catalogList = catalogPoojas(staticPoojas);

      // All active static poojas should remain visible in catalog
      expect(catalogList.length).toBeGreaterThan(0);
      expect(catalogList.length).toBe(activeList.length);
    });
  });

  // Acceptance Test 8: Booking eligibility is intact regardless of catalog visibility
  describe("Test 8: Booking Eligibility Independence", () => {
    it("allows direct booking of active pooja even when showInCatalog is false", () => {
      const heroExclusivePooja: Pooja = {
        ...DEMO_POOJA,
        slug: "hero-exclusive",
        title: "Hero Exclusive Seva",
        active: true,
        showInHero: true,
        showInHeroCard: true,
        showInCatalog: false,
      };

      // Not in public catalog
      expect(isPoojaInCatalog(heroExclusivePooja)).toBe(false);
      // But fully active and bookable via direct route or hero card
      expect(isPoojaActive(heroExclusivePooja)).toBe(true);
      expect(heroExclusivePooja.ctaLink || `/book/${heroExclusivePooja.slug}`).toBe(
        "/book/demo-pooja"
      );
    });
  });
});
