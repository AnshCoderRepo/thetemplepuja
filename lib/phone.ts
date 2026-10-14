/**
 * Phone Number Normalization & International Formatting
 * Supports E.164 format (+919876543210) while preserving seamless compatibility
 * with 10-digit Indian mobile numbers.
 */

export const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;
export const E164_PHONE_RE = /^\+[1-9]\d{7,14}$/;

/**
 * Normalizes any phone number into canonical E.164 format (+919876543210).
 * Defaults to India (+91) if no country code prefix is present.
 */
export function normalizeToE164(raw: string | undefined | null, defaultCountryCode = "91"): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";

  // If already starts with '+'
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  // 10-digit Indian number: prepend default country code (91)
  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  // 12-digit starting with 91 (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  // General fallback: prefix '+'
  return `+${digits}`;
}

/**
 * Reduces any phone string to the core 10 digits if Indian, or raw digits.
 * Useful for matching legacy records.
 */
export function normalizeTo10Digit(raw: string | undefined | null): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Validates whether the phone number is a valid mobile number.
 */
export function isValidMobileNumber(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const digits10 = normalizeTo10Digit(raw);
  if (INDIAN_MOBILE_RE.test(digits10)) return true;
  const e164 = normalizeToE164(raw);
  return E164_PHONE_RE.test(e164);
}

/**
 * Formats a phone number for clean human-readable UI display.
 * e.g. "+919876543210" -> "+91 98765 43210"
 */
export function formatPhoneDisplay(raw: string | undefined | null): string {
  if (!raw) return "";
  const e164 = normalizeToE164(raw);
  if (e164.startsWith("+91") && e164.length === 13) {
    return `+91 ${e164.slice(3, 8)} ${e164.slice(8)}`;
  }
  return e164;
}

/**
 * Generate an array of candidate phone query keys to match both E.164 and 10-digit
 * representations across MongoDB and local stores.
 */
export function getPhoneLookupVariants(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const str = String(raw).trim();
  const e164 = normalizeToE164(str);
  const d10 = normalizeTo10Digit(str);
  const rawDigits = str.replace(/\D/g, "");
  const set = new Set<string>();
  if (e164) {
    set.add(e164);
    set.add(e164.replace(/^\+/, ""));
  }
  if (d10) {
    set.add(d10);
    set.add(`91${d10}`);
    set.add(`+91${d10}`);
  }
  if (rawDigits) set.add(rawDigits);
  return Array.from(set);
}

