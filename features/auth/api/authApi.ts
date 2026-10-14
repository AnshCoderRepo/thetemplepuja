import type {
  AdminConfigResponse,
  AdminLoginResponse,
  ChangeAdminCredentialsInput,
  DevoteeLoginResponse,
  OtpChallengeResponse,
} from "../types/auth.types";
import { setDevoteeSession, clearDevoteeSession } from "@/lib/storage";

export async function devoteeLogin(
  phone: string,
  password: string
): Promise<DevoteeLoginResponse> {
  try {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const body = (await res.json().catch(() => ({}))) as DevoteeLoginResponse;
    if (!res.ok) {
      return {
        ok: false,
        error: body.error ?? "Login failed.",
        requireActivation: body.requireActivation,
        phone: body.phone,
      };
    }
    if (body.user?.phone) {
      setDevoteeSession(body.user.phone, body.token);
    }
    return { ok: true, user: body.user, token: body.token };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function requestActivationOtpRemote(phone: string): Promise<OtpChallengeResponse> {
  try {
    const res = await fetch("/api/users/activate/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = (await res.json().catch(() => ({}))) as OtpChallengeResponse;
    if (!res.ok) return { ok: false, error: body.error || "Failed to request OTP.", resendAfterSec: body.resendAfterSec };
    return { ...body, ok: true };
  } catch {
    return { ok: false, error: "Network error requesting activation code." };
  }
}

export async function verifyActivationOtpRemote(input: {
  phone: string;
  otp?: string;
  firebaseIdToken?: string;
  password?: string;
}): Promise<{ ok: boolean; error?: string; user?: any; token?: string }> {
  try {
    const res = await fetch("/api/users/activate/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return { ok: false, error: body.error || "Activation failed." };
    if (body.user?.phone) {
      setDevoteeSession(body.user.phone, body.token);
    }
    return { ok: true, user: body.user, token: body.token };
  } catch {
    return { ok: false, error: "Network error during account activation." };
  }
}

export async function requestForgotOtpRemote(phone: string): Promise<OtpChallengeResponse> {
  try {
    const res = await fetch("/api/users/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const body = (await res.json().catch(() => ({}))) as OtpChallengeResponse;
    if (!res.ok) return { ok: false, error: body.error || "Failed to request reset OTP.", resendAfterSec: body.resendAfterSec };
    return { ...body, ok: true };
  } catch {
    return { ok: false, error: "Network error requesting reset code." };
  }
}

export async function verifyResetOtpRemote(input: {
  phone: string;
  otp?: string;
  firebaseIdToken?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/users/reset-password/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return { ok: false, error: body.error || "Invalid OTP code." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error verifying OTP." };
  }
}

export async function resetDevoteePasswordRemote(input: {
  phone: string;
  otp?: string;
  firebaseIdToken?: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch("/api/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) return { ok: false, error: body.error || "Failed to reset password." };
    return { ok: true, message: body.message };
  } catch {
    return { ok: false, error: "Network error resetting password." };
  }
}

export async function devoteeLogoutRemote(): Promise<void> {
  clearDevoteeSession();
  try {
    await fetch("/api/users/logout", { method: "POST" });
  } catch {}
}


const DEFAULT_CONFIG: AdminConfigResponse = {
  email: "admin@thetemplepuja.com",
  isDefault: true,
};

async function postJson(
  url: string,
  body: unknown,
  token?: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.error ?? "Request failed" };
    }
    return { ok: true, status: res.status, ...data };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResponse> {

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    token?: string;
    error?: string;
  };
  if (!res.ok) return { ok: false, error: body.error ?? "Login failed." };
  return { ok: true, token: body.token };
}

export async function adminConfig(): Promise<AdminConfigResponse> {
  try {
    const res = await fetch("/api/admin/config", { cache: "no-store" });
    if (!res.ok) return DEFAULT_CONFIG;
    const body = (await res.json()) as { email?: string; isDefault?: boolean };
    return {
      email: body.email ?? DEFAULT_CONFIG.email,
      isDefault: body.isDefault ?? true,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function changeAdminCredentials(
  input: ChangeAdminCredentialsInput
): Promise<{ ok: boolean; status?: number; error?: string }> {
  return postJson(
    "/api/admin/credentials",
    {
      currentPassword: input.currentPassword,
      email: input.email || undefined,
      newPassword: input.newPassword || undefined,
    },
    input.token
  );
}

export async function resetAdminCredentials(
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  return postJson("/api/admin/credentials", { reset: true }, token);
}

export async function adminLogout(token: string): Promise<void> {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // ignore — client session is cleared regardless
  }
}
