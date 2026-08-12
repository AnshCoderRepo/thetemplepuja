import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { createJsonStore } from "../lib/json-store";
import type { BookingRecord } from "../lib/storage";

let tmpDir: string;
let store: ReturnType<typeof createJsonStore>;

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ttp-json-"));
  process.env.TTP_DATA_DIR = tmpDir;
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.TTP_DATA_DIR;
});

beforeEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  store = createJsonStore();
});

describe("json store", () => {
  it("starts empty and round-trips catalog overrides to disk", async () => {
    expect(await store.getCatalogOverrides()).toEqual({});

    await store.saveCatalogOverrides({
      poojas: [
        {
          slug: "ganesh-pooja",
          title: "Ganesh Pooja",
          hindiTitle: "गणेश पूजा",
          emoji: "🐘",
          gradient: "from-saffron-500 to-saffron-700",
          price: 1101,
          duration: "1.5 hours",
          bestMuhurat: "Wednesday",
          description: "Worship of Lord Ganesha.",
          benefits: ["Removal of obstacles"],
        },
      ],
    });

    const reloaded = createJsonStore(); // fresh instance reads the same file
    const overrides = await reloaded.getCatalogOverrides();
    expect(overrides.poojas).toHaveLength(1);
    expect(overrides.poojas![0].slug).toBe("ganesh-pooja");
    expect(fs.existsSync(path.join(tmpDir, "catalog.json"))).toBe(true);
  });

  it("clears only the requested sections", async () => {
    await store.saveCatalogOverrides({ poojas: [], coupons: {} });
    await store.clearCatalogOverrides(["poojas"]);
    const overrides = await store.getCatalogOverrides();
    expect(overrides.poojas).toBeUndefined();
    expect(overrides.coupons).toEqual({});
  });

  it("round-trips admin credentials and sessions", async () => {
    await store.saveAdminCreds("boss@example.com", "h123abc");
    expect(await store.getAdminCreds()).toEqual({
      email: "boss@example.com",
      passwordHash: "h123abc",
    });

    await store.saveSessions({ tok_1: 111, tok_2: 222 });
    expect(await store.getSessions()).toEqual({ tok_1: 111, tok_2: 222 });
  });

  it("round-trips devotee profiles to disk (one entry per devotee)", async () => {
    expect(await store.getUsers()).toEqual([]);
    await store.saveUser({
      id: "USR1",
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "New Delhi",
      phone: "9876543210",
      email: "",
      createdAt: "2026-08-04T09:59:26.627Z",
      bookings: [
        {
          bookingId: "SK6HNM7L",
          poojaSlug: "satyanarayan-katha",
          poojaTitle: "Satyanarayan Katha",
          date: "Wed, 5 Aug",
          time: "6:00 AM",
          panditName: "Pt. Rama Krishna Sharma",
          amount: 1101,
          discount: 0,
          couponCode: null,
          addonCount: 0,
          createdAt: "2026-08-04T09:59:26.626Z",
          status: "confirmed",
        },
      ],
    });

    const reloaded = createJsonStore(); // fresh instance reads the same file
    expect(await reloaded.getUsers()).toHaveLength(1);
    expect(await reloaded.findUserByPhone("9876543210")).toBeDefined();
    expect(await reloaded.findUserById("USR1")).toBeDefined();
    expect((await reloaded.findUserByPhone("9876543210"))!.bookings[0].bookingId).toBe(
      "SK6HNM7L"
    );
    expect(await reloaded.findUserByPhone("9999999999")).toBeUndefined();
    expect(fs.existsSync(path.join(tmpDir, "users.json"))).toBe(true);
  });

  it("merges bookings onto the same devotee by phone (no duplicate profiles)", async () => {
    const base = {
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "New Delhi",
      phone: "9876543210",
      email: "",
      createdAt: "2026-08-04T09:59:26.627Z",
    };
    await store.saveUser({
      id: "USR1",
      ...base,
      bookings: [
        {
          bookingId: "BK1",
          poojaSlug: "hanuman-pooja",
          poojaTitle: "Hanuman Pooja",
          date: "Fri, 14 Aug",
          time: "7:00 PM IST",
          panditName: "Assigned by The Temple Puja",
          amount: 501,
          discount: 0,
          couponCode: null,
          addonCount: 0,
          createdAt: "2026-08-07T10:00:00.000Z",
          status: "confirmed",
        },
      ],
    });
    // A second save for the same phone (e.g. a concurrent first booking with
    // a fresh id) must merge into the existing profile, not duplicate it.
    await store.saveUser({
      id: "USRNEW2",
      ...base,
      bookings: [
        {
          bookingId: "BK2",
          poojaSlug: "lakshmi-pooja",
          poojaTitle: "Lakshmi Pooja",
          date: "Fri, 21 Aug",
          time: "9:00 AM IST",
          panditName: "Assigned by The Temple Puja",
          amount: 1101,
          discount: 0,
          couponCode: null,
          addonCount: 0,
          createdAt: "2026-08-07T11:00:00.000Z",
          status: "confirmed",
        },
      ],
    });

    const users = await store.getUsers();
    expect(users).toHaveLength(1); // one profile for the phone
    expect(users[0].bookings.map((b) => b.bookingId).sort()).toEqual(["BK1", "BK2"]);
  });

  it("persists mutations to an existing booking (cancel survives a re-save)", async () => {
    const base = {
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "New Delhi",
      phone: "9876543210",
      email: "",
      createdAt: "2026-08-04T09:59:26.627Z",
    };
    const booking = (over: Partial<BookingRecord> = {}): BookingRecord => ({
      bookingId: "BK1",
      poojaSlug: "hanuman-pooja",
      poojaTitle: "Hanuman Pooja",
      date: "Fri, 14 Aug",
      time: "7:00 PM IST",
      panditName: "Assigned by The Temple Puja",
      amount: 501,
      discount: 0,
      couponCode: null,
      addonCount: 0,
      createdAt: "2026-08-07T10:00:00.000Z",
      status: "confirmed",
      ...over,
    });

    await store.saveUser({ id: "USR1", ...base, bookings: [booking()] });

    // Cancel: re-save the profile with the same bookingId but status cancelled.
    await store.saveUser({
      id: "USR1",
      ...base,
      bookings: [
        booking({ status: "cancelled", cancelledAt: "2026-08-12T12:00:00.000Z" }),
      ],
    });

    const user = await store.findUserByPhone("9876543210");
    expect(user!.bookings).toHaveLength(1); // still one booking, not a duplicate
    expect(user!.bookings[0].status).toBe("cancelled");
    expect(user!.bookings[0].cancelledAt).toBe("2026-08-12T12:00:00.000Z");
  });

  it("deletes a devotee by id and reports whether one was removed", async () => {
    await store.saveUser({
      id: "USR1",
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "New Delhi",
      phone: "9876543210",
      email: "",
      createdAt: "2026-08-04T09:59:26.627Z",
      bookings: [],
    });
    expect(await store.deleteUserById("USR1")).toBe(true);
    expect(await store.deleteUserById("USR1")).toBe(false); // already gone
    expect(await store.getUsers()).toEqual([]);
  });
});
