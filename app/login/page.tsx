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
import BookPageHeader from "@/components/BookPageHeader";
import { adminLogin, fetchUserByPhone, devoteeLogin } from "@/lib/api";
import { setAdminToken } from "@/lib/storage";
import { isValidIndianPhone } from "@/lib/validation";
import { useI18n } from "@/components/I18nProvider";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { t } = useI18n();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = identifier.trim();

    // —— Devotee: 10-digit mobile number ——
    if (isValidIndianPhone(id)) {
      setError("");
      setBusy(true);

      // If password is provided, try password-based login
      if (password) {
        const res = await devoteeLogin(id, password);
        setBusy(false);
        if (res.ok) {
          router.push(`/profile?phone=${encodeURIComponent(id)}`);
          return;
        }
        setError(res.error ?? "Incorrect password. Please try again.");
        return;
      }

      // Otherwise, check if user exists and if they have a password
      const user = await fetchUserByPhone(id);
      setBusy(false);
      if (!user) {
        setError(
          "No profile found for this number. Please check and try again, or book a pooja to create one."
        );
        return;
      }
      router.push(`/profile?phone=${encodeURIComponent(id)}`);
      return;
    }

    // —— Admin: email + password ——
    if (EMAIL_RE.test(id)) {
      if (!password) {
        setError("Enter your admin password to sign in.");
        return;
      }
      setError("");
      setBusy(true);
      const res = await adminLogin(id.toLowerCase(), password);
      setBusy(false);
      if (res.ok && res.token) {
        setAdminToken(res.token);
        router.push("/admin");
        return;
      }
      setError(res.error ?? "Incorrect email or password. Please try again.");
      return;
    }

    setError("Enter a valid 10-digit mobile number or your admin email.");
  };

  return (
    <>
      <BookPageHeader
        eyebrow="🙏 Devotee Login"
        title={
          <>
            {t("login.title")} <span className="text-amber-200">{t("login.titleHighlight")}</span>
          </>
        }
        subtitle={t("login.subtitle")}
        facts={[
          { icon: "🪔", label: "Your Bookings" },
          { icon: "🙏", label: "Upcoming Poojas" },
          { icon: "🔒", label: "Secure Access" },
        ]}
      />
      <section className="section-pad bg-cream">
        <div className="container-px">
          <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
            <div className="flex items-center gap-3 bg-gradient-to-r from-saffron-500 to-maroon-600 px-6 py-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl backdrop-blur">
                <LogIn className="h-5 w-5 text-white" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  Login to Your Account
                </h2>
                <p className="text-xs text-amber-100/90">
                  {t("login.mobileLabel")} · Admins use email + password
                </p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5 px-6 py-7">
              <div>
                <label
                  htmlFor="lg-identifier"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                >
                  {t("login.mobileLabel")} *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <Phone className="h-4 w-4 text-saffron-500" />
                  </span>
                  <input
                    id="lg-identifier"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError("");
                    }}
                    placeholder="Mobile number or admin email"
                    className={`${inputCls} pl-11`}
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="lg-password"
                  className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft"
                >
                  {t("login.passwordLabel")}{" "}
                  <span className="font-medium normal-case text-ink-soft/60">
                    {t("login.passwordHint")}
                  </span>
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <KeyRound className="h-4 w-4 text-saffron-500" />
                  </span>
                  <input
                    id="lg-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`${inputCls} pl-11 font-mono tracking-[0.2em]`}
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
                <LogIn className="h-4 w-4" />
                {busy ? "Signing in…" : t("login.loginBtn")}
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-soft/70">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  {t("login.devoteeHint")}
                </p>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-saffron-600 hover:text-saffron-700"
                >
                  {t("login.forgotPassword")}
                </Link>
              </div>

              <div className="rounded-2xl bg-saffron-50 px-4 py-3 text-center text-xs leading-relaxed text-ink-soft">
                <span className="flex items-center justify-center gap-1.5 font-bold text-saffron-700">
                  <UserRoundCog className="h-3.5 w-3.5" />
                  {t("login.adminHint")}
                </span>{" "}
                {t("login.adminDesc")}
              </div>

              <div className="rounded-2xl bg-saffron-50 px-4 py-3 text-center text-xs leading-relaxed text-ink-soft">
                {t("login.newDevotee")}{" "}
                <Link
                  href="/signup"
                  className="font-bold text-saffron-700 underline-offset-2 hover:underline"
                >
                  {t("login.createProfile")}
                </Link>{" "}
                {t("login.activateNote")}
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
