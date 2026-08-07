import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelBooking,
  findUserByPhone,
  getUsers,
  isAdminSession,
  setAdminSession,
  upsertBooking,
  type BookingRecord,
} from "../lib/storage";

function booking(over: Partial<BookingRecord> = {}): BookingRecord {
  return {
    bookingId: "BK1001",
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
  };
}

const details = {
  phone: "9876543210",
  name: "Aarav Sharma",
  gotra: "Kashyap",
  city: "New Delhi",
  email: "",
};

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("upsertBooking — profile lifecycle", () => {
  it("creates a new profile on the first booking", () => {
    const user = upsertBooking({ ...details, booking: booking() });
    expect(user.phone).toBe("9876543210");
    expect(user.bookings).toHaveLength(1);
    expect(user.id.startsWith("USR")).toBe(true);
    expect(findUserByPhone("9876543210")).toEqual(user);
  });

  it("appends to the same profile when the same phone books again", () => {
    upsertBooking({ ...details, booking: booking() });
    upsertBooking({
      ...details,
      booking: booking({
        bookingId: "BK1002",
        poojaSlug: "satyanarayan-katha",
        poojaTitle: "Satyanarayan Katha",
        amount: 1101,
      }),
    });
    const user = findUserByPhone("9876543210")!;
    expect(user.bookings).toHaveLength(2);
    expect(user.bookings.map((b) => b.bookingId)).toEqual(["BK1001", "BK1002"]);
  });

  it("never appends the same booking twice (duplicate-save guard)", () => {
    upsertBooking({ ...details, booking: booking() });
    upsertBooking({ ...details, booking: booking() });
    expect(findUserByPhone("9876543210")!.bookings).toHaveLength(1);
  });

  it("refreshes the devotee's details with each new booking", () => {
    upsertBooking({ ...details, booking: booking() });
    upsertBooking({
      ...details,
      name: "Aarav Sharma Updated",
      gotra: "Vashishta",
      city: "Mumbai",
      booking: booking({ bookingId: "BK1002" }),
    });
    const user = findUserByPhone("9876543210")!;
    expect(user.name).toBe("Aarav Sharma Updated");
    expect(user.gotra).toBe("Vashishta");
    expect(user.city).toBe("Mumbai");
  });

  it("persists the reason and coupon savings on the booking", () => {
    upsertBooking({
      ...details,
      booking: booking({
        reason: "For my daughter's wedding",
        amount: 351,
        discount: 150,
        couponCode: "TEMPLE30",
      }),
    });
    const saved = findUserByPhone("9876543210")!.bookings[0];
    expect(saved.reason).toBe("For my daughter's wedding");
    expect(saved.discount).toBe(150);
    expect(saved.couponCode).toBe("TEMPLE30");
  });
});

describe("findUserByPhone", () => {
  it("returns undefined for unknown or empty numbers", () => {
    expect(findUserByPhone("9999999999")).toBeUndefined();
    expect(findUserByPhone("")).toBeUndefined();
    expect(findUserByPhone("   ")).toBeUndefined();
  });

  it("trims surrounding whitespace", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(findUserByPhone("  9876543210 ")?.phone).toBe("9876543210");
  });
});

describe("cancelBooking", () => {
  it("cancels a confirmed booking and stamps cancelledAt", () => {
    upsertBooking({ ...details, booking: booking() });
    const res = cancelBooking("9876543210", "BK1001");
    expect(res.ok).toBe(true);
    expect(res.user!.bookings[0].status).toBe("cancelled");
    expect(res.user!.bookings[0].cancelledAt).toBeTruthy();
  });

  it("refuses to cancel an already-cancelled booking", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(cancelBooking("9876543210", "BK1001").ok).toBe(true);
    expect(cancelBooking("9876543210", "BK1001").ok).toBe(false);
  });

  it("refuses to cancel an unknown booking or unknown phone", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(cancelBooking("9876543210", "NOPE").ok).toBe(false);
    expect(cancelBooking("9999999999", "BK1001").ok).toBe(false);
  });
});

describe("admin session", () => {
  it("defaults to logged-out and toggles correctly", () => {
    expect(isAdminSession()).toBe(false);
    setAdminSession(true);
    expect(isAdminSession()).toBe(true);
    setAdminSession(false);
    expect(isAdminSession()).toBe(false);
  });
});

describe("SSR safety", () => {
  it("storage functions no-op when window is undefined (server render)", () => {
    const win = (globalThis as { window?: unknown }).window;
    delete (globalThis as { window?: unknown }).window;
    try {
      upsertBooking({ ...details, booking: booking() });
      expect(getUsers()).toEqual([]); // nothing persisted
      expect(findUserByPhone("9876543210")).toBeUndefined();
      expect(cancelBooking("9876543210", "BK1001").ok).toBe(false);
      expect(isAdminSession()).toBe(false);
    } finally {
      (globalThis as { window?: unknown }).window = win;
    }
  });
});
