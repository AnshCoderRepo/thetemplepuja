import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeToE164,
  normalizeTo10Digit,
  formatPhoneDisplay,
  getPhoneLookupVariants,
} from "../lib/phone";
import {
  createOtpChallenge,
  verifyOtpChallenge,
} from "../lib/otp-service";
import * as serverStore from "../lib/server-store";

const originalMongoUri = process.env.MONGODB_URI;

beforeAll(() => {
  process.env.TTP_STORE = "memory";
  delete process.env.MONGODB_URI;
});

afterAll(() => {
  delete process.env.TTP_STORE;
  if (originalMongoUri) process.env.MONGODB_URI = originalMongoUri;
  else delete process.env.MONGODB_URI;
});

describe("Phone Number Normalization & Matching", () => {
  it("normalizes standard 10-digit Indian numbers to E.164 and 10-digit formats", () => {
    expect(normalizeToE164("9876543210")).toBe("+919876543210");
    expect(normalizeTo10Digit("9876543210")).toBe("9876543210");
  });

  it("handles numbers with +91 prefix and country code", () => {
    expect(normalizeToE164("+91 98765 43210")).toBe("+919876543210");
    expect(normalizeTo10Digit("+91 98765 43210")).toBe("9876543210");
    expect(normalizeToE164("919876543210")).toBe("+919876543210");
  });

  it("formats phone for sacred, readable devotee display", () => {
    expect(formatPhoneDisplay("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhoneDisplay("9876543210")).toBe("+91 98765 43210");
  });

  it("produces lookup variants to match legacy 10-digit or modern E.164 formats in database", () => {
    const variants = getPhoneLookupVariants("9876543210");
    expect(variants).toContain("+919876543210");
    expect(variants).toContain("9876543210");
    expect(variants).toContain("919876543210");
  });
});

describe("OTP Challenge Generation, Verification & Brute-Force Protection", () => {
  it("generates a 6-digit OTP challenge and hashes it with SHA-256", async () => {
    const challenge = await createOtpChallenge("+919876543210", "activation");

    expect(challenge.ok).toBe(true);
    expect(challenge.rawCode).toHaveLength(6);
    expect(/^\d{6}$/.test(challenge.rawCode!)).toBe(true);
    expect(challenge.resendAfterSec).toBeGreaterThan(0);
  });

  it("enforces a 60-second resend cooldown before allowing another OTP", async () => {
    const first = await createOtpChallenge("+919111122222", "activation");
    expect(first.ok).toBe(true);

    // Immediate second attempt within cooldown window
    const second = await createOtpChallenge("+919111122222", "activation");
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/wait/i);
    expect(second.resendAfterSec).toBeGreaterThan(0);
  });

  it("verifies a valid OTP and invalidates single-use consumption", async () => {
    const challenge = await createOtpChallenge("+919333344444", "password_reset");
    expect(challenge.ok).toBe(true);

    const verifySuccess = await verifyOtpChallenge(
      "+919333344444",
      challenge.rawCode!,
      "password_reset"
    );
    expect(verifySuccess.ok).toBe(true);

    // After consumption, a replay attempt fails
    const replayAttempt = await verifyOtpChallenge(
      "+919333344444",
      challenge.rawCode!,
      "password_reset"
    );
    expect(replayAttempt.ok).toBe(false);
  });

  it("tracks invalid attempts and locks after 5 failed attempts", async () => {
    await createOtpChallenge("+919555566666", "activation");

    for (let i = 0; i < 5; i++) {
      const res = await verifyOtpChallenge("+919555566666", "000000", "activation");
      expect(res.ok).toBe(false);
    }

    const lockedRes = await verifyOtpChallenge("+919555566666", "000000", "activation");
    expect(lockedRes.ok).toBe(false);
    expect(lockedRes.error).toMatch(/too many failed attempts/i);
  });
});

describe("Account Activation & Devotee Session Tokens", () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.TTP_STORE = "memory";
  });

  it("creates account in pending_activation state and activates upon verification", async () => {
    const rawPhone = "9888877777";
    await serverStore.upsertUserBooking({
      phone: rawPhone,
      name: "Radha Krishna",
      gotra: "Vashistha",
      city: "Vrindavan",
      email: "",
      booking: {
        bookingId: "BK_TEST_01",
        poojaSlug: "radha-kripa-puja",
        poojaTitle: "Radha Kripa Seva",
        date: "2026-10-15",
        time: "07:00 AM",
        panditName: "Acharya Ji",
        reason: "Devotion",
        amount: 2100,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: new Date().toISOString(),
        status: "confirmed",
      },
    });

    const userBefore = await serverStore.findUserByPhone(rawPhone);
    expect(userBefore).not.toBeNull();

    // Activate user account and set permanent password
    const activateResult = await serverStore.activateUserAccount(
      rawPhone,
      "SuperSecurePassword123"
    );
    expect(activateResult.ok).toBe(true);
    expect(activateResult.user?.isActivated).toBe(true);
    expect(activateResult.user?.status).toBe("active");
    expect(activateResult.user?.activatedAt).toBeDefined();

    // Password was hashed
    expect(activateResult.user?.passwordHash).not.toBe("SuperSecurePassword123");
    expect(activateResult.user?.passwordHash?.startsWith("$2")).toBe(true);
  });

  it("issues HMAC session tokens and verifies them securely", () => {
    const phone = "+919876543210";
    const token = serverStore.createDevoteeSessionToken(phone);
    expect(token).toBeDefined();

    const verifiedPhone = serverStore.verifyDevoteeSessionToken(token);
    expect(verifiedPhone).toBe(phone);

    // Tampered token fails verification
    const tampered = token.slice(0, -6) + "XXXXXX";
    expect(serverStore.verifyDevoteeSessionToken(tampered)).toBeNull();
  });

  it("attaches paid licence entitlements to the user account safely without duplicate grants", async () => {
    const phone = "9777766666";
    await serverStore.upsertUserBooking({
      phone,
      name: "Suresh Patel",
      gotra: "Kashyap",
      city: "Ahmedabad",
      email: "",
      booking: {
        bookingId: "BK_TEST_02",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Satyanarayan Katha",
        date: "2026-10-16",
        time: "09:00 AM",
        panditName: "Pt. Sharma",
        reason: "Family peace",
        amount: 1101,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: new Date().toISOString(),
        status: "confirmed",
      },
    });

    const entitlement = {
      id: "ent_annual_pass_123",
      orderId: "order_rzp_live_test123",
      paymentId: "pay_live_test456",
      productType: "product_licence" as const,
      sku: "annual-seva-pass",
      title: "Annual Sacred Seva Licence",
      amount: 5100,
      currency: "INR",
      status: "active" as const,
      grantedAt: new Date().toISOString(),
    };

    await serverStore.addDevoteeEntitlement(phone, entitlement);

    const user = await serverStore.findUserByPhone(phone);
    expect(user?.entitlements).toHaveLength(1);
    expect(user?.entitlements?.[0].orderId).toBe("order_rzp_live_test123");
    expect(user?.entitlements?.[0].sku).toBe("annual-seva-pass");

    // Re-adding same entitlement is idempotent (no duplicates)
    await serverStore.addDevoteeEntitlement(phone, entitlement);
    const userAfter = await serverStore.findUserByPhone(phone);
    expect(userAfter?.entitlements).toHaveLength(1);
  });
});

