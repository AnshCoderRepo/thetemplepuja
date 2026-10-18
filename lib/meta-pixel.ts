/**
 * Meta (Facebook) Pixel Client Tracking Architecture
 * Official Pixel ID: 1528984618994788
 */

export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  "1528984618994788";

// Global declaration for TypeScript to support official fbq track signatures including { eventID }
declare global {
  interface Window {
    fbq?: ((
      action: string,
      eventName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: unknown;
  }
}

/**
 * Validates whether client-side analytics tracking is permitted.
 * - Disables tracking on server-side rendering.
 * - Disables tracking on /admin routes to avoid polluting marketing analytics.
 * - Respects devotee opt-out / consent choice in localStorage.
 */
export function isTrackingAllowed(): boolean {
  if (typeof window === "undefined") return false;

  // Never track admin operations as customer analytics
  const path = window.location.pathname || "";
  if (path.startsWith("/admin")) {
    return false;
  }

  // Respect explicit opt-out
  try {
    const consent = localStorage.getItem("ttp_pixel_consent");
    if (consent === "false" || consent === "denied") {
      return false;
    }
  } catch {
    // LocalStorage inaccessible in restricted iframe/context
  }

  return true;
}

/**
 * Execute fbq call safely, with automatic retry buffer for initial hydration.
 */
function safeFbq(
  action: "track" | "trackCustom",
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  if (!isTrackingAllowed()) return;

  const eventOptions = eventId ? { eventID: eventId } : undefined;

  if (typeof window.fbq === "function") {
    if (eventOptions) {
      window.fbq(action, eventName, params || {}, eventOptions);
    } else {
      window.fbq(action, eventName, params || {});
    }
  } else {
    // Retry shortly if script is still downloading/hydrating
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window.fbq === "function") {
        if (eventOptions) {
          window.fbq(action, eventName, params || {}, eventOptions);
        } else {
          window.fbq(action, eventName, params || {});
        }
        clearInterval(interval);
      } else if (attempts >= 10) {
        clearInterval(interval);
      }
    }, 200);
  }
}

/**
 * Track standard page views on initial load and client-side route transitions.
 */
export const pageview = (url?: string): void => {
  if (!isTrackingAllowed()) return;

  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  } else {
    safeFbq("track", "PageView");
  }
};

/**
 * Track ViewContent: viewing a puja, temple, or prominent service.
 */
export const trackViewContent = (
  params: {
    content_name: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq(
    "track",
    "ViewContent",
    {
      content_type: "product",
      currency: "INR",
      ...params,
    },
    eventId
  );
};

/**
 * Track Search: searching catalog for pujas, temples, deities, or doshas.
 */
export const trackSearch = (
  search_string: string,
  params: Record<string, unknown> = {},
  eventId?: string
): void => {
  if (!search_string || !search_string.trim()) return;
  safeFbq(
    "track",
    "Search",
    {
      search_string: search_string.trim(),
      ...params,
    },
    eventId
  );
};

/**
 * Track InitiateCheckout: user submits booking details and proceeds to checkout/payment step.
 */
export const trackInitiateCheckout = (
  params: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
    num_items?: number;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq(
    "track",
    "InitiateCheckout",
    {
      content_type: "product",
      currency: "INR",
      ...params,
    },
    eventId
  );
};

/**
 * Track AddPaymentInfo: devotee confirms or enters payment details.
 */
export const trackAddPaymentInfo = (
  params: {
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
    payment_type?: string;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq(
    "track",
    "AddPaymentInfo",
    {
      currency: "INR",
      ...params,
    },
    eventId
  );
};

/**
 * Track Purchase: ONLY after authoritative server-verified payment!
 * Guarantees event deduplication with matching eventId and prevents duplicates on page refreshes.
 */
export const trackPurchase = (
  params: {
    order_id: string;
    value: number;
    currency?: string;
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    [key: string]: unknown;
  },
  eventId: string
): void => {
  if (!eventId) {
    console.warn("[meta-pixel] trackPurchase called without a stable eventId.");
    return;
  }

  // Prevent duplicate browser firing in the same session (e.g. page refresh, re-mount)
  try {
    const storageKey = `ttp_pur_tracked_${eventId}`;
    if (sessionStorage.getItem(storageKey)) {
      return;
    }
    sessionStorage.setItem(storageKey, "1");
  } catch {
    // SessionStorage unavailable fallback
  }

  safeFbq(
    "track",
    "Purchase",
    {
      content_type: "product",
      currency: params.currency || "INR",
      ...params,
    },
    eventId
  );
};

/**
 * Track Lead: completing a genuine lead-generation or enquiry form.
 */
export const trackLead = (
  params: {
    content_name?: string;
    form_name?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string
): void => {
  safeFbq("track", "Lead", params, eventId);
};

/**
 * Track Contact: clicking phone, WhatsApp, or email link (without claiming lead conversion).
 */
export const trackContact = (
  params: {
    method: "whatsapp" | "phone" | "email" | string;
    label?: string;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq("track", "Contact", params, eventId);
};

/**
 * Track CompleteRegistration: devotee successfully activates account or finishes signup.
 */
export const trackCompleteRegistration = (
  params: {
    method?: string;
    [key: string]: unknown;
  } = {},
  eventId?: string
): void => {
  safeFbq("track", "CompleteRegistration", params, eventId);
};

/**
 * Custom Event: BookingStart — clicking Book Puja or opening booking flow.
 */
export const trackBookingStart = (
  params: {
    content_name: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq("trackCustom", "BookingStart", params, eventId);
};

/**
 * Custom Event: PaymentInitiated — gateway or UPI screen opened.
 */
export const trackPaymentInitiated = (
  params: {
    order_id?: string;
    value: number;
    currency?: string;
    method: string;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq("trackCustom", "PaymentInitiated", params, eventId);
};

/**
 * Custom Event: PaymentFailed — confirmed gateway failure or dismissal.
 */
export const trackPaymentFailed = (
  params: {
    order_id?: string;
    error_description?: string;
    [key: string]: unknown;
  },
  eventId?: string
): void => {
  safeFbq("trackCustom", "PaymentFailed", params, eventId);
};

/**
 * Track custom user event
 */
export const trackCustomEvent = (
  name: string,
  options: Record<string, unknown> = {},
  eventId?: string
): void => {
  safeFbq("trackCustom", name, options, eventId);
};

// ── Backwards compatibility aliases ────────────────────────────────────

/**
 * Legacy standard event tracker (backwards compatible).
 */
export const event = (
  name:
    | "PageView"
    | "ViewContent"
    | "Search"
    | "AddToCart"
    | "AddToWishlist"
    | "InitiateCheckout"
    | "AddPaymentInfo"
    | "Purchase"
    | "Lead"
    | "CompleteRegistration"
    | "Contact"
    | "CustomizeProduct"
    | "Donate"
    | "FindLocation"
    | "Schedule"
    | "StartTrial"
    | "SubmitApplication"
    | "Subscribe",
  options: Record<string, unknown> = {},
  eventId?: string
): void => {
  safeFbq("track", name, options, eventId);
};

/**
 * Legacy custom event tracker (backwards compatible).
 */
export const customEvent = (
  name: string,
  options: Record<string, unknown> = {},
  eventId?: string
): void => {
  safeFbq("trackCustom", name, options, eventId);
};
