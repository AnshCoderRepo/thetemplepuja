// Client-side bridge to the backend API (app/api/*). The server is the source
// of truth for the catalog and admin credentials — this layer fetches it and
// falls back to the old localStorage overrides (then static defaults) only
// when the server is unreachable, so the site still renders standalone.
import {
  getCatalogCoupons,
  getCatalogEventSpecs,
  getCatalogFestivals,
  getCatalogPoojaDates,
  getCatalogPoojas,
  getCatalogTemples,
  getCatalogBlogs,
  getCatalogTestimonials,
  getCatalogFaqs,
  getCatalogSiteContent,
} from "./catalog";
import type { BlogPost } from "./blog-data";
import {
  withEventBookedSeats,
  type Coupon,
  type FestivalEvent,
  type Pooja,
  type PoojaDate,
  type Temple,
  type Testimonial,
  type UpcomingEventSpec,
  type Addon,
} from "./data";
import type { GalleryItem } from "./gallery-types";
import {
  cancelBooking,
  deleteUser,
  findUserByPhone,
  getUsers,
  markBookingRefunded,
  mergeUserFromServer,
  removeBooking,
  rescheduleBooking,
  upsertBooking,
  type BookingInput,
  type BookingRecord,
  type RescheduleInput,
  type UserProfile,
} from "./storage";
import { normalizePhone } from "./validation";
import type {
  ChatbotKnowledgeEntry,
  ChatbotSettings,
  PlatformSettings,
} from "./chatbot-types";

import type { FaqItem } from "./data";
import type { SiteContent } from "./cms-types";

export interface ResolvedCatalog {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
  blogs?: BlogPost[];
  testimonials?: Testimonial[];
  chatbotKnowledge?: ChatbotKnowledgeEntry[];
  chatbotSettings?: ChatbotSettings;
  platformSettings?: PlatformSettings;
  faqs?: FaqItem[];
  siteContent?: SiteContent;
}

const DEFAULT_CONFIG = { email: "admin@thetemplepuja.com", isDefault: true };

let catalogCache: Promise<ResolvedCatalog> | null = null;
let catalogVersion = 0;

const CATALOG_VERSION_KEY = "ttp_catalog_version_v1";

/** Monotonically increasing counter — bumped every time the catalog is
 * refreshed so useCatalog consumers can re-fetch without polling. */
export function getCatalogVersion(): number {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(CATALOG_VERSION_KEY);
      if (stored) {
        const num = Number(stored);
        if (!Number.isNaN(num) && num > catalogVersion) {
          catalogVersion = num;
        }
      }
    } catch {
      // storage unavailable — ignore
    }
  }
  return catalogVersion;
}

/** Notify all tabs/pages that the catalog has changed. Writes to localStorage
 * so other tabs pick it up via the "storage" event, and dispatches a custom
 * event so same-tab consumers update instantly — zero polling. */
export function bumpCatalogVersion(explicitVersion?: number): void {
  catalogVersion = explicitVersion && explicitVersion > catalogVersion ? explicitVersion : Date.now();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CATALOG_VERSION_KEY, String(catalogVersion));
    } catch {
      // storage unavailable — ignore
    }
    // Same-tab notification (storage event only fires cross-tab)
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent("catalog-updated", { detail: { version: catalogVersion } })
      );
    }
  }
}

export function clearCatalogMemoryCache(): void {
  catalogCache = null;
}

export function resetCatalogCache(): void {
  catalogCache = null;
  bumpCatalogVersion();
}

