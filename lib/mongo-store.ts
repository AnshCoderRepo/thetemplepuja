// MongoDB Atlas persistence for the admin catalog, credentials and sessions.
// Server-only — never import from a client component.
import { MongoClient, type Db, type Document } from "mongodb";
import type {
  AdminCreds,
  CatalogOverrides,
  PersistenceStore,
} from "./persistence";
import type { Coupon, Pooja, UpcomingEventSpec } from "./data";
import type { UserProfile } from "./storage";
import { ensureDnsPatch } from "./dns-fix";

// Some networks (corporate/ISP DNS) refuse Node's c-ares resolver while the
// OS resolver works — patch SRV/TXT/A lookups with a DoH fallback first.
ensureDnsPatch();

const URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.MONGODB_DB ?? "templepuja";

// Cache the connection across Next.js dev hot-reloads (globalThis survives
// module re-evaluation). Connections are lazy — nothing touches Atlas until
// the first read/write.
const g = globalThis as unknown as {
  __ttpMongo?: { client: MongoClient; db: Promise<Db> };
};

function getDb(): Promise<Db> {
  if (!g.__ttpMongo) {
    const client = new MongoClient(URI, { serverSelectionTimeoutMS: 8000 });
    g.__ttpMongo = { client, db: client.connect().then(() => client.db(DB_NAME)) };
  }
  return g.__ttpMongo.db;
}

interface CatalogDoc extends Document {
  _id: string;
  poojas?: Pooja[];
  events?: UpcomingEventSpec[];
  coupons?: Record<string, Coupon>;
}

interface AdminDoc extends Document {
  _id: string;
  email: string;
  passwordHash: string;
}

interface SessionDoc extends Document {
  _id: string;
  expiresAt: number;
}

interface UsersDoc extends Document {
  _id: string;
  users: UserProfile[];
}

export const mongoStore: PersistenceStore = {
  async getCatalogOverrides(): Promise<CatalogOverrides> {
    const doc = await (await getDb())
      .collection<CatalogDoc>("catalog")
      .findOne({ _id: "overrides" });
    if (!doc) return {};
    const out: CatalogOverrides = {};
    if (doc.poojas) out.poojas = doc.poojas;
    if (doc.events) out.events = doc.events;
    if (doc.coupons) out.coupons = doc.coupons;
    return out;
  },

  async saveCatalogOverrides(overrides): Promise<void> {
    await (await getDb())
      .collection<CatalogDoc>("catalog")
      .updateOne({ _id: "overrides" }, { $set: overrides }, { upsert: true });
  },

  async clearCatalogOverrides(sections): Promise<void> {
    const unset: Record<string, ""> = {};
    for (const s of sections) unset[s] = "";
    await (await getDb())
      .collection<CatalogDoc>("catalog")
      .updateOne({ _id: "overrides" }, { $unset: unset });
  },

  async getAdminCreds(): Promise<AdminCreds> {
    const doc = await (await getDb())
      .collection<AdminDoc>("admin")
      .findOne({ _id: "creds" });
    if (!doc) return { email: "", passwordHash: "" };
    return { email: doc.email, passwordHash: doc.passwordHash };
  },

  async saveAdminCreds(email, passwordHash): Promise<void> {
    await (await getDb())
      .collection<AdminDoc>("admin")
      .updateOne(
        { _id: "creds" },
        { $set: { email, passwordHash } },
        { upsert: true }
      );
  },

  async getSessions(): Promise<Record<string, number>> {
    const docs = await (await getDb())
      .collection<SessionDoc>("sessions")
      .find({})
      .toArray();
    const out: Record<string, number> = {};
    for (const d of docs) out[d._id] = d.expiresAt;
    return out;
  },

  async saveSessions(sessions): Promise<void> {
    const db = await getDb();
    const col = db.collection<SessionDoc>("sessions");
    await col.deleteMany({});
    const entries = Object.entries(sessions);
    if (entries.length > 0) {
      await col.insertMany(
        entries.map(([token, expiresAt]) => ({ _id: token, expiresAt }))
      );
    }
  },

  async getUsers(): Promise<UserProfile[]> {
    const doc = await (await getDb())
      .collection<UsersDoc>("users")
      .findOne({ _id: "all" });
    return doc?.users ?? [];
  },

  async saveUsers(users): Promise<void> {
    await (await getDb())
      .collection<UsersDoc>("users")
      .updateOne({ _id: "all" }, { $set: { users } }, { upsert: true });
  },
};
