import { describe, expect, it } from "vitest";
import { translations, type Locale } from "@/lib/i18n";
import { getWhatsAppUrl, SITE_CONFIG } from "@/lib/config";

describe("Sankalp Booking Assistance Banner", () => {
  it("has complete translation keys across all 4 supported languages", () => {
    const locales: Locale[] = ["en", "hi", "te", "ta"];

    for (const loc of locales) {
      const dict = translations[loc];
      expect(dict["book.sankalpHelpHeading"], `Heading missing in ${loc}`).toBeTruthy();
      expect(dict["book.sankalpHelpSubtitle"], `Subtitle missing in ${loc}`).toBeTruthy();
      expect(dict["book.sankalpHelpCta"], `Primary CTA missing in ${loc}`).toBeTruthy();
      expect(dict["book.sankalpHelpExplore"], `Explore CTA missing in ${loc}`).toBeTruthy();
    }
  });

  it("English translation matches the exact requested text", () => {
    const en = translations.en;
    expect(en["book.sankalpHelpHeading"]).toBe("Need Help in Sankalp Booking?");
    expect(en["book.sankalpHelpSubtitle"]).toBe(
      "Need help with your Sankalp or Puja booking? Our team will guide you."
    );
    expect(en["book.sankalpHelpCta"]).toBe("Talk to an Expert");
    expect(en["book.sankalpHelpExplore"]).toBe("Explore Pujas");
  });

  it("generates correct WhatsApp assistance URL for 'Talk to an Expert'", () => {
    const msg = "Namaste, I need help with Sankalp and Puja booking on TemplePujaSewa.";
    const url = getWhatsAppUrl(msg);
    expect(url).toContain("https://wa.me/");
    expect(url).toContain(SITE_CONFIG.contact.whatsappNumber);
    expect(url).toContain(encodeURIComponent(msg));
  });
});
