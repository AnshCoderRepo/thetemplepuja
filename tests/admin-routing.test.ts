import { describe, expect, it, beforeEach } from "vitest";
import { normalizeAdminTab } from "@/lib/admin-tab";
import {
  clearAdminToken,
  getAdminToken,
  isAdminSession,
  setAdminToken,
} from "@/lib/storage";

describe("Admin Routing & Session Persistence", () => {
  it("normalizes path sections and aliases correctly to valid AdminTab names", () => {
    // Analytics
    expect(normalizeAdminTab("analytics")).toBe("analytics");
    expect(normalizeAdminTab("dashboard")).toBe("analytics");
    expect(normalizeAdminTab("overview")).toBe("analytics");
    expect(normalizeAdminTab(undefined)).toBe("analytics");

    // Poojas
    expect(normalizeAdminTab("poojas")).toBe("poojas");
    expect(normalizeAdminTab("pujas")).toBe("poojas");
    expect(normalizeAdminTab("puja")).toBe("poojas");
    expect(normalizeAdminTab("catalog")).toBe("poojas");

    // Devotees / Users
    expect(normalizeAdminTab("devotees")).toBe("devotees");
    expect(normalizeAdminTab("users")).toBe("devotees");
    expect(normalizeAdminTab("customers")).toBe("devotees");

    // Chatbot
    expect(normalizeAdminTab("chatbot")).toBe("chatbot");
    expect(normalizeAdminTab("ai")).toBe("chatbot");
    expect(normalizeAdminTab("ai-chatbot")).toBe("chatbot");
    expect(normalizeAdminTab("training")).toBe("chatbot");

    // Account / Settings
    expect(normalizeAdminTab("account")).toBe("account");
    expect(normalizeAdminTab("settings")).toBe("account");

    // Orders & Bookings
    expect(normalizeAdminTab("bookings")).toBe("bookings");
    expect(normalizeAdminTab("orders")).toBe("orders");
    expect(normalizeAdminTab("payments")).toBe("orders");
  });

  describe("Token persistence", () => {
    beforeEach(() => {
      clearAdminToken();
    });

    it("persists admin token and reports active session", () => {
      expect(isAdminSession()).toBe(false);
      expect(getAdminToken()).toBeNull();

      setAdminToken("tok_valid_test_admin_session_123");
      expect(isAdminSession()).toBe(true);
      expect(getAdminToken()).toBe("tok_valid_test_admin_session_123");

      clearAdminToken();
      expect(isAdminSession()).toBe(false);
      expect(getAdminToken()).toBeNull();
    });
  });
});
