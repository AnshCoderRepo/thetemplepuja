// Server-side logic for the admin catalog, credentials and sessions. All
// persistence goes through a PersistenceStore — MongoDB Atlas by default,
// with an in-memory store as the fallback (tests, or when Mongo is
// unreachable). Never import this from a client component.
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  coupons as staticCoupons,
  poojas as staticPoojas,
  upcomingEventSpecs as staticEvents,
  type Coupon,
  type Pooja,
  type UpcomingEventSpec,
} from "./data";
import { createMemoryStore, type PersistenceStore } from "./persistence";
import { mongoStore } from "./mongo-store";
import { createJsonStore } from "./json-store";
import { DEMO_USERS } from "./demo-users";
import {
  cancelIn,
  deleteFrom,
  refundIn,
  upsertInto,
  type BookingInput,
  type UserProfile,
} from "./storage";

export const DEFAULT_ADMIN_EMAIL = "admin@thetemplepuja.com";
export const DEFAULT_ADMIN_PASSWORD = "admin123";

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

export type CatalogOverrideSection = "poojas" | "events" | "coupons";

/** Overrides merged over the static defaults — what consumers should render. */
export async function getResolvedCatalog(): Promise<{
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  coupons: Record<string, Coupon>;
}> {
  const o = await withFallback((s) => s.getCatalogOverrides());
  return {
    poojas: o.poojas ?? staticPoojas,
    events: o.events ?? staticEvents,
    coupons: o.coupons ?? staticCoupons,
  };
}

export async function saveCatalogOverrides(overrides: {
  poojas?: Pooja[];
  events?: UpcomingEventSpec[];
  coupons?: Record<string, Coupon>;
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
  return {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
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
  return verifyAdminLogin(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
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
    await withFallback((s) => s.saveUsers(DEMO_USERS));
    return DEMO_USERS;
  }
  return users;
}

/** Raw lookup (no seeding) — used by the booking flow so a real booking never
 * gets merged into the demo data. */
export async function findUserByPhone(
  phone: string
): Promise<UserProfile | undefined> {
  const users = await withFallback((s) => s.getUsers());
  return users.find((u) => u.phone === phone.trim());
}

/** Create/refresh a devotee profile and append their booking. */
export async function upsertUserBooking(
  input: BookingInput
): Promise<UserProfile> {
  const users = await withFallback((s) => s.getUsers());
  const { users: next, user } = upsertInto(users, input);
  await withFallback((s) => s.saveUsers(next));
  return user;
}

/** Cancel a devotee's confirmed booking. */
export async function cancelUserBooking(
  phone: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const users = await withFallback((s) => s.getUsers());
  const { users: next, ok, user } = cancelIn(users, phone, bookingId);
  if (ok) await withFallback((s) => s.saveUsers(next));
  return { ok, user };
}

/** Permanently remove a devotee profile (admin). */
export async function deleteUserRecord(
  id: string
): Promise<{ ok: boolean }> {
  const users = await withFallback((s) => s.getUsers());
  const { users: next, ok } = deleteFrom(users, id);
  if (ok) await withFallback((s) => s.saveUsers(next));
  return { ok };
}

/** Mark a confirmed/rescheduled booking as refunded (admin). */
export async function refundUserBooking(
  userId: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const users = await withFallback((s) => s.getUsers());
  const { users: next, ok, user } = refundIn(users, userId, bookingId);
  if (ok) await withFallback((s) => s.saveUsers(next));
  return { ok, user };
}
