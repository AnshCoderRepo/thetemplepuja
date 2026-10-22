import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FB_PIXEL_ID,
  isTrackingAllowed,
  pageview,
  trackViewContent,
  trackSearch,
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPaymentInitiated,
  trackPaymentFailed,
  trackPurchase,
  trackLead,
  trackContact,
  trackCompleteRegistration,
  trackCustomEvent,
  event as legacyEvent,
  customEvent as legacyCustomEvent,
} from "@/lib/meta-pixel";

describe("Meta Pixel Tracking Library", () => {
  let mockFbq: any;

  beforeEach(() => {
    // Reset window and mocks
    mockFbq = vi.fn();
    mockFbq.loaded = true;
    (window as any).fbq = mockFbq;
    delete (window as any)._fbq;

    // Reset location
    delete (window as any).location;
    (window as any).location = {
      pathname: "/",
      search: "",
      href: "https://templepujasewa.com/",
    };

    // Reset sessionStorage and localStorage
    const sessionStore: Record<string, string> = {};
    const localStore: Record<string, string> = {};

    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn((k: string) => sessionStore[k] || null),
      setItem: vi.fn((k: string, v: string) => {
        sessionStore[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete sessionStore[k];
      }),
      clear: vi.fn(),
    });

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((k: string) => localStore[k] || null),
      setItem: vi.fn((k: string, v: string) => {
        localStore[k] = v;
      }),
      removeItem: vi.fn((k: string) => {
        delete localStore[k];
      }),
      clear: vi.fn(),
    });
  });

  it("exports official or configured Meta Pixel ID", () => {
    expect(FB_PIXEL_ID).toBeDefined();
    expect(FB_PIXEL_ID.length).toBeGreaterThan(5);
  });

  describe("isTrackingAllowed", () => {
    it("permits tracking on public devotee routes", () => {
      (window as any).location.pathname = "/book/satyanarayan-katha";
      expect(isTrackingAllowed()).toBe(true);
    });

    it("strictly blocks tracking on /admin dashboard routes to prevent polluting customer conversions", () => {
      (window as any).location.pathname = "/admin";
      expect(isTrackingAllowed()).toBe(false);

      (window as any).location.pathname = "/admin/bookings";
      expect(isTrackingAllowed()).toBe(false);

      (window as any).location.pathname = "/admin/catalog";
      expect(isTrackingAllowed()).toBe(false);
    });

    it("respects user tracking opt-out in localStorage", () => {
      (window as any).location.pathname = "/book";
      (localStorage.getItem as any).mockReturnValue("denied");
      expect(isTrackingAllowed()).toBe(false);
    });
  });

  describe("pageview tracking", () => {
    it("calls window.fbq with PageView", () => {
      pageview();
      expect(mockFbq).toHaveBeenCalledWith("track", "PageView");
    });

    it("does not call window.fbq on admin routes", () => {
      (window as any).location.pathname = "/admin";
      pageview();
      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackViewContent", () => {
    it("tracks ViewContent for pujas with valid parameters", () => {
      trackViewContent({
        content_name: "Satyanarayan Katha",
        content_ids: ["satyanarayan-katha"],
        value: 1101,
        currency: "INR",
      });

      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "ViewContent",
        expect.objectContaining({
          content_name: "Satyanarayan Katha",
          content_ids: ["satyanarayan-katha"],
          value: 1101,
          currency: "INR",
          content_type: "product",
        })
      );
    });
  });

  describe("trackSearch", () => {
    it("tracks search queries correctly", () => {
      trackSearch("rudrabhishek");
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "Search",
        expect.objectContaining({
          search_string: "rudrabhishek",
        })
      );
    });

    it("ignores empty or whitespace queries", () => {
      trackSearch("   ");
      expect(mockFbq).not.toHaveBeenCalled();
    });
  });

  describe("trackInitiateCheckout", () => {
    it("tracks InitiateCheckout with stable eventId as 4th parameter for deduplication", () => {
      trackInitiateCheckout(
        {
          content_name: "Maha Rudrabhishek",
          content_ids: ["rudrabhishek"],
          value: 2101,
          currency: "INR",
          num_items: 2,
        },
        "ic_BK_12345"
      );

      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "InitiateCheckout",
        expect.objectContaining({
          content_name: "Maha Rudrabhishek",
          value: 2101,
          currency: "INR",
          num_items: 2,
        }),
        { eventID: "ic_BK_12345" }
      );
    });
  });

  describe("trackAddPaymentInfo", () => {
    it("tracks AddPaymentInfo with payment method", () => {
      trackAddPaymentInfo(
        {
          content_name: "Satyanarayan Katha",
          value: 1501,
          payment_type: "razorpay",
        },
        "api_BK_12345"
      );

      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "AddPaymentInfo",
        expect.objectContaining({
          payment_type: "razorpay",
          value: 1501,
        }),
        { eventID: "api_BK_12345" }
      );
    });
  });

  describe("trackPurchase", () => {
    it("tracks Purchase only with verified order details and matching eventId", () => {
      trackPurchase(
        {
          order_id: "BK_777",
          value: 1501,
          currency: "INR",
          content_name: "Satyanarayan Katha",
          content_ids: ["satyanarayan-katha"],
        },
        "pur_BK_777"
      );

      expect(mockFbq).toHaveBeenCalledTimes(1);
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "Purchase",
        expect.objectContaining({
          order_id: "BK_777",
          value: 1501,
          currency: "INR",
          content_name: "Satyanarayan Katha",
        }),
        { eventID: "pur_BK_777" }
      );
    });

    it("prevents duplicate Purchase events in the same session (deduplication on refresh / re-render)", () => {
      trackPurchase(
        {
          order_id: "BK_777",
          value: 1501,
          currency: "INR",
          content_name: "Satyanarayan Katha",
        },
        "pur_BK_777"
      );
      expect(mockFbq).toHaveBeenCalledTimes(1);

      // Second invocation with identical event ID in same session
      trackPurchase(
        {
          order_id: "BK_777",
          value: 1501,
          currency: "INR",
          content_name: "Satyanarayan Katha",
        },
        "pur_BK_777"
      );

      // Must NOT be called again
      expect(mockFbq).toHaveBeenCalledTimes(1);
    });
  });

  describe("custom and interaction events", () => {
    it("tracks PaymentInitiated and PaymentFailed", () => {
      trackPaymentInitiated({
        order_id: "order_123",
        value: 1101,
        currency: "INR",
        method: "razorpay",
      });

      expect(mockFbq).toHaveBeenCalledWith(
        "trackCustom",
        "PaymentInitiated",
        expect.objectContaining({ order_id: "order_123", method: "razorpay" })
      );

      trackPaymentFailed({
        order_id: "order_123",
        error_description: "Bank declined",
      });

      expect(mockFbq).toHaveBeenCalledWith(
        "trackCustom",
        "PaymentFailed",
        expect.objectContaining({ error_description: "Bank declined" })
      );
    });

    it("tracks Lead on genuine form submission", () => {
      trackLead({ form_name: "Contact Us Form" });
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "Lead",
        expect.objectContaining({ form_name: "Contact Us Form" })
      );
    });

    it("tracks Contact on WhatsApp or phone link click without claiming lead", () => {
      trackContact({ method: "whatsapp", label: "Floating WhatsApp" });
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "Contact",
        expect.objectContaining({ method: "whatsapp" })
      );
    });

    it("tracks CompleteRegistration on account activation", () => {
      trackCompleteRegistration({ method: "phone_otp" });
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "CompleteRegistration",
        expect.objectContaining({ method: "phone_otp" })
      );
    });

    it("preserves backwards compatibility for legacy event and customEvent functions", () => {
      legacyEvent("ViewContent", { content_name: "Test" }, "evt_123");
      expect(mockFbq).toHaveBeenCalledWith(
        "track",
        "ViewContent",
        { content_name: "Test" },
        { eventID: "evt_123" }
      );

      legacyCustomEvent("GalleryView", { album: "Varanasi" });
      expect(mockFbq).toHaveBeenCalledWith(
        "trackCustom",
        "GalleryView",
        { album: "Varanasi" }
      );
    });
  });
});
