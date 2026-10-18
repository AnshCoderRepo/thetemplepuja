// MongoDB Atlas persistence for the admin catalog, credentials and sessions.
// Server-only — never import from a client component.
import { MongoClient, type Collection, type Db, type Document } from "mongodb";
import type {
  AdminCreds,
  CatalogOverrides,
  PersistenceStore,
} from "./persistence";
import { defaultAddons, type Addon, type Coupon, type FestivalEvent, type Pooja, type PoojaDate, type Temple, type UpcomingEventSpec } from "./data";
import type { BlogPost } from "./blog-data";
import type { BookingRecord, DevoteeEntitlement, UserProfile } from "./storage";
import type { RefundRequest } from "./refund-types";
import { getPhoneLookupVariants } from "./phone";
import { DEFAULT_GALLERY_ITEMS, type GalleryItem } from "./gallery-types";

import type {
  ChatbotKnowledgeEntry,
  ChatbotSettings,
  PlatformSettings,
} from "./chatbot-types";
import { ensureDnsPatch } from "./dns-fix";

// Some networks (corporate/ISP DNS) refuse Node's c-ares resolver while the
// OS resolver works — patch SRV/TXT/A lookups with a DoH fallback first.
ensureDnsPatch();

function getMongoUri(): string {
  return (process.env.MONGODB_URI || "").trim();
}

function getMongoDbName(): string {
  return (process.env.MONGODB_DB || "templepuja").trim();
}

// Cache the connection across Next.js dev hot-reloads (globalThis survives
// module re-evaluation). Connections are lazy — nothing touches Atlas until
// the first read/write.
const g = globalThis as unknown as {
  __ttpMongo?: { client: MongoClient; db: Promise<Db> };
};

export function resetMongoConnection(): void {
  try {
    if (g.__ttpMongo?.client) {
      void g.__ttpMongo.client.close();
    }
  } catch {}
  delete g.__ttpMongo;
}

// Discard any previously rejected promise on globalThis so hot-reload immediately retries
if (g.__ttpMongo) {
  g.__ttpMongo.db.catch(() => {
    delete g.__ttpMongo;
  });
}

function getDb(): Promise<Db> {
  ensureDnsPatch();
  if (!g.__ttpMongo) {
    const uri = getMongoUri();
    const dbName = getMongoDbName();
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    const dbPromise = client
      .connect()
      .then(() => client.db(dbName))
      .catch((err) => {
        delete g.__ttpMongo;
        throw err;
      });
    g.__ttpMongo = { client, db: dbPromise };
  }
  return g.__ttpMongo.db;
}

interface CatalogDoc extends Document {
  _id: string;
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
  address?: string;
  createdAt: string;
  bookings: BookingRecord[];
  videos?: any[];
  passwordHash?: string;
  generatedPassword?: string;
  isActivated?: boolean;
  status?: "pending_activation" | "active" | "suspended";
  activatedAt?: string;
  role?: "devotee" | "admin";
  entitlements?: DevoteeEntitlement[];
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
    address: doc.address,
    createdAt: doc.createdAt,
    bookings: doc.bookings ?? [],
    videos: doc.videos,
    passwordHash: doc.passwordHash,
    generatedPassword: doc.generatedPassword,
    isActivated: doc.isActivated ?? true,
    status: doc.status ?? (doc.isActivated === false ? "pending_activation" : "active"),
    activatedAt: doc.activatedAt,
    role: doc.role ?? "devotee",
    entitlements: doc.entitlements ?? [],
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
    if (doc.festivals) out.festivals = doc.festivals;
    if (doc.coupons) out.coupons = doc.coupons;
    if (doc.poojaDates) out.poojaDates = doc.poojaDates;
    if (doc.temples) out.temples = doc.temples;
    if (doc.blogs) out.blogs = doc.blogs;
    if (doc.chatbotKnowledge) out.chatbotKnowledge = doc.chatbotKnowledge;
    if (doc.chatbotSettings) out.chatbotSettings = doc.chatbotSettings;
    if (doc.platformSettings) out.platformSettings = doc.platformSettings;
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
    const variants = getPhoneLookupVariants(phone);
    const doc = await col.findOne({ phone: { $in: variants } });
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
    const setFields: Record<string, any> = {
      name: user.name,
      gotra: user.gotra,
      city: user.city,
      email: user.email,
      updatedAt: new Date().toISOString(),
    };
    if (user.address) setFields.address = user.address;
    if (user.passwordHash) setFields.passwordHash = user.passwordHash;
    if (user.generatedPassword) setFields.generatedPassword = user.generatedPassword;
    if (user.videos) setFields.videos = user.videos;
    if (typeof user.isActivated === "boolean") setFields.isActivated = user.isActivated;
    if (user.status) setFields.status = user.status;
    if (user.activatedAt) setFields.activatedAt = user.activatedAt;
    if (user.role) setFields.role = user.role;
    if (user.entitlements) setFields.entitlements = user.entitlements;

