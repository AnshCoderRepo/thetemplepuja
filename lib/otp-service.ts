/**
 * OTP Service for Account Activation & Password Recovery
 * Features SHA-256 token hashing, 10-minute expiry, single-use invalidation,
 * attempt rate-limiting, and cooldown protection against SMS flooding.
 */

import crypto from "crypto";
import { normalizeToE164, normalizeTo10Digit } from "./phone";
import {
  findActiveOtpChallenge,
  incrementOtpAttempt,
  markOtpChallengeUsed,
  saveOtpChallenge,
  type OtpChallengeDoc,
} from "./mongo-store";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const COOLDOWN_MS = 60 * 1000; // 60 seconds resend cooldown
const MAX_ATTEMPTS = 5;

// In-memory fallback cache for when MongoDB is unavailable or in unit tests
const inMemoryChallenges = new Map<string, {
  id: string;
  phone: string;
  purpose: string;
  tokenHash: string;
  expiresAt: number;
  attempts: number;
  resendAfter: number;
  isUsed: boolean;
}>();

function hashToken(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export interface RequestOtpResult {
  ok: boolean;
  error?: string;
  resendAfterSec?: number;
  expiresInSec?: number;
  rawCode?: string; // provided for development / SMS dispatch
}

/**
 * Request an OTP challenge with cooldown protection and single active challenge per purpose.
 */
export async function createOtpChallenge(
  phone: string,
  purpose: "activation" | "password_reset"
): Promise<RequestOtpResult> {
  const e164 = normalizeToE164(phone);
  if (!e164) {
    return { ok: false, error: "Invalid phone number." };
  }

  const now = Date.now();

  // 1. Check existing challenge in MongoDB or memory
  try {
    const existing = await findActiveOtpChallenge(e164, purpose);
    if (existing && existing.resendAfter && existing.resendAfter.getTime() > now) {
      const waitSec = Math.ceil((existing.resendAfter.getTime() - now) / 1000);
      return {
        ok: false,
        error: `Please wait ${waitSec}s before requesting a new OTP.`,
        resendAfterSec: waitSec,
      };
    }
  } catch {
    // Check in-memory fallback
    const memKey = `${e164}:${purpose}`;
    const mem = inMemoryChallenges.get(memKey);
    if (mem && !mem.isUsed && mem.resendAfter > now && mem.expiresAt > now) {
      const waitSec = Math.ceil((mem.resendAfter - now) / 1000);
      return {
        ok: false,
        error: `Please wait ${waitSec}s before requesting a new OTP.`,
        resendAfterSec: waitSec,
      };
    }
  }

  // 2. Generate cryptographically secure 6-digit numeric OTP
  const rawCode = crypto.randomInt(100000, 1000000).toString();
  const tokenHash = hashToken(rawCode);
  const challengeId = `otp-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const expiresAt = new Date(now + OTP_TTL_MS);
  const resendAfter = new Date(now + COOLDOWN_MS);

  const doc: OtpChallengeDoc = {
    _id: challengeId,
    phone: e164,
    purpose,
    tokenHash,
    expiresAt,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    isUsed: false,
    resendAfter,
    createdAt: new Date(),
  };

  // 3. Persist to MongoDB
  let persistedInMongo = false;
  try {
    await saveOtpChallenge(doc);
    persistedInMongo = true;
  } catch (err) {
    // Mongo unreachable -> save in memory
  }

  // Always mirror in memory for rapid lookup
  const memKey = `${e164}:${purpose}`;
  inMemoryChallenges.set(memKey, {
    id: challengeId,
    phone: e164,
    purpose,
    tokenHash,
    expiresAt: expiresAt.getTime(),
    attempts: 0,
    resendAfter: resendAfter.getTime(),
    isUsed: false,
  });

  return {
    ok: true,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    resendAfterSec: Math.floor(COOLDOWN_MS / 1000),
    rawCode,
  };
}

/**
 * Verify an OTP challenge. Enforces single-use, maximum 5 attempts, and expiry.
 */
export async function verifyOtpChallenge(
  phone: string,
  code: string,
  purpose: "activation" | "password_reset"
): Promise<{ ok: boolean; error?: string }> {
  const e164 = normalizeToE164(phone);
  const trimmedCode = (code || "").trim();

  if (!e164 || !trimmedCode || trimmedCode.length !== 6) {
    return { ok: false, error: "Please enter a valid 6-digit OTP." };
  }

  const now = Date.now();
  const candidateHash = hashToken(trimmedCode);

  // 1. Try MongoDB lookup
  try {
    const challenge = await findActiveOtpChallenge(e164, purpose);
    if (challenge) {
      if (challenge.attempts >= challenge.maxAttempts) {
        await markOtpChallengeUsed(challenge._id);
        return { ok: false, error: "Too many failed attempts. Please request a new OTP." };
      }

      if (challenge.tokenHash === candidateHash) {
        // Success -> single-use invalidation
        await markOtpChallengeUsed(challenge._id);
        const memKey = `${e164}:${purpose}`;
        inMemoryChallenges.delete(memKey);
        return { ok: true };
      }

      const nextAttempts = await incrementOtpAttempt(challenge._id);
      const remaining = Math.max(0, MAX_ATTEMPTS - nextAttempts);
      return {
        ok: false,
        error: remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please request a new OTP.",
      };
    }
  } catch (err) {
    // Fall through to memory
  }

  // 2. Try in-memory fallback
  const memKey = `${e164}:${purpose}`;
  const mem = inMemoryChallenges.get(memKey);

  if (!mem || mem.isUsed || mem.expiresAt <= now) {
    return { ok: false, error: "OTP expired or not found. Please request a new one." };
  }

  if (mem.attempts >= MAX_ATTEMPTS) {
    mem.isUsed = true;
    return { ok: false, error: "Too many failed attempts. Please request a new OTP." };
  }

  mem.attempts++;

  if (mem.tokenHash === candidateHash) {
    mem.isUsed = true;
    inMemoryChallenges.delete(memKey);
    return { ok: true };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - mem.attempts);
  return {
    ok: false,
    error: remaining > 0
      ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
      : "Too many failed attempts. Please request a new OTP.",
  };
}
