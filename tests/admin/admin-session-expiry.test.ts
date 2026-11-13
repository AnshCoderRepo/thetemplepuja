import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchAllUsers } from "@/lib/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Admin Session Expiry and Data Isolation", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ttp_profiles_v1");
      window.localStorage.removeItem("ttp_admin_token_v1");
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when admin token is rejected with 401 Unauthorized", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Unauthorized — please sign in again." }, 401)
      )
    );

    const result = await fetchAllUsers("expired_admin_token_123");
    expect(result).toBeNull();
  });

  it("returns null when admin token is rejected with 403 Forbidden", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Forbidden" }, 403)
      )
    );

    const result = await fetchAllUsers("forbidden_token_123");
    expect(result).toBeNull();
  });

  it("does not leak mock demo users into admin result if server call fails with an active token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network timeout"))
    );

    const result = await fetchAllUsers("valid_token_network_fail");
    // Must return empty array, NOT mock demo users
    expect(result).toEqual([]);
  });

  it("successfully returns server users when token is valid", async () => {
    const mockUsers = [
      {
        id: "USR_101",
        name: "Test Devotee",
        phone: "9876543210",
        bookings: [
          {
            bookingId: "BK_TEST_1",
            poojaSlug: "hanuman-puja",
            status: "confirmed",
            amount: 501,
          },
        ],
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ users: mockUsers }, 200))
    );

    const result = await fetchAllUsers("valid_token_xyz");
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe("USR_101");
    expect(result?.[0].bookings).toHaveLength(1);
  });
});