/** Fetches the resolved catalog once and shares the result across consumers. */
export function fetchCatalog(): Promise<ResolvedCatalog> {
  if (!catalogCache) {
    catalogCache = (async () => {
      try {
        const res = await fetch("/api/catalog");
        if (!res.ok) throw new Error("catalog request failed");
        const body = (await res.json()) as Partial<ResolvedCatalog>;
        if (
          body &&
          Array.isArray(body.poojas) &&
          Array.isArray(body.events) &&
          body.coupons
        ) {
          return {
            poojas: body.poojas,
            events: body.events,
            festivals: body.festivals ?? getCatalogFestivals(),
            coupons: body.coupons,
            poojaDates: body.poojaDates ?? [],
            temples: body.temples ?? getCatalogTemples(),
            blogs: body.blogs ?? getCatalogBlogs(),
            testimonials: body.testimonials ?? getCatalogTestimonials(),
            faqs: body.faqs ?? getCatalogFaqs(),
            siteContent: body.siteContent ?? getCatalogSiteContent(),
          };
        }
        throw new Error("unexpected catalog payload");
      } catch {
        // Server unreachable — use local overrides, then static defaults,
        // and count seats from the local profile cache so availability still
        // reflects confirmed bookings made on this device.
        return {
          poojas: getCatalogPoojas(),
          events: withEventBookedSeats(
            getCatalogEventSpecs(),
            getUsers().flatMap((u) => u.bookings)
          ),
          festivals: getCatalogFestivals(),
          coupons: getCatalogCoupons(),
          poojaDates: getCatalogPoojaDates(),
          temples: getCatalogTemples(),
          blogs: getCatalogBlogs(),
          testimonials: getCatalogTestimonials(),
          faqs: getCatalogFaqs(),
          siteContent: getCatalogSiteContent(),
        };
      }
    })();
  }
  return catalogCache;
}

/** Refetch the catalog from the server (used after an admin write). */
export async function refreshCatalog(): Promise<ResolvedCatalog> {
  resetCatalogCache();
  return fetchCatalog();
}

async function post(path: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok, status: res.status, error: data.error };
}

// ===================== CATALOG (admin) =====================

export type CatalogSection =
  | "poojas"
  | "events"
  | "festivals"
  | "coupons"
  | "poojaDates"
  | "temples"
  | "blogs"
  | "testimonials"
  | "faqs"
  | "siteContent";

export async function saveCatalogSection(
  section: CatalogSection,
  value: unknown,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const res = await post(`/api/catalog`, { [section]: value }, token);
  if (!res.ok) return res;
  await refreshCatalog();
  return { ok: true };
}

export async function resetCatalogSection(
  section: CatalogSection,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const res = await post(`/api/catalog`, { reset: [section] }, token);
  if (!res.ok) return res;
  await refreshCatalog();
  return { ok: true };
}

// ===================== DEVOTEE AUTH =====================

export async function devoteeLogin(
  phone: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return { ok: false, error: body.error ?? "Login failed." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error." };
  }
}

// ===================== ADMIN AUTH =====================

export async function adminLogin(
  email: string,
  password: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    token?: string;
    error?: string;
  };
  if (!res.ok) return { ok: false, error: body.error ?? "Login failed." };
  return { ok: true, token: body.token };
}