    await col.updateOne(
      { phone: user.phone },
      {
        $set: setFields,
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

  async getRefundRequests(): Promise<RefundRequest[]> {
    const db = await getDb();
    const col = db.collection<Document>("refund_requests");
    const docs = await col.find({}).sort({ requestedAt: -1 }).toArray();
    return docs.map((d: any) => {
      const { _id, ...rest } = d;
      return rest as RefundRequest;
    });
  },

  async findRefundRequestById(id: string): Promise<RefundRequest | undefined> {
    const db = await getDb();
    const col = db.collection<Document>("refund_requests");
    const doc = await col.findOne({ id } as any);
    if (!doc) return undefined;
    const { _id, ...rest } = doc as any;
    return rest as RefundRequest;
  },

  async saveRefundRequest(req: RefundRequest): Promise<void> {
    const db = await getDb();
    const col = db.collection<Document>("refund_requests");
    try {
      await col.createIndex({ id: 1 }, { unique: true });
      await col.createIndex({ status: 1 });
      await col.createIndex({ bookingId: 1 });
    } catch {}
    await col.updateOne(
      { id: req.id } as any,
      { $set: req },
      { upsert: true }
    );
  },

  async getAddons(): Promise<Addon[]> {
    const col = await addonsCol();
    const count = await col.countDocuments({});
    if (count === 0) {
      try {
        await col.insertMany(defaultAddons.map((a) => ({ ...a })));
      } catch {}
    }
    const docs = await col.find({}).toArray();
    return docs.map(toAddonDoc);
  },

  async findAddonById(id: string): Promise<Addon | undefined> {
    const col = await addonsCol();
    const doc = await col.findOne({ $or: [{ _id: id }, { id }] });
    return doc ? toAddonDoc(doc) : undefined;
  },

  async saveAddon(addon: Addon): Promise<void> {
    const col = await addonsCol();
    const id = String(addon._id || addon.id);
    const doc = {
      ...addon,
      _id: id,
      id: id,
      updatedAt: new Date().toISOString(),
    };
    if (!doc.createdAt) doc.createdAt = new Date().toISOString();
    await col.updateOne({ $or: [{ _id: id }, { id }] }, { $set: doc }, { upsert: true });
  },

  async deleteAddon(id: string): Promise<boolean> {
    const col = await addonsCol();
    const res = await col.deleteOne({ $or: [{ _id: id }, { id }] });
    return res.deletedCount > 0;
  },

  async getGalleryItems(): Promise<GalleryItem[]> {
    const col = await galleryCol();
    const count = await col.countDocuments({});
    if (count === 0) {
      try {
        await col.insertMany(DEFAULT_GALLERY_ITEMS.map((g) => ({ ...g })));
      } catch {}
    }
    const docs = await col.find({}).sort({ displayOrder: 1 }).toArray();
    return docs.map(toGalleryDoc);
  },

  async findGalleryItemById(id: string): Promise<GalleryItem | undefined> {
    const col = await galleryCol();
    const doc = await col.findOne({ $or: [{ _id: id }, { id }] });
    return doc ? toGalleryDoc(doc) : undefined;
  },

  async saveGalleryItem(item: GalleryItem): Promise<void> {
    const col = await galleryCol();
    const id = String(item._id || item.id);
    const doc = {
      ...item,
      _id: id,
      id: id,
      updatedAt: new Date().toISOString(),
    };
    if (!doc.createdAt) doc.createdAt = new Date().toISOString();
    await col.updateOne({ $or: [{ _id: id }, { id }] }, { $set: doc }, { upsert: true });
  },

  async deleteGalleryItem(id: string): Promise<boolean> {
    const col = await galleryCol();
    const res = await col.deleteOne({ $or: [{ _id: id }, { id }] });
    return res.deletedCount > 0;
  },
};

export async function galleryCol(): Promise<Collection<any>> {
  const db = await getDb();
  const col = db.collection<any>("gallery");
  try {
    await col.createIndex({ id: 1 });
    await col.createIndex({ isActive: 1 });
    await col.createIndex({ showOnHomepage: 1 });
    await col.createIndex({ displayOrder: 1 });
  } catch {}
  return col;
}

function toGalleryDoc(doc: any): GalleryItem {
  const idStr = String(doc._id || doc.id);
  return {
    _id: idStr,
    id: idStr,
    title: doc.title || "",
    description: doc.description || "",
    mediaType: doc.mediaType || "photo",
    images: Array.isArray(doc.images) ? doc.images : undefined,
    imageUrl: doc.imageUrl,
    imageUrl2: doc.imageUrl2,
    imageUrl3: doc.imageUrl3,
    videoUrl: doc.videoUrl,
    thumbnailUrl: doc.thumbnailUrl,
    youtubeUrl: doc.youtubeUrl,
    youtubeVideoId: doc.youtubeVideoId,
    category: doc.category || "Puja Ceremonies",
    isActive: doc.isActive !== false,
    showOnHomepage: doc.showOnHomepage !== false,
    displayOrder: Number(doc.displayOrder) || 1,
    isDemo: Boolean(doc.isDemo),
    videoDurationSeconds: doc.videoDurationSeconds ? Number(doc.videoDurationSeconds) : undefined,
    durationVerified: Boolean(doc.durationVerified),
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

export async function addonsCol(): Promise<Collection<any>> {
  const db = await getDb();
  const col = db.collection<any>("addons");
  try {
    await col.createIndex({ id: 1 });
    await col.createIndex({ active: 1 });
  } catch {}
  return col;
}

function toAddonDoc(doc: any): Addon {
  const idStr = String(doc._id || doc.id);
  return {
    _id: idStr,
    id: idStr,
    name: doc.name || "",
    hindiName: doc.hindiName,
    teluguName: doc.teluguName,
    tamilName: doc.tamilName,
    description: doc.description || "",
    hindiDescription: doc.hindiDescription,
    teluguDescription: doc.teluguDescription,
    tamilDescription: doc.tamilDescription,
    price: Number(doc.price) || 0,
    currency: doc.currency || "INR",
    active: doc.active !== false,
    emoji: doc.emoji || "🌸",
    category: doc.category || "Chadhava Seva",
    hindiCategory: doc.hindiCategory,
    teluguCategory: doc.teluguCategory,
    tamilCategory: doc.tamilCategory,
    image: doc.image,
    type: doc.type || "chadhava",
    badge: doc.badge,
    hindiBadge: doc.hindiBadge,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

// ============ ORDERS / PAYMENTS PERSISTENCE ============

export interface OrderDoc extends Document {
  _id?: string;
  orderId: string;
  paymentId?: string;
  phone: string;
  customerName?: string;
  amount: number;
  currency: string;
  status: "created" | "verified" | "failed" | "refunded";
  paymentMethod: "razorpay" | "upi_qr" | "simulated";
  receipt: string;
  poojaSlug?: string;
  poojaTitle?: string;
  bookingId?: string;
  createdAt: string;
  verifiedAt?: string;
  metadata?: Record<string, any>;
}


export async function ordersCol(): Promise<Collection<OrderDoc>> {
  const db = await getDb();
  const col = db.collection<OrderDoc>("orders");
  try {
    await col.createIndex({ orderId: 1 }, { unique: true });
    await col.createIndex({ phone: 1 });
  } catch {}
  return col;
}

export async function saveOrder(order: OrderDoc): Promise<void> {
  const col = await ordersCol();
  await col.updateOne(
    { orderId: order.orderId },
    { $set: order },
    { upsert: true }
  );
}

export async function findOrderByOrderId(orderId: string): Promise<OrderDoc | null> {
  const col = await ordersCol();
  return col.findOne({ orderId });
}

export async function findOrdersByPhone(phone: string): Promise<OrderDoc[]> {
  const col = await ordersCol();
  const variants = getPhoneLookupVariants(phone);
  return col.find({ phone: { $in: variants } }).sort({ createdAt: -1 }).toArray();
}

// ============ WEBHOOK IDEMPOTENCY PERSISTENCE ============

export async function recordWebhookEvent(
  eventId: string,
  eventType: string
): Promise<boolean> {
  if (!eventId) return true;
  try {
    const db = await getDb();
    const col = db.collection("webhook_events");
    const res = await col.updateOne(
      { _id: eventId as any },
      {
        $setOnInsert: {
          _id: eventId as any,
          eventType,
          processedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );
    // If upsertedCount is 0, the event already existed -> duplicate!
    return Boolean(res.upsertedCount > 0);
  } catch (err: any) {
    if (err?.code === 11000) return false; // duplicate key error
    return true; // continue safely on unexpected error
  }
}

// ============ OTP CHALLENGES PERSISTENCE ============

export interface OtpChallengeDoc extends Document {
  _id: string;
  phone: string;
  purpose: "activation" | "password_reset";
  tokenHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  resendAfter: Date;
  createdAt: Date;
}

export async function otpCol(): Promise<Collection<OtpChallengeDoc>> {
  const db = await getDb();
  const col = db.collection<OtpChallengeDoc>("otp_challenges");
  try {
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await col.createIndex({ phone: 1, purpose: 1 });
  } catch {}
  return col;
}

export async function saveOtpChallenge(challenge: OtpChallengeDoc): Promise<void> {
  const col = await otpCol();
  await col.updateOne(
    { _id: challenge._id },
    { $set: challenge },
    { upsert: true }
  );
}

export async function findActiveOtpChallenge(
  phone: string,
  purpose: "activation" | "password_reset"
): Promise<OtpChallengeDoc | null> {
  const col = await otpCol();
  const variants = getPhoneLookupVariants(phone);
  return col.findOne({
    phone: { $in: variants },
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });
}

export async function incrementOtpAttempt(id: string): Promise<number> {
  const col = await otpCol();
  const res = await col.findOneAndUpdate(
    { _id: id },
    { $inc: { attempts: 1 } },
    { returnDocument: "after" }
  );
  return res?.attempts ?? 0;
}

export async function markOtpChallengeUsed(id: string): Promise<void> {
  const col = await otpCol();
  await col.updateOne({ _id: id }, { $set: { isUsed: true } });
}

