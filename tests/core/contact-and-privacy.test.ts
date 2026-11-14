import { describe, expect, it } from "vitest";
import { SITE_CONFIG, getWhatsAppUrl, isHiddenPhoneNumber } from "@/lib/config";
import { contactInfo } from "@/lib/data";
import { DEFAULT_CHATBOT_SETTINGS } from "@/lib/chatbot-types";

describe("Global Contact Information & Privacy-Safe Configuration", () => {
  it("hides personal phone numbers by default and uses official email in SITE_CONFIG", () => {
    // Personal phone numbers must not be hardcoded or leaked
    expect(SITE_CONFIG.contact.phoneRaw).not.toBe("9621014155");
    expect(SITE_CONFIG.contact.phoneDisplay).not.toContain("96210 14155");
    expect(SITE_CONFIG.contact.whatsappNumber).not.toBe("919621014155");
    expect(SITE_CONFIG.contact.email).toBe("infotemplepujasewa@gmail.com");
  });

  it("correctly identifies hidden personal phone numbers", () => {
    expect(isHiddenPhoneNumber("9621014155")).toBe(true);
    expect(isHiddenPhoneNumber("+91 96210 14155")).toBe(true);
    expect(isHiddenPhoneNumber("919621014155")).toBe(true);
    expect(isHiddenPhoneNumber("9876543210")).toBe(false);
    expect(isHiddenPhoneNumber("+91 98765 43210")).toBe(false);
  });

  it("configures official social media URLs for Instagram, Facebook, and YouTube", () => {
    expect(SITE_CONFIG.social.instagram).toContain("instagram.com/templepujasewa");
    expect(SITE_CONFIG.social.facebook).toContain("facebook.com");
    expect(SITE_CONFIG.social.youtube).toContain("youtube.com/@TEMPLEPUJASEWA");
  });

  it("generates privacy-safe WhatsApp URLs without leaking private phone numbers", () => {
    const defaultUrl = getWhatsAppUrl();
    expect(defaultUrl).toContain("https://wa.me/");
    expect(defaultUrl).not.toContain("9621014155");

    const customUrl = getWhatsAppUrl("Test inquiry");
    expect(customUrl).toContain("https://wa.me/");
    expect(customUrl).toContain("Test%20inquiry");
    expect(customUrl).not.toContain("9621014155");
  });

  it("exports safe contactInfo without hardcoded personal phone number", () => {
    const wa = contactInfo.find((c) => c.label.includes("WhatsApp"));
    expect(wa?.href).not.toContain("9621014155");
    expect(wa?.value).not.toContain("96210 14155");

    const phone = contactInfo.find((c) => c.label.includes("Helpline"));
    expect(phone?.href).not.toContain("9621014155");
    expect(phone?.value).not.toContain("96210 14155");

    const email = contactInfo.find((c) => c.label.includes("Email"));
    expect(email?.href).toBe("mailto:infotemplepujasewa@gmail.com");
    expect(email?.value).toBe("infotemplepujasewa@gmail.com");
  });

  it("does not leak personal phone number in Pandit AI chatbot defaults", () => {
    expect(DEFAULT_CHATBOT_SETTINGS.supportPhone).not.toContain("9621014155");
  });
});
