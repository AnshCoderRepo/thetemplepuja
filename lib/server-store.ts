// Server-side logic for the admin catalog, credentials and sessions. All
// persistence goes through a PersistenceStore — MongoDB Atlas by default,
// with an in-memory store as the fallback (tests, or when Mongo is
// unreachable). Never import this from a client component.
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  coupons as staticCoupons,
  defaultFestivals as staticFestivals,
  defaultPoojaDates,
  defaultTemples as staticTemples,
  poojas as staticPoojas,
  upcomingEventSpecs as staticEvents,
  resolvePoojaTemple,
  type Coupon,
  type FestivalEvent,
  type Pooja,
  type PoojaDate,
  type Temple,
  type UpcomingEventSpec,
  type Addon,
} from "./data";
import type { GalleryItem } from "./gallery-types";
import { BLOG_POSTS as staticBlogPosts, type BlogPost } from "./blog-data";
import { createMemoryStore, type PersistenceStore } from "./persistence";
import { mongoStore, resetMongoConnection } from "./mongo-store";
import { createJsonStore } from "./json-store";
import { DEMO_USERS } from "./demo-users";
import {
  DEFAULT_CHATBOT_KNOWLEDGE,
  DEFAULT_CHATBOT_SETTINGS,
  type ChatbotKnowledgeEntry,
  type ChatbotSettings,
  type PlatformSettings,
} from "./chatbot-types";
import {
  cancelIn,
  refundIn,
  remindIn,
  rescheduleIn,
  reviewIn,
  upsertInto,
  type BookingInput,
  type BookingRecord,
  type CustomerMediaRecord,
  type RescheduleInput,
  type UserProfile,
} from "./storage";

export const DEFAULT_ADMIN_EMAIL =
  process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@thetemplepuja.com";
export const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin123";

export function getDefaultAdminEmail(): string {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || "admin@thetemplepuja.com";
}

export function getDefaultAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

/** bcrypt-hash a password (cost factor 10). Always async — never block the
 * event loop on a hash. */
export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

/** The old demo hash (djb2) — kept only to migrate previously stored values. */
export function legacyHashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) {
    h = ((h << 5) + h + pw.charCodeAt(i)) | 0;
  }
  return "h" + (h >>> 0).toString(36);
}

/** True when a stored hash is the legacy djb2 format (needs migration). */
function isLegacyHash(hash: string): boolean {
  return /^h[0-9a-z]+$/.test(hash);
}

/** Check a password against a stored hash (bcrypt, or legacy djb2). */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (isLegacyHash(storedHash)) {
    return legacyHashPassword(password) === storedHash;
  }
  try {
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false; // malformed hash — never match
  }
}

const memoryStore = createMemoryStore();
const jsonStore = createJsonStore();

// Persistence chain: MongoDB Atlas (primary, when MONGODB_URI is set) → JSON
// files (durable local fallback) → memory (last resort). Tests force memory.
function getChain(): PersistenceStore[] {
  if (process.env.TTP_STORE === "memory") return [memoryStore];
  if (process.env.MONGODB_URI) return [mongoStore, jsonStore, memoryStore];
  return [jsonStore, memoryStore];
}

// Circuit breaker — once Atlas is unreachable, skip it for 30s so admin calls
// stay fast instead of waiting on a time-out every request.
let mongoDownUntil = 0;
const MONGO_RETRY_MS = 30_000;

/** Runs an operation against the chain, degrading to the next tier on failure. */
export async function withFallback<T>(
  fn: (s: PersistenceStore) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (const s of getChain()) {
    if (s === mongoStore && Date.now() < mongoDownUntil) continue;
    try {
      const result = await fn(s);
      if (s === mongoStore) mongoDownUntil = 0; // success resets the breaker
      return result;
    } catch (err) {
      lastError = err;
      if (s === mongoStore) {
        mongoDownUntil = Date.now() + MONGO_RETRY_MS;
        console.error(
          "[server-store] MongoDB unreachable — falling back to local storage:",
          err instanceof Error ? err.message : err
        );
        resetMongoConnection();
      }
    }
  }
  throw lastError; // the memory tier never throws in practice
}

// ===================== CATALOG =====================

export type CatalogOverrideSection =
  | "poojas"
  | "events"
  | "festivals"
  | "coupons"
  | "poojaDates"
  | "temples"
  | "blogs"
  | "chatbotKnowledge"
  | "chatbotSettings"
  | "platformSettings";

