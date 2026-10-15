"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  LogIn,
  Phone,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { isValidIndianPhone } from "@/lib/validation";
import { fetchUserByPhone } from "@/lib/api";
import { devoteeLogin } from "../api/authApi";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

export default function DevoteeLoginForm() {
  const router = useRouter();
  const { t } = useI18n();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unactivatedPhone, setUnactivatedPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnactivatedPhone(null);

    const cleanDigits = phone.trim().replace(/\D/g, "");
    const cleanPhone = cleanDigits.length === 10 ? cleanDigits : cleanDigits.slice(-10);
    if (!isValidIndianPhone(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setBusy(true);
    const res = await devoteeLogin(cleanPhone, password);
    setBusy(false);

    if (!res.ok) {
      if (res.requireActivation) {
        setUnactivatedPhone(cleanPhone);
      }
      setError(res.error || "Invalid mobile number or password.");
      return;
    }

    // Sync and redirect to devotee profile
    await fetchUserByPhone(cleanPhone);
    router.push(`/profile?phone=${cleanPhone}`);
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-saffron-100 bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-100 text-2xl">
          🙏
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          Welcome Back, Devotee
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Enter your mobile number and password to manage bookings
        </p>
      </div>

      {unactivatedPhone && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <span className="text-base">🔐</span>
            <span>Account Activation Required</span>
          </div>
          <p className="mt-1 text-ink-soft">
            Your account was created via booking/payment but has not been verified yet. Complete quick mobile OTP verification to set your password and access your seva orders.
          </p>
          <div className="mt-3">
            <Link
              href={`/activate?phone=${encodeURIComponent(unactivatedPhone)}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-600 px-3.5 py-2 font-bold text-white shadow-xs transition-colors hover:bg-saffron-700"
            >
              <span>Activate Account with OTP</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {error && !unactivatedPhone && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className={`${inputCls} pl-10`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-saffron-600 hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full justify-center disabled:opacity-50"
        >
          {busy ? (
            <span>Signing in...</span>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-saffron-100 pt-4 text-center space-y-1.5">
        <p className="text-xs text-ink-soft">
          Paid for a booking?{" "}
          <Link
            href="/activate"
            className="font-bold text-saffron-600 hover:underline"
          >
            Activate Account with OTP
          </Link>
        </p>
        <p className="text-xs text-ink-soft">
          New to templepujasewa?{" "}
          <Link
            href="/signup"
            className="font-bold text-saffron-600 hover:underline"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
