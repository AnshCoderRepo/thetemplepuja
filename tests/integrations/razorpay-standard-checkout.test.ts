import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { POST as createOrderHandler } from "@/app/api/create-order/route";
import { POST as verifyPaymentHandler } from "@/app/api/verify-payment/route";
import { NextRequest } from "next/server";

const TEST_KEY_ID = "rzp_test_ToB5l9zysAGRTp";
const TEST_KEY_SECRET = "5agfA0Mky55E1r5CLD5ryVNB";

describe("Razorpay Standard Checkout Integration", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
  });

  describe("POST /api/create-order", () => {
    it("rejects requests when amount is missing or invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/create-order", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await createOrderHandler(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Valid amount in paise is required");
    });

    it("rejects orders below 100 paise (< ₹1)", async () => {
      const req = new NextRequest("http://localhost:3000/api/create-order", {
        method: "POST",
        body: JSON.stringify({ amount: 99 }),
      });
      const res = await createOrderHandler(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("at least 100 paise");
    });

    it("successfully creates a live test order with Razorpay API", async () => {
      process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
      process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

      const req = new NextRequest("http://localhost:3000/api/create-order", {
        method: "POST",
        body: JSON.stringify({
          amount: 50100, // ₹501.00 in paise
          currency: "INR",
          receipt: `rcpt_test_${Date.now()}`,
          notes: { pooja: "Ganesh Puja Test" },
        }),
      });

      const res = await createOrderHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.order_id).toBeDefined();
      expect(data.order_id).toMatch(/^order_/);
      expect(data.amount).toBe(50100);
      expect(data.currency).toBe("INR");
      expect(data.key_id).toBe(TEST_KEY_ID);
    });

    it("handles Razorpay auth failures when invalid keys are passed", async () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_invalidKey123";
      process.env.RAZORPAY_KEY_SECRET = "invalidSecret123";

      const req = new NextRequest("http://localhost:3000/api/create-order", {
        method: "POST",
        body: JSON.stringify({
          amount: 10000,
        }),
      });

      const res = await createOrderHandler(req);
      expect([401, 500]).toContain(res.status);

      // Restore credentials
      process.env.RAZORPAY_KEY_ID = TEST_KEY_ID;
      process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;
    });
  });

  describe("POST /api/verify-payment", () => {
    it("rejects when required fields are missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/verify-payment", {
        method: "POST",
        body: JSON.stringify({
          order_id: "order_123",
          // missing payment_id and signature
        }),
      });
      const res = await verifyPaymentHandler(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Missing required fields");
    });

    it("rejects when signature does not match", async () => {
      process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

      const req = new NextRequest("http://localhost:3000/api/verify-payment", {
        method: "POST",
        body: JSON.stringify({
          order_id: "order_M5XnAbcDef",
          payment_id: "pay_M5Yo123456",
          signature: "tampered_fake_signature_hash_1234567890",
        }),
      });
      const res = await verifyPaymentHandler(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Signature mismatch");
    });

    it("verifies genuine HMAC-SHA256 signature successfully", async () => {
      process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

      const orderId = "order_VALID123";
      const paymentId = "pay_VALID456";
      const validSignature = createHmac("sha256", TEST_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const req = new NextRequest("http://localhost:3000/api/verify-payment", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: validSignature,
        }),
      });

      const res = await verifyPaymentHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.order_id).toBe(orderId);
      expect(data.payment_id).toBe(paymentId);
    });
  });
});
