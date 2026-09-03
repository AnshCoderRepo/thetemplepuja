// Server-side OTP generation and verification for forgot-password flow.
// OTPs are stored in-memory (keyed by phone) with a 10-minute TTL.
// In production, replace with Redis or MongoDB for cross-instance state.

import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory store — OK for single-instance; swap for Redis in production
const otpStore = new Map<string, OtpEntry>();

/** Generate a 6-digit OTP and store it for the given phone number. */
export function generateOtp(phone: string): string {
  const code = crypto
    .randomInt(0, Math.pow(10, OTP_LENGTH))
    .toString()
    .padStart(OTP_LENGTH, "0");

  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });

  return code;
}

/** Verify an OTP. Returns { ok: true } on success, or { ok: false, error } on failure. */
export function verifyOtp(
  phone: string,
  code: string
): { ok: true } | { ok: false; error: string } {
  const entry = otpStore.get(phone);

  if (!entry) {
    return { ok: false, error: "No OTP found. Please request a new one." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return { ok: false, error: "OTP expired. Please request a new one." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(phone);
    return {
      ok: false,
      error: "Too many failed attempts. Please request a new OTP.",
    };
  }

  entry.attempts++;

  if (entry.code !== code) {
    return { ok: false, error: `Invalid OTP. ${MAX_ATTEMPTS - entry.attempts} attempts remaining.` };
  }

  // OTP verified — delete it (one-time use)
  otpStore.delete(phone);
  return { ok: true };
}

/** Clean up expired OTPs (call periodically or on each request). */
export function cleanupExpiredOtps(): void {
  const now = Date.now();
  for (const [phone, entry] of otpStore) {
    if (now > entry.expiresAt) {
      otpStore.delete(phone);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredOtps, 5 * 60 * 1000);
}
