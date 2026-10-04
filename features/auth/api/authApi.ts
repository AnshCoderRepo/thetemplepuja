import type {
  AdminConfigResponse,
  AdminLoginResponse,
  ChangeAdminCredentialsInput,
  DevoteeLoginResponse,
} from "../types/auth.types";

const DEFAULT_CONFIG: AdminConfigResponse = {
  email: "admin@thetemplepuja.com",
  isDefault: true,
};

async function postJson(path: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok, status: res.status, error: data.error };
}

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
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: body.error ?? "Login failed." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error." };
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