/** Overrides merged over the static defaults — what consumers should render. */
export async function getResolvedCatalog(): Promise<{
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
  blogs: BlogPost[];
  chatbotKnowledge: ChatbotKnowledgeEntry[];
  chatbotSettings: ChatbotSettings;
  platformSettings: PlatformSettings;
}> {
  const o = await withFallback((s) => s.getCatalogOverrides());
  const resolvedTemples = o.temples ?? staticTemples;
  const rawPoojas = o.poojas ?? staticPoojas;
  const poojas = rawPoojas.map((p) => {
    const temple = resolvePoojaTemple(p, resolvedTemples);
    if (!temple) return p;
    return {
      ...p,
      templeId: p.templeId || (temple._id ? String(temple._id) : (temple.id || temple.slug)),
      templeSlug: p.templeSlug || temple.slug,
      templeName: p.templeName || temple.name,
    };
  });
  return {
    poojas,
    events: o.events ?? staticEvents,
    festivals: o.festivals ?? staticFestivals,
    coupons: o.coupons ?? staticCoupons,
    poojaDates: o.poojaDates ?? defaultPoojaDates,
    temples: resolvedTemples,
    blogs: o.blogs ?? staticBlogPosts,
    chatbotKnowledge: o.chatbotKnowledge ?? DEFAULT_CHATBOT_KNOWLEDGE,
    chatbotSettings: o.chatbotSettings ?? DEFAULT_CHATBOT_SETTINGS,
    platformSettings: o.platformSettings ?? {
      whatsappChannelUrl:
        process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
        "https://whatsapp.com/channel/0029Vaexample",
    },
  };
}

export async function saveCatalogOverrides(overrides: {
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
}): Promise<void> {
  await withFallback((s) => s.saveCatalogOverrides(overrides));
}

export async function clearCatalogOverrides(
  sections: CatalogOverrideSection[]
): Promise<void> {
  await withFallback((s) => s.clearCatalogOverrides(sections));
}

// ===================== CHATBOT & PLATFORM HELPERS =====================

export async function getChatbotKnowledge(): Promise<ChatbotKnowledgeEntry[]> {
  const overrides = await withFallback((s) => s.getCatalogOverrides());
  return overrides.chatbotKnowledge ?? DEFAULT_CHATBOT_KNOWLEDGE;
}

export async function saveChatbotKnowledge(
  knowledge: ChatbotKnowledgeEntry[]
): Promise<void> {
  await saveCatalogOverrides({ chatbotKnowledge: knowledge });
}

export async function getChatbotSettings(): Promise<ChatbotSettings> {
  const overrides = await withFallback((s) => s.getCatalogOverrides());
  return overrides.chatbotSettings ?? DEFAULT_CHATBOT_SETTINGS;
}

export async function saveChatbotSettings(
  settings: ChatbotSettings
): Promise<void> {
  await saveCatalogOverrides({ chatbotSettings: settings });
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const overrides = await withFallback((s) => s.getCatalogOverrides());
  return (
    overrides.platformSettings ?? {
      whatsappChannelUrl:
        process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
        "https://whatsapp.com/channel/0029Vaexample",
    }
  );
}

export async function savePlatformSettings(
  settings: PlatformSettings
): Promise<void> {
  const current = await getPlatformSettings();
  await saveCatalogOverrides({
    platformSettings: { ...current, ...settings },
  });
}

// ===================== ADD-ONS PERSISTENCE =====================

export async function getAllAddons(): Promise<Addon[]> {
  return withFallback((s) => s.getAddons());
}

export async function getActiveAddons(): Promise<Addon[]> {
  const all = await getAllAddons();
  return all.filter((a) => a.active !== false);
}

export async function findAddonById(id: string): Promise<Addon | undefined> {
  return withFallback((s) => s.findAddonById(id));
}

export async function saveAddon(addon: Addon): Promise<void> {
  await withFallback((s) => s.saveAddon(addon));
}

