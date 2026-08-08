import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { createJsonStore } from "../lib/json-store";

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

  it("round-trips devotee profiles to disk", async () => {
    expect(await store.getUsers()).toEqual([]);
    await store.saveUsers([
      {
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
      },
    ]);

    const reloaded = createJsonStore(); // fresh instance reads the same file
    const users = await reloaded.getUsers();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Aarav Sharma");
    expect(users[0].bookings[0].bookingId).toBe("SK6HNM7L");
    expect(fs.existsSync(path.join(tmpDir, "users.json"))).toBe(true);
  });
});
