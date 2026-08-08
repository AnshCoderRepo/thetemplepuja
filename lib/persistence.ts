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
  /** Devotee profiles + bookings. */
  getUsers(): Promise<UserProfile[]>;
  saveUsers(users: UserProfile[]): Promise<void>;
}

/** In-memory store — data lives for the lifetime of the process only. */
export function createMemoryStore(): PersistenceStore {
  let overrides: CatalogOverrides = {};
  let creds: AdminCreds = { email: "", passwordHash: "" };
  let sessions: Record<string, number> = {};
  let users: UserProfile[] = [];

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
    async saveUsers(u) {
      users = u;
    },
  };
}