export async function deleteAddon(id: string): Promise<boolean> {
  const success = await withFallback((s) => s.deleteAddon(id));
  if (success) {
    // Clean up assignment references from all pujas safely without deleting pujas
    try {
      const catalog = await getResolvedCatalog();
      let changed = false;
      const updatedPoojas = catalog.poojas.map((p) => {
        if (p.assignedAddonIds && (p.assignedAddonIds.includes(id) || p.assignedAddonIds.includes(String(id)))) {
          changed = true;
          return {
            ...p,
            assignedAddonIds: p.assignedAddonIds.filter((aid) => aid !== id && aid !== String(id)),
          };
        }
        return p;
      });
      if (changed) {
        await saveCatalogOverrides({ poojas: updatedPoojas });
      }
    } catch (e) {
      console.error("[server-store] error cleaning up addon reference in poojas:", e);
    }
  }
  return success;
}

// ===================== GALLERY PERSISTENCE =====================

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  return withFallback((s) => s.getGalleryItems());
}

export async function getActiveGalleryItems(options?: {
  mediaType?: "photo" | "video";
  category?: string;
}): Promise<GalleryItem[]> {
  const all = await getAllGalleryItems();
  let filtered = all.filter((item) => item.isActive !== false);

  if (options?.mediaType) {
    filtered = filtered.filter((item) => item.mediaType === options.mediaType);
  }
  if (options?.category && options.category !== "all" && options.category !== "All") {
    filtered = filtered.filter(
      (item) => item.category.toLowerCase() === options.category!.toLowerCase()
    );
  }

  return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function getHomepageGalleryItems(limit: number = 6): Promise<GalleryItem[]> {
  const all = await getAllGalleryItems();
  return all
    .filter((item) => item.isActive !== false && item.showOnHomepage === true)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, limit);
}

export async function findGalleryItemById(id: string): Promise<GalleryItem | undefined> {
  return withFallback((s) => s.findGalleryItemById(id));
}

export async function saveGalleryItem(item: GalleryItem): Promise<void> {
  await withFallback((s) => s.saveGalleryItem(item));
}

export async function deleteGalleryItem(id: string): Promise<boolean> {
  return withFallback((s) => s.deleteGalleryItem(id));
}

// ===================== ADMIN CREDENTIALS =====================

export async function getAdminCreds(): Promise<{
  email: string;
  passwordHash: string;
}> {
  const creds = await withFallback((s) => s.getAdminCreds());
  if (creds.email && creds.passwordHash) return creds;
  // No stored credentials yet — seed with a bcrypt hash of the defaults.
  const email = getDefaultAdminEmail();
  const password = getDefaultAdminPassword();
  return {
    email,
    passwordHash: await hashPassword(password),
  };
}

export async function saveAdminCreds(
  email: string,
  passwordHash: string
): Promise<void> {
  await withFallback((s) =>
    s.saveAdminCreds(email.trim().toLowerCase(), passwordHash)
  );
}

export async function verifyAdminLogin(
  email: string,
  password: string
): Promise<boolean> {
  const creds = await getAdminCreds();
  const inputEmail = email.trim().toLowerCase();
  const storedEmail = creds.email.trim().toLowerCase();
  const defaultEmail = getDefaultAdminEmail().trim().toLowerCase();
  const cleanPassword = password.replace(/\s+/g, "");

  const isEmailMatch =
    inputEmail === storedEmail ||
    (storedEmail === "admin@thetemplepuja.com" && inputEmail === defaultEmail) ||
    (!storedEmail && inputEmail === defaultEmail);

  if (!isEmailMatch) return false;

  let ok = false;
  if (inputEmail === storedEmail && creds.passwordHash) {
    ok = await verifyPassword(password, creds.passwordHash);
    if (!ok && password.includes(" ")) {
      ok = await verifyPassword(cleanPassword, creds.passwordHash);
    }
  }

  if (!ok && (inputEmail === defaultEmail || !creds.passwordHash)) {
    const defaultPwd = getDefaultAdminPassword().replace(/\s+/g, "");
    if (cleanPassword === defaultPwd) {
      ok = true;
      await saveAdminCreds(inputEmail, await hashPassword(cleanPassword));
    }
  }

  // Migrate a legacy djb2 hash to bcrypt on first successful login.
  if (ok && isLegacyHash(creds.passwordHash)) {
    await saveAdminCreds(inputEmail, await hashPassword(cleanPassword));
  }
  return ok;
}

export async function adminCredsAreDefault(): Promise<boolean> {
  return verifyAdminLogin(getDefaultAdminEmail(), getDefaultAdminPassword());
}

// ===================== SESSIONS =====================

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const sessionEmailMap = new Map<string, string>();

