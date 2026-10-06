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
  type Coupon,
  type FestivalEvent,
  type Pooja,
  type PoojaDate,
  type Temple,
  type UpcomingEventSpec,
} from "./data";
import { createMemoryStore, type PersistenceStore } from "./persistence";
import { mongoStore } from "./mongo-store";
import { createJsonStore } from "./json-store";
import { DEMO_USERS } from "./demo-users";
import {
  cancelIn,
  refundIn,
  remindIn,
  rescheduleIn,
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
async function withFallback<T>(
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
  | "temples";

/** Overrides merged over the static defaults — what consumers should render. */
export async function getResolvedCatalog(): Promise<{
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
}> {
  const o = await withFallback((s) => s.getCatalogOverrides());
  return {
    poojas: o.poojas ?? staticPoojas,
    events: o.events ?? staticEvents,
    festivals: o.festivals ?? staticFestivals,
    coupons: o.coupons ?? staticCoupons,
    poojaDates: o.poojaDates ?? defaultPoojaDates,
    temples: o.temples ?? staticTemples,
  };
}

export async function saveCatalogOverrides(overrides: {
  poojas?: Pooja[];
  events?: UpcomingEventSpec[];
  festivals?: FestivalEvent[];
  coupons?: Record<string, Coupon>;
  poojaDates?: PoojaDate[];
  temples?: Temple[];
}): Promise<void> {
  await withFallback((s) => s.saveCatalogOverrides(overrides));
}

export async function clearCatalogOverrides(
  sections: CatalogOverrideSection[]
): Promise<void> {
  await withFallback((s) => s.clearCatalogOverrides(sections));
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
  if (email.trim().toLowerCase() !== creds.email) return false;
  const ok = await verifyPassword(password, creds.passwordHash);
  // Migrate a legacy djb2 hash to bcrypt on first successful login.
  if (ok && isLegacyHash(creds.passwordHash)) {
    await saveAdminCreds(creds.email, await hashPassword(password));
  }
  return ok;
}

export async function adminCredsAreDefault(): Promise<boolean> {
  return verifyAdminLogin(getDefaultAdminEmail(), getDefaultAdminPassword());
}

// ===================== SESSIONS =====================

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSessionToken(): Promise<string> {
  const token = "tok_" + randomBytes(24).toString("hex");
  const sessions = await withFallback((s) => s.getSessions());
  sessions[token] = Date.now() + SESSION_TTL_MS;
  await withFallback((s) => s.saveSessions(sessions));
  return token;
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
    const testUser = DEMO_USERS.find((u) => u.phone === "7070410031");
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

