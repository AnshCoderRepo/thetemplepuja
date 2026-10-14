// JSON-file persistence — used as the fallback tier when MongoDB Atlas is not
// configured or unreachable, so local admin edits still survive restarts.
import fs from "fs";
import path from "path";
import type {
  AdminCreds,
  CatalogOverrides,
  PersistenceStore,
} from "./persistence";
import type { UserProfile } from "./storage";
import type { RefundRequest } from "./refund-types";

function dataDir(): string {
  return process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
}

function file(name: string): string {
  return path.join(dataDir(), name);
}

function readJson<T>(name: string, fallback: T): T {
  try {
    if (!fs.existsSync(file(name))) return fallback;
    return JSON.parse(fs.readFileSync(file(name), "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(name: string, data: unknown): void {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(file(name), JSON.stringify(data, null, 2), "utf8");
}

export function createJsonStore(): PersistenceStore {
  function getUsersFromFile(): UserProfile[] {
    return readJson<UserProfile[]>("users.json", []);
  }

  return {
    async getCatalogOverrides(): Promise<CatalogOverrides> {
      return readJson<CatalogOverrides>("catalog.json", {});
    },
    async saveCatalogOverrides(overrides): Promise<void> {
      writeJson("catalog.json", { ...readJson<CatalogOverrides>("catalog.json", {}), ...overrides });
    },
    async clearCatalogOverrides(sections): Promise<void> {
      const current = readJson<CatalogOverrides>("catalog.json", {});
      const next: CatalogOverrides = {};
      for (const [k, v] of Object.entries(current)) {
        if (!sections.includes(k as (typeof sections)[number])) {
          (next as Record<string, unknown>)[k] = v;
        }
      }
      writeJson("catalog.json", next);
    },
    async getAdminCreds(): Promise<AdminCreds> {
      return readJson<AdminCreds>("admin.json", { email: "", passwordHash: "" });
    },
    async saveAdminCreds(email, passwordHash): Promise<void> {
      writeJson("admin.json", { email, passwordHash });
    },
    async getSessions(): Promise<Record<string, number>> {
      return readJson<Record<string, number>>("sessions.json", {});
    },
    async saveSessions(sessions): Promise<void> {
      writeJson("sessions.json", sessions);
    },
    async getUsers(): Promise<UserProfile[]> {
      return readJson<UserProfile[]>("users.json", []);
    },
    async findUserByPhone(phone): Promise<UserProfile | undefined> {
      const p = phone.trim();
      const p10 = p.replace(/\D/g, "").slice(-10);
      return getUsersFromFile().find((u) => {
        if (u.phone === p) return true;
        const u10 = u.phone.replace(/\D/g, "").slice(-10);
        return p10 && u10 && p10 === u10;
      });
    },
    async findUserById(id): Promise<UserProfile | undefined> {
      return getUsersFromFile().find((u) => u.id === id);
    },
    async saveUser(user): Promise<void> {
      const users = getUsersFromFile();
      // Phone-keyed merge (mirrors MongoDB): append only bookings that aren't
      // already on the devotee, so concurrent same-phone saves merge instead
      // of duplicating the profile.
      const byPhone = users.findIndex((u) => u.phone === user.phone);
      if (byPhone >= 0) {
        const existing = users[byPhone];
        const existingIds = new Set(existing.bookings.map((b) => b.bookingId));
        for (const b of user.bookings) {
          if (!existingIds.has(b.bookingId)) existing.bookings.push(b);
          else {
            // Already known booking — take the incoming (possibly mutated:
            // cancelled / rescheduled / refunded) version.
            const i = existing.bookings.findIndex(
              (x) => x.bookingId === b.bookingId
            );
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
        writeJson("users.json", users);
        return;
      }
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) users[idx] = user;
      else users.push(user);
      writeJson("users.json", users);
    },
    async deleteUserById(id): Promise<boolean> {
      const users = getUsersFromFile();
      const next = users.filter((u) => u.id !== id);
      if (next.length === users.length) return false;
      writeJson("users.json", next);
      return true;
    },
    async getRefundRequests(): Promise<RefundRequest[]> {
      return readJson<RefundRequest[]>("refund_requests.json", []);
    },
    async findRefundRequestById(id: string): Promise<RefundRequest | undefined> {
      const list = readJson<RefundRequest[]>("refund_requests.json", []);
      return list.find((r) => r.id === id);
    },
    async saveRefundRequest(req: RefundRequest): Promise<void> {
      const list = readJson<RefundRequest[]>("refund_requests.json", []);
      const idx = list.findIndex((r) => r.id === req.id);
      if (idx >= 0) list[idx] = req;
      else list.unshift(req);
      writeJson("refund_requests.json", list);
    },
  };
}
