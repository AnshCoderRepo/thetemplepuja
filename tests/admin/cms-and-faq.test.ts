import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  clearCatalogOverrides,
  getResolvedCatalog,
  saveCatalogOverrides,
  getFaqs,
  saveFaqs,
  getSiteContent,
  saveSiteContent,
} from "@/lib/server-store";
import { faqs as defaultFaqs, type FaqItem } from "@/lib/data";
import {
  DEFAULT_SITE_CONTENT,
  DEFAULT_VEDIC_ASSURANCES,
  type SiteContent,
} from "@/lib/cms-types";
import { normalizeAdminTab } from "@/lib/admin-tab";
import {
  getCatalogFaqs,
  saveCatalogFaqs,
  resetCatalogFaqs,
  getCatalogSiteContent,
  saveCatalogSiteContent,
  resetCatalogSiteContent,
} from "@/lib/catalog";

beforeAll(() => {
  process.env.TTP_STORE = "memory";
});

describe("FAQ Management & Persistence System", () => {
  beforeEach(async () => {
    await clearCatalogOverrides(["faqs"]);
    resetCatalogFaqs();
  });

  const customFaqItem: FaqItem = {
    id: "custom-faq-test-1",
    q: "Can I perform a special puja for birthday or anniversary?",
    a: "Yes, personalized Vedic sankalp and blessings are available for all special occasions.",
    hindiQ: "क्या मैं जन्मदिन या सालगिरह के लिए विशेष पूजा करवा सकता हूँ?",
    hindiA: "हाँ, सभी विशेष अवसरों के लिए व्यक्तिगत वैदिक संकल्प और आशीर्वाद उपलब्ध है।",
    order: 1,
    active: true,
  };

  const hiddenFaqItem: FaqItem = {
    id: "hidden-faq-test-2",
    q: "What is the secret mantra for quick results?",
    a: "All Vedic mantras require faith and dedicated observance.",
    order: 2,
    active: false,
  };

  it("resolves to static default FAQs when no override exists", async () => {
    const catalog = await getResolvedCatalog();
    expect(catalog.faqs.length).toBe(defaultFaqs.length);
    expect(catalog.faqs[0].q).toBe(defaultFaqs[0].q);
  });

  it("persists custom FAQs and updates the resolved catalog", async () => {
    const customList = [customFaqItem, hiddenFaqItem, ...defaultFaqs];
    await saveFaqs(customList);

    const catalog = await getResolvedCatalog();
    expect(catalog.faqs.length).toBe(defaultFaqs.length + 2);

    const found = catalog.faqs.find((f) => f.id === "custom-faq-test-1");
    expect(found).toBeDefined();
    expect(found?.q).toContain("birthday or anniversary");
    expect(found?.hindiQ).toContain("जन्मदिन");
    expect(found?.active).toBe(true);
  });

  it("supports toggling visibility (active / inactive)", async () => {
    const customList = [customFaqItem, hiddenFaqItem];
    await saveFaqs(customList);

    const catalog = await getResolvedCatalog();
    const activeFaqs = catalog.faqs.filter((f) => f.active !== false);

    expect(activeFaqs.length).toBe(1);
    expect(activeFaqs[0].id).toBe("custom-faq-test-1");
  });

  it("supports client catalog caching and storage sync", () => {
    const clientList: FaqItem[] = [customFaqItem];
    saveCatalogFaqs(clientList);

    const cached = getCatalogFaqs();
    expect(cached.length).toBe(1);
    expect(cached[0].id).toBe("custom-faq-test-1");

    resetCatalogFaqs();
    const resetList = getCatalogFaqs();
    expect(resetList.length).toBe(defaultFaqs.length);
  });

  it("clears FAQ overrides and restores default Vedic FAQs", async () => {
    await saveFaqs([customFaqItem]);
    let catalog = await getResolvedCatalog();
    expect(catalog.faqs.length).toBe(1);

    await clearCatalogOverrides(["faqs"]);
    catalog = await getResolvedCatalog();
    expect(catalog.faqs.length).toBe(defaultFaqs.length);
  });
});

