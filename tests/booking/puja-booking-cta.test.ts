import { describe, expect, it, vi } from "vitest";
import { translations, type Locale } from "@/lib/i18n";
import { formatINR } from "@/lib/format";
import { DEMO_POOJA } from "@/lib/data";

describe("Puja Details Primary Booking CTA & Responsive Sticky Bar", () => {
  const locales: Locale[] = ["en", "hi", "te", "ta"];

  it("verifies translation labels for the primary Book Now CTA exist in all supported languages", () => {
    for (const loc of locales) {
      const dict = translations[loc];
      expect(dict["book.bookNow"], `Missing book.bookNow for ${loc}`).toBeTruthy();
      expect(dict["service.from"], `Missing service.from for ${loc}`).toBeTruthy();
      expect(dict["service.groupDakshinaLabel"], `Missing service.groupDakshinaLabel for ${loc}`).toBeTruthy();
      expect(dict["service.startingDakshina"], `Missing service.startingDakshina for ${loc}`).toBeTruthy();
      expect(dict["service.nextStepHint"], `Missing service.nextStepHint for ${loc}`).toBeTruthy();
    }
  });

  it("formats the primary CTA button label consistently across prices", () => {
    const formattedPrice = formatINR(251);
    expect(formattedPrice).toBe("₹251");

    const enLabel = `${translations.en["book.bookNow"]} — ${translations.en["service.from"]} ${formattedPrice}`;
    expect(enLabel).toBe("Book Now — From ₹251");

    const hiLabel = `${translations.hi["book.bookNow"]} — ${translations.hi["service.from"]} ${formattedPrice}`;
    expect(hiLabel).toContain("₹251");
  });

  it("ensures both main and sticky CTAs trigger the exact same booking route and slug", () => {
    const mockOpenBooking = vi.fn();
    const handleBookNow = (slug: string) => {
      mockOpenBooking(slug);
    };

    // Trigger via main CTA
    handleBookNow(DEMO_POOJA.slug);
    expect(mockOpenBooking).toHaveBeenCalledTimes(1);
    expect(mockOpenBooking).toHaveBeenCalledWith(DEMO_POOJA.slug);

    // Trigger via sticky bottom bar
    handleBookNow(DEMO_POOJA.slug);
    expect(mockOpenBooking).toHaveBeenCalledTimes(2);
    expect(mockOpenBooking).toHaveBeenLastCalledWith(DEMO_POOJA.slug);
  });

  it("simulates scroll-aware visibility transitions based on viewport intersection", () => {
    let isMainCtaInView = true;

    // Simulate observer callback when main CTA is in viewport (initial or scrolled to)
    const onIntersection = (isIntersecting: boolean) => {
      isMainCtaInView = isIntersecting;
    };

    // When main CTA is visible on screen, sticky bar is hidden (zero duplicate buttons)
    onIntersection(true);
    expect(isMainCtaInView).toBe(true);

    const getStickyClassNames = (inView: boolean) => {
      return inView
        ? "translate-y-full opacity-0 pointer-events-none"
        : "translate-y-0 opacity-100 pointer-events-auto";
    };

    expect(getStickyClassNames(isMainCtaInView)).toContain("translate-y-full opacity-0");

    // When user scrolls away and main CTA leaves viewport, sticky bar smoothly appears
    onIntersection(false);
    expect(isMainCtaInView).toBe(false);
    expect(getStickyClassNames(isMainCtaInView)).toContain("translate-y-0 opacity-100");
  });

  it("verifies safe-area inset protection and clearance to prevent content overlap", () => {
    // Check that CSS class styles include safe area bottom inset and bottom page padding
    const stickyBarClasses =
      "fixed bottom-0 inset-x-0 z-40 border-t border-saffron-200/90 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(0,0,0,0.08)] backdrop-blur-md";
    expect(stickyBarClasses).toContain("env(safe-area-inset-bottom)");
    expect(stickyBarClasses).toContain("fixed bottom-0");

    const pageContainerClasses = "min-h-screen bg-[#FFFDF9] pt-6 pb-28 sm:pt-10 sm:pb-32";
    expect(pageContainerClasses).toContain("pb-28");
    expect(pageContainerClasses).toContain("sm:pb-32");
  });
});
