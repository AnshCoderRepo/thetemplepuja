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

const HIDDEN_PERSONAL_NUMBERS = ["9621014155", "919621014155"];

export function isHiddenPhoneNumber(val?: string | null): boolean {
  if (!val) return false;
  const digits = val.replace(/\D/g, "");
  return HIDDEN_PERSONAL_NUMBERS.some((num) => digits.includes(num));
}

function resolveContactPhoneRaw(): string {
  const envVal = (process.env.NEXT_PUBLIC_CONTACT_PHONE || "").trim();
  if (isHiddenPhoneNumber(envVal)) return "";
  return envVal;
}

function resolveContactPhoneDisplay(): string {
  const envVal = (process.env.NEXT_PUBLIC_CONTACT_PHONE_DISPLAY || "").trim();
  if (isHiddenPhoneNumber(envVal)) return "";
  if (envVal) return envVal;
  const raw = resolveContactPhoneRaw();
  return raw ? `+91 ${raw}` : "";
}

function resolveWhatsAppNumber(): string {
  const envVal = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").trim();
  if (isHiddenPhoneNumber(envVal)) return "";
  return envVal;
}

export const SITE_CONFIG = {
  // Brand & Domain
  brandName: "templepujasewa",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://templepujasewa.com",


  // Business Contact Details (Easily replaceable for client handoff)
  contact: {
    // 10-digit mobile number
    phoneRaw: resolveContactPhoneRaw(),
    // Human-readable formatted phone
    phoneDisplay: resolveContactPhoneDisplay(),
    // Country code prefix (digits only)
    countryCode: "91",
    // Full WhatsApp international number (strictly digits)
    whatsappNumber: resolveWhatsAppNumber(),
    // Official pre-filled greeting message for customer support
    whatsappPreFilledMessage: "Namaste, I would like to know more about your Puja services.",
    // Support & Admin Email
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "infotemplepujasewa@gmail.com",
    // Official WhatsApp Channel link (e.g. for daily panchang, pooja muhurat & darshan updates)
    whatsappChannelUrl:
      process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
      "https://whatsapp.com/channel/0029Vaexample",
  },

  // Official Social Media Handles & URLs
  social: {
    instagram:
      process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
      "https://www.instagram.com/templepujasewa?mdxt=cXd3andyOWN1cmNr",
    facebook:
      process.env.NEXT_PUBLIC_FACEBOOK_URL ||
      "https://www.facebook.com/share/1J1Wh1NRND/",
    youtube:
      process.env.NEXT_PUBLIC_YOUTUBE_URL ||
      "https://www.youtube.com/@TEMPLEPUJASEWA",
  },

  // Payment Configuration (UPI QR & Razorpay)
  payment: {
    // Current active payment mode: "upi_qr" (default) or "razorpay" (for future live credentials)
    mode: ((process.env.NEXT_PUBLIC_PAYMENT_MODE || "upi_qr").toLowerCase() === "razorpay"
      ? "razorpay"
      : "upi_qr") as "upi_qr" | "razorpay",
    // UPI ID to receive client payments (easily configurable via NEXT_PUBLIC_UPI_ID)
    upiId: process.env.NEXT_PUBLIC_UPI_ID || "rajnimaurya875@okicici",
    // Merchant/Payee name displayed on UPI app & QR code
    payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME || "templepujasewa",

    // Custom QR image URL (placed in /public)
    qrImageUrl: process.env.NEXT_PUBLIC_UPI_QR_IMAGE || "/payment-qr.jpg",
  },

  // Admin Portal Defaults
  admin: {
    defaultEmail: process.env.ADMIN_EMAIL || "infotemplepujasewa@gmail.com",
    defaultPassword: process.env.ADMIN_PASSWORD || "admin123",
  },
} as const;

/**
 * Generate standard UPI Intent URL for QR code and direct mobile UPI app opening
 * @param amount Amount in rupees
 * @param note Optional note / transaction description
 */
export function getUpiPaymentUrl(amount: number, note?: string): string {
  const upiId = SITE_CONFIG.payment.upiId;
  const payeeName = SITE_CONFIG.payment.payeeName;
  const cleanNote = note || "Sacred Pooja Dakshina";
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: cleanNote,
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate a standard, compliant WhatsApp Click-to-Chat URL
 * @param customMessage Optional custom greeting or enquiry text
 */
export function getWhatsAppUrl(customMessage?: string): string {
  const rawNumber = (SITE_CONFIG.contact.whatsappNumber || "").replace(/\D/g, "");
  const number = isHiddenPhoneNumber(rawNumber) ? "" : rawNumber;
  const message = customMessage || SITE_CONFIG.contact.whatsappPreFilledMessage;
  const encoded = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * Retrieve the official WhatsApp Channel URL
 */
export function getWhatsAppChannelUrl(): string {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
    SITE_CONFIG.contact.whatsappChannelUrl
  );
}

/**
 * Retrieve official Social Media links
 */
export function getSocialLinks() {
  return SITE_CONFIG.social;
}

export default SITE_CONFIG;
