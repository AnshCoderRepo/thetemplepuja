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
  resolvePoojaTemple,
  isTempleActive,
  type Pooja,
  type Temple,
} from "@/lib/data";
import sitemap from "@/app/sitemap";

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
    expect(resolvedTemple?.slug).toBe("somnath-temple");

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

  describe("Puja Card Temple Name Resolution (Homepage Banner Badge)", () => {
    const mockTemples: Temple[] = [
      {
        _id: "66f123456789abcdef000001",
        slug: "trimbakeshwar",
        name: "Trimbakeshwar Shiva Temple",
        hindiName: "त्र्यंबकेश्वर ज्योतिर्लिंग मंदिर",
        deity: "Lord Shiva",
        city: "Nashik",
        state: "Maharashtra",
        description: "Holy Jyotirlinga near Godavari river",
        active: true,
      },
      {
        _id: "66f123456789abcdef000002",
        slug: "khatu-shyam",
        name: "Khatu Shyam Ji Temple",
        hindiName: "खाटू श्याम जी मंदिर",
        deity: "Khatu Shyam",
        city: "Sikar",
        state: "Rajasthan",
        description: "Revered shrine in Rajasthan",
        active: true,
      },
    ];

    it("resolves temple by stable MongoDB _id reference", () => {
      const poojaWithMongoId: Pooja = {
        slug: "kaal-sarp-dosh-puja",
        title: "Kaal Sarp Dosh Nivaran Puja",
        hindiTitle: "काल सर्प दोष निवारण पूजा",
        price: 2501,
        benefits: ["Dosha Shanti"],
        bestMuhurat: "Nag Panchami",
        duration: "2 hours",
        description: "Special dosha shanti pooja",
        emoji: "🐍",
        gradient: "from-slate-700 to-amber-900",
        templeId: "66f123456789abcdef000001",
      };

      const resolved = resolvePoojaTemple(poojaWithMongoId, mockTemples);
      expect(resolved).toBeDefined();
      expect(resolved?.name).toBe("Trimbakeshwar Shiva Temple");
      expect(resolved?.slug).toBe("trimbakeshwar");
      expect(getLocalizedTempleName(resolved, "hi")).toBe("त्र्यंबकेश्वर ज्योतिर्लिंग मंदिर");
    });

    it("resolves temple by templeSlug or templeSlugs array", () => {
      const poojaWithSlug: Pooja = {
        slug: "khatu-shyam-kirtan",
        title: "Shree Khatu Shyam Bhajan & Kirtan",
        hindiTitle: "श्री खाटू श्याम भजन एवं कीर्तन",
        price: 1101,
        benefits: ["Bhakti & Blessings"],
        bestMuhurat: "Ekadashi",
        duration: "3 hours",
        description: "Devotional kirtan",
        emoji: "🪔",
        gradient: "from-amber-500 to-orange-700",
        templeSlug: "khatu-shyam",
      };

      const resolved = resolvePoojaTemple(poojaWithSlug, mockTemples);
      expect(resolved?.name).toBe("Khatu Shyam Ji Temple");
    });

    it("returns null gracefully when no temple is assigned to the puja", () => {
      const homePooja: Pooja = {
        slug: "griha-shanti-home",
        title: "Vedic Griha Shanti at Home",
        hindiTitle: "वैदिक गृह शांति पूजा",
        price: 3101,
        benefits: ["Home Harmony"],
        bestMuhurat: "Any auspicious day",
        duration: "2 hours",
        description: "Performed at devotee's residence",
        emoji: "🏠",
        gradient: "from-emerald-600 to-teal-800",
        type: "home",
        templeId: "",
        templeSlugs: [],
      };

      // Crucial: Must return null instead of falling back to Kashi Vishwanath or defaultTemples[0]!
      const resolved = resolvePoojaTemple(homePooja, mockTemples);
      expect(resolved).toBeNull();
    });

    it("updates resolved temple name immediately when admin edits templeId reference", () => {
      const dynamicPooja: Pooja = {
        slug: "special-yagya",
        title: "Maha Yagya Seva",
        hindiTitle: "महायज्ञ सेवा",
        price: 5101,
        benefits: ["Divine protection"],
        bestMuhurat: "Purnima",
        duration: "4 hours",
        description: "Auspicious havan",
        emoji: "🔥",
        gradient: "from-orange-500 to-rose-700",
        templeId: "66f123456789abcdef000001",
      };

      // Initially linked to Trimbakeshwar
      const initial = resolvePoojaTemple(dynamicPooja, mockTemples);
      expect(initial?.name).toBe("Trimbakeshwar Shiva Temple");

      // Admin updates temple to Khatu Shyam
      const updatedPooja = {
        ...dynamicPooja,
        templeId: "66f123456789abcdef000002",
        templeSlug: "khatu-shyam",
      };
      const updated = resolvePoojaTemple(updatedPooja, mockTemples);
      expect(updated?.name).toBe("Khatu Shyam Ji Temple");

      // Admin unassigns temple
      const unassignedPooja = {
        ...dynamicPooja,
        templeId: "",
        templeSlug: "",
        templeSlugs: [],
      };
      const unassigned = resolvePoojaTemple(unassignedPooja, mockTemples);
      expect(unassigned).toBeNull();
    });
  });
});
