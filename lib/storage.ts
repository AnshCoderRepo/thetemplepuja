// Client-side persistence for devotee profiles and the admin session.
// No backend exists yet, so profiles live in localStorage. All functions are
// SSR-safe (they no-op on the server) — call them only from client effects.

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "checkout_incomplete"
  | "pending_payment"
  | "payment_processing"
  | "payment_failed"
  | "failed"
  | "cancelled"
  | "rescheduled"
  | "refunded"
  | "expired";

export interface BookingAddonItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji?: string;
  category?: string;
  itemType?: "chadhava" | "addon";
}

export interface CustomerMediaRecord {
  id: string;
  title: string;
  url: string;
  description?: string;
  poojaTitle?: string;
  bookingId?: string;
  uploadedAt: string; // ISO
}

export interface BookingRecord {
  bookingId: string;
  receiptNumber?: string; // e.g. "RCPT-20261001-000123"
  poojaSlug: string;
  poojaTitle: string;
  ritualType?: "temple" | "home";
  templeId?: string;
  templeSlug?: string;
  templeName?: string;
  date: string; // e.g. "Wed, 12 Aug"
  time: string; // e.g. "7:00 PM IST"
  panditName: string;
  reason?: string; // why the devotee wants this puja
  amount: number;
  discount: number; // coupon savings (0 when none)
  couponCode: string | null;
  addonCount: number;
  addons?: BookingAddonItem[];
  videos?: CustomerMediaRecord[];
  createdAt: string; // ISO
  status: BookingStatus;
  failureReason?: string; // set when payment fails or is rejected
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
  packageTier?: string;
  gotra?: string;
  partnerName?: string;
  partnerGotra?: string;
  devotees?: { name: string; gotra: string }[];
  familyMembers?: { name: string; gotra: string }[] | string[];
  /** Payment method used: "upi_qr", "razorpay", or "simulated" */
  paymentMethod?: "upi_qr" | "razorpay" | "simulated";
  /** 12-digit UTR or UPI Reference Number submitted by devotee */
  upiTransactionId?: string;
  /** Merchant UPI ID paid to */
  upiId?: string;
  /** Devotee review rating (1 to 5 stars) */
  rating?: number;
  /** Devotee feedback or review text */
  review?: string;
  /** ISO timestamp when devotee submitted rating & review */
  reviewedAt?: string;
  /** Primary devotee or customer name for this specific booking */
  primaryDevoteeName?: string;
  /** Currency of transaction, defaults to INR */
  currency?: string;
  /** Address for prasad delivery / devotee location if collected */
  address?: string;
  /** City where puja is performed or devotee resides */
  city?: string;
  /** Quantity of puja services booked (default 1) */
  quantity?: number;
}

export interface DevoteeEntitlement {
  id: string;
  poojaSlug?: string;
  poojaTitle?: string;
  productType?: "pooja_booking" | "product_licence" | "seva_pass";
  sku?: string;
  title?: string;
  bookingId?: string;
  paymentId?: string;
  orderId?: string;
  amount: number;
  currency?: string;
  grantedAt: string; // ISO
  status: "active" | "completed" | "revoked";
}


export interface UserProfile {
  id: string;
  name: string;
  gotra: string;
  city: string;
  phone: string;
  email: string;
  address?: string;
  createdAt: string; // ISO
  bookings: BookingRecord[];
  videos?: CustomerMediaRecord[];
  passwordHash?: string;
  generatedPassword?: string;
  isActivated?: boolean;
  status?: "pending_activation" | "active" | "suspended";
  activatedAt?: string;
  role?: "devotee" | "admin";
  entitlements?: DevoteeEntitlement[];
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
  address?: string;
  ritualType?: "temple" | "home";
  booking: BookingRecord;
  password?: string;
  passwordHash?: string;
  generatedPassword?: string;
  paymentMethod?: "upi_qr" | "razorpay" | "simulated";
  upiTransactionId?: string;
  upiId?: string;
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
      address: input.address,
      createdAt: new Date().toISOString(),
      bookings: [],
      passwordHash: input.passwordHash,
      generatedPassword: input.generatedPassword,
    };
    users.push(user);
  } else {
    // Same devotee — refresh their details without wiping existing valid information
    const cleanName = input.name ? input.name.trim() : "";
    if (cleanName && (cleanName !== "Devotee" || !user.name)) {
      user.name = cleanName;
    }
    const cleanGotra = input.gotra ? input.gotra.trim() : "";
    if (cleanGotra) {
      user.gotra = cleanGotra;
    }
    const cleanCity = input.city ? input.city.trim() : "";
    if (cleanCity) {
      user.city = cleanCity;
    }
    const cleanEmail = input.email ? input.email.trim() : "";
    if (cleanEmail) {
      user.email = cleanEmail;
    }
    const cleanAddress = input.address ? input.address.trim() : "";
    if (cleanAddress) {
      user.address = cleanAddress;
    }
    if (input.passwordHash) user.passwordHash = input.passwordHash;
    if (input.generatedPassword) user.generatedPassword = input.generatedPassword;
  }

  // Deduplicate and update booking: if new, append it; if existing, update it
  // (e.g. status transition from pending -> confirmed or pending -> failed).
  const existingIdx = user.bookings.findIndex((b) => b.bookingId === input.booking.bookingId);
  const status = input.booking.status || "confirmed";
  const enrichedBooking: BookingRecord = {
    ...input.booking,
    status,
    currency: input.booking.currency || "INR",
    quantity: input.booking.quantity || 1,
    gotra: input.booking.gotra || (input.gotra ? input.gotra.trim() : undefined) || user.gotra || undefined,
    city: input.booking.city || (input.city ? input.city.trim() : undefined) || user.city || undefined,
    address: input.booking.address || (input.address ? input.address.trim() : undefined) || user.address || undefined,
  };

  if (existingIdx === -1) {
    user.bookings.push(enrichedBooking);
  } else {
    user.bookings[existingIdx] = {
      ...user.bookings[existingIdx],
      ...enrichedBooking,
      status,
    };
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

/** Add or update a 1-5 star review and feedback on a confirmed booking. */
export function reviewIn(
  users: UserProfile[],
  bookingId: string,
  rating: number,
  reviewText?: string,
  phone?: string
): { users: UserProfile[]; ok: boolean; booking?: BookingRecord; user?: UserProfile } {
  const cleanPhone = phone?.trim();
  const user = cleanPhone
    ? users.find((u) => u.phone === cleanPhone)
    : users.find((u) => u.bookings.some((b) => b.bookingId === bookingId));

  if (!user) return { users, ok: false };
  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (!booking) return { users, ok: false };

  const boundedRating = Math.max(1, Math.min(5, Math.round(rating)));
  booking.rating = boundedRating;
  booking.review = reviewText ? reviewText.trim().slice(0, 1000) : undefined;
  booking.reviewedAt = new Date().toISOString();

  return { users, ok: true, booking, user };
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

// Admin session: the token issued by POST /api/admin/login is synchronized
// across sessionStorage, localStorage, and a SameSite=Lax cookie. This ensures
// session resilience across page reloads, new tabs, and browser refreshes
// while maintaining complete security.

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, maxAgeSec: number = 604800): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  // 1. Check sessionStorage
  let token = window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) return token;

  // 2. Fallback to localStorage
  token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    return token;
  }

  // 3. Fallback to cookie
  token = getCookie("admin_token");
  if (token) {
    window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
    return token;
  }

  return null;
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  setCookie("admin_token", token, 604800); // 7 days
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  deleteCookie("admin_token");
}

