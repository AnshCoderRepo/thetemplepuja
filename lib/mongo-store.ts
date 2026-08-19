// MongoDB Atlas persistence for the admin catalog, credentials and sessions.
// Server-only — never import from a client component.
import { MongoClient, type Collection, type Db, type Document } from "mongodb";
import type {
  AdminCreds,
  CatalogOverrides,
  PersistenceStore,
} from "./persistence";
import type { Coupon, Pooja, PoojaDate, UpcomingEventSpec } from "./data";
import type { BookingRecord, UserProfile } from "./storage";
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
  poojaDates?: PoojaDate[];
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

/** One devotee per document — _id is the devotee's id, phone is indexed. */
interface UserDoc extends Document {
  _id: string;
  name: string;
  gotra: string;
  city: string;
  phone: string;
  email: string;
  createdAt: string;
  bookings: BookingRecord[];
}

/** The legacy layout (pre per-document migration): one doc holding the array. */
interface LegacyUsersDoc extends Document {
  _id: "all";
  users: UserProfile[];
}

/** Loose alias for the users collection — the driver types `Document._id` as
    ObjectId, but our docs use string ids plus dotted/array paths in filters
    and updates. `Collection<any>` keeps all of that assignable; reads still
    map through `toUser` for shape safety. */
async function usersCol(): Promise<Collection<any>> {
  return (await getDb()).collection("users") as Collection<any>;
}

function toUser(doc: UserDoc): UserProfile {
  return {
    id: doc._id,
    name: doc.name,
    gotra: doc.gotra,
    city: doc.city,
    phone: doc.phone,
    email: doc.email,
    createdAt: doc.createdAt,
    bookings: doc.bookings ?? [],
  };
}

/** Split the legacy single-document layout into per-devotee documents. Existing
 * per-doc entries win (setOnInsert), so re-running is safe; then the legacy
 * doc is removed. Runs at the start of every user op — cheap after the first
 * time (the findOne simply misses). */
async function migrateUsers(col: Collection<any>): Promise<void> {
  const legacy = (await col.findOne({ _id: "all" })) as LegacyUsersDoc | null;
  if (!legacy) return;
  for (const u of legacy.users ?? []) {
    await col.updateOne(
      { phone: u.phone },
      {
        $setOnInsert: {
          _id: u.id,
          name: u.name,
          gotra: u.gotra,
          city: u.city,
          email: u.email,
          createdAt: u.createdAt,
          bookings: u.bookings ?? [],
        },
      },
      { upsert: true }
    );
  }
  await col.deleteOne({ _id: "all" });
  // Best-effort index — duplicate phones would break it, so never fail on it.
  try {
    await col.createIndex({ phone: 1 }, { unique: true });
  } catch {
    // index exists or pre-existing duplicates — lookups still work
  }
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
    if (doc.poojaDates) out.poojaDates = doc.poojaDates;
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
    const col = await usersCol();
    await migrateUsers(col);
    const docs = await col.find({ _id: { $ne: "all" } }).toArray();
    return docs.map((d) => toUser(d as unknown as UserDoc));
  },

  async findUserByPhone(phone): Promise<UserProfile | undefined> {
    const col = await usersCol();
    await migrateUsers(col);
    const doc = await col.findOne({ phone: phone.trim() });
    return doc ? toUser(doc as unknown as UserDoc) : undefined;
  },

  async findUserById(id): Promise<UserProfile | undefined> {
    const col = await usersCol();
    await migrateUsers(col);
    const doc = await col.findOne({ _id: id });
    return doc ? toUser(doc as unknown as UserDoc) : undefined;
  },

  async saveUser(user): Promise<void> {
    const col = await usersCol();
    await migrateUsers(col);
    // Upsert the profile itself (idempotent, phone-keyed — a first booking
    // creates the doc with the caller's id, later bookings keep it).
    await col.updateOne(
      { phone: user.phone },
      {
        $set: {
          name: user.name,
          gotra: user.gotra,
          city: user.city,
          email: user.email,
          updatedAt: new Date().toISOString(),
        },
        $setOnInsert: {
          _id: user.id,
          createdAt: user.createdAt,
          bookings: [],
        },
      },
      { upsert: true }
    );
    // Diff against the stored doc so we append NEW bookings atomically (the
    // guard means a concurrent identical submit can never double-append) and
    // persist MUTATIONS to existing bookings (cancel / reschedule / refund)
    // via the positional operator — a plain whole-array $set would clobber a
    // concurrent append.
    const existing = await col.findOne({ phone: user.phone });
    const existingBookings = (existing?.bookings ?? []) as BookingRecord[];
    for (const b of user.bookings) {
      const prev = existingBookings.find((x) => x.bookingId === b.bookingId);
      if (!prev) {
        await col.updateOne(
          { phone: user.phone, "bookings.bookingId": { $ne: b.bookingId } },
          // The driver's PushOperator rejects even `any` here; the shape is
          // exactly `{ $push: { bookings: <BookingRecord> } }`.
          { $push: { bookings: b } } as any
        );
      } else if (JSON.stringify(prev) !== JSON.stringify(b)) {
        await col.updateOne(
          { phone: user.phone, "bookings.bookingId": b.bookingId },
          { $set: { "bookings.$": b } }
        );
      }
    }
  },

  async deleteUserById(id): Promise<boolean> {
    const col = await usersCol();
    await migrateUsers(col);
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  },
};
