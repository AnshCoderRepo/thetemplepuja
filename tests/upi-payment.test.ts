import { describe, expect, it } from "vitest";
import { SITE_CONFIG, getUpiPaymentUrl } from "../lib/config";
import { upsertInto, type BookingInput } from "../lib/storage";

describe("UPI QR Payment Flow", () => {
  it("generates correct UPI payment URI with amount and note", () => {
    const url = getUpiPaymentUrl(1101, "Satyanarayan Katha - Ansh");
    expect(url).toContain("upi://pay?");
    expect(url).toContain("pa=" + encodeURIComponent(SITE_CONFIG.payment.upiId));
    expect(url).toContain("am=1101.00");
    expect(url).toContain("cu=INR");
    expect(url).toContain("pn=The+Temple+Puja");
    expect(url).toContain("tn=Satyanarayan+Katha+-+Ansh");
  });

  it("stores paymentMethod, upiTransactionId and upiId on confirmed booking", () => {
    const input: BookingInput = {
      name: "Rahul Sharma",
      phone: "9876543210",
      gotra: "Kashyap",
      city: "Ayodhya",
      email: "9876543210@templepujasewa.com",
      booking: {
        bookingId: "BK-UPI123",
        receiptNumber: "RCPT-20261013-001",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Shri Satyanarayan Katha",
        date: "2026-10-15",
        time: "06:30 PM IST",
        panditName: "Acharya Ji",
        amount: 1101,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: new Date().toISOString(),
        status: "confirmed",
        paymentMethod: "upi_qr",
        upiTransactionId: "428192837491",
        upiId: SITE_CONFIG.payment.upiId,
      },
    };

    const result = upsertInto([], input);
    expect(result.users).toHaveLength(1);
    const booking = result.user.bookings[0];
    expect(booking.paymentMethod).toBe("upi_qr");
    expect(booking.upiTransactionId).toBe("428192837491");
    expect(booking.upiId).toBe(SITE_CONFIG.payment.upiId);
    expect(booking.status).toBe("confirmed");
  });
});
