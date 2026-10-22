import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { translations, SUPPORTED_LANGUAGES, type Locale } from "@/lib/i18n";

describe("Booking Confirmation & Payment Modal Post-Payment Experience", () => {
  it("verifies 5-second redirect and pause translation keys exist across all 4 supported languages", () => {
    const requiredKeys = [
      "booking.confirm.redirecting",
      "booking.confirm.redirectPaused",
      "booking.confirm.goToHomeNow",
      "booking.confirm.stayOnPage",
      "booking.confirm.resumeRedirect",
    ] as const;

    const locales: Locale[] = ["en", "hi", "te", "ta"];

    for (const loc of locales) {
      const dict = translations[loc] as Record<string, string>;
      for (const key of requiredKeys) {
        expect(dict[key], `Locale '${loc}' must define key '${key}'`).toBeTruthy();
        expect(dict[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("verifies LanguageToggle has been removed from BookingModal", () => {
    const modalFilePath = path.resolve(
      process.cwd(), "features/bookings/components/BookingModal.tsx"
    );
    const content = fs.readFileSync(modalFilePath, "utf8");

    // LanguageToggle component should not be imported or rendered in the modal header
    expect(content).not.toContain("<LanguageToggle");
    expect(content).not.toContain("LanguageToggle");
  });

  it("verifies BookingConfirmation handles modal scrolling, 5-second countdown, and redirect", () => {
    const confirmationFilePath = path.resolve(
      process.cwd(), "features/bookings/components/BookingConfirmation.tsx"
    );
    const content = fs.readFileSync(confirmationFilePath, "utf8");

    // Modal scroll container support
    expect(content).toContain("overflow-y-auto modal-scrollbar overscroll-contain");

    // 5-second countdown state
    expect(content).toContain("useState(5)");
    expect(content).toContain("booking.confirm.redirecting");

    // Home redirect navigation
    expect(content).toContain('router.push("/")');

    // Pause / Stay controls
    expect(content).toContain("booking.confirm.stayOnPage");
    expect(content).toContain("booking.confirm.goToHomeNow");
  });
});
