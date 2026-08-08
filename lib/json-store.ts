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
    async saveUsers(users): Promise<void> {
      writeJson("users.json", users);
    },
  };
}
