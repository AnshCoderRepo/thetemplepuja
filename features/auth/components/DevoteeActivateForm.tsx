"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { normalizeToE164, formatPhoneDisplay } from "@/lib/phone";
import {
  requestActivationOtpRemote,
  verifyActivationOtpRemote,
} from "../api/authApi";
import { trackCompleteRegistration } from "@/lib/meta-pixel";
import { isFirebaseConfigured, setupRecaptcha, sendFirebasePhoneOtp } from "@/lib/firebase";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

type Step = "phone" | "otp" | "password" | "success";

export default function DevoteeActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<any>(null);
  const [firebaseToken, setFirebaseToken] = useState("");
  const [testCodeNotice, setTestCodeNotice] = useState<string | null>(null);

  // Pre-fill phone from URL param e.g. /activate?phone=+919876543210
  useEffect(() => {
    const p = searchParams.get("phone");
    if (p) {
      setPhone(p.replace(/[^\d+]/g, ""));
    }
  }, [searchParams]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    setTestCodeNotice(null);

    const cleanPhone = normalizeToE164(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid mobile number with country code (e.g. +91 98765 43210).");
      return;
    }

    setBusy(true);

    // If Firebase Web SDK is configured, try Firebase Phone Auth
    if (isFirebaseConfigured() && typeof window !== "undefined") {
      try {
        const verifier = setupRecaptcha("recaptcha-container");
        if (verifier) {
          const fbRes = await sendFirebasePhoneOtp(cleanPhone, verifier);
          if (fbRes.ok && fbRes.confirmationResult) {
            setFirebaseConfirmation(fbRes.confirmationResult);
            setBusy(false);
            setCooldown(60);
            setSuccessMsg("Verification code sent to your phone via SMS.");
            setStep("otp");
            return;
          }
        }
      } catch (fbErr: any) {
        console.warn("[activate] Firebase phone auth fallback:", fbErr?.message);
      }
    }

    // Server-side OTP Challenge dispatch
    const res = await requestActivationOtpRemote(cleanPhone);
    setBusy(false);

    if (res.alreadyActive) {
      setSuccessMsg("Your account is already active. Redirecting to login...");
      setTimeout(() => router.push(`/login?phone=${cleanPhone}`), 1500);
      return;
    }

    if (!res.ok) {
      setError(res.error || "Failed to send activation code.");
      if (res.resendAfterSec) setCooldown(res.resendAfterSec);
      return;
    }

    setCooldown(res.resendAfterSec || 60);
    if (res.testCode) {
      setTestCodeNotice(res.testCode);
    }
    setSuccessMsg(res.message || "Activation OTP sent successfully.");
    setStep("otp");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError("Please enter the 6-digit OTP received via SMS.");
      return;
    }

    setBusy(true);

    // If Firebase confirmation is pending
    if (firebaseConfirmation) {
      try {
        const result = await firebaseConfirmation.confirm(trimmedOtp);
        const token = await result.user.getIdToken();
        setFirebaseToken(token);
        setBusy(false);
        setStep("password");
        return;
      } catch (err: any) {
        setBusy(false);
        setError(err?.message || "Invalid OTP entered. Please try again.");
        return;
      }
    }

    // Direct server OTP check
    setBusy(false);
    setStep("password");
  };

  const handleSetPasswordAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const cleanPhone = normalizeToE164(phone);

    const res = await verifyActivationOtpRemote({
      phone: cleanPhone,
      otp: firebaseToken ? undefined : otp.trim(),
      firebaseIdToken: firebaseToken || undefined,
      password,
    });

    setBusy(false);

    if (!res.ok) {
      setError(res.error || "Failed to activate account.");
      return;
    }

    setStep("success");
    trackCompleteRegistration({ method: "phone_otp" });
    setTimeout(() => {
      router.push(`/profile?phone=${cleanPhone}`);
    }, 2000);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-saffron-100 bg-white p-6 shadow-card sm:p-8">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container" />

      {/* Header */}
      <div className="mb-6 flex items-center gap-3 border-b border-saffron-100 pb-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-amber-600 text-white shadow-md shadow-saffron-500/20">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            {step === "success"
              ? "Account Activated!"
              : step === "password"
              ? "Set Your Password"
              : step === "otp"
              ? "Verify Mobile Number"
              : "Activate Devotee Account"}
          </h2>
          <p className="text-xs text-ink-soft">
            {step === "success"
              ? "Your sacred profile is now ready"
              : "Verify your mobile number to access your puja bookings"}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-fadeIn">
          {error}
        </div>
      )}
      {successMsg && !error && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
          {successMsg}
        </div>
      )}
      {testCodeNotice && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 animate-fadeIn flex items-center justify-between">
          <span>
            <strong>Dev Test Code:</strong> <span className="font-mono font-bold text-sm tracking-widest">{testCodeNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => setOtp(testCodeNotice)}
            className="text-[11px] font-bold text-saffron-700 underline"
          >
            Fill OTP
          </button>
        </div>
      )}

      {/* STEP 1: Phone Entry */}
      {step === "phone" && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Registered Mobile Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={`${inputCls} pl-10 font-mono`}
                required
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ink-soft">
              Enter the phone number used during puja booking or payment.
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || !phone.trim()}
            className="btn-primary !w-full !py-3.5 flex items-center justify-center gap-2"
          >
            <span>{busy ? "Sending Verification Code..." : "Send Activation OTP"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="pt-2 text-center text-xs text-ink-soft">
            Already activated?{" "}
            <Link href="/login" className="font-bold text-saffron-600 hover:text-saffron-700 underline">
              Sign In
            </Link>
          </p>
        </form>
      )}

      {/* STEP 2: OTP Verification */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-soft">
                Enter 6-Digit SMS OTP *
              </label>
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-[11px] font-bold text-saffron-600 hover:underline"
              >
                Change Phone
              </button>
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className={`${inputCls} pl-10 text-center font-mono text-base tracking-widest`}
                autoFocus
                required
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-soft text-center">
              Sent to <strong className="font-mono text-ink">{formatPhoneDisplay(phone)}</strong>
            </p>
          </div>

          <button
            type="submit"
            disabled={busy || otp.length !== 6}
            className="btn-primary !w-full !py-3.5 flex items-center justify-center gap-2"
          >
            <span>{busy ? "Verifying..." : "Verify Code & Proceed"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="pt-2 text-center text-xs">
            {cooldown > 0 ? (
              <span className="text-ink-soft">
                Resend code in <strong className="font-mono text-saffron-700">{cooldown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                className="font-bold text-saffron-600 hover:text-saffron-700 underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Resend OTP SMS</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: Set Password */}
      {step === "password" && (
        <form onSubmit={handleSetPasswordAndActivate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Create Account Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className={`${inputCls} pl-10`}
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={`${inputCls} pl-10`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy || !password || password !== confirmPassword}
            className="btn-primary !w-full !py-3.5 flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-200" />
            <span>{busy ? "Activating Account..." : "Set Password & Complete Activation"}</span>
          </button>
        </form>
      )}

      {/* STEP 4: Success */}
      {step === "success" && (
        <div className="space-y-4 text-center py-4 animate-scale-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            Account Activated Successfully!
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed">
            Your mobile number <strong className="font-mono text-ink">{formatPhoneDisplay(phone)}</strong> is verified.
            Taking you to your devotee profile...
          </p>
          <div className="pt-2">
            <Link
              href={`/profile?phone=${encodeURIComponent(normalizeToE164(phone))}`}
              className="btn-primary !w-full !py-3 flex items-center justify-center gap-2"
            >
              <span>Go to Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
