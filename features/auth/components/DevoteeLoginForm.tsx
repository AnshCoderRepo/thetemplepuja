"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  KeyRound,
  LogIn,
  Phone,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { setAdminToken } from "@/lib/storage";
import { isValidIndianPhone } from "@/lib/validation";
import { fetchUserByPhone } from "@/lib/api";
import { devoteeLogin, adminLogin } from "../api/authApi";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DevoteeLoginForm() {
  const router = useRouter();
  const { t } = useI18n();

  const [mode, setMode] = useState<"devotee" | "admin">("devotee");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = identifier.trim();

    if (mode === "devotee") {
      const cleanPhone = trimmed.replace(/\D/g, "").slice(-10);
      if (!isValidIndianPhone(cleanPhone)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        return;
      }

      setBusy(true);
      const res = await devoteeLogin(cleanPhone, password);
      setBusy(false);

      if (!res.ok) {
        setError(res.error || "Invalid mobile number or password.");
        return;
      }

      // Sync and redirect to devotee profile
      await fetchUserByPhone(cleanPhone);
      router.push(`/profile?phone=${cleanPhone}`);
    } else {
      if (!EMAIL_RE.test(trimmed)) {
        setError("Please enter a valid admin email address.");
        return;
      }

      setBusy(true);
      const res = await adminLogin(trimmed, password);
      setBusy(false);

      if (!res.ok || !res.token) {
        setError(res.error || "Invalid admin credentials.");
        return;
      }

      setAdminToken(res.token);
      router.push("/admin");
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-saffron-100 bg-white p-6 shadow-card sm:p-8">
      {/* Mode Switcher */}
      <div className="mb-6 flex rounded-2xl bg-cream/70 p-1 border border-saffron-100">
        <button
          type="button"
          onClick={() => {
            setMode("devotee");
            setError("");
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            mode === "devotee"
              ? "bg-white text-saffron-700 shadow-xs"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Devotee Login</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("admin");
            setError("");
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
            mode === "admin"
              ? "bg-white text-saffron-700 shadow-xs"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          <UserRoundCog className="h-3.5 w-3.5" />
          <span>Admin Portal</span>
        </button>
      </div>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-saffron-100 text-2xl">
          {mode === "devotee" ? "🙏" : "🛡️"}
        </div>
        <h2 className="font-display text-xl font-bold text-ink">
          {mode === "devotee" ? "Welcome Back, Devotee" : "Admin Security Access"}
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          {mode === "devotee"
            ? "Enter your mobile number and password to manage bookings"
            : "Sign in with your verified administrator credentials"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">
            {mode === "devotee" ? "Mobile Number" : "Admin Email Address"}
          </label>
          <input
            type={mode === "devotee" ? "tel" : "email"}
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={
              mode === "devotee"
                ? "e.g. 9876543210"
                : "e.g. admin@thetemplepuja.com"
            }
            className={inputCls}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-ink">
              Password
            </label>
            {mode === "devotee" && (
              <Link
                href="/forgot-password"
                className="text-[11px] font-semibold text-saffron-600 hover:underline"
              >
                Forgot?
              </Link>
            )}
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

      {mode === "devotee" && (
        <div className="mt-6 border-t border-saffron-100 pt-4 text-center">
          <p className="text-xs text-ink-soft">
            New to The Temple Puja?{" "}
            <Link
              href="/signup"
              className="font-bold text-saffron-600 hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