export async function adminConfig(): Promise<{
  email: string;
  isDefault: boolean;
}> {
  try {
    const res = await fetch("/api/admin/config", { cache: "no-store" });
    if (!res.ok) return DEFAULT_CONFIG;
    const body = (await res.json()) as { email?: string; isDefault?: boolean };
    return {
      email: body.email ?? DEFAULT_CONFIG.email,
      isDefault: body.isDefault ?? true,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function changeAdminCredentials(input: {
  currentPassword: string;
  email: string;
  newPassword: string;
  token: string;
}): Promise<{ ok: boolean; status?: number; error?: string }> {
  return post(
    "/api/admin/credentials",
    {
      currentPassword: input.currentPassword,
      email: input.email || undefined,
      newPassword: input.newPassword || undefined,
    },
    input.token
  );
}

export async function resetAdminCredentials(
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  return post("/api/admin/credentials", { reset: true }, token);
}

export async function adminLogout(token: string): Promise<void> {
  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    // ignore — client session is cleared regardless
  }
}

// ===================== RAZORPAY (real payments) =====================

export interface RazorpayOrderStart {
  configured: boolean;
  keyId?: string;
  orderId?: string;
  amount?: number; // paise
  subtotal?: number;
  discount?: number;
  currency?: string;
  receipt?: string;
  validatedAddons?: { id: string; name: string; price: number; quantity: number; emoji?: string }[];
  error?: string;
}

/** Ask the server to create a Razorpay order for a pooja and addons at the server-side
 * price (coupon-validated). Returns `{ configured: false }` in demo mode so
 * the checkout can fall back to its simulated payment. */
export async function createRazorpayOrderRemote(input: {
  poojaSlug: string;
  packageTier?: string;
  addons?: { id: string; quantity: number }[];
  couponCode: string | null;
  phone: string;
}): Promise<RazorpayOrderStart> {
  try {
    const res = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as Partial<RazorpayOrderStart>;
    if (res.ok && body.configured === false) return { configured: false };
    if (res.ok && body.configured) {
      return {
        configured: true,
        keyId: body.keyId,
        orderId: body.orderId,
        amount: body.amount,
        subtotal: body.subtotal,
        discount: body.discount,
        validatedAddons: body.validatedAddons,
        currency: body.currency,
        receipt: body.receipt,
      };
    }
    return { configured: false, error: body.error ?? "Order failed" };
  } catch {
    // Server unreachable — demo mode.
    return { configured: false };
  }
}

/** Add a video recording to a customer's profile (admin action). */
export async function addCustomerMediaRemote(
  userId: string,
  media: {
    title: string;
    url: string;
    description?: string;
    poojaTitle?: string;
    bookingId?: string;
  },
  token: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch("/api/admin/users/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "add", userId, media }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: UserProfile;
      error?: string;
    };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: false, error: body.error };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

/** Delete a video recording from a customer's profile (admin action). */
export async function deleteCustomerMediaRemote(
  userId: string,
  mediaId: string,
  token: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch("/api/admin/users/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: "delete", userId, mediaId }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: UserProfile;
      error?: string;
    };
    if (res.ok && (body.ok || body.user)) {
      if (body.user) mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: false, error: body.error };
  } catch {
    return { ok: false, error: "Network error" };
  }
}

// ===================== DEVOTEES & BOOKINGS =====================
// The server is the source of truth; the localStorage cache (lib/storage.ts)
// is written first so reads stay instant and the site still works offline.

/** All devotees for the admin dashboard. Returns null on a 401 (stale
 * session) and falls back to the local cache when the server is unreachable. */
export async function fetchAllUsers(
  token: string | null
): Promise<UserProfile[] | null> {
  try {
    const res = await fetch("/api/users", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (res.status === 401) return null;
    if (!res.ok) throw new Error("users request failed");
    const body = (await res.json()) as { users?: UserProfile[] };
    if (Array.isArray(body.users)) {
      for (const u of body.users) {
        if (Array.isArray(u.bookings)) {
          const seen = new Set<string>();
          u.bookings = u.bookings.filter((b) => {
            if (!b || !b.bookingId) return true;
            if (seen.has(b.bookingId)) return false;
            seen.add(b.bookingId);
            return true;
          });
        }
      }
      return body.users;
    }
    throw new Error("unexpected users payload");
  } catch {
    return getUsers();
  }
}

/** Receipt lookup guarded by the devotee's mobile number: the booking id
 * (shown on the confirmation screen) must be matched with the phone used at
 * booking. Any mismatch returns null. Falls back to the local cache when
 * offline, still requiring the phone to match the holder. */
export async function fetchBooking(
  bookingId: string,
  phone: string
): Promise<{
  booking?: BookingRecord;
  holder?: { name: string; phone: string; gotra: string; city: string };
} | null> {
  const id = bookingId.trim().toUpperCase();
  const p = phone.trim();
  if (!id || !p) return null;
  try {
    const res = await fetch(
      `/api/bookings/${encodeURIComponent(id)}?phone=${encodeURIComponent(p)}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("lookup failed");
    const body = (await res.json()) as {
      booking?: BookingRecord;
      holder?: { name: string; phone: string; gotra: string; city: string };
    };
    if (body.booking) return body;
    return null;
  } catch {
    for (const u of getUsers()) {
      if (normalizePhone(u.phone) !== normalizePhone(p)) continue;
      const booking = u.bookings.find((b) => b.bookingId === id);
      if (booking) {
        return {
          booking,
          holder: { name: u.name, phone: u.phone, gotra: u.gotra, city: u.city },
        };
      }
    }
    return null;
  }
}

/** Look up one devotee by phone (public). Falls back to the local cache. */
export async function fetchUserByPhone(
  phone: string
): Promise<UserProfile | undefined> {
  try {
    const res = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    });
    if (res.status === 404) return undefined;
    if (!res.ok) throw new Error("lookup failed");
    const body = (await res.json()) as { user?: UserProfile | null };
    if (body.user) return body.user;
    return undefined;
  } catch {
    return findUserByPhone(phone);
  }
}

/** Pull a phone's profile from the server into the local cache — used so
 * coupon eligibility (first-booking rules) sees cross-device truth. */
export async function syncUserFromServer(phone: string): Promise<void> {
  try {
    const res = await fetch(`/api/users?phone=${encodeURIComponent(phone)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const body = (await res.json()) as { user?: UserProfile };
    if (body.user) mergeUserFromServer(body.user);
  } catch {
    // offline — local cache is fine
  }
}

/** Persist a devotee's profile + booking after payment. The server is the
 * authority: on success the returned profile is merged into the local cache;
 * if the server REJECTS the booking (e.g. a Razorpay signature or amount
 * check failed) the optimistic local copy is removed so the app never shows a
 * "confirmed" booking the admin never saw. Only when the server is
 * unreachable does it fall back to saving locally (offline). Never throws. */
export async function submitBooking(
  input: BookingInput & {
    payment?: {
      method?: "upi_qr" | "razorpay" | "simulated";
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      upiTransactionId?: string;
      upiId?: string;
    };
  }
): Promise<{
  ok: boolean;
  status?: number;
  user?: UserProfile;
  credentials?: { username: string; password?: string };
}> {
  try {
    const res = await fetch("/api/users/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      user?: UserProfile;
      credentials?: { username: string; password?: string };
    };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user, credentials: body.credentials };
    }
    // Server reachable but rejected — don't keep a phantom booking locally if it was being confirmed.
    if (input.booking.status === "confirmed") {
      removeBooking(input.phone, input.booking.bookingId);
    }
    return { ok: false, status: res.status };
  } catch {
    const localUser = upsertBooking(input); // offline — saved locally
    return { ok: true, user: localUser };
  }
}

/** Cancel a booking from the profile page. Local first, then server. */
export async function cancelBookingRemote(
  phone: string,
  bookingId: string
): Promise<{ ok: boolean; user?: UserProfile }> {
  const local = cancelBooking(phone, bookingId);
  try {
    const res = await fetch("/api/users/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, bookingId }),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: local.ok, user: local.user };
  } catch {
    return local;
  }
}

/** Move a booking to a new muhurat from the profile page. Local first, then
 * server (authoritative when reachable). */
export async function rescheduleBookingRemote(
  phone: string,
  bookingId: string,
  next: RescheduleInput
): Promise<{ ok: boolean; user?: UserProfile }> {
  const local = rescheduleBooking(phone, bookingId, next);
  try {
    const res = await fetch("/api/users/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, bookingId, ...next }),
    });
    const body = (await res.json().catch(() => ({}))) as { user?: UserProfile };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: local.ok, user: local.user };
  } catch {
    return local;
  }
}

/** Delete a devotee profile (admin). The server is authoritative when
 * reachable; the local cache is kept in sync as a fallback when offline. */
export async function deleteUserRemote(
  id: string,
  token: string
): Promise<{ ok: boolean; status?: number }> {
  const local = deleteUser(id);
  try {
    const res = await post("/api/admin/users/delete", { id }, token);
    if (res.status === 401) return { ok: false, status: 401 };
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: local.ok }; // offline — removed locally
  }
}

