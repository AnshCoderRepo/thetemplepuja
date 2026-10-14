import { describe, expect, it } from "vitest";
import {
  duplicatePooja,
  generateUniquePoojaSlug,
  slugifyPooja,
} from "../lib/pooja-duplicate";
import type { Pooja } from "../lib/data";

describe("Pooja Catalog Duplication Service", () => {
  const samplePooja: Pooja = {
    slug: "vishwakarma-pooja",
    title: "Vishwakarma Pooja",
    hindiTitle: "विश्वकर्मा पूजा",
    teluguTitle: "విశ్వకర్మ పూజ",
    tamilTitle: "விஸ்வகர்மா பூஜை",
    emoji: "⚒️",
    gradient: "from-amber-400 to-orange-600",
    price: 1001,
    duration: "2 hours",
    bestMuhurat: "Vishwakarma Day",
    startDate: "2026-09-17",
    description: "Worship of the divine architect Vishwakarma for workshops and tools.",
    hindiDescription: "शिल्पकार भगवान विश्वकर्मा की पावन पूजा।",
    teluguDescription: "పరిశ్రమలు మరియు ఉపకరణాల కోసం పూజ.",
    tamilDescription: "கருவிகள் மற்றும் தொழிற்கூடங்களுக்கான பூஜை.",
    benefits: ["Protection of tools & machinery", "Smooth business operations"],
    hindiBenefits: ["औजारों व यंत्रों की सुरक्षा", "व्यापार में निर्विघ्न प्रगति"],
    active: true,
    category: "Wealth & Prosperity",
    type: "temple",
    online: true,
    liveStreamUrl: "https://youtube.com/live/demo123",
    imageUrl: "/images/poojas/vishwakarma.jpg",
    deities: ["Lord Vishwakarma"],
    templeSlugs: ["kashi-vishwanath"],
    chadhavaOptions: ["Panchamrit Abhishek Offering"],
    packages: [
      { name: "Single Workshop Sankalp", price: 1001, description: "1 workshop sankalp" },
      { name: "Complete Factory Anushthan", price: 3100, description: "Full factory blessing" },
    ],
    daysFromToday: 15,
    eventTime: "9:00 AM IST",
    seats: "15 slots available",
    capacity: 25,
    bookedSeats: 10, // Original has 10 booked seats
    live: true,
  };

  const existingCatalog: Pooja[] = [samplePooja];

  describe("Slug Generation & Conflict Resolution", () => {
    it("cleans and formats string into standard url slug", () => {
      expect(slugifyPooja("Kuber Pooja 2026!")).toBe("kuber-pooja-2026");
      expect(slugifyPooja("  Maha  Rudrabhishek - Seva  ")).toBe("maha-rudrabhishek-seva");
    });

    it("generates -copy slug when base does not exist", () => {
      const slug = generateUniquePoojaSlug("vishwakarma-pooja-copy", existingCatalog);
      expect(slug).toBe("vishwakarma-pooja-copy");
    });

    it("automatically disambiguates when slug already exists in catalog", () => {
      const catalogWithCopy: Pooja[] = [
        samplePooja,
        { ...samplePooja, slug: "vishwakarma-pooja-copy" },
      ];

      const slug1 = generateUniquePoojaSlug("vishwakarma-pooja-copy", catalogWithCopy);
      expect(slug1).toBe("vishwakarma-pooja-copy-2");

      const catalogWithCopy2: Pooja[] = [
        ...catalogWithCopy,
        { ...samplePooja, slug: "vishwakarma-pooja-copy-2" },
      ];
      const slug2 = generateUniquePoojaSlug("vishwakarma-pooja-copy", catalogWithCopy2);
      expect(slug2).toBe("vishwakarma-pooja-copy-3");
    });
  });

  describe("duplicatePooja Core Behavior", () => {
    it("generates a separate record with unique slug and (Copy) in titles", () => {
      const duplicated = duplicatePooja(samplePooja, existingCatalog);

      expect(duplicated.slug).toBe("vishwakarma-pooja-copy");
      expect(duplicated.title).toBe("Vishwakarma Pooja (Copy)");
      expect(duplicated.hindiTitle).toBe("विश्वकर्मा पूजा (प्रतिलिपि)");
      expect(duplicated.teluguTitle).toBe("విశ్వకర్మ పూజ (కాపీ)");
      expect(duplicated.tamilTitle).toBe("விஸ்வகர்மா பூஜை (நகல்)");
    });

    it("defaults to HIDDEN/DRAFT status (active: false) for safe review", () => {
      // Original was active (true)
      expect(samplePooja.active).toBe(true);

      const duplicated = duplicatePooja(samplePooja, existingCatalog);
      // Duplicated must be false (Hidden/Draft)
      expect(duplicated.active).toBe(false);

      // Verify original is untouched
      expect(samplePooja.active).toBe(true);
    });

    it("preserves hidden status if original was already hidden", () => {
      const hiddenPooja: Pooja = { ...samplePooja, slug: "hidden-pooja", active: false };
      const duplicated = duplicatePooja(hiddenPooja, [hiddenPooja]);
      expect(duplicated.active).toBe(false);
      expect(hiddenPooja.active).toBe(false);
    });

    it("copies all reusable configuration, media, category, deities, and packages", () => {
      const duplicated = duplicatePooja(samplePooja, existingCatalog);

      expect(duplicated.category).toBe("Wealth & Prosperity");
      expect(duplicated.type).toBe("temple");
      expect(duplicated.online).toBe(true);
      expect(duplicated.liveStreamUrl).toBe("https://youtube.com/live/demo123");
      expect(duplicated.price).toBe(1001);
      expect(duplicated.duration).toBe("2 hours");
      expect(duplicated.bestMuhurat).toBe("Vishwakarma Day");
      expect(duplicated.description).toBe(samplePooja.description);
      expect(duplicated.hindiDescription).toBe(samplePooja.hindiDescription);
      expect(duplicated.emoji).toBe("⚒️");
      expect(duplicated.gradient).toBe("from-amber-400 to-orange-600");
      expect(duplicated.imageUrl).toBe("/images/poojas/vishwakarma.jpg");
      expect(duplicated.deities).toEqual(["Lord Vishwakarma"]);
      expect(duplicated.templeSlugs).toEqual(["kashi-vishwanath"]);
      expect(duplicated.chadhavaOptions).toEqual(["Panchamrit Abhishek Offering"]);
      expect(duplicated.packages?.length).toBe(2);
      expect(duplicated.packages?.[0].name).toBe("Single Workshop Sankalp");
    });

    it("strips bookedSeats and historical booking counts from the duplicate", () => {
      expect(samplePooja.bookedSeats).toBe(10);

      const duplicated = duplicatePooja(samplePooja, existingCatalog);
      expect(duplicated.bookedSeats).toBeUndefined();
      expect(duplicated.isNew).toBe(true);
      expect(duplicated.createdAt).toBeDefined();
    });

    it("deep-clones packages and benefits so editing the duplicate never mutates the original", () => {
      const duplicated = duplicatePooja(samplePooja, existingCatalog);

      // Mutate duplicated packages and benefits
      duplicated.benefits.push("Brand New Distinct Benefit");
      duplicated.packages![0].price = 9999;
      duplicated.title = "Completely Independent Ceremony";

      // Verify original remains strictly unchanged
      expect(samplePooja.benefits).not.toContain("Brand New Distinct Benefit");
      expect(samplePooja.packages![0].price).toBe(1001);
      expect(samplePooja.title).toBe("Vishwakarma Pooja");
    });

    it("respects custom title, custom slug, or activeDefault options when provided", () => {
      const duplicated = duplicatePooja(samplePooja, existingCatalog, {
        customTitle: "Special Dhanteras Pooja",
        customSlug: "special-dhanteras",
        activeDefault: true,
      });

      expect(duplicated.title).toBe("Special Dhanteras Pooja");
      expect(duplicated.slug).toBe("special-dhanteras");
      expect(duplicated.active).toBe(true);
    });
  });
});