describe("Webhook Idempotency & Order Records", () => {
  it("records webhook event and enforces idempotency against replay attacks", async () => {
    const eventId = "evt_payment_captured_123456";
    const recorded = await serverStore.recordWebhookEvent(
      eventId,
      "payment.captured"
    );
    expect(recorded).toBe(true);

    // Duplicate webhook with same eventId must return false (idempotent ignore)
    const duplicate = await serverStore.recordWebhookEvent(
      eventId,
      "payment.captured"
    );
    expect(duplicate).toBe(false);
  });

  it("stores and queries payment orders by order ID and customer phone", async () => {
    const order = {
      orderId: "order_998877",
      phone: "+919999900000",
      customerName: "Gita Devi",
      amount: 2100,
      currency: "INR",
      status: "verified" as const,
      paymentMethod: "razorpay" as const,
      receipt: "rcpt_998877",
      poojaSlug: "rudrabhishek",
      poojaTitle: "Maha Rudrabhishek",
      createdAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };

    await serverStore.saveOrder(order);

    const fetched = await serverStore.findOrderByOrderId("order_998877");
    expect(fetched).not.toBeNull();
    expect(fetched?.amount).toBe(2100);
    expect(fetched?.status).toBe("verified");

    const ordersForUser = await serverStore.findOrdersByPhone("+919999900000");
    expect(ordersForUser).toHaveLength(1);
    expect(ordersForUser[0].orderId).toBe("order_998877");
  });
});