/** Reset a devotee's password (admin action). */
export async function resetDevoteePassword(
  phone: string,
  newPassword: string,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  return post(
    "/api/admin/users/reset-password",
    { phone, newPassword },
    token
  );
}

/** Mark a booking refunded (admin). The server is authoritative when
 * reachable; the local cache is kept in sync as a fallback when offline. */
export async function refundBookingRemote(
  userId: string,
  bookingId: string,
  token: string
): Promise<{ ok: boolean; status?: number }> {
  const local = markBookingRefunded(userId, bookingId);
  try {
    const res = await post(
      "/api/admin/bookings/refund",
      { userId, bookingId },
      token
    );
    if (res.status === 401) return { ok: false, status: 401 };
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: local.ok }; // offline — applied locally
  }
}

/** Update devotee profile details (name, phone, email, gotra, city, password). Admin action. */
export async function updateCustomerProfileRemote(
  userId: string,
  updates: {
    name?: string;
    phone?: string;
    email?: string;
    gotra?: string;
    city?: string;
    password?: string;
  },
  token: string
): Promise<{ ok: boolean; user?: UserProfile; error?: string }> {
  try {
    const res = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...updates }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      user?: UserProfile;
      error?: string;
    };
    if (res.ok && body.user) {
      mergeUserFromServer(body.user);
      return { ok: true, user: body.user };
    }
    return { ok: false, error: body.error || "Failed to update devotee profile." };
  } catch {
    return { ok: false, error: "Network error while saving changes." };
  }
}

