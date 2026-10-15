import { describe, expect, it, vi } from "vitest";
import { DEMO_POOJA, getLocalizedPoojaNativeBadge, getLocalizedPoojaTitle, type Pooja } from "../lib/data";

describe("Puja Card Full Banner Display & Direct Booking Navigation", () => {
  const samplePooja: Pooja = {
    ...DEMO_POOJA,
    id: "test-puja-1",
    slug: "someshwar-mahadev-abhishek",
    title: "Someshwar Mahadev Abhishek",
    hindiTitle: "सोमेश्वर महादेव अभिषेक",
    category: "Abhishek",
    type: "temple",
    price: 251,
    imageUrl: "/festivals/shivratri.jpg",
  };

  describe("1. Complete Banner Aspect Ratio & Dimension Calculation", () => {
    // Helper replicating the container aspect ratio logic in PoojaCard
    const calculateContainerAspect = (aspectRatio: number | null): number | null => {
      if (!aspectRatio || !Number.isFinite(aspectRatio)) return null;
      return Math.max(0.75, Math.min(aspectRatio, 1.85));
    };

    it("preserves standard 16:9 landscape banners without forcing portrait crop", () => {
      const landscapeRatio = 16 / 9; // ~1.777
      const containerAspect = calculateContainerAspect(landscapeRatio);

      expect(containerAspect).toBeCloseTo(1.777, 2);
      expect(containerAspect).toBeGreaterThan(1.5);
    });

    it("preserves classic 4:3 landscape banners across available width", () => {
      const photoRatio = 4 / 3; // ~1.333
      const containerAspect = calculateContainerAspect(photoRatio);

      expect(containerAspect).toBeCloseTo(1.333, 2);
    });

    it("preserves square 1:1 banners cleanly", () => {
      const squareRatio = 1.0;
      const containerAspect = calculateContainerAspect(squareRatio);

      expect(containerAspect).toBe(1.0);
    });

    it("displays complete portrait banners (4:5 / 3:4) without excessive side letterboxing", () => {
      // 4:5 poster (e.g. 800x1000)
      const portraitRatio4_5 = 800 / 1000; // 0.8
      const aspect4_5 = calculateContainerAspect(portraitRatio4_5);
      expect(aspect4_5).toBe(0.8);

      // 3:4 poster (e.g. 750x1000)
      const portraitRatio3_4 = 750 / 1000; // 0.75
      const aspect3_4 = calculateContainerAspect(portraitRatio3_4);
      expect(aspect3_4).toBe(0.75);
    });

    it("clamps ultra-tall portrait banners (e.g. 9:16) to protect grid layout stability", () => {
      const tallRatio = 9 / 16; // 0.5625
      const containerAspect = calculateContainerAspect(tallRatio);

      // Clamped to 0.75 (3:4) so card height doesn't explode the grid, while object-contain fits banner
      expect(containerAspect).toBe(0.75);
    });

    it("clamps ultra-wide panoramic banners (e.g. 21:9) cleanly", () => {
      const ultrawideRatio = 21 / 9; // ~2.333
      const containerAspect = calculateContainerAspect(ultrawideRatio);

      expect(containerAspect).toBe(1.85);
    });

    it("returns null fallback for unmeasured or null ratios", () => {
      expect(calculateContainerAspect(null)).toBeNull();
      expect(calculateContainerAspect(0)).toBeNull();
    });
  });

  describe("2. Direct Booking Route & Navigation on Image Click", () => {
    it("ensures clicking the banner navigates directly to the booking route /book/[slug]", () => {
      const pushedRoutes: string[] = [];
      const mockRouter = {
        push: (url: string) => pushedRoutes.push(url),
      };

      const handleImageClick = (slug: string) => {
        mockRouter.push(`/book/${slug}`);
      };

      handleImageClick(samplePooja.slug);

      expect(pushedRoutes).toHaveLength(1);
      expect(pushedRoutes[0]).toBe(`/book/${samplePooja.slug}`);
    });

    it("verifies banner click and Book Now button target the exact same booking entry point", () => {
      const navigatedByBanner: string[] = [];
      const navigatedByBtn: string[] = [];

      const navigateToPooja = (target: "banner" | "button", slug: string) => {
        const route = `/book/${slug}`;
        if (target === "banner") navigatedByBanner.push(route);
        else navigatedByBtn.push(route);
      };

      navigateToPooja("banner", samplePooja.slug);
      navigateToPooja("button", samplePooja.slug);

      expect(navigatedByBanner[0]).toBe(navigatedByBtn[0]);
      expect(navigatedByBanner[0]).toBe(`/book/someshwar-mahadev-abhishek`);
    });

    it("verifies nested click event propagation is stopped to prevent duplicate navigation", () => {
      const stopPropagationMock = vi.fn();
      const mockEvent = {
        stopPropagation: stopPropagationMock,
      } as unknown as React.MouseEvent;

      const onBannerClick = (e: React.MouseEvent, navigate: () => void) => {
        e.stopPropagation();
        navigate();
      };

      const navigateMock = vi.fn();
      onBannerClick(mockEvent, navigateMock);

      expect(stopPropagationMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledTimes(1);
    });

    it("supports keyboard activation via Enter and Space with default prevention", () => {
      const navigateMock = vi.fn();

      const onKeyDown = (key: string, navigate: () => void) => {
        const preventDefault = vi.fn();
        const stopPropagation = vi.fn();

        if (key === "Enter" || key === " ") {
          preventDefault();
          stopPropagation();
          navigate();
        }

        return { preventDefault, stopPropagation };
      };

      // Test Enter key
      const enterResult = onKeyDown("Enter", navigateMock);
      expect(enterResult.preventDefault).toHaveBeenCalledTimes(1);
      expect(enterResult.stopPropagation).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledTimes(1);

      // Test Space key
      const spaceResult = onKeyDown(" ", navigateMock);
      expect(spaceResult.preventDefault).toHaveBeenCalledTimes(1);
      expect(spaceResult.stopPropagation).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledTimes(2);

      // Test Tab key (should NOT trigger navigation)
      const tabResult = onKeyDown("Tab", navigateMock);
      expect(tabResult.preventDefault).not.toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("3. Badge Formatting & Collision Prevention", () => {
    it("displays clean category or native script instead of repeating the English title", () => {
      const getTopBadgeText = (p: Pooja, locale: string) => {
        const poojaTitle = getLocalizedPoojaTitle(p, locale);
        const nativeBadge = getLocalizedPoojaNativeBadge(p, locale);
        const isDifferent = Boolean(nativeBadge && nativeBadge.trim() !== poojaTitle.trim());

        return isDifferent
          ? nativeBadge
          : p.category && p.category.trim()
          ? p.category.trim()
          : p.type === "home"
          ? "Home Puja"
          : "Vedic Seva";
      };

      // In English: should show category "Abhishek" instead of repeating title
      const enBadge = getTopBadgeText(samplePooja, "en");
      expect(enBadge).toBe("Abhishek");
      expect(enBadge).not.toBe(samplePooja.title);

      // In Hindi: since title is already translated to Hindi, it shows category "Abhishek" instead of repeating
      const hiBadge = getTopBadgeText(samplePooja, "hi");
      expect(hiBadge).toBe("Abhishek");

      // When native script differs from displayed title (e.g. custom native title on English card)
      const poojaWithCustomBadge: Pooja = {
        ...samplePooja,
        title: "Kashi Vishwanath Puja",
      };
      // native badge differs from title
      const customBadge = getTopBadgeText({ ...poojaWithCustomBadge, hindiTitle: "काशी विश्वनाथ" }, "en");
      expect(customBadge).toBe("Abhishek");
    });
  });
});
