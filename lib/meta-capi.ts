import crypto from "crypto";
import { isCapiEventRecorded, recordCapiEvent } from "@/lib/server-store";
import { SITE_URL } from "@/lib/seo";

export interface CapiUserData {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  clientIp?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface CapiCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  order_id?: string;
  num_items?: number;
  [key: string]: unknown;
}

export interface CapiEventInput {
  eventName:
    | "Purchase"
    | "InitiateCheckout"
    | "AddPaymentInfo"
    | "ViewContent"
    | "Search"
    | "Lead"
    | "Contact"
    | "CompleteRegistration"
    | string;
  eventId: string;
  eventTime?: number; // Unix timestamp in seconds
  eventSourceUrl?: string;
  user?: CapiUserData;
  customData?: CapiCustomData;
}

export interface CapiSendResult {
  success: boolean;
  eventId: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
  eventsReceived?: number;
  fbtraceId?: string;
}

/**
 * Returns configuration values for Meta Conversions API.
 * Never exposes secrets to the client.
 */
export function getMetaCapiConfig() {
  const pixelId =
    (process.env.META_PIXEL_ID ||
      process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID ||
      "1528984618994788").trim();

  const accessToken =
    (process.env.META_ACCESS_TOKEN ||
      process.env.META_CAPI_ACCESS_TOKEN ||
      process.env.FB_ACCESS_TOKEN ||
      "").trim();

  const apiVersion =
    (process.env.META_GRAPH_API_VERSION || "v20.0").trim().replace(/^v?/, "v");

  const testEventCode = (process.env.META_TEST_EVENT_CODE || "").trim();

  return {
    pixelId,
    accessToken,
    apiVersion,
    testEventCode: testEventCode || undefined,
    isConfigured: Boolean(pixelId && accessToken),
  };
}

/**
 * SHA-256 hash a normalized string to lowercase hex format.
 */
export function sha256Hash(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Normalize and SHA-256 hash an email address according to Meta specification.
 */
export function hashEmail(email?: string): string | undefined {
  if (!email || typeof email !== "string") return undefined;
  const cleaned = email.trim().toLowerCase();
  if (!cleaned || !cleaned.includes("@")) return undefined;
  // Ignore dummy/fallback internal domain emails
  if (cleaned.endsWith("@templepujasewa.com")) return undefined;
  return sha256Hash(cleaned);
}

/**
 * Normalize and SHA-256 hash an Indian / international mobile number according to Meta specification.
 * Strips non-digits; prepends country code 91 if a 10-digit national number is given.
 */
export function hashPhone(phone?: string): string | undefined {
  if (!phone || typeof phone !== "string") return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  // If 10 digits, prepend India country code 91
  if (digits.length === 10) {
    digits = "91" + digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = "91" + digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    // Already in correct international format
  }

  return sha256Hash(digits);
}

/**
 * Normalize and SHA-256 hash a devotee's first name according to Meta specification.
 */
export function hashFirstName(name?: string): string | undefined {
  if (!name || typeof name !== "string") return undefined;
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return undefined;
  // Take the first name token
  const firstName = trimmed.split(/[\s,]+/)[0];
  if (!firstName) return undefined;
  return sha256Hash(firstName);
}

/**
 * Normalize and SHA-256 hash a city name according to Meta specification.
 */
export function hashCity(city?: string): string | undefined {
  if (!city || typeof city !== "string") return undefined;
  const cleaned = city.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return undefined;
  return sha256Hash(cleaned);
}

/**
 * Extract _fbp and _fbc cookies from raw cookie header.
 */
export function parseMetaCookies(cookieHeader?: string | null): {
  fbp?: string;
  fbc?: string;
} {
  if (!cookieHeader) return {};
  const cookies = cookieHeader.split(";").reduce((acc, part) => {
    const [key, val] = part.trim().split("=");
    if (key && val) acc[key] = decodeURIComponent(val);
    return acc;
  }, {} as Record<string, string>);

  return {
    fbp: cookies["_fbp"],
    fbc: cookies["_fbc"],
  };
}

/**
 * Extract client IP address from standard request headers.
 */
export function extractClientIp(req?: {
  headers?: { get?: (k: string) => string | null } | Headers | Record<string, string | string[]>;
}): string | undefined {
  if (!req?.headers) return undefined;

  const getHeader = (name: string): string | undefined => {
    if (typeof (req.headers as { get?: (k: string) => string | null }).get === "function") {
      return (req.headers as { get: (k: string) => string | null }).get(name) || undefined;
    }
    const headersObj = req.headers as Record<string, string | string[]>;
    const val = headersObj[name.toLowerCase()] || headersObj[name];
    if (Array.isArray(val)) return val[0];
    return typeof val === "string" ? val : undefined;
  };

  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = getHeader("x-real-ip");
  if (realIp) return realIp.trim();

  return undefined;
}

/**
 * Extract User Agent from request headers.
 */
export function extractUserAgent(req?: {
  headers?: { get?: (k: string) => string | null } | Headers | Record<string, string | string[]>;
}): string | undefined {
  if (!req?.headers) return undefined;

  if (typeof (req.headers as { get?: (k: string) => string | null }).get === "function") {
    return (req.headers as { get: (k: string) => string | null }).get("user-agent") || undefined;
  }
  const headersObj = req.headers as Record<string, string | string[]>;
  const val = headersObj["user-agent"] || headersObj["User-Agent"];
  return typeof val === "string" ? val : undefined;
}

/**
 * Core server-side Conversions API event dispatcher.
 * Validates payloads, hashes PII, guarantees idempotency, and never throws or interrupts payment logic.
 */
export async function sendCapiEvent(input: CapiEventInput): Promise<CapiSendResult> {
  const { eventName, eventId, eventTime, eventSourceUrl, user, customData } = input;

  if (!eventId) {
    return {
      success: false,
      eventId: "",
      error: "eventId is required for Meta Conversions API tracking and deduplication.",
    };
  }

  // 1. Idempotency Check — Never send the exact same eventId twice
  const alreadySent = await isCapiEventRecorded(eventId);
  if (alreadySent) {
    return {
      success: true,
      eventId,
      skipped: true,
      reason: "already_processed_in_store",
    };
  }

  const config = getMetaCapiConfig();
  if (!config.isConfigured) {
    // Missing credentials — safely record skipped state without crashing
    await recordCapiEvent(eventId, eventName, "skipped", {
      reason: "META_ACCESS_TOKEN_not_configured",
    });
    return {
      success: true,
      eventId,
      skipped: true,
      reason: "credentials_not_configured",
    };
  }

  // 2. Build User Data with Permitted Hashed Matching Fields
  const userData: Record<string, unknown> = {};

  const hashedEm = hashEmail(user?.email);
  if (hashedEm) userData.em = [hashedEm];

  const hashedPh = hashPhone(user?.phone);
  if (hashedPh) userData.ph = [hashedPh];

  const hashedFn = hashFirstName(user?.name);
  if (hashedFn) userData.fn = [hashedFn];

  const hashedCt = hashCity(user?.city);
  if (hashedCt) userData.ct = [hashedCt];

  if (user?.clientIp) userData.client_ip_address = user.clientIp;
  if (user?.clientUserAgent) userData.client_user_agent = user.clientUserAgent;
  if (user?.fbp) userData.fbp = user.fbp;
  if (user?.fbc) userData.fbc = user.fbc;

  // 3. Assemble Meta Graph API CAPI Payload
  const eventPayload = {
    event_name: eventName,
    event_time: eventTime || Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl || `${SITE_URL}/book`,
    action_source: "website",
    user_data: userData,
    custom_data: customData ? { ...customData } : undefined,
  };

  const requestBody: Record<string, unknown> = {
    data: [eventPayload],
  };

  if (config.testEventCode) {
    requestBody.test_event_code = config.testEventCode;
  }

  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(5000),
    });

    const resJson = await res.json().catch(() => ({}));

    if (res.ok) {
      await recordCapiEvent(eventId, eventName, "sent", {
        eventsReceived: resJson.events_received,
        fbtraceId: resJson.fbtrace_id,
      });

      return {
        success: true,
        eventId,
        eventsReceived: resJson.events_received,
        fbtraceId: resJson.fbtrace_id,
      };
    } else {
      const errorMsg =
        resJson?.error?.message ||
        `Meta Graph API HTTP ${res.status}: ${res.statusText}`;

      // Log non-sensitive warning
      console.warn(`[meta-capi] Event ${eventName} (${eventId}) error: ${errorMsg}`);

      await recordCapiEvent(eventId, eventName, "failed", {
        status: res.status,
        error: errorMsg,
      });

      return {
        success: false,
        eventId,
        error: errorMsg,
      };
    }
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.message?.includes("timed out");
    const failureMsg = isTimeout ? "Graph API request timed out (5s)" : (err?.message || "Network error");

    console.warn(`[meta-capi] Delivery attempt failed for ${eventName} (${eventId}): ${failureMsg}`);

    await recordCapiEvent(eventId, eventName, "failed", {
      error: failureMsg,
    });

    return {
      success: false,
      eventId,
      error: failureMsg,
    };
  }
}