// ===================== CHATBOT & PLATFORM APIS =====================

export async function fetchChatbotConfigRemote(token?: string): Promise<{
  knowledge: ChatbotKnowledgeEntry[];
  settings: ChatbotSettings;
  platformSettings?: PlatformSettings;
  status?: number;
}> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/admin/chatbot", {
      headers,
      cache: "no-store",
    });
    if (res.status === 401) {
      return { knowledge: [], settings: {} as ChatbotSettings, status: 401 };
    }
    const data = await res.json();
    return {
      knowledge: data.knowledge || [],
      settings: data.settings || {},
      platformSettings: data.platformSettings,
      status: res.status,
    };
  } catch {
    return { knowledge: [], settings: {} as ChatbotSettings };
  }
}

export async function saveChatbotKnowledgeRemote(
  knowledge: ChatbotKnowledgeEntry[],
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch("/api/admin/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ knowledge }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, status: 401 };
    if (!res.ok) return { ok: false, error: body.error || "Failed to save knowledge." };
    resetCatalogCache();
    return { ok: true };
  } catch {
    return { ok: false, error: "Network failure while saving knowledge." };
  }
}

export async function saveChatbotSettingsRemote(
  settings: ChatbotSettings,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch("/api/admin/chatbot", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, status: 401 };
    if (!res.ok) return { ok: false, error: body.error || "Failed to update settings." };
    resetCatalogCache();
    return { ok: true };
  } catch {
    return { ok: false, error: "Network failure while saving settings." };
  }
}

export async function savePlatformSettingsRemote(
  platformSettings: PlatformSettings,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const res = await fetch("/api/admin/chatbot", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ platformSettings }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) return { ok: false, status: 401 };
    if (!res.ok) return { ok: false, error: body.error || "Failed to update platform settings." };
    resetCatalogCache();
    return { ok: true };
  } catch {
    return { ok: false, error: "Network failure while saving platform settings." };
  }
}

export async function sendChatMessage(
  messages: Array<{ from: "bot" | "user"; text: string }>,
  phone?: string,
  locale?: string
): Promise<{ reply: string; ok: boolean; requiresPhone?: boolean; bookingFound?: boolean }> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, phone, locale }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        reply: data.reply || "Namaste. I am temporarily unavailable. Please connect via WhatsApp support.",
        ok: false,
      };
    }
    return {
      reply: data.reply,
      ok: true,
      requiresPhone: data.requiresPhone,
      bookingFound: data.bookingFound,
    };
  } catch {
    return {
      reply: "Namaste! I am having difficulty connecting. Please reach our temple coordinators on WhatsApp for instant assistance.",
      ok: false,
    };
  }
}

