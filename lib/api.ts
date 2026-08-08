// Client-side bridge to the backend API (app/api/*). The server is the source
// of truth for the catalog and admin credentials — this layer fetches it and
// falls back to the old localStorage overrides (then static defaults) only
// when the server is unreachable, so the site still renders standalone.
import {
  getCatalogCoupons,
  getCatalogEventSpecs,
  getCatalogPoojas,
} from "./catalog";
import type { Coupon, Pooja, UpcomingEventSpec } from "./data";
import {
  cancelBooking,
  deleteUser,
  findUserByPhone,
  getUsers,
  markBookingRefunded,
  mergeUserFromServer,
  upsertBooking,
  type BookingInput,
  type UserProfile,
} from "./storage";

export interface ResolvedCatalog {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  coupons: Record<string, Coupon>;
}

const DEFAULT_CONFIG = { email: "admin@thetemplepuja.com", isDefault: true };

let catalogCache: Promise<ResolvedCatalog> | null = null;

export function resetCatalogCache(): void {
  catalogCache = null;
}

/** Fetches the resolved catalog once and shares the result across consumers. */
export function fetchCatalog(): Promise<ResolvedCatalog> {
  if (!catalogCache) {
    catalogCache = (async () => {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        if (!res.ok) throw new Error("catalog request failed");
        const body = (await res.json()) as Partial<ResolvedCatalog>;
        if (
          body &&
          Array.isArray(body.poojas) &&
          Array.isArray(body.events) &&
          body.coupons
        ) {
          return body as ResolvedCatalog;
        }
        throw new Error("unexpected catalog payload");
      } catch {
        // Server unreachable — use local overrides, then static defaults.
        return {
          poojas: getCatalogPoojas(),
          events: getCatalogEventSpecs(),
          coupons: getCatalogCoupons(),
        };
      }
    })();
  }
  return catalogCache;
}

/** Refetch the catalog from the server (used after an admin write). */
export async function refreshCatalog(): Promise<ResolvedCatalog> {
  resetCatalogCache();
  return fetchCatalog();
}

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

// ===================== CATALOG (admin) =====================

export type CatalogSection = "poojas" | "events" | "coupons";

export async function saveCatalogSection(
  section: CatalogSection,
  value: unknown,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const res = await post(`/api/catalog`, { [section]: value }, token);
  if (!res.ok) return res;
  await refreshCatalog();
  return { ok: true };
}

export async function resetCatalogSection(
  section: CatalogSection,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const res = await post(`/api/catalog`, { reset: [section] }, token);
  if (!res.ok) return res;
  await refreshCatalog();
  return { ok: true };
}

// ===================== ADMIN AUTH =====================

export async function adminLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
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

export async function adminConfig(): Promise<{
  email: string;
  isDefault: boolean;
}> {
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

export async function changeAdminCredentials(input: {
  currentPassword: string;
  email: string;
  newPassword: string;
  token: string;
}): Promise<{ ok: boolean; status?: number; error?: string }> {
  return post(
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
  return post("/api/admin/credentials", { reset: true }, token);
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

// ===================== DEVOTEES & BOOKINGS =====================
// The server is the source of truth; the localStorage cache (lib/storage.ts)
// is written first so reads stay instant and the site still works offline.

/** All devotees for the admin dashboard. Returns null on a 401 (stale
 * session) and falls back to the local cache when the server is unreachable. */
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

/** Look up one devotee by phone (public). Falls back to the local cache. */
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

/** Pull a phone's profile from the server into the local cache — used so
 * coupon eligibility (first-booking rules) sees cross-device truth. */
export async function syncUserFromServer(phone: string): Promise<void> {
  try {
    const res = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const body = (await res.json()) as { user?: UserProfile };
    if (body.user) mergeUserFromServer(body.user);
  } catch {
    // offline — local cache is fine
  }
}

/** Persist a devotee's profile + booking after payment. Writes the local cache
 * first, then mirrors to the server; never throws. */
export async function submitBooking(
  input: BookingInput
): Promise<{ ok: boolean; status?: number; user?: UserProfile }> {
  const localUser = upsertBooking(input);
  try {
    const res = await fetch("/api/users/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: false, status: res.status, user: localUser };
  } catch {
    return { ok: true, user: localUser }; // offline — saved locally
  }
}

/** Cancel a booking from the profile page. Local first, then server. */
export async function cancelBookingRemote(
  phone: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const local = cancelBooking(phone, bookingId);
  try {
    const res = await fetch("/api/users/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, bookingId }),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: local.ok, user: local.user };
  } catch {
    return local;
  }
}

/** Delete a devotee profile (admin). The server is authoritative when
 * reachable; the local cache is kept in sync as a fallback when offline. */
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
    return { ok: local.ok }; // offline — removed locally
  }
}

/** Mark a booking refunded (admin). The server is authoritative when
 * reachable; the local cache is kept in sync as a fallback when offline. */
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
    return { ok: local.ok }; // offline — applied locally
  }
}
