import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const originalMongoUri = process.env.MONGODB_URI;

beforeAll(() => {
  // Force the in-memory store so tests never touch MongoDB Atlas.
  process.env.TTP_STORE = "memory";
  delete process.env.MONGODB_URI;
});

afterAll(() => {
  delete process.env.TTP_STORE;
  if (originalMongoUri) process.env.MONGODB_URI = originalMongoUri;
  else delete process.env.MONGODB_URI;
});

// Fresh module instance per test → a fresh in-memory store.
let store: typeof import("../lib/server-store");

beforeEach(async () => {
  vi.resetModules();
  process.env.TTP_STORE = "memory";
  store = await import("../lib/server-store");
});

function bookingInput(phone = "9876543210", bookingId = "BK1001") {
  return {
    phone,
    name: "Aarav Sharma",
    gotra: "Kashyap",
    city: "New Delhi",
    email: "",
    booking: {
      bookingId,
      poojaSlug: "satyanarayan-katha",
      poojaTitle: "Satyanarayan Katha",
      date: "Wed, 12 Aug",
      time: "6:00 AM",
      panditName: "Pt. Rama Krishna Sharma",
      reason: "For family peace",
      amount: 1101,
      discount: 0,
      couponCode: null,
      addonCount: 0,
      createdAt: "2026-08-12T06:00:00.000Z",
      status: "confirmed" as const,
    },
  };
}

describe("devotee store", () => {
  it("seeds the demo devotees when the store is empty", async () => {
    const users = await store.getAllUsers();
    expect(users).toHaveLength(4);
    expect(users[0].name).toBe("Aarav Sharma");
    // Seeded data is persisted — a second read returns it without re-seeding.
    expect(await store.getAllUsers()).toHaveLength(4);
  });

  it("does not re-seed once a booking exists", async () => {
    await store.upsertUserBooking(bookingInput());
    const users = await store.getAllUsers();
    expect(users).toHaveLength(1); // only the real booking, no demo data
    expect(users[0].phone).toBe("9876543210");
  });

  it("creates a profile on first booking and appends to it later", async () => {
    const first = await store.upsertUserBooking(bookingInput("9812345670", "BK1"));
    expect(first.id).toBeTruthy();
    expect(first.bookings).toHaveLength(1);

    const second = await store.upsertUserBooking(
      bookingInput("9812345670", "BK2")
    );
    expect(second.id).toBe(first.id); // same profile
    expect(second.bookings).toHaveLength(2);
    expect(second.bookings.map((b) => b.bookingId).sort()).toEqual(["BK1", "BK2"]);
  });

  it("dedupes the same bookingId", async () => {
    await store.upsertUserBooking(bookingInput("9812345670", "BK1"));
    await store.upsertUserBooking(bookingInput("9812345670", "BK1"));
    const users = await store.findUserByPhone("9812345670");
    expect(users?.bookings).toHaveLength(1);
  });

  it("finds a devotee by phone (exact match)", async () => {
    await store.upsertUserBooking(bookingInput("9123456789", "BK1"));
    expect(await store.findUserByPhone("9123456789")).toBeTruthy();
    expect(await store.findUserByPhone("9999999999")).toBeUndefined();
  });

  it("finds a booking by id across all devotees (public receipt lookup)", async () => {
    await store.upsertUserBooking(bookingInput("9812345670", "BK1001"));
    await store.upsertUserBooking(bookingInput("9123456789", "BK2002"));
    // Case-insensitive, like the site's SK… ids.
    const found = await store.findBookingById("bk1001");
    expect(found?.booking.bookingId).toBe("BK1001");
    expect(found?.user.phone).toBe("9812345670");
    expect(await store.findBookingById("NOPE")).toBeUndefined();
    expect(await store.findBookingById("")).toBeUndefined();
  });

  it("concurrent bookings on different phones all persist", async () => {
    await Promise.all([
      store.upsertUserBooking(bookingInput("9000000001", "BK1")),
      store.upsertUserBooking(bookingInput("9000000002", "BK2")),
      store.upsertUserBooking(bookingInput("9000000003", "BK3")),
    ]);
    const users = await store.getAllUsers();
    expect(users.map((u) => u.phone).sort()).toEqual([
      "9000000001",
      "9000000002",
      "9000000003",
    ]);
    expect(users.every((u) => u.bookings.length === 1)).toBe(true);
  });

  it("concurrent first bookings on the same phone merge into one profile", async () => {
    await Promise.all([
      store.upsertUserBooking(bookingInput("9000000005", "BK-A")),
      store.upsertUserBooking(bookingInput("9000000005", "BK-B")),
    ]);
    const user = await store.findUserByPhone("9000000005");
    expect(user).toBeTruthy();
    expect(user!.bookings.map((b) => b.bookingId).sort()).toEqual(["BK-A", "BK-B"]);
  });
});

describe("booking lifecycle (server)", () => {
  it("cancels a confirmed booking", async () => {
    await store.upsertUserBooking(bookingInput("9812345670", "BK1"));
    const res = await store.cancelUserBooking("9812345670", "BK1");
    expect(res.ok).toBe(true);
    expect(res.user?.bookings[0].status).toBe("cancelled");
    expect(res.user?.bookings[0].cancelledAt).toBeTruthy();
    // The mutation must survive a re-read (store round-trip), not just the
    // in-memory return value.
    const reread = await store.findUserByPhone("9812345670");
    expect(reread?.bookings[0].status).toBe("cancelled");
    expect(reread?.bookings[0].cancelledAt).toBeTruthy();
    // Cannot cancel twice
    expect((await store.cancelUserBooking("9812345670", "BK1")).ok).toBe(false);
  });

  it("refuses to cancel unknown bookings", async () => {
    expect((await store.cancelUserBooking("9812345670", "NOPE")).ok).toBe(false);
  });
});

describe("admin actions (server)", () => {
  it("deletes a devotee profile permanently", async () => {
    const user = await store.upsertUserBooking(bookingInput("9812345670", "BK1"));
    expect((await store.deleteUserRecord(user.id)).ok).toBe(true);
    expect(await store.findUserByPhone("9812345670")).toBeUndefined();
    expect((await store.deleteUserRecord(user.id)).ok).toBe(false);
  });

  it("marks a confirmed booking as refunded, not a cancelled one", async () => {
    const user = await store.upsertUserBooking(bookingInput("9812345670", "BK1"));
    const res = await store.refundUserBooking(user.id, "BK1");
    expect(res.ok).toBe(true);
    expect(res.user?.bookings[0].status).toBe("refunded");
    expect(res.user?.bookings[0].refundedAt).toBeTruthy();
    // Refunded bookings cannot be refunded again
    expect((await store.refundUserBooking(user.id, "BK1")).ok).toBe(false);
  });
});
