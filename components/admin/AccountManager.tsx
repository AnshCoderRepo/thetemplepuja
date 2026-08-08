"use client";

import { useEffect, useState } from "react";
import { KeyRound, RotateCcw, Save } from "lucide-react";
import {
  adminConfig,
  changeAdminCredentials,
  resetAdminCredentials,
} from "@/lib/api";
import { Field, ManagerCard, TextInput } from "./manager-ui";

export default function AccountManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    adminConfig().then((c) => {
      if (live) setSavedEmail(c.email);
    });
    return () => {
      live = false;
    };
  }, []);

  const save = async () => {
    if (!newEmail.trim() && !newPassword) {
      setMsg({
        ok: false,
        text: "Nothing to change — enter a new email and/or a new password.",
      });
      return;
    }
    if (newPassword.length > 0) {
      if (newPassword.length < 6) {
        setMsg({ ok: false, text: "New password must be at least 6 characters." });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMsg({ ok: false, text: "New password and its confirmation do not match." });
        return;
      }
    }
    const res = await changeAdminCredentials({
      currentPassword,
      email: newEmail.trim(),
      newPassword,
      token,
    });
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setMsg({
        ok: false,
        text: res.error ?? "Could not update credentials.",
      });
      return;
    }
    setMsg({
      ok: true,
      text: "Admin credentials updated. Use them the next time you sign in.",
    });
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    const c = await adminConfig();
    setSavedEmail(c.email);
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Reset the admin account to the default demo credentials (admin@thetemplepuja.com / admin123)?"
      )
    ) {
      return;
    }
    const res = await resetAdminCredentials(token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setMsg({ ok: false, text: res.error ?? "Could not reset credentials." });
      return;
    }
    setMsg({
      ok: true,
      text: "Credentials reset to defaults (admin@thetemplepuja.com / admin123).",
    });
    setCurrentEmail("");
    setCurrentPassword("");
    setNewEmail("");
    setNewPassword("");
    setConfirmPassword("");
    const c = await adminConfig();
    setSavedEmail(c.email);
  };

  return (
    <ManagerCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
            <KeyRound className="h-5 w-5 text-saffron-600" />
            Admin Account
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Change the email and password used to sign in to this dashboard.
          </p>
        </div>
        <button onClick={reset} className="btn-outline !px-4 !py-2.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset to defaults
        </button>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-saffron-50 px-4 py-2.5 text-xs font-semibold text-ink-soft">
        Current sign-in email:{" "}
        <span className="font-mono font-bold text-saffron-700">
          {savedEmail ?? "loading…"}
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-saffron-200 bg-cream/60 p-5">
        <h3 className="mb-4 font-display text-base font-bold text-ink">
          Update Credentials
        </h3>
        <p className="mb-4 text-xs text-ink-soft">
          Enter your current password to confirm, then set the new email and/or
          password. Changes are saved on the server and apply on every device.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current email *">
            <TextInput
              type="email"
              value={currentEmail}
              onChange={(e) => {
                setCurrentEmail(e.target.value);
                setMsg(null);
              }}
              placeholder={savedEmail ?? "admin@thetemplepuja.com"}
              autoComplete="username"
            />
          </Field>
          <Field label="Current password *">
            <TextInput
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setMsg(null);
              }}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </Field>
          <Field label="New email" hint="Optional — blank keeps the current email">
            <TextInput
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setMsg(null);
              }}
              placeholder={savedEmail ?? "admin@thetemplepuja.com"}
              autoComplete="off"
            />
          </Field>
          <div className="hidden sm:block" />
          <Field label="New password" hint="Optional — at least 6 characters">
            <TextInput
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setMsg(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password">
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setMsg(null);
              }}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </Field>
        </div>

        {msg && (
          <p
            className={`mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold ${
              msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {msg.text}
          </p>
        )}

        <button onClick={save} className="btn-primary mt-5">
          <Save className="h-4 w-4" />
          Save New Credentials
        </button>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-soft/70">
        🔒 Credentials live on the server (hashed, never in plaintext) and sync
        across every device pointing at this deployment. For production-grade
        security, move to real password hashing and HTTPS.
      </p>
    </ManagerCard>
  );
}
