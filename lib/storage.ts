// Client-side persistence for devotee profiles and the admin session.
// No backend exists yet, so profiles live in localStorage. All functions are
// SSR-safe (they no-op on the server) — call them only from client effects.

export type BookingStatus = "confirmed" | "cancelled" | "rescheduled" | "refunded";

export interface BookingRecord {
  bookingId: string;
  poojaSlug: string;
  poojaTitle: string;
  date: string; // e.g. "Wed, 12 Aug"
  time: string; // e.g. "7:00 PM IST"
  panditName: string;
  reason?: string; // why the devotee wants this puja
  amount: number;
  discount: number; // coupon savings (0 when none)
  couponCode: string | null;
  addonCount: number;
  createdAt: string; // ISO
  status: BookingStatus;
  cancelledAt?: string; // ISO — set when the devotee cancels
  refundedAt?: string; // ISO — set when the admin marks the booking refunded
}

export interface UserProfile {
  id: string;
  name: string;
  gotra: string;
  city: string;
  phone: string;
  email: string;
  createdAt: string; // ISO
  bookings: BookingRecord[];
}

const USERS_KEY = "ttp_profiles_v1";
const ADMIN_TOKEN_KEY = "ttp_admin_token_v1";
export function getUsers(): UserProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as UserProfile[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: UserProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // storage full / unavailable — ignore for demo
  }
}

export function findUserByPhone(phone: string): UserProfile | undefined {
  const p = phone.trim();
  if (!p) return undefined;
  return getUsers().find((u) => u.phone === p);
}

// ============ PURE ARRAY HELPERS ============
// These operate on a users array with no I/O, so the same logic drives both
// the localStorage cache (below) and the server store (lib/server-store.ts).

export interface BookingInput {
  phone: string;
  name: string;
  gotra: string;
  city: string;
  email: string;
  booking: BookingRecord;
}

/** Add (or refresh) a devotee and append their booking. Dedupes bookingId. */
export function upsertInto(
  users: UserProfile[],
  input: BookingInput
): { users: UserProfile[]; user: UserProfile } {
  let user = users.find((u) => u.phone === input.phone.trim());

  if (!user) {
    user = {
      id:
        "USR" +
        Math.random().toString(36).slice(2, 8).toUpperCase(),
      name: input.name,
      gotra: input.gotra,
      city: input.city,
      phone: input.phone.trim(),
      email: input.email,
      createdAt: new Date().toISOString(),
      bookings: [],
    };
    users.push(user);
  } else {
    // Same devotee — refresh their details with the latest booking info
    user.name = input.name;
    user.gotra = input.gotra;
    user.city = input.city;
    if (input.email) user.email = input.email;
  }

  // Guard against duplicate saves of the same booking (e.g. modal close
  // firing twice) — never append the same bookingId twice.
  if (!user.bookings.some((b) => b.bookingId === input.booking.bookingId)) {
    user.bookings.push(input.booking);
  }
  return { users, user };
}

/** Cancel a confirmed booking. No-op unless the booking is confirmed. */
export function cancelIn(
  users: UserProfile[],
  phone: string,
  bookingId: string
): { users: UserProfile[]; ok: boolean; user?: UserProfile } {
  const user = users.find((u) => u.phone === phone.trim());
  if (!user) return { users, ok: false };

  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (!booking || booking.status !== "confirmed") return { users, ok: false };

  booking.status = "cancelled";
  booking.cancelledAt = new Date().toISOString();
  return { users, ok: true, user };
}

/** Remove a devotee profile (and all their bookings). */
export function deleteFrom(
  users: UserProfile[],
  id: string
): { users: UserProfile[]; ok: boolean } {
  const next = users.filter((u) => u.id !== id);
  return { users: next, ok: next.length !== users.length };
}

/** Mark a confirmed/rescheduled booking as refunded (admin action). */
export function refundIn(
  users: UserProfile[],
  userId: string,
  bookingId: string
): { users: UserProfile[]; ok: boolean; user?: UserProfile } {
  const user = users.find((u) => u.id === userId);
  if (!user) return { users, ok: false };

  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (
    !booking ||
    (booking.status !== "confirmed" && booking.status !== "rescheduled")
  ) {
    return { users, ok: false };
  }

  booking.status = "refunded";
  booking.refundedAt = new Date().toISOString();
  return { users, ok: true, user };
}

/** Replace (or insert) a profile with the server's authoritative copy. */
export function mergeUserFromServer(user: UserProfile): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.phone === user.phone);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  saveUsers(users);
}

// ============ CLIENT CACHE (localStorage) ============
// These stay synchronous for instant reads. Writes are mirrored to the server
// by lib/api.ts (submitBooking, cancelBookingRemote, …).

export function upsertBooking(input: BookingInput): UserProfile {
  const users = getUsers();
  const { users: next, user } = upsertInto(users, input);
  saveUsers(next);
  return user;
}

/**
 * Cancel a confirmed booking for a devotee. No-op (returns false) if the
 * booking isn't found or is already cancelled/rescheduled.
 */
export function cancelBooking(
  phone: string,
  bookingId: string
): { ok: boolean; user?: UserProfile } {
  const users = getUsers();
  const { users: next, ok, user } = cancelIn(users, phone, bookingId);
  if (ok) saveUsers(next);
  return { ok, user };
}

/**
 * Permanently remove a devotee profile (and all their bookings) from the
 * admin view. No-op (returns false) if the id doesn't exist.
 */
export function deleteUser(id: string): { ok: boolean } {
  const users = getUsers();
  const { users: next, ok } = deleteFrom(users, id);
  if (ok) saveUsers(next);
  return { ok };
}

/**
 * Admin action — mark a paid booking as refunded. Only confirmed or
 * rescheduled bookings can be refunded (cancelled/refunded ones can't).
 */
export function markBookingRefunded(
  userId: string,
  bookingId: string
): { ok: boolean; user?: UserProfile } {
  const users = getUsers();
  const { users: next, ok, user } = refundIn(users, userId, bookingId);
  if (ok) saveUsers(next);
  return { ok, user };
}

// Admin session: the token issued by POST /api/admin/login is kept in
// sessionStorage and sent as a Bearer header on admin API calls. The server
// remains the authority — a stale/missing token just logs the admin out.

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function isAdminSession(): boolean {
  return Boolean(getAdminToken());
}

/** Kept for compatibility — a session is now driven by the token alone. */
export function setAdminSession(active: boolean): void {
  if (!active) clearAdminToken();
}
