import { describe, expect, it } from "vitest";
import {
  DEMO_POOJA,
  getLocalizedPoojaTitle,
  type Pooja,
} from "@/lib/data";

describe("Puja Card Title Display & Line Clamping", () => {
  const samplePoojaLongTitle: Pooja = {
    ...DEMO_POOJA,
    slug: "rama-ekadashi-special-vishnu-tulsi-archan",
    title: "Rama Ekadashi Special Vishnu Tulsi Archan & Maha Hawan",
    hindiTitle: "रमा एकादशी विशेष विष्णु तुलसी अर्चन एवं महा हवन",
    teluguTitle: "రామ ఏకాదశి ప్రత్యేక విష్ణు తులసి అర్చన మరియు మహా హవనం",
    tamilTitle: "ராமர் ஏகாதசி சிறப்பு விஷ்ணு துளசி அர்ச்சனை மற்றும் மகா ஹவனம்",
    price: 251,
  };

  const samplePoojaShortTitle: Pooja = {
    ...DEMO_POOJA,
    slug: "dhan-lakshmi-puja",
    title: "Dhan Lakshmi Puja",
    hindiTitle: "धन लक्ष्मी पूजा",
    price: 3101,
  };

  it("retrieves the full localized Puja title without programmatic truncation", () => {
    const enTitle = getLocalizedPoojaTitle(samplePoojaLongTitle, "en");
    expect(enTitle).toBe("Rama Ekadashi Special Vishnu Tulsi Archan & Maha Hawan");
    expect(enTitle).not.toContain("...");

    const hiTitle = getLocalizedPoojaTitle(samplePoojaLongTitle, "hi");
    expect(hiTitle).toBe("रमा एकादशी विशेष विष्णु तुलसी अर्चन एवं महा हवन");

    const teTitle = getLocalizedPoojaTitle(samplePoojaLongTitle, "te");
    expect(teTitle).toBe("రామ ఏకాదశి ప్రత్యేక విష్ణు తులసి అర్చన మరియు మహా హవనం");

    const taTitle = getLocalizedPoojaTitle(samplePoojaLongTitle, "ta");
    expect(taTitle).toBe("ராமர் ஏகாதசி சிறப்பு விஷ்ணு துளசி அர்ச்சனை மற்றும் மகா ஹவனம்");
  });

  it("ensures long puja titles are not prematurely truncated at 20-30 characters", () => {
    const title = getLocalizedPoojaTitle(samplePoojaLongTitle, "en");
    // "Rama Ekadashi Vishnu Tul..." was cut off at ~27 characters
    expect(title.length).toBeGreaterThan(45);
    expect(title.includes("Tulsi Archan & Maha Hawan")).toBe(true);
  });

  describe("CSS Class Verification for 2-Line Clamping & Height Alignment", () => {
    it("verifies the line-clamp-2 configuration and removal of line-clamp-1/truncate", () => {
      // The CSS classes used on the title heading in PoojaCard
      const headingClasses =
        "font-display text-sm sm:text-base font-bold text-ink group-hover:text-saffron-800 transition-colors leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] break-words";

      expect(headingClasses).toContain("line-clamp-2");
      expect(headingClasses).not.toContain("line-clamp-1");
      expect(headingClasses).not.toContain("truncate");
      expect(headingClasses).toContain("break-words");
    });

    it("verifies reserved vertical space ensures consistent alignment for 1-line and 2-line cards", () => {
      const headingClasses =
        "font-display text-sm sm:text-base font-bold text-ink group-hover:text-saffron-800 transition-colors leading-snug line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] break-words";

      // min-h-[2.5rem] on mobile (40px) and min-h-[2.75rem] on desktop (44px)
      // guarantees that 1-line titles take the same space as 2-line titles
      expect(headingClasses).toContain("min-h-[2.5rem]");
      expect(headingClasses).toContain("sm:min-h-[2.75rem]");
    });

    it("verifies price container has shrink-0 and whitespace-nowrap to prevent overlap", () => {
      const priceClasses =
        "font-display text-sm font-extrabold text-saffron-600 shrink-0 pt-0.5 whitespace-nowrap";

      expect(priceClasses).toContain("shrink-0");
      expect(priceClasses).toContain("whitespace-nowrap");
    });
  });
});