export async function createSessionToken(adminEmail?: string): Promise<string> {
  const token = "tok_" + randomBytes(24).toString("hex");
  const sessions = await withFallback((s) => s.getSessions());
  sessions[token] = Date.now() + SESSION_TTL_MS;
  await withFallback((s) => s.saveSessions(sessions));
  if (adminEmail) {
    sessionEmailMap.set(token, adminEmail.trim().toLowerCase());
  }
  return token;
}

export async function getAdminEmailFromToken(
  token: string | null | undefined
): Promise<string | null> {
  if (!token) return null;
  const valid = await isValidSessionToken(token);
  if (!valid) return null;
  const cached = sessionEmailMap.get(token);
  if (cached) return cached;
  const creds = await getAdminCreds();
  return creds.email || getDefaultAdminEmail();
}

export async function isValidSessionToken(
  token: string | null | undefined
): Promise<boolean> {
  if (!token) return false;
  const sessions = await withFallback((s) => s.getSessions());
  const expiresAt = sessions[token];
  if (!expiresAt) return false;
  if (expiresAt < Date.now()) {
    delete sessions[token];
    await withFallback((s) => s.saveSessions(sessions));
    return false;
  }
  return true;
}

export async function invalidateSessionToken(token: string): Promise<void> {
  const sessions = await withFallback((s) => s.getSessions());
  delete sessions[token];
  sessionEmailMap.delete(token);
  await withFallback((s) => s.saveSessions(sessions));
}

// ===================== DEVOTEES & BOOKINGS =====================

// Seed the demo devotees the first time the store is empty, so a fresh
// deployment shows the same dashboard as before. The flag prevents re-seeding
// after the admin deliberately deletes every profile within one process.
let usersSeeded = false;

/** All devotee profiles. Seeds the demo data when the store is empty. */
export async function getAllUsers(): Promise<UserProfile[]> {
  const users = await withFallback((s) => s.getUsers());
  if (users.length === 0 && !usersSeeded) {
    usersSeeded = true;
    // Seed one document per devotee.
    await Promise.all(DEMO_USERS.map((u) => withFallback((s) => s.saveUser(u))));
    return DEMO_USERS;
  }
  // Ensure the dedicated test devotee 7070410031 is seeded if missing (in normal app runtime)
  const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  if (!isTestEnv) {
    const hasTestUser = users.some((u) => u.phone === "7070410031");
    if (!hasTestUser) {
      const testUser = DEMO_USERS.find((u) => u.phone === "7070410031");
      if (testUser) {
        await withFallback((s) => s.saveUser(testUser));
        users.push(testUser);
      }
    }
  }
  return users;
}

/** Raw lookup (no seeding) — used by the booking flow so a real booking never
 * gets merged into the demo data. */
export async function findUserByPhone(
  phone: string
): Promise<UserProfile | undefined> {
  const found = await withFallback((s) => s.findUserByPhone(phone));
  const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
  if (!found && phone === "7070410031" && !isTestEnv) {
    const testUser = DEMO_USERS.find((u) => u.phone === phone);
    if (testUser) {
      await withFallback((s) => s.saveUser(testUser));
      return testUser;
    }
  }
  return found;
}

/** Update a devotee profile (name, phone, email, gotra, city, password). Admin action. */
export async function updateUserProfile(
  userIdOrPhone: string,
  updates: {
    name?: string;
    phone?: string;
    email?: string;
    gotra?: string;
    city?: string;
    address?: string;
    password?: string;
  }
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  const user = await withFallback(async (s) => {
    const byId = await s.findUserById(userIdOrPhone);
    if (byId) return byId;
    return s.findUserByPhone(userIdOrPhone);
  });
  if (!user) return { ok: false, error: "Devotee profile not found." };

  if (updates.name && updates.name.trim()) {
    user.name = updates.name.trim();
  }
  if (updates.gotra !== undefined) {
    user.gotra = updates.gotra.trim();
  }
  if (updates.city !== undefined) {
    user.city = updates.city.trim();
  }
  if (updates.address !== undefined) {
    user.address = updates.address.trim();
  }
  if (updates.email !== undefined) {
    user.email = updates.email.trim();
  }
  if (updates.phone && updates.phone.trim() && updates.phone.trim() !== user.phone) {
    const newPhone = updates.phone.trim();
    const existing = await withFallback((s) => s.findUserByPhone(newPhone));
    if (existing && existing.id !== user.id) {
      return { ok: false, error: "Another devotee with this mobile number already exists." };
    }
    user.phone = newPhone;
  }
  if (updates.password && updates.password.trim()) {
    const pass = updates.password.trim();
    user.passwordHash = await hashPassword(pass);
    user.generatedPassword = pass;
  }

  await withFallback((s) => s.saveUser(user));
  return { ok: true, user };
}

