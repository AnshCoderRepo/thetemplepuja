import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  sha256Hash,
  hashEmail,
  hashPhone,
  hashFirstName,
  hashCity,
  parseMetaCookies,
  extractClientIp,
  extractUserAgent,
  getMetaCapiConfig,
  sendCapiEvent,
  sendCapiPurchaseEvent,
} from "../lib/meta-capi";
import * as serverStore from "../lib/server-store";

describe("Meta Conversions API (CAPI) Library", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("PII Normalization and SHA-256 Hashing", () => {
    it("hashes email correctly according to Meta specifications", () => {
      // Lowercase, trimmed, sha256
      const email = "Devotee.Name@Example.COM ";
      const expected = sha256Hash("devotee.name@example.com");
      expect(hashEmail(email)).toBe(expected);

      // Invalid emails or empty strings should return undefined
      expect(hashEmail("")).toBeUndefined();
      expect(hashEmail("notanemail")).toBeUndefined();
      expect(hashEmail(undefined)).toBeUndefined();

      // Dummy internal emails should be filtered out
      expect(hashEmail("user123@templepujasewa.com")).toBeUndefined();
    });

    it("normalizes and hashes Indian 10-digit phone numbers with 91 prefix", () => {
      // 10 digits without country code -> prepends 91
      const tenDigit = "9876543210";
      expect(hashPhone(tenDigit)).toBe(sha256Hash("919876543210"));

      // Formatted phone: +91 98765-43210
      const formatted = "+91 98765-43210";
      expect(hashPhone(formatted)).toBe(sha256Hash("919876543210"));

      // 11 digits with leading 0: 09876543210
      const zeroPrefix = "09876543210";
      expect(hashPhone(zeroPrefix)).toBe(sha256Hash("919876543210"));

      // Invalid
      expect(hashPhone("")).toBeUndefined();
      expect(hashPhone("abc")).toBeUndefined();
      expect(hashPhone(undefined)).toBeUndefined();
    });

    it("normalizes and hashes devotee first names", () => {
      expect(hashFirstName("Anand Sharma")).toBe(sha256Hash("anand"));
      expect(hashFirstName(" Priya ")).toBe(sha256Hash("priya"));
      expect(hashFirstName("")).toBeUndefined();
      expect(hashFirstName(undefined)).toBeUndefined();
    });

    it("normalizes and hashes city names", () => {
      expect(hashCity("Varanasi")).toBe(sha256Hash("varanasi"));
      expect(hashCity("New Delhi")).toBe(sha256Hash("newdelhi"));
      expect(hashCity("")).toBeUndefined();
      expect(hashCity(undefined)).toBeUndefined();
    });
  });

  describe("Request Metadata Extraction", () => {
    it("extracts _fbp and _fbc cookies", () => {
      const cookieHeader =
        "session_id=abc; _fbp=fb.1.1610000000.12345; other=xyz; _fbc=fb.1.1610000000.AbCdEf";
      const result = parseMetaCookies(cookieHeader);
      expect(result.fbp).toBe("fb.1.1610000000.12345");
      expect(result.fbc).toBe("fb.1.1610000000.AbCdEf");
    });

    it("handles missing cookie headers safely", () => {
      expect(parseMetaCookies(null)).toEqual({});
      expect(parseMetaCookies(undefined)).toEqual({});
      expect(parseMetaCookies("")).toEqual({});
    });

    it("extracts client IP from x-forwarded-for or x-real-ip", () => {
      const reqWithForwarded = {
        headers: {
          "x-forwarded-for": "203.0.113.195, 70.41.3.18",
        },
      };
      expect(extractClientIp(reqWithForwarded)).toBe("203.0.113.195");

      const reqWithRealIp = {
        headers: {
          "x-real-ip": "198.51.100.42",
        },
      };
      expect(extractClientIp(reqWithRealIp)).toBe("198.51.100.42");

      const reqWithGetMethod = {
        headers: {
          get: (header: string) =>
            header === "x-forwarded-for" ? "192.0.2.1" : null,
        },
      };
      expect(extractClientIp(reqWithGetMethod as any)).toBe("192.0.2.1");
    });

    it("extracts user-agent from headers", () => {
      const req = {
        headers: {
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      };
      expect(extractUserAgent(req)).toBe(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      );
    });
  });

  describe("getMetaCapiConfig", () => {
    it("reads configuration with defaults", () => {
      process.env.META_PIXEL_ID = "1234567890";
      process.env.META_ACCESS_TOKEN = "EAAB...testToken";
      process.env.META_GRAPH_API_VERSION = "v20.0";
      process.env.META_TEST_EVENT_CODE = "TEST12345";

      const config = getMetaCapiConfig();
      expect(config.pixelId).toBe("1234567890");
      expect(config.accessToken).toBe("EAAB...testToken");
      expect(config.apiVersion).toBe("v20.0");
      expect(config.testEventCode).toBe("TEST12345");
      expect(config.isConfigured).toBe(true);
    });

    it("reports isConfigured false when access token is missing", () => {
      delete process.env.META_ACCESS_TOKEN;
      delete process.env.META_CAPI_ACCESS_TOKEN;
      delete process.env.FB_ACCESS_TOKEN;

      const config = getMetaCapiConfig();
      expect(config.isConfigured).toBe(false);
    });
  });

  describe("sendCapiEvent", () => {
    it("returns error if eventId is missing", async () => {
      const result = await sendCapiEvent({
        eventName: "Purchase",
        eventId: "",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("eventId is required");
    });

    it("guarantees idempotency by skipping previously recorded events", async () => {
      vi.spyOn(serverStore, "isCapiEventRecorded").mockResolvedValueOnce(true);

      const result = await sendCapiEvent({
        eventName: "Purchase",
        eventId: "pur_duplicate_123",
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("already_processed_in_store");
    });

    it("safely skips dispatch when credentials are not configured without crashing", async () => {
      delete process.env.META_ACCESS_TOKEN;
      delete process.env.META_CAPI_ACCESS_TOKEN;
      delete process.env.FB_ACCESS_TOKEN;

      vi.spyOn(serverStore, "isCapiEventRecorded").mockResolvedValueOnce(false);
      const recordSpy = vi.spyOn(serverStore, "recordCapiEvent").mockResolvedValueOnce(true);

      const result = await sendCapiEvent({
        eventName: "Purchase",
        eventId: "pur_unconfigured_456",
      });

      expect(result.success).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("credentials_not_configured");
      expect(recordSpy).toHaveBeenCalledWith(
        "pur_unconfigured_456",
        "Purchase",
        "skipped",
        expect.anything()
      );
    });

    it("sends formatted CAPI payload to Meta Graph API when configured", async () => {
      process.env.META_PIXEL_ID = "1528984618994788";
      process.env.META_ACCESS_TOKEN = "TEST_TOKEN_XYZ";
      process.env.META_GRAPH_API_VERSION = "v20.0";
      process.env.META_TEST_EVENT_CODE = "TEST999";

      vi.spyOn(serverStore, "isCapiEventRecorded").mockResolvedValueOnce(false);
      const recordSpy = vi.spyOn(serverStore, "recordCapiEvent").mockResolvedValueOnce(true);

      let capturedUrl = "";
      let capturedBody: any = null;

      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (url, init) => {
          capturedUrl = String(url);
          capturedBody = JSON.parse(init.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              events_received: 1,
              fbtrace_id: "trace_abc123",
            }),
          };
        })
      );

      const result = await sendCapiEvent({
        eventName: "Purchase",
        eventId: "pur_order_1001",
        eventSourceUrl: "https://templepujasewa.com/book/rudrabhishek",
        user: {
          name: "Rahul Verma",
          email: "rahul@example.com",
          phone: "9876543210",
          city: "Varanasi",
          clientIp: "203.0.113.1",
          clientUserAgent: "Mozilla/5.0",
          fbp: "fb.1.123",
          fbc: "fb.1.456",
        },
        customData: {
          value: 2101,
          currency: "INR",
          content_name: "Maha Rudrabhishek",
          order_id: "order_1001",
        },
      });

      expect(result.success).toBe(true);
      expect(result.eventsReceived).toBe(1);
      expect(result.fbtraceId).toBe("trace_abc123");

      // Verify endpoint
      expect(capturedUrl).toBe(
        "https://graph.facebook.com/v20.0/1528984618994788/events"
      );

      // Verify payload structure
      expect(capturedBody.test_event_code).toBe("TEST999");
      const eventData = capturedBody.data[0];
      expect(eventData.event_name).toBe("Purchase");
      expect(eventData.event_id).toBe("pur_order_1001");
      expect(eventData.action_source).toBe("website");

      // Verify SHA-256 hashed fields
      expect(eventData.user_data.em).toEqual([sha256Hash("rahul@example.com")]);
      expect(eventData.user_data.ph).toEqual([sha256Hash("919876543210")]);
      expect(eventData.user_data.fn).toEqual([sha256Hash("rahul")]);
      expect(eventData.user_data.ct).toEqual([sha256Hash("varanasi")]);
      expect(eventData.user_data.client_ip_address).toBe("203.0.113.1");
      expect(eventData.user_data.client_user_agent).toBe("Mozilla/5.0");
      expect(eventData.user_data.fbp).toBe("fb.1.123");
      expect(eventData.user_data.fbc).toBe("fb.1.456");

      // Custom data
      expect(eventData.custom_data.value).toBe(2101);
      expect(eventData.custom_data.currency).toBe("INR");
      expect(eventData.custom_data.content_name).toBe("Maha Rudrabhishek");

      expect(recordSpy).toHaveBeenCalledWith(
        "pur_order_1001",
        "Purchase",
        "sent",
        expect.objectContaining({ eventsReceived: 1 })
      );
    });

    it("handles Graph API error response gracefully without throwing", async () => {
      process.env.META_PIXEL_ID = "1528984618994788";
      process.env.META_ACCESS_TOKEN = "EXPIRED_TOKEN";

      vi.spyOn(serverStore, "isCapiEventRecorded").mockResolvedValueOnce(false);
      vi.spyOn(serverStore, "recordCapiEvent").mockResolvedValueOnce(true);

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({
            error: {
              message: "Invalid OAuth access token.",
              type: "OAuthException",
              code: 190,
            },
          }),
        })
      );

      const result = await sendCapiEvent({
        eventName: "Purchase",
        eventId: "pur_err_test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid OAuth access token");
    });
  });

  describe("sendCapiPurchaseEvent", () => {
    it("generates stable eventId matching browser format pur_{bookingId}", async () => {
      process.env.META_PIXEL_ID = "1528984618994788";
      process.env.META_ACCESS_TOKEN = "VALID_TOKEN";

      vi.spyOn(serverStore, "isCapiEventRecorded").mockResolvedValueOnce(false);
      vi.spyOn(serverStore, "recordCapiEvent").mockResolvedValueOnce(true);

      let capturedBody: any = null;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(async (_, init) => {
          capturedBody = JSON.parse(init.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({ events_received: 1 }),
          };
        })
      );

      const bookingData = {
        bookingId: "BK_778899",
        orderId: "order_xyz123",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Shri Satyanarayan Puja",
        amount: 1501,
        currency: "INR",
      };

      const userData = {
        name: "Amit Patel",
        phone: "9876501234",
        email: "amit@example.com",
        city: "Ahmedabad",
      };

      const result = await sendCapiPurchaseEvent({
        booking: bookingData,
        user: userData,
      });

      expect(result.success).toBe(true);
      expect(result.eventId).toBe("pur_BK_778899");

      const event = capturedBody.data[0];
      expect(event.event_name).toBe("Purchase");
      expect(event.event_id).toBe("pur_BK_778899");
      expect(event.custom_data.value).toBe(1501);
      expect(event.custom_data.currency).toBe("INR");
      expect(event.custom_data.content_name).toBe("Shri Satyanarayan Puja");
      expect(event.custom_data.content_ids).toEqual(["satyanarayan-katha"]);
    });
  });
});
