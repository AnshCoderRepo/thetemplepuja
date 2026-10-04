import {
  deleteUser,
  findUserByPhone,
  getUsers,
  markBookingRefunded,
  mergeUserFromServer,
  type UserProfile,
} from "@/lib/storage";
import type { DevoteeMediaInput } from "../types/devotee.types";

async function post(path: string, body: unknown, token?: string | null) {
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

export async function fetchAllUsers(
  token: string | null
): Promise<UserProfile[] | null> {
  try {
    const res = await fetch("/api/users", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error("users request failed");
    const body = (await res.json()) as { users?: UserProfile[] };
    if (Array.isArray(body.users)) return body.users;
    throw new Error("unexpected users payload");
  } catch {
    return getUsers();
  }
}

export async function fetchUserByPhone(
  phone: string
): Promise<UserProfile | undefined> {
  try {
    const res = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error("lookup failed");
    const body = (await res.json()) as { user?: UserProfile | null };
    if (body.user) return body.user;
    return undefined;
  } catch {
    return findUserByPhone(phone);
  }
}

export async function syncUserFromServer(phone: string): Promise<void> {
  try {
    const res = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const body = (await res.json()) as { user?: UserProfile };
    if (body.user) mergeUserFromServer(body.user);
  } catch {
    // offline
  }
}

export async function deleteUserRemote(
  id: string,
  token: string
): Promise<{ ok: boolean; status?: number }> {
  const local = deleteUser(id);
  try {
    const res = await post("/api/admin/users/delete", { id }, token);
    if (res.status === 401) return { ok: false, status: 401 };
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: local.ok };
  }
}

export async function resetDevoteePassword(
  phone: string,
  newPassword: string,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  return post(
    "/api/admin/users/reset-password",
    { phone, newPassword },
    token
  );
}

export async function refundBookingRemote(
  userId: string,
  bookingId: string,
  token: string
): Promise<{ ok: boolean; status?: number }> {
  const local = markBookingRefunded(userId, bookingId);
  try {
    const res = await post(
      "/api/admin/bookings/refund",
      { userId, bookingId },
      token
    );
    if (res.status === 401) return { ok: false, status: 401 };
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: local.ok };
  }
}

export async function addCustomerMediaRemote(
  userId: string,
  media: DevoteeMediaInput,
  token: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch("/api/admin/users/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "add", userId, media }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: UserProfile;
      error?: string;
    };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: false, error: body.error };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export async function deleteCustomerMediaRemote(
  userId: string,
  mediaId: string,
  token: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch("/api/admin/users/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "delete", userId, mediaId }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: UserProfile;
      error?: string;
    };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: false, error: body.error };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
