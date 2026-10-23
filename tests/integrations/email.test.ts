import { describe, expect, it } from "vitest";
import {
  getCeoDestinationEmail,
  extractDevoteeEmail,
  extractDevoteePhone,
  formatCeoEmailText,
  formatCeoEmailHtml,
  sendCeoMessageEmail,
} from "@/lib/email";

describe("CEO Email Notification Service", () => {
  it("resolves the CEO destination email address", () => {
    const email = getCeoDestinationEmail();
    expect(email).toBeTruthy();
    expect(email).toContain("@");
  });

  it("extracts devotee email and phone from contact strings", () => {
    expect(extractDevoteeEmail("test@example.com")).toBe("test@example.com");
    expect(extractDevoteeEmail("+91 9876543210 / contact@domain.in")).toBe("contact@domain.in");
    expect(extractDevoteeEmail("+91 9876543210")).toBeNull();

    expect(extractDevoteePhone("+91 98765 43210")).toBe("9876543210");
    expect(extractDevoteePhone("9876543210")).toBe("9876543210");
    expect(extractDevoteePhone("hello@domain.com")).toBeNull();
  });

  it("formats a comprehensive plain-text email with all content", () => {
    const text = formatCeoEmailText({
      id: "CEO-test-12345",
      name: "Rameshwar Prasad",
      contact: "+91 9876543210",
      subject: "Pooja Timings Feedback",
      message: "The morning puja sankalp was delivered with utmost reverence.",
      createdAt: "2026-10-14T12:00:00.000Z",
    });

    expect(text).toContain("CEO-test-12345");
    expect(text).toContain("Rameshwar Prasad");
    expect(text).toContain("+91 9876543210");
    expect(text).toContain("Pooja Timings Feedback");
    expect(text).toContain("morning puja sankalp was delivered with utmost reverence");
    expect(text).toContain("https://wa.me/919876543210");
    expect(text).toContain("tel:+919876543210");
  });

  it("formats a rich, responsive HTML email with saffron styling and buttons", () => {
    const html = formatCeoEmailHtml({
      id: "CEO-html-67890",
      name: "Suman Lata",
      contact: "suman.lata@example.com",
      subject: "Suggestion for Navratri",
      message: "Please include special Chandi Path booking for Navratri.",
      createdAt: "2026-10-14T12:00:00.000Z",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("CEO-html-67890");
    expect(html).toContain("Suman Lata");
    expect(html).toContain("suman.lata@example.com");
    expect(html).toContain("Suggestion for Navratri");
    expect(html).toContain("special Chandi Path booking for Navratri");
    expect(html).toContain("mailto:suman.lata@example.com");
    expect(html).toContain("templepujasewa");
  });

  it("dispatches the CEO message email cleanly without throwing errors", async () => {
    const result = await sendCeoMessageEmail({
      id: "CEO-send-99999",
      name: "Govind Das",
      contact: "+91 96210 14155",
      subject: "Darshan Streaming Inquiry",
      message: "Kindly verify if the live stream link will be sent on WhatsApp.",
    });

    expect(result.ok).toBe(true);
    expect(result.to).toBeTruthy();
    expect(["smtp", "resend", "dev-logger"]).toContain(result.provider);
  });
});
