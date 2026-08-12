// Client-side bridge to the backend API (app/api/*). The server is the source
// of truth for the catalog and admin credentials — this layer fetches it and
// falls back to the old localStorage overrides (then static defaults) only
// when the server is unreachable, so the site still renders standalone.
import {
  getCatalogCoupons,
  getCatalogEventSpecs,
  getCatalogPoojas,
} from "./catalog";
import { withEventBookedSeats, type Coupon, type Pooja, type UpcomingEventSpec } from "./data";
import {
  cancelBooking,
  deleteUser,
  findUserByPhone,
  getUsers,
  markBookingRefunded,
  mergeUserFromServer,
  removeBooking,
  rescheduleBooking,
  upsertBooking,
  type BookingInput,
  type BookingRecord,
  type RescheduleInput,
  type UserProfile,
} from "./storage";
import { normalizePhone } from "./validation";

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
        // Server unreachable — use local overrides, then static defaults,
        // and count seats from the local profile cache so availability still
        // reflects confirmed bookings made on this device.
        return {
          poojas: getCatalogPoojas(),
          events: withEventBookedSeats(
            getCatalogEventSpecs(),
            getUsers().flatMap((u) => u.bookings)
          ),
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

// ===================== RAZORPAY (real payments) =====================

export interface RazorpayOrderStart {
  configured: boolean;
  keyId?: string;
  orderId?: string;
  amount?: number; // paise
  currency?: string;
  receipt?: string;
  error?: string;
}

/** Ask the server to create a Razorpay order for a pooja at the server-side
 * price (coupon-validated). Returns `{ configured: false }` in demo mode so
 * the checkout can fall back to its simulated payment. */
export async function createRazorpayOrderRemote(input: {
  poojaSlug: string;
  couponCode: string | null;
  phone: string;
}): Promise<RazorpayOrderStart> {
  try {
    const res = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<RazorpayOrderStart>;
    if (res.ok && body.configured === false) return { configured: false };
    if (res.ok && body.configured) {
      return {
        configured: true,
        keyId: body.keyId,
        orderId: body.orderId,
        amount: body.amount,
        currency: body.currency,
        receipt: body.receipt,
      };
    }
    return { configured: false, error: body.error ?? "Order failed" };
  } catch {
    // Server unreachable — demo mode.
    return { configured: false };
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

/** Receipt lookup guarded by the devotee's mobile number: the booking id
 * (shown on the confirmation screen) must be matched with the phone used at
 * booking. Any mismatch returns null. Falls back to the local cache when
 * offline, still requiring the phone to match the holder. */
export async function fetchBooking(
  bookingId: string,
  phone: string
): Promise<{
  booking?: BookingRecord;
  holder?: { name: string; phone: string; gotra: string; city: string };
} | null> {
  const id = bookingId.trim().toUpperCase();
  const p = phone.trim();
  if (!id || !p) return null;
  try {
    const res = await fetch(
      `/api/bookings/${encodeURIComponent(id)}?phone=${encodeURIComponent(p)}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("lookup failed");
    const body = (await res.json()) as {
      booking?: BookingRecord;
      holder?: { name: string; phone: string; gotra: string; city: string };
    };
    if (body.booking) return body;
    return null;
  } catch {
    for (const u of getUsers()) {
      if (normalizePhone(u.phone) !== normalizePhone(p)) continue;
      const booking = u.bookings.find((b) => b.bookingId === id);
      if (booking) {
        return {
          booking,
          holder: { name: u.name, phone: u.phone, gotra: u.gotra, city: u.city },
        };
      }
    }
    return null;
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

/** Persist a devotee's profile + booking after payment. The server is the
 * authority: on success the returned profile is merged into the local cache;
 * if the server REJECTS the booking (e.g. a Razorpay signature or amount
 * check failed) the optimistic local copy is removed so the app never shows a
 * "confirmed" booking the admin never saw. Only when the server is
 * unreachable does it fall back to saving locally (offline). Never throws. */
export async function submitBooking(
  input: BookingInput
): Promise<{ ok: boolean; status?: number; user?: UserProfile }> {
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
    // Server reachable but rejected — don't keep a phantom booking locally.
    removeBooking(input.phone, input.booking.bookingId);
    return { ok: false, status: res.status };
  } catch {
    const localUser = upsertBooking(input); // offline — saved locally
    return { ok: true, user: localUser };
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

/** Move a booking to a new muhurat from the profile page. Local first, then
 * server (authoritative when reachable). */
export async function rescheduleBookingRemote(
  phone: string,
  bookingId: string,
  next: RescheduleInput
): Promise<{ ok: boolean; user?: UserProfile }> {
  const local = rescheduleBooking(phone, bookingId, next);
  try {
    const res = await fetch("/api/users/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, bookingId, ...next }),
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