describe("CMS Site Content Management System", () => {
  beforeEach(async () => {
    await clearCatalogOverrides(["siteContent"]);
    resetCatalogSiteContent();
  });

  const customSiteContent: SiteContent = {
    announcementStrip: {
      enabled: true,
      items: [
        {
          icon: "🕉️",
          label: "Special Navratri Anushthan Open",
          hindiLabel: "विशेष नवरात्रि अनुष्ठान प्रारंभ",
        },
        {
          icon: "🪔",
          label: "Live Kashi Darshan",
          hindiLabel: "काशी लाइव दर्शन",
        },
      ],
    },
    hero: {
      badgeText: "Devotional Sanctuary",
      title: "Sacred Vedic Poojas Direct from Ayodhya & Kashi",
      subtitle: "Authentic purohits chanting your gotra sankalp with sacred prasad delivery.",
      ctaText: "Book Sacred Seva",
      featuredPujaSlug: "rudrabhishek-puja",
    },
    vedicAssurances: {
      heading: "Our 5 Divine Guarantees",
      subheading: "Sacred assurances ensuring pure Shastric vidhi.",
      items: DEFAULT_VEDIC_ASSURANCES,
    },
    footer: {
      aboutText: "Devotee-first Vedic seva platform honoring Sanatan Dharma.",
      phone: "+91 99999 88888",
      email: "support@templepujasewa.com",
      copyrightText: "© 2026 TemplePujaSewa Sacred Sanctuary. All Rights Reserved.",
    },
  };

  it("resolves to default site content when no override exists", async () => {
    const catalog = await getResolvedCatalog();
    expect(catalog.siteContent).toBeDefined();
    expect(catalog.siteContent.announcementStrip?.enabled).toBe(true);
    expect(catalog.siteContent.hero?.badgeText).toBe(DEFAULT_SITE_CONTENT.hero?.badgeText);
  });

  it("persists custom site content overrides", async () => {
    await saveSiteContent(customSiteContent);

    const catalog = await getResolvedCatalog();
    expect(catalog.siteContent.announcementStrip?.items?.length).toBe(2);
    expect(catalog.siteContent.announcementStrip?.items?.[0].label).toContain("Navratri Anushthan");
    expect(catalog.siteContent.hero?.title).toContain("Ayodhya & Kashi");
    expect(catalog.siteContent.hero?.featuredPujaSlug).toBe("rudrabhishek-puja");
    expect(catalog.siteContent.vedicAssurances?.heading).toBe("Our 5 Divine Guarantees");
    expect(catalog.siteContent.footer?.phone).toBe("+91 99999 88888");
  });

  it("supports disabling the announcement marquee strip", async () => {
    const disabledStripContent: SiteContent = {
      ...customSiteContent,
      announcementStrip: {
        enabled: false,
        items: [],
      },
    };
    await saveSiteContent(disabledStripContent);

    const catalog = await getResolvedCatalog();
    expect(catalog.siteContent.announcementStrip?.enabled).toBe(false);
  });

  it("supports client-side catalog siteContent caching and reset", () => {
    saveCatalogSiteContent(customSiteContent);
    const cached = getCatalogSiteContent();
    expect(cached.hero?.featuredPujaSlug).toBe("rudrabhishek-puja");

    resetCatalogSiteContent();
    const restored = getCatalogSiteContent();
    expect(restored.hero?.featuredPujaSlug).toBe(DEFAULT_SITE_CONTENT.hero?.featuredPujaSlug);
  });

  it("clears siteContent overrides and restores defaults", async () => {
    await saveSiteContent(customSiteContent);
    let catalog = await getResolvedCatalog();
    expect(catalog.siteContent.hero?.title).toContain("Ayodhya & Kashi");

    await clearCatalogOverrides(["siteContent"]);
    catalog = await getResolvedCatalog();
    expect(catalog.siteContent.hero?.title).toBe(DEFAULT_SITE_CONTENT.hero?.title);
  });
});

describe("Admin Routing Tab Resolution for FAQ and CMS", () => {
  it("normalizes 'faq' and its aliases to 'faq'", () => {
    expect(normalizeAdminTab("faq")).toBe("faq");
    expect(normalizeAdminTab("faqs")).toBe("faq");
    expect(normalizeAdminTab("questions")).toBe("faq");
    expect(normalizeAdminTab("help-center")).toBe("faq");
  });

  it("normalizes 'cms' and its aliases to 'cms'", () => {
    expect(normalizeAdminTab("cms")).toBe("cms");
    expect(normalizeAdminTab("content")).toBe("cms");
    expect(normalizeAdminTab("site-content")).toBe("cms");
    expect(normalizeAdminTab("website-content")).toBe("cms");
  });
});

