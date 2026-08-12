import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  computeOrderAmount,
  createRazorpayOrder,
  getRazorpayOrder,
  razorpayConfigured,
  verifyPaymentSignature,
} from "../lib/razorpay";
import { coupons, type Pooja } from "../lib/data";

const ENV_KEYS = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"];
const saved: Record<string, string | undefined> = {};

function pooja(price: number): Pooja {
  return {
    slug: "hanuman-pooja",
    title: "Hanuman Pooja",
    hindiTitle: "हनुमान पूजा",
    emoji: "🐒",
    gradient: "from-orange-400 to-rose-500",
    price,
    duration: "1 hour",
    bestMuhurat: "Tuesday & Saturday",
    description: "Worship of Bajrang Bali.",
    benefits: ["Courage & strength"],
  };
}

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

describe("razorpayConfigured", () => {
  it("is false when the keys are missing", () => {
    expect(razorpayConfigured()).toBe(false);
  });

  it("is true when both keys are present", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    expect(razorpayConfigured()).toBe(true);
  });
});

describe("verifyPaymentSignature", () => {
  it("verifies a genuine signature (HMAC-SHA256 of orderId|paymentId)", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "my-secret";
    const orderId = "order_M5XnAbcDef";
    const paymentId = "pay_M5Yo123456";
    const expected = createHmac("sha256", "my-secret")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    expect(
      verifyPaymentSignature({ orderId, paymentId, signature: expected })
    ).toBe(true);
  });

  it("rejects a tampered signature", () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "my-secret";
    expect(
      verifyPaymentSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "deadbeef",
      })
    ).toBe(false);
  });

  it("rejects everything when unconfigured", () => {
    expect(
      verifyPaymentSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "anything",
      })
    ).toBe(false);
  });
});

describe("createRazorpayOrder", () => {
  it("throws when Razorpay isn't configured", async () => {
    await expect(
      createRazorpayOrder({ amount: 501, receipt: "R1" })
    ).rejects.toThrow("not configured");
  });

  it("posts to the orders endpoint with basic auth and paise amount", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const order = {
      id: "order_M5XnAbcDef",
      entity: "order",
      amount: 50100,
      amount_paid: 0,
      amount_due: 50100,
      currency: "INR",
      receipt: "R1",
      status: "created",
      attempts: 0,
      created_at: 1700000000,
      notes: { poojaSlug: "hanuman-pooja" },
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(order), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createRazorpayOrder({
      amount: 501,
      receipt: "R1",
      notes: { poojaSlug: "hanuman-pooja" },
    });
    expect(result.id).toBe("order_M5XnAbcDef");
    expect(result.amount).toBe(50100);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.razorpay.com/v1/orders");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      "Basic " + Buffer.from("rzp_test_123:secret").toString("base64")
    );
    const body = JSON.parse(init.body as string);
    expect(body.amount).toBe(50100); // rupees → paise
    expect(body.currency).toBe("INR");
    expect(body.receipt).toBe("R1");
    expect(body.notes.poojaSlug).toBe("hanuman-pooja");
  });

  it("throws on a non-2xx response", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { code: "BAD_REQUEST" } }), {
          status: 400,
        })
      )
    );
    await expect(
      createRazorpayOrder({ amount: 501, receipt: "R1" })
    ).rejects.toThrow("400");
  });
});

describe("getRazorpayOrder", () => {
  it("fetches the order with basic auth", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const order = {
      id: "order_M5XnAbcDef",
      entity: "order",
      amount: 50100,
      amount_paid: 50100,
      amount_due: 0,
      currency: "INR",
      receipt: "R1",
      status: "paid",
      attempts: 1,
      created_at: 1700000000,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(order), { status: 200 }))
    );

    const result = await getRazorpayOrder("order_M5XnAbcDef");
    expect(result.status).toBe("paid");
    expect(result.amount).toBe(50100);
  });

  it("throws on failure", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_123";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 404 }))
    );
    await expect(getRazorpayOrder("order_missing")).rejects.toThrow("404");
  });
});

describe("computeOrderAmount", () => {
  it("charges the full price without a coupon", () => {
    const r = computeOrderAmount({
      pooja: pooja(501),
      couponCode: null,
      couponMap: coupons,
      phone: "9876543210",
      confirmedCount: 0,
    });
    expect(r.amount).toBe(501);
    expect(r.discount).toBe(0);
    expect(r.couponProblem).toBeNull();
  });

  it("applies a valid percent coupon (rounded to the nearest rupee)", () => {
    const r = computeOrderAmount({
      pooja: pooja(501),
      couponCode: "TEMPLE30",
      couponMap: coupons,
      phone: "9876543210",
      confirmedCount: 0,
    });
    expect(r.discount).toBe(150); // round(501 * 30 / 100)
    expect(r.amount).toBe(351);
    expect(r.couponProblem).toBeNull();
  });

  it("rejects a first-booking coupon when the phone already has a booking", () => {
    const r = computeOrderAmount({
      pooja: pooja(501),
      couponCode: "TEMPLE30",
      couponMap: coupons,
      phone: "9876543210",
      confirmedCount: 1,
    });
    expect(r.couponProblem).toContain("first booking");
    expect(r.amount).toBe(501); // full price — no discount applied
    expect(r.discount).toBe(0);
  });

  it("rejects a min-amount coupon below its threshold", () => {
    const r = computeOrderAmount({
      pooja: pooja(501),
      couponCode: "TEMPLEKUNDLI",
      couponMap: coupons,
      phone: "9876543210",
      confirmedCount: 0,
    });
    expect(r.couponProblem).toContain("₹1,500");
    expect(r.amount).toBe(501);
  });

  it("rejects an unknown coupon and charges full price", () => {
    const r = computeOrderAmount({
      pooja: pooja(1101),
      couponCode: "NOPE99",
      couponMap: coupons,
      phone: "9876543210",
      confirmedCount: 0,
    });
    expect(r.couponProblem).toContain("not a valid coupon");
    expect(r.amount).toBe(1101);
  });
});
