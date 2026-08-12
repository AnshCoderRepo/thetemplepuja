// The persistence contract used by lib/server-store.ts. Real deployments use
// the MongoDB store (lib/mongo-store.ts); tests and offline fallbacks use the
// in-memory store below.
import type { Coupon, Pooja, UpcomingEventSpec } from "./data";
import type { UserProfile } from "./storage";

export interface CatalogOverrides {
  poojas?: Pooja[];
  events?: UpcomingEventSpec[];
  coupons?: Record<string, Coupon>;
}

export interface AdminCreds {
  email: string;
  passwordHash: string;
}

export interface PersistenceStore {
  getCatalogOverrides(): Promise<CatalogOverrides>;
  saveCatalogOverrides(overrides: CatalogOverrides): Promise<void>;
  clearCatalogOverrides(
    sections: ("poojas" | "events" | "coupons")[]
  ): Promise<void>;
  getAdminCreds(): Promise<AdminCreds>;
  saveAdminCreds(email: string, passwordHash: string): Promise<void>;
  /** token -> expiry timestamp */
  getSessions(): Promise<Record<string, number>>;
  saveSessions(sessions: Record<string, number>): Promise<void>;
  /** Devotee profiles + bookings — one document/entry per devotee. */
  getUsers(): Promise<UserProfile[]>;
  findUserByPhone(phone: string): Promise<UserProfile | undefined>;
  findUserById(id: string): Promise<UserProfile | undefined>;
  /** Create or fully replace one devotee's document. */
  saveUser(user: UserProfile): Promise<void>;
  /** Permanently remove one devotee. Returns true when a doc was removed. */
  deleteUserById(id: string): Promise<boolean>;
}

/** In-memory store — data lives for the lifetime of the process only. */
export function createMemoryStore(): PersistenceStore {
  let overrides: CatalogOverrides = {};
  let creds: AdminCreds = { email: "", passwordHash: "" };
  let sessions: Record<string, number> = {};
  let users: UserProfile[] = [];

  // Mirrors the MongoDB store's saveUser semantics: phone-keyed, appending
  // only bookings that aren't already on the devotee, so concurrent saves on
  // the same phone merge instead of duplicating the profile.
  const saveUser = (user: UserProfile): void => {
    const byPhone = users.findIndex((u) => u.phone === user.phone);
    if (byPhone >= 0) {
      const existing = users[byPhone];
      const existingIds = new Set(existing.bookings.map((b) => b.bookingId));
      for (const b of user.bookings) {
        if (!existingIds.has(b.bookingId)) existing.bookings.push(b);
        else {
          // Already known booking — take the incoming (possibly mutated:
          // cancelled / rescheduled / refunded) version.
          const i = existing.bookings.findIndex((x) => x.bookingId === b.bookingId);
          existing.bookings[i] = b;
        }
      }
      existing.name = user.name;
      existing.gotra = user.gotra;
      existing.city = user.city;
      existing.email = user.email;
      return;
    }
    const byId = users.findIndex((u) => u.id === user.id);
    if (byId >= 0) users[byId] = user;
    else users.push(user);
  };

  return {
    async getCatalogOverrides() {
      return overrides;
    },
    async saveCatalogOverrides(o) {
      overrides = { ...overrides, ...o };
    },
    async clearCatalogOverrides(sections) {
      const next: CatalogOverrides = {};
      for (const [k, v] of Object.entries(overrides)) {
        if (!sections.includes(k as (typeof sections)[number])) {
          (next as Record<string, unknown>)[k] = v;
        }
      }
      overrides = next;
    },
    async getAdminCreds() {
      return creds;
    },
    async saveAdminCreds(email, passwordHash) {
      creds = { email, passwordHash };
    },
    async getSessions() {
      return sessions;
    },
    async saveSessions(s) {
      sessions = s;
    },
    async getUsers() {
      return users;
    },
    async findUserByPhone(phone) {
      return users.find((u) => u.phone === phone.trim());
    },
    async findUserById(id) {
      return users.find((u) => u.id === id);
    },
    async saveUser(user) {
      saveUser(user);
    },
    async deleteUserById(id) {
      const before = users.length;
      users = users.filter((u) => u.id !== id);
      return users.length !== before;
    },
  };
}