/** Public receipt lookup: find one booking anywhere in the store by its
 * booking id (case-insensitive — ids are shown as SK… on the site). Raw read
 * (no demo seeding) so a random id can't write demo data. */
export async function findBookingById(
  bookingId: string
): Promise<{ user: UserProfile; booking: BookingRecord } | undefined> {
  const id = bookingId.trim().toUpperCase();
  if (!id) return undefined;
  const users = await withFallback((s) => s.getUsers());
  for (const user of users) {
    const booking = user.bookings.find((b) => b.bookingId === id);
    if (booking) return { user, booking };
  }
  return undefined;
}

/** Retrieve all devotee profiles including historical bookings. */
export async function getAllDevotees(): Promise<UserProfile[]> {
  return withFallback((s) => s.getUsers());
}

/** Create/refresh a devotee profile and append their booking. Reads and writes
 * ONLY that devotee's document, so concurrent bookings on different phones
 * (and duplicate submits on the same phone) never overwrite each other. */
export async function upsertUserBooking(
  input: BookingInput
): Promise<UserProfile> {
  const existing = await withFallback((s) => s.findUserByPhone(input.phone));
  const { user } = upsertInto(existing ? [existing] : [], input);
  await withFallback((s) => s.saveUser(user));
  return user;
}

/** Cancel a devotee's confirmed/rescheduled booking. */
export async function cancelUserBooking(
  phone: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const user = await withFallback((s) => s.findUserByPhone(phone));
  if (!user) return { ok: false };
  const { users, ok } = cancelIn([user], phone, bookingId);
  if (!ok) return { ok: false };
  await withFallback((s) => s.saveUser(users[0]));
  return { ok: true, user: users[0] };
}

/** Move a devotee's confirmed/rescheduled booking to a new muhurat. */
export async function rescheduleUserBooking(
  phone: string,
  bookingId: string,
  next: RescheduleInput
): Promise<{ ok: boolean; user?: UserProfile }> {
  const user = await withFallback((s) => s.findUserByPhone(phone));
  if (!user) return { ok: false };
  const { users, ok } = rescheduleIn([user], phone, bookingId, next);
  if (!ok) return { ok: false };
  await withFallback((s) => s.saveUser(users[0]));
  return { ok: true, user: users[0] };
}

/** Stamp a booking as reminded for a muhurat date (YYYY-MM-DD). Idempotent —
 * a second call for the same date is a no-op. Used by the daily reminder job. */
export async function markBookingReminded(
  phone: string,
  bookingId: string,
  dateISO: string
): Promise<{ ok: boolean }> {
  const user = await withFallback((s) => s.findUserByPhone(phone));
  if (!user) return { ok: false };
  const { users, ok } = remindIn([user], phone, bookingId, dateISO);
  if (!ok) return { ok: false };
  await withFallback((s) => s.saveUser(users[0]));
  return { ok: true };
}

/** Permanently remove a devotee profile (admin). */
export async function deleteUserRecord(
  id: string
): Promise<{ ok: boolean }> {
  const ok = await withFallback((s) => s.deleteUserById(id));
  return { ok };
}

/** Mark a confirmed/rescheduled booking as refunded (admin). */
export async function refundUserBooking(
  userId: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const user = await withFallback((s) => s.findUserById(userId));
  if (!user) return { ok: false };
  const { users, ok } = refundIn([user], userId, bookingId);
  if (!ok) return { ok: false };
  await withFallback((s) => s.saveUser(users[0]));
  return { ok: true, user: users[0] };
}

/** Record or update a devotee's rating & review on a booking (server-side). */
export async function saveBookingReview(
  bookingId: string,
  rating: number,
  reviewText?: string,
  phone?: string
): Promise<{ ok: boolean; booking?: BookingRecord; user?: UserProfile }> {
  let targetUser: UserProfile | undefined;
  if (phone) {
    targetUser = await withFallback((s) => s.findUserByPhone(phone));
  }
  if (!targetUser) {
    const found = await findBookingById(bookingId);
    if (found) targetUser = found.user;
  }

  if (!targetUser) return { ok: false };

  const { users, ok, booking, user } = reviewIn(
    [targetUser],
    bookingId,
    rating,
    reviewText,
    targetUser.phone
  );
  if (!ok || !booking) return { ok: false };

  await withFallback((s) => s.saveUser(users[0]));
  return { ok: true, booking, user };
}

