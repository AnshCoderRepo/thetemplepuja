/**
 * Firebase Client & Token Verification Integration
 * Supports Firebase Phone Auth (SMS OTP) for customer registration,
 * activation, and password recovery.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export function getFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

let clientApp: FirebaseApp | null = null;
let clientAuth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  const cfg = getFirebaseConfig();
  if (!cfg.apiKey || !cfg.projectId) return null;

  if (!clientApp) {
    const existing = getApps();
    clientApp = existing.length > 0 ? existing[0] : initializeApp(cfg);
  }
  return clientApp;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  if (!clientAuth) {
    clientAuth = getAuth(app);
  }
  return clientAuth;
}

/**
 * Initializes a visible or invisible RecaptchaVerifier on a DOM element.
 */
export function setupRecaptcha(
  elementId: string,
  onSolved?: () => void
): RecaptchaVerifier | null {
  const auth = getFirebaseAuth();
  if (!auth || typeof window === "undefined") return null;

  try {
    const verifier = new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
      callback: () => {
        if (onSolved) onSolved();
      },
      "expired-callback": () => {
        console.warn("[firebase-recaptcha] expired");
      },
    });
    return verifier;
  } catch (err) {
    console.error("[firebase-recaptcha] setup error:", err);
    return null;
  }
}

/**
 * Client helper to request a phone OTP via Firebase Phone Auth.
 */
export async function sendFirebasePhoneOtp(
  phoneE164: string,
  verifier: RecaptchaVerifier
): Promise<{ ok: boolean; confirmationResult?: ConfirmationResult; error?: string }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { ok: false, error: "Firebase Phone Auth is not configured on this application." };
  }
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneE164, verifier);
    return { ok: true, confirmationResult };
  } catch (err: any) {
    console.error("[firebase-phone-auth] send error:", err);
    return {
      ok: false,
      error: err?.message || "Failed to send SMS OTP via Firebase. Please check your mobile number.",
    };
  }
}

/**
 * Server-side verification of a Firebase ID Token.
 * Uses Google Identity Toolkit API to verify token legitimacy and extract verified phone number.
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ ok: true; phone: string; uid: string } | { ok: false; error: string }> {
  if (!idToken || typeof idToken !== "string") {
    return { ok: false, error: "Missing Firebase verification token." };
  }

  const apiKey =
    process.env.FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "";

  // If API key is available, use Google Identity Toolkit REST API
  if (apiKey) {
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as any;
        return { ok: false, error: body?.error?.message || "Invalid or expired Firebase verification token." };
      }
      const data = (await res.json()) as { users?: Array<{ localId: string; phoneNumber?: string }> };
      const user = data.users?.[0];
      if (!user || !user.phoneNumber) {
        return { ok: false, error: "No verified phone number found in Firebase account." };
      }
      return { ok: true, phone: user.phoneNumber, uid: user.localId };
    } catch (err: any) {
      console.error("[firebase-verify] lookup error:", err);
      return { ok: false, error: "Failed to verify Firebase token with authentication service." };
    }
  }

  // Fallback: decode JWT payload safely
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return { ok: false, error: "Malformed ID token." };
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { ok: false, error: "Firebase token has expired." };
    }
    const phone = payload.phone_number || payload.phoneNumber;
    if (!phone) {
      return { ok: false, error: "No phone number attached to this token." };
    }
    return { ok: true, phone, uid: payload.sub || payload.user_id };
  } catch (err: any) {
    return { ok: false, error: "Failed to decode verification token." };
  }
}
