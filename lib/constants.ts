// ===================== STORAGE KEYS =====================
// Single source of truth for all localStorage / sessionStorage keys.
// Renaming a key here updates every consumer — no more stale reads.

export const STORAGE_KEYS = {
  /** Devotee profiles cache. */
  USERS: "ttp_profiles_v1",
  /** Admin session token. */
  ADMIN_TOKEN: "ttp_admin_token_v1",
  /** Catalog override — poojas. */
  CATALOG_POOJAS: "ttp_catalog_poojas_v1",
  /** Catalog override — events. */
  CATALOG_EVENTS: "ttp_catalog_events_v1",
  /** Catalog override — coupons. */
  CATALOG_COUPONS: "ttp_catalog_coupons_v1",
  /** Catalog override — pooja dates. */
  CATALOG_POOJA_DATES: "ttp_catalog_pooja_dates_v1",
  /** Catalog version counter for cross-tab sync. */
  CATALOG_VERSION: "ttp_catalog_version_v1",
} as const;

// ===================== API PATHS =====================

export const API = {
  CATALOG: "/api/catalog",
  ADMIN_LOGIN: "/api/admin/login",
  ADMIN_LOGOUT: "/api/admin/logout",
  ADMIN_CONFIG: "/api/admin/config",
  ADMIN_CREDENTIALS: "/api/admin/credentials",
  ADMIN_USERS_DELETE: "/api/admin/users/delete",
  ADMIN_BOOKINGS_REFUND: "/api/admin/bookings/refund",
  USERS: "/api/users",
  USERS_BOOKING: "/api/users/booking",
  USERS_CANCEL: "/api/users/cancel",
  USERS_RESCHEDULE: "/api/users/reschedule",
  BOOKINGS: "/api/bookings",
  RAZORPAY_ORDER: "/api/payments/razorpay/order",
  CRON_REMINDERS: "/api/cron/booking-reminders",
} as const;

// ===================== BOOKING =====================

export const BOOKING = {
  /** Minimum password length for auto-generated devotee passwords. */
  PASSWORD_LENGTH: 10,
  /** Characters used for auto-generated passwords. */
  PASSWORD_CHARS: "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789",
  /** Booking ID prefix. */
  ID_PREFIX: "SK",
  /** User profile ID prefix. */
  USER_ID_PREFIX: "USR",
} as const;

// ===================== ADMIN =====================

export const ADMIN = {
  DEFAULT_EMAIL: "admin@thetemplepuja.com",
  DEFAULT_PASSWORD: "admin123",
  /** Session TTL in milliseconds (7 days). */
  SESSION_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  /** How long to skip MongoDB after a failure (circuit breaker). */
  MONGO_RETRY_MS: 30_000,
} as const;

// ===================== RAZORPAY =====================

export const RAZORPAY = {
  ENV_KEY_ID: "RAZORPAY_KEY_ID",
  ENV_KEY_SECRET: "RAZORPAY_KEY_SECRET",
  ENV_WEBHOOK_SECRET: "RAZORPAY_WEBHOOK_SECRET",
  CURRENCY: "INR",
} as const;

// ===================== UI =====================

export const UI = {
  /** Max booking IDs shown on the copy chip. */
  MAX_BOOKING_ID_LENGTH: 20,
  /** Debounce delay for search inputs (ms). */
  DEBOUNCE_MS: 300,
  /** How long to show "copied" feedback (ms). */
  COPY_FEEDBACK_MS: 2000,
} as const;

// ===================== VALIDATION =====================

export const VALIDATION = {
  /** Indian mobile number regex (10 digits, optionally prefixed with +91). */
  INDIAN_PHONE_REGEX: /^[6-9]\d{9}$/,
  /** Slug regex (lowercase, numbers, dashes). */
  SLUG_REGEX: /^[a-z0-9-]+$/,
  /** Coupon code regex (uppercase, numbers, dashes). */
  COUPON_CODE_REGEX: /^[A-Z0-9-]+$/,
} as const;
