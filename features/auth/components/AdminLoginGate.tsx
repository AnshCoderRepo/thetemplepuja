"use client";

import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { BookPageHeader } from "@/components/layout";
import { adminLogin } from "../api/authApi";

interface AdminLoginGateProps {
  onLoginSuccess: (token: string) => void;
}

export default function AdminLoginGate({ onLoginSuccess }: AdminLoginGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await adminLogin(email.trim(), password);
    setBusy(false);
    if (!res.ok || !res.token) {
      setError(res.error || "Invalid email or password.");
      return;
    }
    onLoginSuccess(res.token);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-cream flex flex-col justify-between">
      <BookPageHeader
        eyebrow="Admin Portal"
        title="Sign in to Admin Dashboard"
        subtitle="Access analytics, booking fulfillment, puja catalog, and temple management."
      />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-saffron-100 bg-white p-8 shadow-xl shadow-saffron-500/5">
          <div className="mb-6 text-center">
            <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-2xl font-bold text-white shadow-md shadow-saffron-500/20">
              🪔
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">
              Admin Portal Security
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              Sign in to manage bookings, pooja catalog, and platform settings.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@thetemplepuja.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-saffron-100 bg-cream/40 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 transition-all disabled:opacity-50"
            >
              {busy ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <footer className="border-t border-saffron-100 py-4 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} The Temple Puja — Admin Security Panel
      </footer>
    </div>
  );
}
