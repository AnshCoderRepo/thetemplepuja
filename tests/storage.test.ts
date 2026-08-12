import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelBooking,
  clearAdminToken,
  deleteUser,
  findUserByPhone,
  getAdminToken,
  getUsers,
  isAdminSession,
  markBookingRefunded,
  rescheduleBooking,
  setAdminToken,
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

describe("rescheduleBooking", () => {
  it("moves a confirmed booking, stamps rescheduledAt and keeps the audit trail", () => {
    upsertBooking({ ...details, booking: booking() });
    const res = rescheduleBooking("9876543210", "BK1001", {
      date: "Sat, 22 Aug",
      time: "10:00 AM IST",
    });
    expect(res.ok).toBe(true);
    const b = res.user!.bookings[0];
    expect(b.status).toBe("rescheduled");
    expect(b.date).toBe("Sat, 22 Aug");
    expect(b.time).toBe("10:00 AM IST");
    expect(b.rescheduledAt).toBeTruthy();
    expect(b.previousDate).toBe("Fri, 14 Aug");
    expect(b.previousTime).toBe("7:00 PM IST");
  });

  it("allows moving an already-rescheduled booking again", () => {
    upsertBooking({ ...details, booking: booking({ status: "rescheduled" }) });
    const res = rescheduleBooking("9876543210", "BK1001", {
      date: "Sun, 23 Aug",
      time: "9:00 AM",
    });
    expect(res.ok).toBe(true);
    expect(res.user!.bookings[0].status).toBe("rescheduled");
  });

  it("moves the event seat: updates eventDateISO and keeps the previous one", () => {
    upsertBooking({
      ...details,
      booking: booking({ eventDateISO: "2026-08-20", seatCount: 1 }),
    });
    const res = rescheduleBooking("9876543210", "BK1001", {
      date: "Sat, 22 Aug",
      time: "7:00 PM IST",
      dateISO: "2026-08-22",
    });
    const b = res.user!.bookings[0];
    expect(b.eventDateISO).toBe("2026-08-22");
    expect(b.previousEventDateISO).toBe("2026-08-20");
  });

  it("refuses to reschedule cancelled or refunded bookings", () => {
    // Bookings are created confirmed, so build the refused states through the
    // real transitions (cancel / refund) rather than injecting the status.
    upsertBooking({ ...details, booking: booking() });
    expect(cancelBooking("9876543210", "BK1001").ok).toBe(true);
    expect(
      rescheduleBooking("9876543210", "BK1001", { date: "X", time: "Y" }).ok
    ).toBe(false);

    const user = upsertBooking({
      ...details,
      booking: booking({ bookingId: "BK2" }),
    });
    expect(markBookingRefunded(user.id, "BK2").ok).toBe(true);
    expect(
      rescheduleBooking("9876543210", "BK2", { date: "X", time: "Y" }).ok
    ).toBe(false);
  });

  it("refuses unknown booking ids or phones", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(
      rescheduleBooking("9876543210", "NOPE", { date: "X", time: "Y" }).ok
    ).toBe(false);
    expect(
      rescheduleBooking("9999999999", "BK1001", { date: "X", time: "Y" }).ok
    ).toBe(false);
  });

  it("a rescheduled booking can still be cancelled", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(
      rescheduleBooking("9876543210", "BK1001", {
        date: "Sat, 22 Aug",
        time: "10:00 AM IST",
      }).ok
    ).toBe(true);
    expect(cancelBooking("9876543210", "BK1001").ok).toBe(true);
    expect(findUserByPhone("9876543210")!.bookings[0].status).toBe("cancelled");
  });
});

describe("deleteUser (admin)", () => {
  it("removes the profile and all its bookings", () => {
    const user = upsertBooking({ ...details, booking: booking() });
    upsertBooking({
      ...details,
      booking: booking({ bookingId: "BK1002", poojaTitle: "Satyanarayan Katha" }),
    });
    expect(getUsers()).toHaveLength(1);

    expect(deleteUser(user.id).ok).toBe(true);
    expect(getUsers()).toHaveLength(0);
    expect(findUserByPhone("9876543210")).toBeUndefined();
  });

  it("is a no-op for an unknown id", () => {
    upsertBooking({ ...details, booking: booking() });
    expect(deleteUser("USR-NOPE").ok).toBe(false);
    expect(getUsers()).toHaveLength(1);
  });
});

describe("markBookingRefunded (admin)", () => {
  it("refunds a confirmed booking and stamps refundedAt", () => {
    const user = upsertBooking({ ...details, booking: booking() });
    const res = markBookingRefunded(user.id, "BK1001");
    expect(res.ok).toBe(true);
    expect(res.user!.bookings[0].status).toBe("refunded");
    expect(res.user!.bookings[0].refundedAt).toBeTruthy();
  });

  it("refunds a rescheduled booking too", () => {
    const user = upsertBooking({
      ...details,
      booking: booking({ status: "rescheduled" }),
    });
    expect(markBookingRefunded(user.id, "BK1001").ok).toBe(true);
  });

  it("refuses to refund a cancelled or already-refunded booking", () => {
    const user = upsertBooking({ ...details, booking: booking() });
    expect(markBookingRefunded(user.id, "BK1001").ok).toBe(true);
    expect(markBookingRefunded(user.id, "BK1001").ok).toBe(false);
  });

  it("refuses unknown user or booking ids", () => {
    const user = upsertBooking({ ...details, booking: booking() });
    expect(markBookingRefunded(user.id, "NOPE").ok).toBe(false);
    expect(markBookingRefunded("USR-NOPE", "BK1001").ok).toBe(false);
  });
});

describe("admin session (token)", () => {
  it("is logged out without a token and logged in with one", () => {
    expect(isAdminSession()).toBe(false);
    expect(getAdminToken()).toBeNull();
    setAdminToken("tok_abc123");
    expect(getAdminToken()).toBe("tok_abc123");
    expect(isAdminSession()).toBe(true);
    clearAdminToken();
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
      expect(
        rescheduleBooking("9876543210", "BK1001", { date: "X", time: "Y" }).ok
      ).toBe(false);
      expect(deleteUser("USR1").ok).toBe(false);
      expect(markBookingRefunded("USR1", "BK1001").ok).toBe(false);
      expect(isAdminSession()).toBe(false);
    } finally {
      (globalThis as { window?: unknown }).window = win;
    }
  });
});
