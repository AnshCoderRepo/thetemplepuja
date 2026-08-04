// Client-side persistence for devotee profiles and the admin session.
// No backend exists yet, so profiles live in localStorage. All functions are
// SSR-safe (they no-op on the server) — call them only from client effects.

export type BookingStatus = "confirmed" | "cancelled" | "rescheduled";

export interface BookingRecord {
  bookingId: string;
  poojaSlug: string;
  poojaTitle: string;
  date: string; // e.g. "Wed, 12 Aug"
  time: string; // e.g. "7:00 PM IST"
  panditName: string;
  reason?: string; // why the devotee wants this puja
  amount: number;
  couponCode: string | null;
  addonCount: number;
  createdAt: string; // ISO
  status: BookingStatus;
  cancelledAt?: string; // ISO — set when the devotee cancels
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
const ADMIN_KEY = "ttp_admin_session_v1";

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

export function upsertBooking(input: {
  phone: string;
  name: string;
  gotra: string;
  city: string;
  email: string;
  booking: BookingRecord;
}): UserProfile {
  const users = getUsers();
  let user = users.find((u) => u.phone === input.phone);

  if (!user) {
    user = {
      id:
        "USR" +
        Math.random().toString(36).slice(2, 8).toUpperCase(),
      name: input.name,
      gotra: input.gotra,
      city: input.city,
      phone: input.phone,
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
    saveUsers(users);
  }
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
  const user = users.find((u) => u.phone === phone.trim());
  if (!user) return { ok: false };

  const booking = user.bookings.find((b) => b.bookingId === bookingId);
  if (!booking || booking.status !== "confirmed") return { ok: false };

  booking.status = "cancelled";
  booking.cancelledAt = new Date().toISOString();
  saveUsers(users);
  return { ok: true, user };
}

export function isAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(ADMIN_KEY) === "1";
}

export function setAdminSession(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) window.sessionStorage.setItem(ADMIN_KEY, "1");
  else window.sessionStorage.removeItem(ADMIN_KEY);
}
