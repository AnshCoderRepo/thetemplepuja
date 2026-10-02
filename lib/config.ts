/**
 * ═══════════════════════════════════════════════════════════════════════
 * THE TEMPLE PUJA — CENTRALIZED CLIENT & ENVIRONMENT CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════
 * 
 * Single source of truth for all business contact details, phone numbers,
 * WhatsApp messaging, email addresses, and environment overrides.
 *
 * When delivering to a client:
 * 1. Update the default values in this file OR
 * 2. Set the corresponding environment variables in .env.local
 */

export const SITE_CONFIG = {
  // Brand & Domain
  brandName: "The Temple Puja",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://thetemplepuja.com",

  // Business Contact Details (Easily replaceable for client handoff)
  contact: {
    // 10-digit mobile number
    phoneRaw: process.env.NEXT_PUBLIC_CONTACT_PHONE || "7070410031",
    // Human-readable formatted phone
    phoneDisplay: process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || "+91 70704 10031",
    // Country code prefix (digits only)
    countryCode: "91",
    // Full WhatsApp international number (e.g. 917070410031, strictly digits)
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917070410031",
    // Official pre-filled greeting message for customer support
    whatsappPreFilledMessage: "Namaste, I would like to know more about your Puja services.",
    // Support & Admin Email
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "admin@thetemplepuja.com",
  },

  // Admin Portal Defaults
  admin: {
    defaultEmail: process.env.ADMIN_EMAIL || "admin@thetemplepuja.com",
    defaultPassword: process.env.ADMIN_PASSWORD || "admin123",
  },
} as const;

/**
 * Generate a standard, compliant WhatsApp Click-to-Chat URL
 * @param customMessage Optional custom greeting or enquiry text
 */
export function getWhatsAppUrl(customMessage?: string): string {
  const number = SITE_CONFIG.contact.whatsappNumber.replace(/\D/g, "");
  const message = customMessage || SITE_CONFIG.contact.whatsappPreFilledMessage;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${number}?text=${encoded}`;
}

export default SITE_CONFIG;