export function isAdminSession(): boolean {
  return Boolean(getAdminToken());
}

/** Kept for compatibility — a session is now driven by the token alone. */
export function setAdminSession(active: boolean): void {
  if (!active) clearAdminToken();
}

// ============ DEVOTEE SESSION MANAGEMENT ============
const DEVOTEE_PHONE_KEY = "ttp_devotee_phone";
const DEVOTEE_TOKEN_KEY = "ttp_devotee_token";

export function getDevoteePhone(): string | null {
  if (typeof window === "undefined") return null;
  // 1. SessionStorage
  let phone = window.sessionStorage.getItem(DEVOTEE_PHONE_KEY);
  if (phone) return phone;
  // 2. LocalStorage
  phone = window.localStorage.getItem(DEVOTEE_PHONE_KEY);
  if (phone) {
    window.sessionStorage.setItem(DEVOTEE_PHONE_KEY, phone);
    return phone;
  }
  // 3. Cookie
  phone = getCookie("devotee_phone");
  if (phone) {
    window.sessionStorage.setItem(DEVOTEE_PHONE_KEY, phone);
    window.localStorage.setItem(DEVOTEE_PHONE_KEY, phone);
    return phone;
  }
  return null;
}

export function getDevoteeToken(): string | null {
  if (typeof window === "undefined") return null;
  let token = window.sessionStorage.getItem(DEVOTEE_TOKEN_KEY);
  if (token) return token;
  token = window.localStorage.getItem(DEVOTEE_TOKEN_KEY);
  if (token) {
    window.sessionStorage.setItem(DEVOTEE_TOKEN_KEY, token);
    return token;
  }
  token = getCookie("devotee_session");
  if (token) {
    window.sessionStorage.setItem(DEVOTEE_TOKEN_KEY, token);
    window.localStorage.setItem(DEVOTEE_TOKEN_KEY, token);
    return token;
  }
  return null;
}

export function setDevoteeSession(phone: string, token?: string): void {
  if (typeof window === "undefined") return;
  const cleanPhone = phone.trim();
  window.sessionStorage.setItem(DEVOTEE_PHONE_KEY, cleanPhone);
  window.localStorage.setItem(DEVOTEE_PHONE_KEY, cleanPhone);
  setCookie("devotee_phone", cleanPhone, 604800); // 7 days

  if (token) {
    window.sessionStorage.setItem(DEVOTEE_TOKEN_KEY, token);
    window.localStorage.setItem(DEVOTEE_TOKEN_KEY, token);
    setCookie("devotee_session", token, 604800);
  }
}

export function clearDevoteeSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(DEVOTEE_PHONE_KEY);
  window.localStorage.removeItem(DEVOTEE_PHONE_KEY);
  window.sessionStorage.removeItem(DEVOTEE_TOKEN_KEY);
  window.localStorage.removeItem(DEVOTEE_TOKEN_KEY);
  deleteCookie("devotee_phone");
  deleteCookie("devotee_session");
}

export function isDevoteeSession(): boolean {
  return Boolean(getDevoteePhone() || getDevoteeToken());
}

/** Save or update a devotee's review in client localStorage */
export function saveBookingReview(
  bookingId: string,
  rating: number,
  reviewText?: string,
  phone?: string
): BookingRecord | null {
  if (typeof window === "undefined") return null;
  const current = getUsers();
  const { users, ok, booking } = reviewIn(current, bookingId, rating, reviewText, phone);
  if (ok && booking) {
    saveUsers(users);
    return booking;
  }
  return null;
}

