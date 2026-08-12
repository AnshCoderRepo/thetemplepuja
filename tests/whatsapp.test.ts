import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  bookingAlertText,
  cancelAlertText,
  devoteeBookingAlertText,
  devoteeCancelAlertText,
  devoteeWhatsAppNumber,
  receiptUrlFor,
  sendAdminWhatsApp,
  sendWhatsApp,
  whatsappConfigured,
} from "../lib/whatsapp";

const info = {
  bookingId: "SKABC123",
  poojaTitle: "Hanuman Pooja",
  name: "Aarav Sharma",
  phone: "9876543210",
  date: "Tue, 25 Aug",
  time: "11:00 AM IST",
  amount: 501,
  discount: 0,
  couponCode: null,
  reason: "For courage and protection",
};

describe("message builders", () => {
  it("bookingAlertText includes the key booking details", () => {
    const t = bookingAlertText(info);
    expect(t).toContain("SKABC123");
    expect(t).toContain("Hanuman Pooja");
    expect(t).toContain("Aarav Sharma (9876543210)");
    expect(t).toContain("Tue, 25 Aug · 11:00 AM IST");
    expect(t).toContain("₹501");
    expect(t).toContain("CONFIRMED");
  });

  it("bookingAlertText shows coupon savings only when a coupon was used", () => {
    const withCoupon = bookingAlertText({ ...info, discount: 150, couponCode: "TEMPLE30" });
    expect(withCoupon).toContain("TEMPLE30");
    expect(withCoupon).toContain("saved ₹150");
    const without = bookingAlertText(info);
    expect(without).not.toContain("Coupon");
  });

  it("cancelAlertText mentions the refund and the original muhurat", () => {
    const t = cancelAlertText(info);
    expect(t).toContain("Cancelled");
    expect(t).toContain("SKABC123");
    expect(t).toContain("₹501");
    expect(t).toContain("5–7 business days");
  });

  it("devoteeBookingAlertText greets the devotee and includes the receipt link", () => {
    const t = devoteeBookingAlertText({
      ...info,
      receiptUrl: "https://thetemplepuja.com/booking/SKABC123?phone=9876543210",
    });
    expect(t).toContain("Namaste Aarav Sharma");
    expect(t).toContain("CONFIRMED");
    expect(t).toContain("SKABC123");
    expect(t).toContain("Hanuman Pooja");
    expect(t).toContain("₹501");
    expect(t).toContain("View your receipt: https://thetemplepuja.com");
  });

  it("devoteeBookingAlertText shows savings and omits the link when absent", () => {
    const withCoupon = devoteeBookingAlertText({
      ...info,
      discount: 150,
      couponCode: "TEMPLE30",
    });
    expect(withCoupon).toContain("TEMPLE30");
    expect(withCoupon).toContain("saved ₹150");
    expect(withCoupon).not.toContain("View your receipt");
  });

  it("devoteeCancelAlertText mentions the refund and rebooking", () => {
    const t = devoteeCancelAlertText(info);
    expect(t).toContain("cancelled as requested");
    expect(t).toContain("SKABC123");
    expect(t).toContain("₹501");
    expect(t).toContain("rebook");
  });
});

describe("devotee helpers", () => {
  it("devoteeWhatsAppNumber formats +91 and rejects invalid numbers", () => {
    expect(devoteeWhatsAppNumber("9876543210")).toBe("whatsapp:+919876543210");
    expect(devoteeWhatsAppNumber("+91 98765 43210")).toBe(
      "whatsapp:+919876543210"
    );
    expect(devoteeWhatsAppNumber("123")).toBeNull();
    expect(devoteeWhatsAppNumber("")).toBeNull();
  });

  it("receiptUrlFor uses SITE_URL when set, else the host header", () => {
    const saved = process.env.SITE_URL;
    process.env.SITE_URL = "https://thetemplepuja.com";
    expect(
      receiptUrlFor("localhost:3000", "SKABC123", "9876543210")
    ).toBe(
      "https://thetemplepuja.com/booking/SKABC123?phone=9876543210"
    );
    delete process.env.SITE_URL;
    expect(receiptUrlFor("example.com", "SKABC123", "9876543210")).toBe(
      "http://example.com/booking/SKABC123?phone=9876543210"
    );
    if (saved === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = saved;
  });
});

describe("sendAdminWhatsApp", () => {
  const ENV_KEYS = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "ADMIN_WHATSAPP_TO",
  ];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.unstubAllGlobals();
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("is a safe no-op when Twilio isn't configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(whatsappConfigured()).toBe(false);
    expect(await sendAdminWhatsApp("hello")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the message to the Twilio Messages endpoint with basic auth", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    process.env.ADMIN_WHATSAPP_TO = "whatsapp:+918765301563";
    expect(whatsappConfigured()).toBe(true);

    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendAdminWhatsApp("Namaste 🙏")).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      "https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json"
    );
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      "Basic " + Buffer.from("AC123:tok123").toString("base64")
    );
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const body = init.body as string;
    expect(body).toContain("From=whatsapp%3A%2B14155238886");
    expect(body).toContain("To=whatsapp%3A%2B918765301563");
    expect(body).toContain("Body=Namaste+%F0%9F%99%8F");
  });

  it("never throws when the Twilio API fails or times out", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("twilio unreachable"))
    );
    expect(await sendAdminWhatsApp("hi")).toBe(false);
  });

  it("reports non-2xx responses as failure", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 401 }))
    );
    expect(await sendAdminWhatsApp("hi")).toBe(false);
  });

  it("defaults the admin recipient to the site's contact number", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await sendAdminWhatsApp("hi");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body as string).toContain("To=whatsapp%3A%2B918765301563");
  });

  it("sendWhatsApp can address the devotee directly", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendWhatsApp("whatsapp:+919876543210", "Namaste 🙏")).toBe(
      true
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body as string).toContain("To=whatsapp%3A%2B919876543210");
  });

  it("sendWhatsApp is a no-op without a recipient", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendWhatsApp("", "hi")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
