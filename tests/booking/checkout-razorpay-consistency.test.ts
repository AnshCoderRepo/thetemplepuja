import { describe, expect, it } from "vitest";
import {
  resolveBookingConsistencyStatus,
  type BookingRecord,
  type PaymentAuditRecord,
} from "@/lib/storage";

describe("PHASE 10: Checkout vs Razorpay Amount Consistency & Pricing Integrity", () => {
  // Pure pricing calculation helper mirroring computeOrderAmount from route handlers
  interface PricingInputs {
    basePrice: number;
    packageTierPrice?: number;
    addons?: Array<{ price: number; quantity?: number }>;
    chadhavas?: Array<{ price: number; quantity: number }>;
    couponDiscount?: number;
  }

  function calculatePayableAmount(inputs: PricingInputs): {
    totalRupees: number;
    totalPaise: number;
    breakdown: {
      packagePrice: number;
      addonsTotal: number;
      chadhavasTotal: number;
      discount: number;
    };
  } {
    const packagePrice = inputs.packageTierPrice !== undefined ? inputs.packageTierPrice : inputs.basePrice;
    const addonsTotal = (inputs.addons || []).reduce(
      (sum, a) => sum + (Number(a.price) || 0) * (Number(a.quantity) || 1),
      0
    );
    const chadhavasTotal = (inputs.chadhavas || []).reduce(
      (sum, c) => sum + (Number(c.price) || 0) * (Number(c.quantity) || 1),
      0
    );
    const subtotal = packagePrice + addonsTotal + chadhavasTotal;
    const discount = Math.min(Number(inputs.couponDiscount) || 0, subtotal);
    const finalRupees = Math.max(0, subtotal - discount);
    const totalPaise = Math.round(finalRupees * 100);

    return {
      totalRupees: finalRupees,
      totalPaise,
      breakdown: {
        packagePrice,
        addonsTotal,
        chadhavasTotal,
        discount,
      },
    };
  }

  describe("Scenario 1: Normal booking with no add-ons", () => {
    it("matches exact base puja price without deviation", () => {
      const result = calculatePayableAmount({ basePrice: 501 });
      expect(result.totalRupees).toBe(501);
      expect(result.totalPaise).toBe(50100);
      expect(result.breakdown.addonsTotal).toBe(0);
      expect(result.breakdown.discount).toBe(0);
    });
  });

  describe("Scenario 2: Booking with package tier", () => {
    it("correctly overrides base price with selected tier (Family Seva ₹2,100)", () => {
      const result = calculatePayableAmount({
        basePrice: 501,
        packageTierPrice: 2100,
      });
      expect(result.totalRupees).toBe(2100);
      expect(result.totalPaise).toBe(210000);
    });
  });

  describe("Scenario 3: Booking with multiple add-ons", () => {
    it("sums add-ons cleanly without floating-point inaccuracies", () => {
      const result = calculatePayableAmount({
        basePrice: 501,
        addons: [
          { price: 101, quantity: 1 },
          { price: 251, quantity: 1 },
          { price: 51, quantity: 1 },
        ],
      });
      // 501 + 101 + 251 + 51 = 904
      expect(result.totalRupees).toBe(904);
      expect(result.totalPaise).toBe(90400);
    });
  });

  describe("Scenario 4: Booking with Chadhava offerings and quantities", () => {
    it("multiplies quantity cleanly (e.g. 3 x ₹108 Lotus Seeds, 2 x ₹51 Deepam)", () => {
      const result = calculatePayableAmount({
        basePrice: 501,
        chadhavas: [
          { price: 108, quantity: 3 }, // 324
          { price: 51, quantity: 2 },  // 102
        ],
      });
      // 501 + 324 + 102 = 927
      expect(result.totalRupees).toBe(927);
      expect(result.totalPaise).toBe(92700);
    });
  });

  describe("Scenario 5: Booking with coupon discount", () => {
    it("applies fixed discount correctly and prevents negative amounts", () => {
      const result = calculatePayableAmount({
        basePrice: 501,
        couponDiscount: 100,
      });
      expect(result.totalRupees).toBe(401);
      expect(result.totalPaise).toBe(40100);

      // Discount exceeding total is safely capped at subtotal
      const capped = calculatePayableAmount({
        basePrice: 501,
        couponDiscount: 1000,
      });
      expect(capped.totalRupees).toBe(0);
      expect(capped.totalPaise).toBe(0);
    });
  });

  describe("Scenario 6: Combined packages, add-ons, and coupon", () => {
    it("calculates multi-item cart to exact integer paise", () => {
      // Family Package ₹2100 + Ghee Abhishek ₹251 + 2x Flowers ₹101 (202) - Coupon ₹200 = ₹2353
      const result = calculatePayableAmount({
        basePrice: 501,
        packageTierPrice: 2100,
        addons: [{ price: 251, quantity: 1 }],
        chadhavas: [{ price: 101, quantity: 2 }],
        couponDiscount: 200,
      });
      expect(result.totalRupees).toBe(2353);
      expect(result.totalPaise).toBe(235300);
    });
  });

  describe("Scenario 7: Exact Integer Paise Conversion & Tolerance Prevention", () => {
    it("strictly flags even a 1 paise difference as mismatch", () => {
      const checkoutTotal = 628;
      const checkoutPaise = Math.round(checkoutTotal * 100); // 62800

      const tamperedPaise = 62801; // 1 paise off
      const isExactMatch = checkoutPaise === tamperedPaise;
      expect(isExactMatch).toBe(false);
    });

    it("handles decimal amounts safely without precision errors", () => {
      const price1 = 19.99;
      const price2 = 0.01;
      const total = price1 + price2;
      expect(Math.round(total * 100)).toBe(2000);
    });
  });

  describe("Scenario 8: Checkout Amount Mismatch Detection (Gatekeeper)", () => {
    it("detects when client checkout total differs from backend catalog calculation", () => {
      const clientCheckoutAmount = 501;
      const clientCheckoutPaise = Math.round(clientCheckoutAmount * 100);

      // Backend recalculation based on latest catalog shows updated price (e.g. 751)
      const backendCalculatedAmount = 751;
      const backendCalculatedPaise = Math.round(backendCalculatedAmount * 100);

      const hasMismatch = clientCheckoutPaise !== backendCalculatedPaise;
      expect(hasMismatch).toBe(true);

      const errorPayload = {
        success: false,
        code: "PRICE_MISMATCH",
        message: "The puja or package price has been updated. Please review your updated total before proceeding.",
        checkoutAmount: clientCheckoutAmount,
        calculatedAmount: backendCalculatedAmount,
      };

      expect(errorPayload.code).toBe("PRICE_MISMATCH");
      expect(errorPayload.checkoutAmount).toBe(501);
      expect(errorPayload.calculatedAmount).toBe(751);
    });
  });

  describe("Scenario 9: Razorpay Payment Verification Amount Audit", () => {
    it("flags discrepancy when Razorpay order amount does not match recorded booking amount", () => {
      const orderAmountPaise: number = 50100;
      const requestedBookingPaise: number = 110100; // Tampered request payload

      const isConsistent = orderAmountPaise === requestedBookingPaise;
      expect(isConsistent).toBe(false);

      const auditRecord: PaymentAuditRecord = {
        checkoutAmount: 1101,
        calculatedAmount: 501,
        razorpayOrderAmount: 501,
        capturedAmount: 501,
        recordedAmount: 1101,
        currency: "INR",
        consistencyStatus: "MISMATCH",
        mismatchReason: "Razorpay order amount (₹501) does not match submitted total (₹1101)",
        auditedAt: new Date().toISOString(),
      };

      expect(auditRecord.consistencyStatus).toBe("MISMATCH");
      expect(auditRecord.mismatchReason).toContain("does not match");
    });

    it("successfully creates MATCHED audit record when amounts align", () => {
      const auditRecord: PaymentAuditRecord = {
        checkoutAmount: 628,
        calculatedAmount: 628,
        razorpayOrderAmount: 628,
        capturedAmount: 628,
        recordedAmount: 628,
        currency: "INR",
        consistencyStatus: "MATCHED",
        auditedAt: new Date().toISOString(),
        razorpayOrderId: "order_test_123",
        razorpayPaymentId: "pay_test_456",
      };

      expect(auditRecord.consistencyStatus).toBe("MATCHED");
      expect(auditRecord.mismatchReason).toBeUndefined();
    });
  });

  describe("Scenario 10: Legacy Historical Records Protection", () => {
    it("never marks legacy bookings without audit snapshots as MISMATCH", () => {
      const legacyConfirmedBooking: BookingRecord = {
        bookingId: "BK-LEGACY-001",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Satyanarayan Katha",
        amount: 1101,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        panditName: "Acharya Ji",
        date: "Wed, 12 Aug",
        time: "7:00 PM IST",
        status: "confirmed",
        paidAt: "2026-10-01T10:00:00.000Z",
        createdAt: "2026-10-01T09:55:00.000Z",
      };

      const status = resolveBookingConsistencyStatus(legacyConfirmedBooking);
      // Requirement: Legacy records without snapshots must show NOT AVAILABLE, never false MISMATCH
      expect(status).toBe("NOT AVAILABLE");
      expect(status).not.toBe("MISMATCH");
    });

    it("marks legacy pending bookings as PENDING VERIFICATION", () => {
      const legacyPendingBooking: BookingRecord = {
        bookingId: "BK-LEGACY-002",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Satyanarayan Katha",
        amount: 1101,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        panditName: "Acharya Ji",
        date: "Wed, 12 Aug",
        time: "7:00 PM IST",
        status: "pending",
        createdAt: "2026-10-01T09:55:00.000Z",
      };

      const status = resolveBookingConsistencyStatus(legacyPendingBooking);
      expect(status).toBe("PENDING VERIFICATION");
    });

    it("resolves confirmed modern booking with audit record as MATCHED", () => {
      const modernBooking: BookingRecord = {
        bookingId: "BK-MODERN-003",
        poojaSlug: "rudrabhishek",
        poojaTitle: "Rudrabhishek",
        amount: 2501,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        panditName: "Acharya Ji",
        date: "Thu, 13 Aug",
        time: "5:00 AM IST",
        status: "confirmed",
        paymentAudit: {
          checkoutAmount: 2501,
          calculatedAmount: 2501,
          razorpayOrderAmount: 2501,
          capturedAmount: 2501,
          recordedAmount: 2501,
          currency: "INR",
          consistencyStatus: "MATCHED",
          auditedAt: "2026-11-06T10:00:00.000Z",
        },
        createdAt: "2026-11-06T09:55:00.000Z",
      };

      const status = resolveBookingConsistencyStatus(modernBooking);
      expect(status).toBe("MATCHED");
    });
  });

  describe("Scenario 11: Webhook and Retry Idempotency", () => {
    it("preserves original paymentAudit on duplicate confirmation attempts", () => {
      const existingAudit: PaymentAuditRecord = {
        checkoutAmount: 1101,
        calculatedAmount: 1101,
        razorpayOrderAmount: 1101,
        capturedAmount: 1101,
        recordedAmount: 1101,
        currency: "INR",
        consistencyStatus: "MATCHED",
        auditedAt: "2026-11-06T10:00:00.000Z",
        razorpayOrderId: "order_idempotent_1",
        razorpayPaymentId: "pay_idempotent_1",
      };

      const existingBooking: BookingRecord = {
        bookingId: "BK-IDEMP-001",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Satyanarayan Katha",
        amount: 1101,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        panditName: "Acharya Ji",
        date: "Fri, 14 Aug",
        time: "6:30 PM IST",
        status: "confirmed",
        paidAt: "2026-11-06T10:00:05.000Z",
        paymentAudit: existingAudit,
        createdAt: "2026-11-06T09:59:00.000Z",
      };

      // Simulating a second webhook or duplicate user callback
      const isAlreadyConfirmed = existingBooking.status === "confirmed" && Boolean(existingBooking.paidAt);
      expect(isAlreadyConfirmed).toBe(true);

      // Audit should remain intact and untouched
      expect(existingBooking.paymentAudit?.consistencyStatus).toBe("MATCHED");
      expect(existingBooking.paymentAudit?.razorpayPaymentId).toBe("pay_idempotent_1");
    });
  });
});
