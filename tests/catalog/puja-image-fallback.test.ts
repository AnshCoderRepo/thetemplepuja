import { describe, expect, it } from "vitest";
import { getPoojaBannerImage, type Pooja } from "@/lib/data";
import { duplicatePooja } from "@/lib/pooja-duplicate";

describe("Puja Image Handling & Default Sacred Fallback", () => {
  const sampleWithImage: Pooja = {
    slug: "shree-ganesha-puja",
    title: "Shree Ganesha Pooja",
    hindiTitle: "श्री गणेश पूजा",
    emoji: "🐘",
    gradient: "from-amber-400 to-orange-600",
    price: 1501,
    duration: "1.5 hours",
    bestMuhurat: "Chaturthi",
    description: "Auspicious Ganesha invocation ritual.",
    benefits: ["Obstacle removal", "New beginnings"],
    imageUrl: "/festivals/ganesha-altar.jpg",
    active: true,
  };

  const sampleWithoutImage: Pooja = {
    slug: "custom-navchandi-yagya",
    title: "Custom Navchandi Yagya",
    hindiTitle: "नवचंडी महायज्ञ",
    emoji: "🔥",
    gradient: "from-saffron-500 to-saffron-700",
    price: 5100,
    duration: "4 hours",
    bestMuhurat: "Ashtami",
    description: "Special custom tantrik yagya performed by 5 Vedic brahmins.",
    benefits: ["Divine protection", "Victory over adversities"],
    active: true,
  };

  const sampleWithBrokenImage: Pooja = {
    slug: "broken-image-puja",
    title: "Broken Image Ceremony",
    hindiTitle: "ब्रोकन इमेज पूजा",
    emoji: "🪔",
    gradient: "from-purple-500 to-indigo-600",
    price: 1101,
    duration: "1 hour",
    bestMuhurat: "Anytime",
    description: "Testing invalid image URL resilience.",
    benefits: ["Resilience test"],
    imageUrl: "https://example-inaccessible-domain.invalid/photo-404.jpg",
    active: true,
  };

  describe("1. Valid Uploaded Image Retention", () => {
    it("returns the actual valid image URL when specified", () => {
      const banner = getPoojaBannerImage(sampleWithImage);
      expect(banner).toBe("/festivals/ganesha-altar.jpg");
    });

    it("trims whitespace from image URLs", () => {
      const banner = getPoojaBannerImage({
        imageUrl: "   https://images.unsplash.com/sacred-puja.jpg   ",
      });
      expect(banner).toBe("https://images.unsplash.com/sacred-puja.jpg");
    });

    it("preserves uploaded image when duplicating a puja", () => {
      const duplicated = duplicatePooja(sampleWithImage, [sampleWithImage]);
      expect(duplicated.imageUrl).toBe("/festivals/ganesha-altar.jpg");
    });
  });

  describe("2. Default Fallback When No Image is Provided", () => {
    it("returns empty string for custom pujas without an image so Om + TPS logo fallback is used", () => {
      const banner = getPoojaBannerImage(sampleWithoutImage);
      expect(banner).toBe("");
    });

    it("returns stock photo for seeded core festival rituals when image is not explicitly set", () => {
      const durgaBanner = getPoojaBannerImage({ title: "Maha Durga Saptashati", slug: "durga-saptashati" });
      expect(durgaBanner).toBe("/sample-puja.jpg");

      const shivratriBanner = getPoojaBannerImage({ title: "Maha Rudrabhishek", slug: "rudrabhishek" });
      expect(shivratriBanner).toBe("/festivals/shivratri.jpg");

      const diwaliBanner = getPoojaBannerImage({ title: "Diwali Lakshmi Kuber Puja", slug: "diwali-puja" });
      expect(diwaliBanner).toBe("/festivals/diwali.jpg");
    });
  });

  describe("3. Resilience & Duplication Without Image", () => {
    it("safely duplicates a puja that has no image without injecting placeholder URLs", () => {
      const duplicated = duplicatePooja(sampleWithoutImage, [sampleWithoutImage]);
      expect(duplicated.imageUrl).toBeUndefined();
      expect(duplicated.title).toBe("Custom Navchandi Yagya (Copy)");
      expect(duplicated.slug).toBe("custom-navchandi-yagya-copy");
      expect(duplicated.active).toBe(false);
    });

    it("preserves gradient backwards-compatibility without requiring manual gradient selection", () => {
      const duplicated = duplicatePooja(sampleWithoutImage, [sampleWithoutImage]);
      expect(duplicated.gradient).toBe("from-saffron-500 to-saffron-700");
    });
  });
});
