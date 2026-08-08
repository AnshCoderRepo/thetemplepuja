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

// Fresh module instance per test → a fresh in-memory store, so tests are
// isolated from each other's writes.
let store: typeof import("../lib/server-store");

beforeEach(async () => {
  vi.resetModules();
  process.env.TTP_STORE = "memory";
  store = await import("../lib/server-store");
});

describe("catalog store", () => {
  it("resolves to the static defaults when no overrides exist", async () => {
    const c = await store.getResolvedCatalog();
    expect(c.poojas).toHaveLength(12);
    expect(c.events).toHaveLength(6);
    expect(Object.keys(c.coupons).sort()).toEqual([
      "BUNDLE20",
      "MUHURAT",
      "TEMPLE30",
      "TEMPLEKUNDLI",
    ]);
  });

  it("merges saved overrides over the defaults", async () => {
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

    const c = await store.getResolvedCatalog();
    expect(c.poojas).toHaveLength(1);
    expect(c.poojas[0].slug).toBe("ganesh-pooja");
    // untouched sections still resolve to defaults
    expect(c.events).toHaveLength(6);
  });

  it("clears only the requested sections", async () => {
    await store.saveCatalogOverrides({ poojas: [], coupons: {} });
    await store.clearCatalogOverrides(["poojas"]);
    const c = await store.getResolvedCatalog();
    expect(c.poojas).toHaveLength(12); // back to defaults
    expect(Object.keys(c.coupons)).toHaveLength(0); // coupon override kept
  });
});

describe("admin credentials", () => {
  it("defaults to the demo account and bcrypt-hashes the password", async () => {
    const creds = await store.getAdminCreds();
    expect(creds.email).toBe("admin@thetemplepuja.com");
    expect(creds.passwordHash.startsWith("$2b$")).toBe(true);
    expect(await store.verifyAdminLogin("admin@thetemplepuja.com", "admin123")).toBe(
      true
    );
    expect(await store.adminCredsAreDefault()).toBe(true);
    const hashed = await store.hashPassword("admin123");
    expect(hashed).toMatch(/^\$2[aby]\$10\$/);
    expect(hashed).not.toContain("admin123");
  });

  it("rejects wrong credentials but matches email case-insensitively", async () => {
    expect(await store.verifyAdminLogin("admin@thetemplepuja.com", "nope")).toBe(
      false
    );
    expect(await store.verifyAdminLogin("other@example.com", "admin123")).toBe(
      false
    );
    expect(
      await store.verifyAdminLogin("ADMIN@THETEMPLEPUJA.COM", "admin123")
    ).toBe(true);
  });

  it("verifies with saved credentials and reports non-default state", async () => {
    await store.saveAdminCreds(
      "boss@thetemplepuja.com",
      await store.hashPassword("secret99")
    );
    expect(await store.verifyAdminLogin("boss@thetemplepuja.com", "secret99")).toBe(
      true
    );
    expect(await store.verifyAdminLogin("boss@thetemplepuja.com", "wrong")).toBe(
      false
    );
    expect(await store.verifyAdminLogin("admin@thetemplepuja.com", "admin123")).toBe(
      false
    );
    expect(await store.adminCredsAreDefault()).toBe(false);
  });

  it("migrates a legacy djb2 hash to bcrypt on first successful login", async () => {
    // Old-format hash of "admin123" — as stored by previous versions.
    await store.saveAdminCreds(
      "admin@thetemplepuja.com",
      store.legacyHashPassword("admin123")
    );
    expect(await store.verifyAdminLogin("admin@thetemplepuja.com", "admin123")).toBe(
      true
    );
    const creds = await store.getAdminCreds();
    expect(creds.passwordHash.startsWith("$2b$")).toBe(true); // migrated
    // And the migrated hash still verifies.
    expect(await store.verifyAdminLogin("admin@thetemplepuja.com", "admin123")).toBe(
      true
    );
  });
});

describe("session tokens", () => {
  it("creates valid tokens and invalidates them", async () => {
    const token = await store.createSessionToken();
    expect(token.startsWith("tok_")).toBe(true);
    expect(await store.isValidSessionToken(token)).toBe(true);

    await store.invalidateSessionToken(token);
    expect(await store.isValidSessionToken(token)).toBe(false);
  });

  it("rejects garbage and missing tokens", async () => {
    expect(await store.isValidSessionToken(null)).toBe(false);
    expect(await store.isValidSessionToken(undefined)).toBe(false);
    expect(await store.isValidSessionToken("tok_nope")).toBe(false);
    expect(await store.isValidSessionToken("")).toBe(false);
  });
});
