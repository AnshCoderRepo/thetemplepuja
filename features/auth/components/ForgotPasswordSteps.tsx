"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle,
  KeyRound,
  Phone,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { isValidIndianPhone } from "@/lib/validation";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

type Step = "phone" | "otp" | "password" | "success";

export default function ForgotPasswordSteps() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.trim();
    if (!isValidIndianPhone(trimmed)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: trimmed }),
      });
      const data = await res.json();
      setBusy(false);

      if (data.ok) {
        setStep("otp");
      } else {
        setError(data.error ?? "Failed to send OTP. Please try again.");
      }
    } catch {
      setBusy(false);
      setError("Network error. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      setBusy(false);

      if (data.ok) {
        setStep("success");
      } else {
        setError(data.error ?? "Failed to reset password. Please try again.");
      }
    } catch {
      setBusy(false);
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
      <div className="flex items-center gap-3 bg-gradient-to-r from-saffron-500 to-maroon-600 px-6 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl backdrop-blur">
          <KeyRound className="h-5 w-5 text-white" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-white">
            {step === "phone" && "Reset Password"}
            {step === "otp" && "Enter OTP"}
            {step === "password" && "New Password"}
            {step === "success" && "All Done!"}
          </h2>
          <p className="text-xs text-amber-100/90">
            {step === "phone" && "Step 1 of 3"}
            {step === "otp" && "Step 2 of 3"}
            {step === "password" && "Step 3 of 3"}
            {step === "success" && "Password Reset Complete"}
          </p>
        </div>
      </div>

      {/* Step 1: Phone number */}
      {step === "phone" && (
        <form onSubmit={handleSendOtp} className="space-y-5 px-6 py-7">
          <div>
            <label
              htmlFor="fp-phone"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
            >
              Mobile Number *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Phone className="h-4 w-4 text-saffron-500" />
              </span>
              <input
                id="fp-phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                placeholder="Enter your 10-digit mobile number"
                className={`${inputCls} pl-11`}
                autoFocus
                maxLength={10}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary !w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            {busy ? "Sending OTP…" : "Send OTP"}
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Login
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: OTP verification */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-5 px-6 py-7">
          <div className="rounded-xl bg-green-50 px-4 py-3 text-center text-xs text-green-700">
            OTP sent to <strong>+91 {phone}</strong> via WhatsApp
          </div>

          <div>
            <label
              htmlFor="fp-otp"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
            >
              6-Digit OTP *
            </label>
            <input
              id="fp-otp"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              placeholder="000000"
              className={`${inputCls} text-center font-mono text-2xl tracking-[0.3em]`}
              autoFocus
              maxLength={6}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={otp.length !== 6}
            className="btn-primary !w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck className="h-4 w-4" />
            Verify OTP
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="text-xs font-semibold text-saffron-600 hover:text-saffron-700"
            >
              Change mobile number
            </button>
          </div>
        </form>
      )}

      {/* Step 3: New password */}
      {step === "password" && (
        <form onSubmit={handleResetPassword} className="space-y-5 px-6 py-7">
          <div>
            <label
              htmlFor="fp-new-pw"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
            >
              New Password *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <KeyRound className="h-4 w-4 text-saffron-500" />
              </span>
              <input
                id="fp-new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="Min. 6 characters"
                className={`${inputCls} pl-11`}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="fp-confirm-pw"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
            >
              Confirm Password *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <KeyRound className="h-4 w-4 text-saffron-500" />
              </span>
              <input
                id="fp-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Re-enter your password"
                className={`${inputCls} pl-11`}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || newPassword.length < 6}
            className="btn-primary !w-full !py-3.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {busy ? "Resetting…" : "Reset Password"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Step 4: Success */}
      {step === "success" && (
        <div className="space-y-5 px-6 py-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Password Reset!
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              Your password has been updated successfully.
            </p>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="btn-primary !w-full !py-3.5"
          >
            <ArrowRight className="h-4 w-4" />
            Login with New Password
          </button>
        </div>
      )}
    </div>
  );
}