// ===================== USER PASSWORD & CREDENTIALS =====================

/** Generate a readable random password for automatic devotee account creation. */
export function generateRandomPassword(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

/** Alias for findUserByPhone — used by forgot-password flow. */
export async function getUserByPhone(
  phone: string
): Promise<UserProfile | undefined> {
  return findUserByPhone(phone);
}

/** Update a user's password hash and optionally store plain/generated password for reference. */
export async function updateUserPassword(
  phone: string,
  passwordHash: string,
  plainPassword?: string
): Promise<void> {
  const user = await findUserByPhone(phone);
  if (!user) return;
  user.passwordHash = passwordHash;
  if (plainPassword) {
    user.generatedPassword = plainPassword;
  }
  // Backwards-compatibility with legacy readers that check email
  if (!user.email || user.email.startsWith("pw:") || user.email.includes("@templepujasewa.com")) {
    user.email = `pw:${passwordHash}`;
  }
  await withFallback((s) => s.saveUser(user));
}

/** Verify a devotee's password against their stored hash (supports both modern field & legacy prefix). */
export async function verifyUserPassword(
  phone: string,
  password: string
): Promise<boolean> {
  const user = await findUserByPhone(phone);
  if (!user) return false;

  // 1. Modern dedicated field
  if (user.passwordHash) {
    return verifyPassword(password, user.passwordHash);
  }

  // 2. Legacy email field prefix
  if (user.email && user.email.startsWith("pw:")) {
    const storedHash = user.email.slice(3); // remove 'pw:' prefix
    return verifyPassword(password, storedHash);
  }

  return false; // no password set
}

/** Check if a user has a password set. */
export async function userHasPassword(phone: string): Promise<boolean> {
  const user = await findUserByPhone(phone);
  return Boolean(user?.passwordHash || user?.email?.startsWith("pw:"));
}

// ===================== CUSTOMER MEDIA & VIDEOS =====================

/** Add a video recording to a devotee profile and/or associated booking (admin action). */
export async function addCustomerMediaRecord(
  userId: string,
  media: {
    title: string;
    url: string;
    description?: string;
    poojaTitle?: string;
    bookingId?: string;
  }
): Promise<{ ok: boolean; user?: UserProfile }> {
  const user = await withFallback(async (s) => {
    const byId = await s.findUserById(userId);
    if (byId) return byId;
    return s.findUserByPhone(userId);
  });
  if (!user) return { ok: false };
  const record: CustomerMediaRecord = {
    id: "vid_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    title: media.title.trim(),
    url: media.url.trim(),
    description: media.description?.trim(),
    poojaTitle: media.poojaTitle?.trim(),
    bookingId: media.bookingId?.trim(),
    uploadedAt: new Date().toISOString(),
  };
  user.videos = [...(user.videos || []), record];
  if (media.bookingId) {
    const b = user.bookings.find((x) => x.bookingId === media.bookingId);
    if (b) {
      b.videos = [...(b.videos || []), record];
    }
  }
  await withFallback((s) => s.saveUser(user));
  return { ok: true, user };
}

/** Delete a video recording from a devotee profile (admin action). */
export async function deleteCustomerMediaRecord(
  userId: string,
  mediaId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const user = await withFallback(async (s) => {
    const byId = await s.findUserById(userId);
    if (byId) return byId;
    return s.findUserByPhone(userId);
  });
  if (!user) return { ok: false };
  user.videos = (user.videos || []).filter((v) => v.id !== mediaId);
  for (const b of user.bookings) {
    if (b.videos) {
      b.videos = b.videos.filter((v) => v.id !== mediaId);
    }
  }
  await withFallback((s) => s.saveUser(user));
  return { ok: true, user };
}

// ===================== DEVOTEE ACTIVATION & SESSIONS =====================

import crypto from "crypto";
import type { DevoteeEntitlement } from "./storage";
import {
  saveOrder as mongoSaveOrder,
  findOrderByOrderId as mongoFindOrderByOrderId,
  findOrdersByPhone as mongoFindOrdersByPhone,
  recordWebhookEvent as mongoRecordWebhookEvent,
  recordCapiEvent as mongoRecordCapiEvent,
  findCapiEvent as mongoFindCapiEvent,
  type OrderDoc,
} from "./mongo-store";
import { getPhoneLookupVariants } from "./phone";

const inMemoryOrders = new Map<string, OrderDoc>();
const inMemoryWebhooks = new Set<string>();
const inMemoryCapiEvents = new Set<string>();

export async function saveOrder(order: OrderDoc): Promise<void> {
  inMemoryOrders.set(order.orderId, order);
  if (process.env.TTP_STORE === "memory" || !process.env.MONGODB_URI) return;
  try {
    await mongoSaveOrder(order);
  } catch {}
}

export async function findOrderByOrderId(orderId: string): Promise<OrderDoc | null> {
  if (process.env.TTP_STORE === "memory" || !process.env.MONGODB_URI) {
    return inMemoryOrders.get(orderId) || null;
  }
  try {
    const doc = await mongoFindOrderByOrderId(orderId);
    if (doc) return doc;
  } catch {}
  return inMemoryOrders.get(orderId) || null;
}

export async function findOrdersByPhone(phone: string): Promise<OrderDoc[]> {
  const variants = getPhoneLookupVariants(phone);
  if (process.env.TTP_STORE === "memory" || !process.env.MONGODB_URI) {
    return Array.from(inMemoryOrders.values()).filter((o) => variants.includes(o.phone));
  }
  try {
    const list = await mongoFindOrdersByPhone(phone);
    if (list && list.length > 0) return list;
  } catch {}
  return Array.from(inMemoryOrders.values()).filter((o) => variants.includes(o.phone));
}

export async function recordWebhookEvent(
  eventId: string,
  eventType: string
): Promise<boolean> {
  if (!eventId) return true;
  if (inMemoryWebhooks.has(eventId)) return false;
  inMemoryWebhooks.add(eventId);

  if (process.env.TTP_STORE === "memory" || !process.env.MONGODB_URI) {
    return true;
  }
  try {
    return await mongoRecordWebhookEvent(eventId, eventType);
  } catch {
    return true;
  }
}

export async function isCapiEventRecorded(eventId: string): Promise<boolean> {
  if (!eventId) return false;
  if (inMemoryCapiEvents.has(eventId)) return true;
  if (process.env.TTP_STORE === "memory" || !process.env.MONGODB_URI) {
    return false;
  }
  try {
    const found = await mongoFindCapiEvent(eventId);
    return Boolean(found);
  } catch {
    return false;
  }
}

export async function recordCapiEvent(
  eventId: string,
  eventName: string,
  status: "sent" | "failed" | "skipped" = "sent",
  metadata?: Record<string, unknown>
): Promise<boolean> {
  if (!eventId) return true;
  if (inMemoryCapiEvents.has(eventId)) return false;
  inMemoryCapiEvents.add(eventId);

  if (process.env.TTP_STORE === "memory" || !process.env.MONGODB_URI) {
    return true;
  }
  try {
    return await mongoRecordCapiEvent(eventId, eventName, status, metadata);
  } catch {
    return true;
  }
}


/** Check if devotee account is active. Pre-existing accounts default to active. */
export async function isAccountActivated(phone: string): Promise<boolean> {
  const user = await findUserByPhone(phone);
  if (!user) return false;
  if (typeof user.isActivated === "boolean") return user.isActivated;
  return Boolean(user.passwordHash || user.bookings?.length);
}

/** Activate a devotee account and optionally set permanent password */
export async function activateUserAccount(
  phone: string,
  newPassword?: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  const user = await findUserByPhone(phone);
  if (!user) {
    return { ok: false, error: "Account not found." };
  }

  user.isActivated = true;
  user.status = "active";
  user.activatedAt = new Date().toISOString();

  if (newPassword && newPassword.trim().length >= 6) {
    const hash = await hashPassword(newPassword.trim());
    user.passwordHash = hash;
    delete user.generatedPassword;
    if (!user.email || user.email.startsWith("pw:")) {
      user.email = `pw:${hash}`;
    }
  }

  await withFallback((s) => s.saveUser(user));
  return { ok: true, user };
}

/** Append an entitlement to a devotee profile */
export async function addDevoteeEntitlement(
  phone: string,
  entitlement: DevoteeEntitlement
): Promise<void> {
  const user = await findUserByPhone(phone);
  if (!user) return;
  const existing = user.entitlements || [];
  const exists = existing.some(
    (e) => e.id === entitlement.id || (e.orderId && e.orderId === entitlement.orderId)
  );
  if (!exists) {
    user.entitlements = [entitlement, ...existing];
    await withFallback((s) => s.saveUser(user));
  }
}

const DEVOTEE_SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  "thetemplepuja_devotee_secret_salt_2026";

/** Issue an HMAC-signed session token for a devotee */
export function createDevoteeSessionToken(phone: string): string {
  const ts = Date.now();
  const payload = `${phone.trim()}:${ts}`;
  const sig = crypto.createHmac("sha256", DEVOTEE_SESSION_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

/** Verify devotee session token and return verified phone number */
export function verifyDevoteeSessionToken(token: string): string | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf8");
    const [phone, tsStr, sig] = raw.split(":");
    if (!phone || !tsStr || !sig) return null;
    const ts = parseInt(tsStr, 10);
    // Session valid for 30 days
    if (isNaN(ts) || Date.now() - ts > 30 * 24 * 60 * 60 * 1000) return null;
    const expected = crypto.createHmac("sha256", DEVOTEE_SESSION_SECRET).update(`${phone}:${tsStr}`).digest("hex");
    if (expected !== sig) return null;
    return phone;
  } catch {
    return null;
  }
}

// ===================== MESSAGE THE CEO =====================

export interface CeoMessage {
  id: string;
  name: string;
  contact: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "responded";
}

const inMemoryCeoMessages: CeoMessage[] = [];

export async function saveCeoMessage(input: {
  name: string;
  contact: string;
  subject?: string;
  message: string;
}): Promise<CeoMessage> {
  const msg: CeoMessage = {
    id: `CEO-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
    name: input.name.trim(),
    contact: input.contact.trim(),
    subject: input.subject?.trim() || undefined,
    message: input.message.trim(),
    createdAt: new Date().toISOString(),
    status: "new",
  };

  inMemoryCeoMessages.unshift(msg);

  // If MongoDB is configured, persist to ceo_messages collection
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      await db.collection("ceo_messages").insertOne({ ...msg });
      await client.close();
    } catch (e) {
      console.warn("[server-store] Mongo saveCeoMessage fallback used:", e);
    }
  }

  // Also persist to local .data/ceo_messages.json
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
    const filePath = path.join(dir, "ceo_messages.json");
    fs.mkdirSync(dir, { recursive: true });
    let existing: CeoMessage[] = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
      } catch {
        existing = [];
      }
    }
    existing.unshift(msg);
    fs.writeFileSync(filePath, JSON.stringify(existing.slice(0, 500), null, 2), "utf8");
  } catch {
    // ignore filesystem errors
  }

  return msg;
}

export async function listCeoMessages(): Promise<CeoMessage[]> {
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      const docs = await db.collection("ceo_messages").find({}).sort({ createdAt: -1 }).limit(200).toArray();
      await client.close();
      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          id: d.id,
          name: d.name,
          contact: d.contact,
          subject: d.subject,
          message: d.message,
          createdAt: d.createdAt,
          status: d.status || "new",
        }));
      }
    } catch (e) {
      console.warn("[server-store] Mongo listCeoMessages fallback used:", e);
    }
  }

  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
    const filePath = path.join(dir, "ceo_messages.json");
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch {
    // fallback
  }
  return inMemoryCeoMessages;
}

export async function updateCeoMessageStatus(
  id: string,
  status: "new" | "read" | "responded"
): Promise<boolean> {
  const inMem = inMemoryCeoMessages.find((m) => m.id === id);
  if (inMem) {
    inMem.status = status;
  }

  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      await db.collection("ceo_messages").updateOne({ id }, { $set: { status } });
      await client.close();
    } catch (e) {
      console.warn("[server-store] Mongo updateCeoMessageStatus fallback used:", e);
    }
  }

  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
    const filePath = path.join(dir, "ceo_messages.json");
    if (fs.existsSync(filePath)) {
      const list: CeoMessage[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const target = list.find((m) => m.id === id);
      if (target) {
        target.status = status;
        fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf8");
        return true;
      }
    }
  } catch {
    // fallback
  }

  return Boolean(inMem);
}