// ===================== CEO FEEDBACK MESSAGES =====================

export interface CeoMessageRemote {
  id: string;
  name: string;
  contact: string;
  subject?: string;
  message: string;
  createdAt: string;
  status: "new" | "read" | "responded";
}

export async function fetchCeoMessagesRemote(token?: string): Promise<{
  messages: CeoMessageRemote[];
  status?: number;
}> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/admin/ceo-messages", {
      headers,
      cache: "no-store",
    });
    if (res.status === 401) {
      return { messages: [], status: 401 };
    }
    const data = await res.json();
    return {
      messages: data.messages || [],
      status: res.status,
    };
  } catch {
    return { messages: [] };
  }
}

export async function updateCeoMessageStatusRemote(
  id: string,
  status: "new" | "read" | "responded",
  token?: string
): Promise<{ ok: boolean; status?: number }> {
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch("/api/admin/ceo-messages", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ id, status }),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}

// ===================== APPROVAL-BASED REFUNDS =====================

import type { RefundRequest, AdminRole } from "./refund-types";

export interface RefundRequestsResponse {
  ok: boolean;
  requests: RefundRequest[];
  currentAdminEmail?: string;
  role?: AdminRole;
  error?: string;
  status?: number;
}

export async function fetchRefundRequestsRemote(
  token?: string,
  statusFilter?: string,
  search?: string
): Promise<RefundRequestsResponse> {
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);

    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`/api/admin/refunds${qs}`, {
      headers,
      cache: "no-store",
    });

    if (res.status === 401) {
      return { ok: false, requests: [], status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      requests: data.requests || [],
      currentAdminEmail: data.currentAdminEmail,
      role: data.role,
      status: res.status,
    };
  } catch (err) {
    return {
      ok: false,
      requests: [],
      error: err instanceof Error ? err.message : "Failed to load refund requests",
    };
  }
}

export async function submitRefundRequestRemote(
  token: string,
  input: {
    bookingId: string;
    orderId?: string;
    requestedAmount: number;
    reason: string;
  }
): Promise<{ ok: boolean; request?: RefundRequest; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/admin/refunds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to submit refund request", status: res.status };
    }
    return { ok: true, request: data.request, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error submitting refund request" };
  }
}

export async function approveRefundRemote(
  token: string,
  requestId: string
): Promise<{ ok: boolean; request?: RefundRequest; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/admin/refunds/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to approve refund", status: res.status };
    }
    return { ok: true, request: data.request, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error approving refund" };
  }
}

export async function rejectRefundRemote(
  token: string,
  requestId: string,
  rejectionReason: string
): Promise<{ ok: boolean; request?: RefundRequest; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/admin/refunds/reject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId, rejectionReason }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to reject refund", status: res.status };
    }
    return { ok: true, request: data.request, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error rejecting refund" };
  }
}

export async function executeRefundRemote(
  token: string,
  requestId: string,
  manualSettlement?: { settlementReference?: string; executionNotes?: string }
): Promise<{ ok: boolean; request?: RefundRequest; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/admin/refunds/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ requestId, manualSettlement }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to execute refund", status: res.status };
    }
    return { ok: true, request: data.request, status: res.status };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error executing refund" };
  }
}

export async function exportDevoteesExcelRemote(
  token: string,
  filters: {
    puja?: string;
    status?: string;
    search?: string;
    title?: string;
  } = {}
): Promise<{ ok: boolean; error?: string; distinctCount?: number }> {
  try {
    const params = new URLSearchParams();
    if (filters.puja) params.set("puja", filters.puja);
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.title) params.set("title", filters.title);

    const res = await fetch(`/api/admin/devotees/export?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { ok: false, error: errJson.error || "Failed to export devotees list" };
    }

    const countHeader = res.headers.get("X-Distinct-Count");
    const distinctCount = countHeader ? parseInt(countHeader, 10) : undefined;

    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    let filename = `devotees-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) filename = match[1];
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true, distinctCount };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error generating Excel export",
    };
  }
}

// ===================== ADD-ONS API CLIENT =====================

