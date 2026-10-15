import { describe, expect, it } from "vitest";
import {
  activeTemples,
  defaultTemples,
  getLocalizedTempleDescription,
  getLocalizedTempleHistory,
  getLocalizedTempleName,
  getLocalizedTempleSignificance,
  getLocalizedTempleVisitorGuidance,
  getPoojaBannerImage,
  getRelatedPoojasForTemple,
  getTemple,
  getTempleForPooja,
  isTempleActive,
  type Pooja,
  type Temple,
} from "../lib/data";
import sitemap from "../app/sitemap";

describe("Temple Management & Public Temple Information", () => {
  it("maintains complete default temples data with authentic history and significance", () => {
    expect(defaultTemples.length).toBeGreaterThanOrEqual(6);

    const kashi = defaultTemples.find((t) => t.slug === "kashi-vishwanath");
    expect(kashi).toBeDefined();
    expect(kashi?.name).toBe("Kashi Vishwanath Temple");
    expect(kashi?.hindiName).toContain("काशी विश्वनाथ");
    expect(kashi?.city).toBe("Varanasi");
    expect(kashi?.state).toBe("Uttar Pradesh");
    expect(kashi?.deity).toContain("Lord Shiva");
    expect(kashi?.history).toBeTruthy();
    expect(kashi?.significance).toBeTruthy();
    expect(kashi?.timings).toBeTruthy();
    expect(kashi?.active).toBe(true);
    expect(kashi?.mapUrl).toContain("maps.google.com");
  });

  it("filters inactive temples correctly via isTempleActive and activeTemples", () => {
    const activeTemple: Temple = {
      slug: "active-shrine",
      name: "Active Shrine",
      deity: "Lord Shiva",
      city: "Haridwar",
      state: "Uttarakhand",
      description: "Sacred shrine",
      active: true,
    };

    const inactiveTemple: Temple = {
      slug: "hidden-shrine",
      name: "Hidden Shrine",
      deity: "Lord Shiva",
      city: "Rishikesh",
      state: "Uttarakhand",
      description: "Sacred shrine under renovation",
      active: false,
    };

    expect(isTempleActive(activeTemple)).toBe(true);
    expect(isTempleActive(inactiveTemple)).toBe(false);

    const filtered = activeTemples([activeTemple, inactiveTemple]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].slug).toBe("active-shrine");
  });

  it("provides accurate multi-lingual localization for temple names and content", () => {
    const temple: Temple = {
      slug: "test-temple",
      name: "Mahakal Temple",
      hindiName: "महाकाल मंदिर",
      teluguName: "మహాకాల ఆలయం",
      tamilName: "மகாகால் கோயில்",
      deity: "Lord Shiva",
      city: "Ujjain",
      state: "Madhya Pradesh",
      description: "English description",
      hindiDescription: "हिंदी विवरण",
      history: "English history",
      hindiHistory: "हिंदी इतिहास",
      significance: "English significance",
      hindiSignificance: "हिंदी महत्व",
      visitorGuidance: "English guidance",
      hindiVisitorGuidance: "हिंदी मार्गदर्शिका",
      active: true,
    };

    // Name localization
    expect(getLocalizedTempleName(temple, "en")).toBe("Mahakal Temple");
    expect(getLocalizedTempleName(temple, "hi")).toBe("महाकाल मंदिर");
    expect(getLocalizedTempleName(temple, "te")).toBe("మహాకాల ఆలయం");
    expect(getLocalizedTempleName(temple, "ta")).toBe("மகாகால் கோயில்");

    // Description localization
    expect(getLocalizedTempleDescription(temple, "en")).toBe("English description");
    expect(getLocalizedTempleDescription(temple, "hi")).toBe("हिंदी विवरण");

    // History & Significance localization
    expect(getLocalizedTempleHistory(temple, "en")).toBe("English history");
    expect(getLocalizedTempleHistory(temple, "hi")).toBe("हिंदी इतिहास");
    expect(getLocalizedTempleSignificance(temple, "en")).toBe("English significance");
    expect(getLocalizedTempleSignificance(temple, "hi")).toBe("हिंदी महत्व");

    // Visitor guidance localization
    expect(getLocalizedTempleVisitorGuidance(temple, "en")).toBe("English guidance");
    expect(getLocalizedTempleVisitorGuidance(temple, "hi")).toBe("हिंदी मार्गदर्शिका");
  });

  it("links pujas and temples bidirectionally via getTempleForPooja and getRelatedPoojasForTemple", () => {
    const mockTemple: Temple = {
      slug: "somnath-temple",
      name: "Somnath Temple",
      deity: "Lord Shiva",
      city: "Prabhas Patan",
      state: "Gujarat",
      description: "First of the twelve Jyotirlingas",
      active: true,
      poojaSlugs: ["someshwar-rudrabhishek"],
    };

    const mockPooja: Pooja = {
      slug: "someshwar-rudrabhishek",
      title: "Someshwar Mahadev Abhishek",
      hindiTitle: "सोमेश्वर महादेव का अभिषेक",
      price: 1101,
      benefits: ["Health", "Prosperity"],
      bestMuhurat: "Pradosh Vrat",
      duration: "1.5 hours",
      description: "Sacred abhishek",
      emoji: "🔱",
      gradient: "from-blue-600 to-indigo-800",
      templeSlugs: ["somnath-temple"],
    };

    // From puja -> temple
    const resolvedTemple = getTempleForPooja(mockPooja, [mockTemple]);
    expect(resolvedTemple.slug).toBe("somnath-temple");

    // From temple -> related pujas
    const relatedPujas = getRelatedPoojasForTemple(mockTemple, [mockPooja]);
    expect(relatedPujas).toHaveLength(1);
    expect(relatedPujas[0].slug).toBe("someshwar-rudrabhishek");
  });

  it("resolves getPoojaBannerImage across all image alias fields and Hindi deity titles", () => {
    // 1. Explicit imageUrl
    expect(
      getPoojaBannerImage({
        slug: "rudrabhishek",
        title: "Rudrabhishek",
        imageUrl: "data:image/jpeg;base64,sample123",
      })
    ).toBe("data:image/jpeg;base64,sample123");

    // 2. Explicit image field alias
    expect(
      getPoojaBannerImage({
        slug: "rudrabhishek",
        title: "Rudrabhishek",
        image: "https://example.com/rudra.jpg",
      })
    ).toBe("https://example.com/rudra.jpg");

    // 3. Hindi title with Someshwar Mahadev Abhishek matches Shiva festival banner
    expect(
      getPoojaBannerImage({
        slug: "indreshwar-mahadev-abhisek",
        title: "Indreshwar Mahadev",
        hindiTitle: "सोमेश्वर महादेव का अभिषेक",
      })
    ).toBe("/festivals/shivratri.jpg");

    // 4. Hindi deity matches Ganesha altar banner
    expect(
      getPoojaBannerImage({
        slug: "siddhi-pooja",
        title: "Siddhi Pooja",
        hindiTitle: "श्री गणेश सिद्धि पूजा",
      })
    ).toBe("/festivals/ganesha-altar.jpg");
  });

  it("includes /temples and active temple pages in the generated sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((u) => u.endsWith("/temples"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/temples/kashi-vishwanath"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/temples/mahakaleshwar"))).toBe(true);
  });
});