describe("Multi-Language Automatic Synchronization Engine", () => {
  it("translates text across languages bidirectionally", async () => {
    const { translateText } = await import("@/lib/translate-service");

    // English -> Hindi, Telugu, Tamil
    const hiFromEn = await translateText("Book Puja Now", "en", "hi");
    expect(hiFromEn).toBeTruthy();
    expect(typeof hiFromEn).toBe("string");

    // Hindi -> English, Telugu, Tamil
    const enFromHi = await translateText("पूजा कैसे बुक करें?", "hi", "en");
    expect(enFromHi).toBeTruthy();
    expect(typeof enFromHi).toBe("string");

    // Same language returns original text immediately
    const same = await translateText("Vedic Puja", "en", "en");
    expect(same).toBe("Vedic Puja");
  });

  it("translates a dictionary of fields from any source language", async () => {
    const { translateFields } = await import("@/lib/translate-service");

    const fields = {
      q: "Can I perform a special puja for birthday or anniversary?",
      a: "Yes, personalized Vedic sankalp and blessings are available for all special occasions.",
    };

    const res = await translateFields(fields, "en", ["hi", "te", "ta"]);
    expect(res.hi).toBeDefined();
    expect(res.hi.q).toBeTruthy();
    expect(res.hi.a).toBeTruthy();

    expect(res.te).toBeDefined();
    expect(res.te.q).toBeTruthy();

    expect(res.ta).toBeDefined();
    expect(res.ta.q).toBeTruthy();
  });

  it("persists and localizes 4-language FAQ items correctly", async () => {
    const { getLocalizedFaqQ, getLocalizedFaqA } = await import("@/lib/data");

    const multiFaq: FaqItem = {
      id: "multi-sync-faq-1",
      q: "Will I receive prasad?",
      a: "Yes, blessed temple prasad is delivered to your home.",
      hindiQ: "क्या मुझे प्रसाद मिलेगा?",
      hindiA: "हाँ, पावन प्रसाद आपके घर पहुंचाया जाता है।",
      teluguQ: "నాకు ప్రసాదం అందుతుందా?",
      teluguA: "అవును, పవిత్ర ప్రసాదం మీ ఇంటికి డెలివరీ చేయబడుతుంది.",
      tamilQ: "எனக்கு பிரசாதம் கிடைக்குமா?",
      tamilA: "ஆம், புனித பிரசாதம் உங்கள் வீட்டிற்கு அனுப்பப்படும்.",
      order: 1,
      active: true,
    };

    await saveFaqs([multiFaq]);
    const catalog = await getResolvedCatalog();
    const saved = catalog.faqs.find((f) => f.id === "multi-sync-faq-1");
    expect(saved).toBeDefined();

    // Verify all 4 locales resolve to their corresponding translation
    expect(getLocalizedFaqQ(saved!, "en")).toBe("Will I receive prasad?");
    expect(getLocalizedFaqQ(saved!, "hi")).toBe("क्या मुझे प्रसाद मिलेगा?");
    expect(getLocalizedFaqQ(saved!, "te")).toBe("నాకు ప్రసాదం అందుతుందా?");
    expect(getLocalizedFaqQ(saved!, "ta")).toBe("எனக்கு பிரசாதம் கிடைக்குமா?");

    expect(getLocalizedFaqA(saved!, "en")).toContain("blessed temple prasad");
    expect(getLocalizedFaqA(saved!, "hi")).toContain("पावन प्रसाद");
    expect(getLocalizedFaqA(saved!, "te")).toContain("పవిత్ర ప్రసాదం");
    expect(getLocalizedFaqA(saved!, "ta")).toContain("புனித பிரசாதம்");
  });

  it("persists and localizes Hero content with all 4 languages", async () => {
    const multiHeroSiteContent: SiteContent = {
      hero: {
        title: "Book Authentic Temple Pujas",
        hindiTitle: "प्रामाणिक मंदिर पूजा बुक करें",
        teluguTitle: "ప్రామాణిక ఆలయ పూజలను బుక్ చేయండి",
        tamilTitle: "அங்கீகரிக்கப்பட்ட கோயில் பூஜைகளை பதிவு செய்யுங்கள்",
        subtitle: "Experience divine blessings",
        hindiSubtitle: "दिव्य आशीर्वाद प्राप्त करें",
        teluguSubtitle: "దైవిక ఆశీస్సులను పొందండి",
        tamilSubtitle: "தெய்வீக அருளைப் பெறுங்கள்",
      },
    };

    await saveSiteContent(multiHeroSiteContent);
    const catalog = await getResolvedCatalog();

    expect(catalog.siteContent.hero?.title).toBe("Book Authentic Temple Pujas");
    expect(catalog.siteContent.hero?.hindiTitle).toBe("प्रामाणिक मंदिर पूजा बुक करें");
    expect(catalog.siteContent.hero?.teluguTitle).toBe("ప్రామాణిక ఆలయ పూజలను బుక్ చేయండి");
    expect(catalog.siteContent.hero?.tamilTitle).toBe("அங்கீகரிக்கப்பட்ட கோயில் பூஜைகளை பதிவு செய்யுங்கள்");
  });
});