export interface AvailablePoojaOption {
  id: string;
  slug: string;
  title: string;
  hindiTitle?: string;
  active: boolean;
  emoji?: string;
}

export interface EnrichedAddon extends Addon {
  assignedPoojaCount?: number;
  assignedPoojaSlugs?: string[];
  assignedPoojaTitles?: string[];
}

export async function fetchAdminAddons(token: string): Promise<{
  ok: boolean;
  addons: EnrichedAddon[];
  totalPoojas?: number;
  availablePoojas?: AvailablePoojaOption[];
  error?: string;
  status?: number;
}> {
  try {
    const res = await fetch("/api/admin/addons", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (res.status === 401) {
      return { ok: false, addons: [], status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, addons: [], error: data.error || "Failed to fetch add-ons" };
    }
    return {
      ok: true,
      addons: data.addons || [],
      totalPoojas: typeof data.totalPoojas === "number" ? data.totalPoojas : undefined,
      availablePoojas: data.availablePoojas || [],
    };
  } catch (err) {
    return { ok: false, addons: [], error: "Network error fetching add-ons" };
  }
}

export async function saveAdminAddon(
  addon: Partial<Addon & { assignedPoojaSlugs?: string[] }>,
  token: string
): Promise<{ ok: boolean; addon?: Addon; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/admin/addons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(addon),
    });
    if (res.status === 401) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to save add-on" };
    }
    return { ok: true, addon: data.addon };
  } catch (err) {
    return { ok: false, error: "Network error saving add-on" };
  }
}

export async function deleteAdminAddon(
  id: string,
  token: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const res = await fetch(`/api/admin/addons?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to delete add-on" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Network error deleting add-on" };
  }
}

export async function fetchPujaAddons(poojaSlug?: string): Promise<{
  ok: boolean;
  addons: Addon[];
  error?: string;
}> {
  try {
    const url = poojaSlug
      ? `/api/addons?poojaSlug=${encodeURIComponent(poojaSlug)}`
      : "/api/addons";
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, addons: [], error: data.error || "Failed to fetch addons" };
    }
    return { ok: true, addons: data.addons || [] };
  } catch (err) {
    return { ok: false, addons: [], error: "Network error fetching addons" };
  }
}

// ===================== GALLERY API =====================

export async function fetchPublicGallery(options?: {
  homepage?: boolean;
  mediaType?: "photo" | "video";
  category?: string;
}): Promise<{
  ok: boolean;
  items: GalleryItem[];
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.homepage) params.set("homepage", "true");
    if (options?.mediaType) params.set("mediaType", options.mediaType);
    if (options?.category && options.category !== "all" && options.category !== "All") {
      params.set("category", options.category);
    }

    const query = params.toString();
    const url = `/api/gallery${query ? `?${query}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, items: [], error: data.error || "Failed to fetch gallery items" };
    }
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return { ok: true, items };
  } catch (err) {
    return { ok: false, items: [], error: "Network error fetching gallery" };
  }
}

export async function fetchAdminGallery(token: string): Promise<{
  ok: boolean;
  items: GalleryItem[];
  error?: string;
  status?: number;
}> {
  try {
    const res = await fetch("/api/admin/gallery", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (res.status === 401) {
      return { ok: false, items: [], status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, items: [], error: data.error || "Failed to fetch gallery items" };
    }
    return { ok: true, items: data.items || [] };
  } catch (err) {
    return { ok: false, items: [], error: "Network error fetching gallery" };
  }
}

export async function saveAdminGalleryItem(
  item: Partial<GalleryItem>,
  token: string
): Promise<{ ok: boolean; item?: GalleryItem; error?: string; status?: number }> {
  try {
    const res = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });
    if (res.status === 401) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to save gallery item" };
    }
    return { ok: true, item: data.item };
  } catch (err) {
    return { ok: false, error: "Network error saving gallery item" };
  }
}

export async function deleteAdminGalleryItem(
  id: string,
  token: string
): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.status === 401) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Failed to delete gallery item" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Network error deleting gallery item" };
  }
}
