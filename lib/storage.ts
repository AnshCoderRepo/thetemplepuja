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
  /** Set when this booking came from a live-event slot — the event's
   * machine-readable date (YYYY-MM-DD). Seats held on the event are counted
   * against its capacity from this field, so cancelling releases the seat. */
  eventDateISO?: string;
  /** Seats held on the event's capacity (1 per booking today). */
  seatCount?: number;
  /** ISO — set when the devotee moves the booking to a new muhurat. */
  rescheduledAt?: string;
  /** Audit: the date/time shown before the last reschedule. */
  previousDate?: string;
  previousTime?: string;
  /** Audit: the event occurrence held before the last reschedule (seat moves). */
  previousEventDateISO?: string;
  /** Razorpay order created server-side for this booking (real payments). */
  razorpayOrderId?: string;
  /** Razorpay payment id — set once the payment signature is verified. */
  razorpayPaymentId?: string;
  /** Razorpay signature verified server-side before the booking is confirmed. */
  razorpaySignature?: string;
  /** ISO — when the payment was captured (real payments only). */
  paidAt?: string;
  /** YYYY-MM-DD muhurat this devotee was sent a WhatsApp reminder for. Set
   * once, so a daily reminder job never double-sends for the same date. */
  reminderSentForDate?: string;
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

import { STORAGE_KEYS } from "./constants";

const USERS_KEY = STORAGE_KEYS.USERS;
const ADMIN_TOKEN_KEY = STORAGE_KEYS.ADMIN_TOKEN;
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
    // A booking is always created confirmed — never trust the client to set
    // the status (cancel/refund/reschedule go through their own routes).
    const booking: BookingRecord = { ...input.booking, status: "confirmed" };
    user.bookings.push(booking);
  }
  return { users, user };
}

/** Cancel a confirmed or rescheduled booking. No-op otherwise. */
export function cancelIn(
  users: UserProfile[],
  phone: string,
  bookingId: string
): { users: UserProfile[]; ok: boolean; user?: UserProfile } {
  const user = users.find((u) => u.phone === phone.trim());
  if (!user) return { users, ok: false };

  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (
    !booking ||
    (booking.status !== "confirmed" && booking.status !== "rescheduled")
  ) {
    return { users, ok: false };
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date().toISOString();
  return { users, ok: true, user };
}

/** The fields a devotee can change when moving a booking to a new muhurat. */
export interface RescheduleInput {
  /** Display date, e.g. "Sat, 22 Aug". */
  date: string;
  /** Display time, e.g. "10:00 AM IST". */
  time: string;
  /** Machine date for event-slot bookings — moves the held seat to the new
   * event occurrence. Leave undefined for ordinary pooja bookings. */
  dateISO?: string;
}

/** Move a confirmed (or already-rescheduled) booking to a new muhurat. Keeps
 * the previous date/time for the audit trail and stamps rescheduledAt. For
 * event-slot bookings the eventDateISO moves too, which frees the old seat
 * and takes a new one via the derived seat counter. */
export function rescheduleIn(
  users: UserProfile[],
  phone: string,
  bookingId: string,
  next: RescheduleInput
): { users: UserProfile[]; ok: boolean; user?: UserProfile } {
  const user = users.find((u) => u.phone === phone.trim());
  if (!user) return { users, ok: false };

  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (
    !booking ||
    (booking.status !== "confirmed" && booking.status !== "rescheduled")
  ) {
    return { users, ok: false };
  }

  booking.previousDate = booking.date;
  booking.previousTime = booking.time;
  booking.date = next.date;
  booking.time = next.time;
  booking.status = "rescheduled";
  booking.rescheduledAt = new Date().toISOString();
  if (next.dateISO) {
    booking.previousEventDateISO = booking.eventDateISO;
    booking.eventDateISO = next.dateISO;
  }
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

/** Stamp a booking as reminded for a muhurat date (YYYY-MM-DD). No-op (false)
 * if the booking isn't found or was already reminded for that exact date, so
 * a daily reminder job is idempotent per muhurat. */
export function remindIn(
  users: UserProfile[],
  phone: string,
  bookingId: string,
  dateISO: string
): { users: UserProfile[]; ok: boolean; user?: UserProfile } {
  const user = users.find((u) => u.phone === phone.trim());
  if (!user) return { users, ok: false };
  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (!booking || booking.reminderSentForDate === dateISO) {
    return { users, ok: false };
  }
  booking.reminderSentForDate = dateISO;
  return { users, ok: true, user };
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
 * Cancel a confirmed/rescheduled booking for a devotee. No-op (returns
 * false) if the booking isn't found or is already cancelled/refunded.
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

/** Remove one booking entirely from a devotee's history (used when the
 * server rejects a booking the client optimistically saved — e.g. a payment
 * that failed signature verification). No-op if the booking isn't found. */
export function removeBooking(
  phone: string,
  bookingId: string
): { ok: boolean; user?: UserProfile } {
  const users = getUsers();
  const user = users.find((u) => u.phone === phone.trim());
  if (!user) return { ok: false };
  const before = user.bookings.length;
  user.bookings = user.bookings.filter((b) => b.bookingId !== bookingId);
  if (user.bookings.length === before) return { ok: false };
  saveUsers(users);
  return { ok: true, user };
}

/** Move a confirmed/rescheduled booking to a new muhurat. No-op otherwise. */
export function rescheduleBooking(
  phone: string,
  bookingId: string,
  next: RescheduleInput
): { ok: boolean; user?: UserProfile } {
  const users = getUsers();
  const { users: nextUsers, ok, user } = rescheduleIn(users, phone, bookingId, next);
  if (ok) saveUsers(nextUsers);
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
