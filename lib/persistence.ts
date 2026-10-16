import { defaultAddons, type Addon, type Coupon, type FestivalEvent, type Pooja, type PoojaDate, type Temple, type UpcomingEventSpec } from "./data";
import type { BlogPost } from "./blog-data";
import type { UserProfile } from "./storage";
import type { RefundRequest } from "./refund-types";
import type {
  ChatbotKnowledgeEntry,
  ChatbotSettings,
  PlatformSettings,
} from "./chatbot-types";

export interface CatalogOverrides {
  poojas?: Pooja[];
  events?: UpcomingEventSpec[];
  festivals?: FestivalEvent[];
  coupons?: Record<string, Coupon>;
  poojaDates?: PoojaDate[];
  temples?: Temple[];
  blogs?: BlogPost[];
  chatbotKnowledge?: ChatbotKnowledgeEntry[];
  chatbotSettings?: ChatbotSettings;
  platformSettings?: PlatformSettings;
}

export interface AdminCreds {
  email: string;
  passwordHash: string;
}

export interface PersistenceStore {
  getCatalogOverrides(): Promise<CatalogOverrides>;
  saveCatalogOverrides(overrides: CatalogOverrides): Promise<void>;
  clearCatalogOverrides(
    sections: (
      | "poojas"
      | "events"
      | "festivals"
      | "coupons"
      | "poojaDates"
      | "temples"
      | "blogs"
      | "chatbotKnowledge"
      | "chatbotSettings"
      | "platformSettings"
    )[]
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
  /** Approval-based refund requests */
  getRefundRequests(): Promise<RefundRequest[]>;
  findRefundRequestById(id: string): Promise<RefundRequest | undefined>;
  saveRefundRequest(req: RefundRequest): Promise<void>;
  /** Independent Add-on management */
  getAddons(): Promise<Addon[]>;
  findAddonById(id: string): Promise<Addon | undefined>;
  saveAddon(addon: Addon): Promise<void>;
  deleteAddon(id: string): Promise<boolean>;
}

/** In-memory store — data lives for the lifetime of the process only. */
export function createMemoryStore(): PersistenceStore {
  let overrides: CatalogOverrides = {};
  let creds: AdminCreds = { email: "", passwordHash: "" };
  let sessions: Record<string, number> = {};
  let users: UserProfile[] = [];
  let refundRequests: RefundRequest[] = [];
  let addons: Addon[] = defaultAddons.map((a) => ({ ...a }));

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
      if (user.passwordHash) existing.passwordHash = user.passwordHash;
      if (user.generatedPassword) existing.generatedPassword = user.generatedPassword;
      if (user.videos) existing.videos = user.videos;
      if (typeof user.isActivated === "boolean") existing.isActivated = user.isActivated;
      if (user.status) existing.status = user.status;
      if (user.activatedAt) existing.activatedAt = user.activatedAt;
      if (user.role) existing.role = user.role;
      if (user.entitlements) existing.entitlements = user.entitlements;
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
      const p = phone.trim();
      const p10 = p.replace(/\D/g, "").slice(-10);
      return users.find((u) => {
        if (u.phone === p) return true;
        const u10 = u.phone.replace(/\D/g, "").slice(-10);
        return p10 && u10 && p10 === u10;
      });
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
    async getRefundRequests() {
      return [...refundRequests];
    },
    async findRefundRequestById(id) {
      return refundRequests.find((r) => r.id === id);
    },
    async saveRefundRequest(req) {
      const idx = refundRequests.findIndex((r) => r.id === req.id);
      if (idx >= 0) refundRequests[idx] = req;
      else refundRequests.unshift(req);
    },
    async getAddons() {
      return [...addons];
    },
    async findAddonById(id: string) {
      return addons.find((a) => a._id === id || a.id === id);
    },
    async saveAddon(addon: Addon) {
      const id = addon._id || addon.id;
      const clean: Addon = {
        ...addon,
        _id: id,
        id,
        updatedAt: new Date().toISOString(),
      };
      if (!clean.createdAt) clean.createdAt = new Date().toISOString();
      const idx = addons.findIndex((a) => a._id === id || a.id === id);
      if (idx >= 0) addons[idx] = clean;
      else addons.push(clean);
    },
    async deleteAddon(id: string) {
      const before = addons.length;
      addons = addons.filter((a) => a._id !== id && a.id !== id);
      return addons.length !== before;
    },
  };
}
