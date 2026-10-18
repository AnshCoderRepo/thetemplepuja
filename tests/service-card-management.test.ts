import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  DEMO_POOJA,
  isDemoSlug,
  isPoojaActive,
  sortPoojasByRecent,
  type Pooja,
} from "@/lib/data";
import {
  getCatalogPooja,
  getCatalogPoojas,
  saveCatalogPoojas,
  resetCatalogPoojas,
} from "@/lib/catalog";
import { createMemoryStore } from "@/lib/persistence";

describe("Service Card Management & Dynamic Admin Edits", () => {
  beforeEach(() => {
    resetCatalogPoojas();
  });

  afterEach(() => {
    resetCatalogPoojas();
  });

  describe("Card Schema & Default Properties", () => {
    it("has valid editable card fields on the DEMO_POOJA card", () => {
      expect(DEMO_POOJA.title).toBe("Test Demo Pooja (₹1)");
      expect(DEMO_POOJA.badge).toBe("DEMO");
      expect(DEMO_POOJA.showBadge).toBe(true);
      expect(DEMO_POOJA.displayOrder).toBe(1);
      expect(DEMO_POOJA.ctaText).toBe("Book for ₹1 →");
      expect(DEMO_POOJA.ctaLink).toBe("/book/demo-pooja");
      expect(isPoojaActive(DEMO_POOJA)).toBe(true);
    });

    it("correctly identifies demo slug variants", () => {
      expect(isDemoSlug("demo-pooja")).toBe(true);
      expect(isDemoSlug("DEMO-POOJA")).toBe(true);
      expect(isDemoSlug("maha-mrityunjaya-jaap")).toBe(false);
    });
  });

  describe("Dynamic Catalog Overrides & Public Retrieval", () => {
    it("reflects updated card title, description, image, and badge when edited by admin", () => {
      // Initially, getCatalogPooja returns static DEMO_POOJA
      const initial = getCatalogPooja("demo-pooja");
      expect(initial?.title).toBe("Test Demo Pooja (₹1)");
      expect(initial?.badge).toBe("DEMO");

      // Admin updates the card in catalog
      const updatedDemo: Pooja = {
        ...DEMO_POOJA,
        title: "Live Special Test Demo Puja",
        description: "Updated spiritual seva description for live testing.",
        badge: "EXCLUSIVE",
        showBadge: true,
        displayOrder: 1,
        ctaText: "Experience Seva (₹1) →",
        ctaLink: "/book/demo-pooja",
        imageUrl: "https://example.com/custom-banner.webp",
      };

      saveCatalogPoojas([...getCatalogPoojas(), updatedDemo]);

      // getCatalogPooja now returns the dynamic override
      const overridden = getCatalogPooja("demo-pooja");
      expect(overridden?.title).toBe("Live Special Test Demo Puja");
      expect(overridden?.description).toBe("Updated spiritual seva description for live testing.");
      expect(overridden?.badge).toBe("EXCLUSIVE");
      expect(overridden?.showBadge).toBe(true);
      expect(overridden?.ctaText).toBe("Experience Seva (₹1) →");
      expect(overridden?.imageUrl).toBe("https://example.com/custom-banner.webp");
    });

    it("respects the badge visibility toggle", () => {
      const cardWithHiddenBadge: Pooja = {
        ...DEMO_POOJA,
        badge: "DEMO",
        showBadge: false, // Admin turned off badge visibility
      };

      saveCatalogPoojas([...getCatalogPoojas(), cardWithHiddenBadge]);

      const pooja = getCatalogPooja("demo-pooja");
      expect(pooja?.showBadge).toBe(false);
    });

    it("supports active/inactive toggle so inactive cards can be hidden from public catalog", () => {
      const activeCard: Pooja = { ...DEMO_POOJA, active: true };
      const inactiveCard: Pooja = { ...DEMO_POOJA, slug: "custom-puja", active: false };

      expect(isPoojaActive(activeCard)).toBe(true);
      expect(isPoojaActive(inactiveCard)).toBe(false);

      const allCards = [activeCard, inactiveCard];
      const publicCards = allCards.filter((c) => isPoojaActive(c));
      expect(publicCards).toHaveLength(1);
      expect(publicCards[0].slug).toBe("demo-pooja");
    });
  });

  describe("Display Order Priority", () => {
    it("sorts service cards with explicit displayOrder at the front according to ranking", () => {
      const cardA: Pooja = { ...DEMO_POOJA, slug: "card-a", title: "Card A", displayOrder: 2 };
      const cardB: Pooja = { ...DEMO_POOJA, slug: "card-b", title: "Card B", displayOrder: 1 };
      const cardC: Pooja = { ...DEMO_POOJA, slug: "card-c", title: "Card C", displayOrder: undefined };

      const sorted = sortPoojasByRecent([cardA, cardB, cardC]);
      expect(sorted[0].slug).toBe("card-b"); // Order #1
      expect(sorted[1].slug).toBe("card-a"); // Order #2
      expect(sorted[2].slug).toBe("card-c"); // No explicit order (placed after)
    });
  });

  describe("Persistence Store Service Card Serialization", () => {
    it("persists and reloads edited service cards across store sessions", async () => {
      const store = createMemoryStore();

      const editedCard: Pooja = {
        ...DEMO_POOJA,
        title: "Persisted Ceremony Card",
        description: "Validates persistence in JSON / MongoDB / Local state",
        badge: "VERIFIED",
        showBadge: true,
        displayOrder: 5,
        ctaText: "Participate Now →",
        ctaLink: "/book/demo-pooja",
        imageUrl: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoB+AA/v2WAAA==",
      };

      await store.saveCatalogOverrides({ poojas: [editedCard] });

      const loadedOverrides = await store.getCatalogOverrides();
      expect(loadedOverrides.poojas).toBeDefined();
      expect(loadedOverrides.poojas).toHaveLength(1);

      const reloadedCard = loadedOverrides.poojas![0];
      expect(reloadedCard.title).toBe("Persisted Ceremony Card");
      expect(reloadedCard.badge).toBe("VERIFIED");
      expect(reloadedCard.showBadge).toBe(true);
      expect(reloadedCard.displayOrder).toBe(5);
      expect(reloadedCard.ctaText).toBe("Participate Now →");
      expect(reloadedCard.imageUrl).toContain("data:image/webp;base64");
    });
  });
});
