import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminLogin,
  cancelBookingRemote,
  deleteUserRemote,
  fetchAllUsers,
  fetchCatalog,
  fetchUserByPhone,
  refundBookingRemote,
  resetCatalogCache,
  saveCatalogSection,
  submitBooking,
} from "../lib/api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const resolved = {
  poojas: [{ slug: "ganesh-pooja", title: "Ganesh Pooja" }],
  events: [{ slug: "hanuman-pooja", title: "Hanuman Pooja" }],
  coupons: { TEMPLE30: { kind: "percent" } },
};

describe("fetchCatalog", () => {
  beforeEach(() => {
    resetCatalogCache();
    vi.unstubAllGlobals();
    window.localStorage.removeItem("ttp_catalog_poojas_v1");
    window.localStorage.removeItem("ttp_catalog_events_v1");
    window.localStorage.removeItem("ttp_catalog_coupons_v1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetCatalogCache();
  });

  it("returns the server catalog and caches it (one fetch)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(resolved));
    vi.stubGlobal("fetch", fetchMock);

    const first = await fetchCatalog();
    expect(first.poojas[0].slug).toBe("ganesh-pooja");
    await fetchCatalog();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to local overrides when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const catalog = await fetchCatalog();
    // No local override saved → static defaults.
    expect(catalog.poojas).toHaveLength(12);
    expect(catalog.events).toHaveLength(6);
  });
});

describe("adminLogin", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("returns the token on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ ok: true, token: "tok_abc" }))
    );
    const res = await adminLogin("admin@thetemplepuja.com", "admin123");
    expect(res.ok).toBe(true);
    expect(res.token).toBe("tok_abc");
  });

  it("returns an error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Incorrect email or password." }, 401)
      )
    );
    const res = await adminLogin("admin@thetemplepuja.com", "wrong");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Incorrect");
  });
});

describe("saveCatalogSection", () => {
  beforeEach(() => {
    resetCatalogCache();
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    resetCatalogCache();
  });

  it("sends the section with a Bearer token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, catalog: resolved }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await saveCatalogSection("poojas", [], "tok_abc");
    expect(res.ok).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/catalog");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok_abc");
    expect(JSON.parse(init.body as string)).toEqual({ poojas: [] });
  });

  it("surfaces 401 so the caller can force a re-login", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401))
    );
    const res = await saveCatalogSection("poojas", [], "stale");
    expect(res.ok).toBe(false);
    expect(res.status).toBe(401);
  });
});

describe("fetchAllUsers", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem("ttp_profiles_v1");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("returns the server users with a Bearer token", async () => {
    const serverUsers = [{ id: "USR1", name: "Aarav", phone: "9876543210", bookings: [] }];
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ users: serverUsers }));
    vi.stubGlobal("fetch", fetchMock);

    const users = await fetchAllUsers("tok_abc");
    expect(users).toEqual(serverUsers);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/users");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok_abc"
    );
  });

  it("returns null on 401 (stale admin session)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401))
    );
    expect(await fetchAllUsers("stale")).toBeNull();
  });

  it("falls back to the local cache when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchAllUsers("tok")).toEqual([]); // empty local cache
  });
});

const bookingInput = {
  phone: "9876543210",
  name: "Aarav Sharma",
  gotra: "Kashyap",
  city: "New Delhi",
  email: "",
  booking: {
    bookingId: "BK1001",
    poojaSlug: "satyanarayan-katha",
    poojaTitle: "Satyanarayan Katha",
    date: "Wed, 12 Aug",
    time: "6:00 AM",
    panditName: "Pt. Rama Krishna Sharma",
    amount: 1101,
    discount: 0,
    couponCode: null,
    addonCount: 0,
    createdAt: "2026-08-12T06:00:00.000Z",
    status: "confirmed" as const,
  },
};

describe("submitBooking", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem("ttp_profiles_v1");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("posts the booking and merges the server user back", async () => {
    const serverUser = { ...bookingInput, id: "USR1", createdAt: "x", bookings: [bookingInput.booking] };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ ok: true, user: serverUser }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await submitBooking(bookingInput);
    expect(res.ok).toBe(true);
    expect(res.user?.id).toBe("USR1");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/users/booking");
    expect(JSON.parse(init.body as string)).toEqual(bookingInput);
  });

  it("still saves locally when the server is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const res = await submitBooking(bookingInput);
    expect(res.ok).toBe(true); // local save counts as success offline
    expect(res.user?.bookings[0].bookingId).toBe("BK1001");
  });
});

describe("admin user actions", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.removeItem("ttp_profiles_v1");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("deleteUserRemote surfaces a 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Unauthorized" }, 401))
    );
    const res = await deleteUserRemote("USR1", "stale");
    expect(res.status).toBe(401);
    expect(res.ok).toBe(false);
  });

  it("cancelBookingRemote returns ok with a server user", async () => {
    // Seed the local cache so the local cancel applies.
    await submitBooking({
      ...bookingInput,
      booking: { ...bookingInput.booking, bookingId: "BK9" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          ok: true,
          user: { ...bookingInput, id: "USR1", bookings: [{ ...bookingInput.booking, status: "cancelled" }] },
        })
      )
    );
    const res = await cancelBookingRemote("9876543210", "BK9");
    expect(res.ok).toBe(true);
  });

  it("refundBookingRemote returns ok on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    );
    const res = await refundBookingRemote("USR1", "BK9", "tok");
    expect(res.ok).toBe(true);
  });

  it("fetchUserByPhone returns undefined on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ user: null }, 404))
    );
    expect(await fetchUserByPhone("9876543210")).toBeUndefined();
  });
});
