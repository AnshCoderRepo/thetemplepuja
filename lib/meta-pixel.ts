/**
 * Meta (Facebook) Pixel Configuration & Helper Functions
 * Official Pixel ID: 2274877150125921
 */

export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  "2274877150125921";

// Global declaration for TypeScript
declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: unknown;
  }
}

/**
 * Track standard page views
 */
export const pageview = (): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  }
};

/**
 * Track standard Meta events (e.g., Purchase, Lead, InitiateCheckout, ViewContent)
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
  options: Record<string, unknown> = {}
): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", name, options);
  }
};

/**
 * Track custom user events
 */
export const customEvent = (
  name: string,
  options: Record<string, unknown> = {}
): void => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", name, options);
  }
};
