/**
 * Meta (Facebook) Pixel Configuration & Helper Functions
 * Official Pixel ID: 1528984618994788
 */

export const FB_PIXEL_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
  process.env.NEXT_PUBLIC_META_PIXEL_ID ||
  "1528984618994788";

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
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    window.fbq("track", "PageView");
  } else {
    // Retry shortly if script is still downloading/hydrating
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window.fbq === "function") {
        window.fbq("track", "PageView");
        clearInterval(interval);
      } else if (attempts >= 10) {
        clearInterval(interval);
      }
    }, 200);
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
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    window.fbq("track", name, options);
  } else {
    // Retry shortly if script is still downloading/hydrating
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window.fbq === "function") {
        window.fbq("track", name, options);
        clearInterval(interval);
      } else if (attempts >= 10) {
        clearInterval(interval);
      }
    }, 200);
  }
};

/**
 * Track custom user events
 */
export const customEvent = (
  name: string,
  options: Record<string, unknown> = {}
): void => {
  if (typeof window === "undefined") return;

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", name, options);
  } else {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof window.fbq === "function") {
        window.fbq("trackCustom", name, options);
        clearInterval(interval);
      } else if (attempts >= 10) {
        clearInterval(interval);
      }
    }, 200);
  }
};
