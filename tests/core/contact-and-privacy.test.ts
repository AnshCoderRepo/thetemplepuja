import { describe, expect, it } from "vitest";
import { SITE_CONFIG, getWhatsAppUrl } from "@/lib/config";
import { contactInfo } from "@/lib/data";
import { DEFAULT_CHATBOT_SETTINGS } from "@/lib/chatbot-types";

describe("Global Contact Information & Privacy Policy Integration", () => {
  it("uses the approved phone number, WhatsApp number, and email in SITE_CONFIG", () => {
    expect(SITE_CONFIG.contact.phoneRaw).toBe("9621014155");
    expect(SITE_CONFIG.contact.phoneDisplay).toBe("+91 96210 14155");
    expect(SITE_CONFIG.contact.whatsappNumber).toBe("919621014155");
    expect(SITE_CONFIG.contact.email).toBe("infotemplepujasewa@gmail.com");
  });

  it("configures official social media URLs for Instagram, Facebook, and YouTube", () => {
    expect(SITE_CONFIG.social.instagram).toContain("instagram.com/templepujasewa");
    expect(SITE_CONFIG.social.facebook).toContain("facebook.com");
    expect(SITE_CONFIG.social.youtube).toContain("youtube.com/@TEMPLEPUJASEWA");
  });

  it("generates WhatsApp URLs using the correct international format https://wa.me/919621014155", () => {
    const defaultUrl = getWhatsAppUrl();
    expect(defaultUrl).toContain("https://wa.me/919621014155");

    const customUrl = getWhatsAppUrl("Test inquiry");
    expect(customUrl).toBe("https://wa.me/919621014155?text=Test%20inquiry");
  });

  it("exports updated contactInfo with new contact values and correct link protocols", () => {
    const wa = contactInfo.find((c) => c.label.includes("WhatsApp"));
    expect(wa?.href).toContain("https://wa.me/919621014155");
    expect(wa?.value).toBe("+91 96210 14155");

    const phone = contactInfo.find((c) => c.label.includes("Helpline"));
    expect(phone?.href).toBe("tel:9621014155");
    expect(phone?.value).toBe("+91 96210 14155");

    const email = contactInfo.find((c) => c.label.includes("Email"));
    expect(email?.href).toBe("mailto:infotemplepujasewa@gmail.com");
    expect(email?.value).toBe("infotemplepujasewa@gmail.com");
  });

  it("uses updated contact phone and email in Pandit AI chatbot defaults", () => {
    expect(DEFAULT_CHATBOT_SETTINGS.supportPhone).toBe("+91 96210 14155");
  });
});