/**
 * Authoritative Server-Side Purchase Conversion Tracker.
 * Triggered exclusively when a payment is verified and booking confirmed.
 */
export async function sendCapiPurchaseEvent(params: {
  booking: {
    bookingId?: string;
    orderId?: string;
    paymentId?: string;
    poojaSlug?: string;
    poojaTitle?: string;
    amount?: number;
    currency?: string;
  };
  user?: {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
  };
  req?: any;
}): Promise<CapiSendResult> {
  const { booking, user, req } = params;

  const stableId = booking.bookingId || booking.orderId || booking.paymentId || `ord_${Date.now()}`;
  const eventId = `pur_${stableId}`;

  // Extract request metadata if available
  let clientIp: string | undefined;
  let clientUserAgent: string | undefined;
  let fbp: string | undefined;
  let fbc: string | undefined;

  if (req) {
    clientIp = extractClientIp(req);
    clientUserAgent = extractUserAgent(req);
    const cookieHeader =
      typeof req.headers?.get === "function"
        ? req.headers.get("cookie")
        : (req.headers?.cookie as string | undefined);
    const metaCookies = parseMetaCookies(cookieHeader);
    fbp = metaCookies.fbp;
    fbc = metaCookies.fbc;
  }

  const safeAmount = Number(booking.amount) || 0;
  const poojaTitle = booking.poojaTitle || "Sacred Pooja Seva";
  const poojaSlug = booking.poojaSlug || "custom-puja";

  return await sendCapiEvent({
    eventName: "Purchase",
    eventId,
    eventSourceUrl: `${SITE_URL}/book/${poojaSlug}`,
    user: {
      name: user?.name,
      phone: user?.phone,
      email: user?.email,
      city: user?.city,
      clientIp,
      clientUserAgent,
      fbp,
      fbc,
    },
    customData: {
      value: safeAmount,
      currency: booking.currency || "INR",
      content_name: poojaTitle,
      content_type: "product",
      content_ids: [poojaSlug],
      order_id: booking.bookingId || booking.orderId || stableId,
      num_items: 1,
    },
  });
}
