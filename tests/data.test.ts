import { describe, expect, it } from "vitest";
import {
  activePoojas,
  coupons,
  eventBookedSeats,
  getPooja,
  getUpcomingEvents,
  isEventFull,
  isPoojaActive,
  poojas,
  seatsLabel,
  withEventBookedSeats,
} from "../lib/data";
import { cancelIn, rescheduleIn, type BookingRecord, type UserProfile } from "../lib/storage";

function booking(
  partial: Partial<BookingRecord> & { bookingId: string }
): BookingRecord {
  return {
    poojaSlug: "hanuman-pooja",
    poojaTitle: "Hanuman Pooja",
    date: "Thu, 20 Aug",
    time: "7:00 PM IST",
    panditName: "Assigned by The Temple Puja",
    amount: 501,
    discount: 0,
    couponCode: null,
    addonCount: 0,
    createdAt: "2026-08-12T05:00:00.000Z",
    status: "confirmed",
    ...partial,
  };
}

describe("pooja catalog", () => {
  it("has 12 poojas with unique slugs and positive prices", () => {
    expect(poojas).toHaveLength(12);
    const slugs = new Set(poojas.map((p) => p.slug));
    expect(slugs.size).toBe(12);
    for (const p of poojas) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  it("getPooja finds a pooja by slug and returns undefined for unknown slugs", () => {
    expect(getPooja("hanuman-pooja")?.price).toBe(501);
    expect(getPooja("satyanarayan-katha")?.title).toBe("Satyanarayan Katha");
    expect(getPooja("does-not-exist")).toBeUndefined();
  });

  it("every default pooja is active (missing flag counts as active)", () => {
    for (const p of poojas) expect(isPoojaActive(p)).toBe(true);
  });

  it("activePoojas hides admin-deactivated poojas and keeps the rest", () => {
    const [satya, rudra] = poojas;
    const hidden = { ...rudra, active: false };
    const visible = activePoojas([satya, hidden]);
    expect(visible).toEqual([satya]);

    // Legacy data without the field still shows.
    const legacy = { ...satya, active: undefined };
    expect(isPoojaActive(legacy)).toBe(true);
    expect(activePoojas([legacy, hidden])).toEqual([legacy]);
  });
});

describe("coupon registry integrity", () => {
  it("defines every coupon the UI advertises", () => {
    expect(Object.keys(coupons).sort()).toEqual([
      "BUNDLE20",
      "MUHURAT",
      "TEMPLE30",
      "TEMPLEKUNDLI",
    ]);
  });

  it("TEMPLE30 is a 30% first-booking-only discount", () => {
    expect(coupons.TEMPLE30.kind).toBe("percent");
    expect(coupons.TEMPLE30.value).toBe(30);
    expect(coupons.TEMPLE30.firstBookingOnly).toBe(true);
  });

  it("BUNDLE20 requires 3+ bookings", () => {
    expect(coupons.BUNDLE20.kind).toBe("percent");
    expect(coupons.BUNDLE20.value).toBe(20);
    expect(coupons.BUNDLE20.minBookings).toBe(3);
  });

  it("TEMPLEKUNDLI is a benefit with a ₹1,500 minimum", () => {
    expect(coupons.TEMPLEKUNDLI.kind).toBe("benefit");
    expect(coupons.TEMPLEKUNDLI.minAmount).toBe(1500);
  });

  it("MUHURAT is a free benefit with no restrictions", () => {
    expect(coupons.MUHURAT.kind).toBe("benefit");
    expect(coupons.MUHURAT.firstBookingOnly).toBeUndefined();
    expect(coupons.MUHURAT.minBookings).toBeUndefined();
    expect(coupons.MUHURAT.minAmount).toBeUndefined();
  });
});

describe("event seat inventory", () => {
  // Fixed "today" so the computed event dates are deterministic.
  const today = new Date("2026-08-07T12:00:00");
  const hanuman = getUpcomingEvents(today).find(
    (e) => e.slug === "hanuman-pooja"
  )!; // dateISO = 2026-08-15

  it("counts only confirmed/rescheduled bookings for that event occurrence", () => {
    const bookings = [
      booking({ bookingId: "A", eventDateISO: hanuman.dateISO, seatCount: 1 }),
      booking({ bookingId: "B", eventDateISO: hanuman.dateISO, status: "rescheduled" }),
      booking({ bookingId: "C", eventDateISO: hanuman.dateISO, status: "cancelled" }),
      booking({ bookingId: "D", eventDateISO: hanuman.dateISO, status: "refunded" }),
      booking({ bookingId: "E", eventDateISO: "2026-08-16" }), // another occurrence
      booking({ bookingId: "F", poojaSlug: "rudrabhishek", eventDateISO: hanuman.dateISO }),
    ];
    expect(eventBookedSeats(hanuman, bookings)).toBe(2);
  });

  it("sums seatCount and defaults to 1 when absent", () => {
    const bookings = [
      booking({ bookingId: "A", eventDateISO: hanuman.dateISO, seatCount: 2 }),
      booking({ bookingId: "B", eventDateISO: hanuman.dateISO }),
    ];
    expect(eventBookedSeats(hanuman, bookings)).toBe(3);
  });

  it("counts against the spec's computed date when given a spec", () => {
    const spec = { slug: "hanuman-pooja", daysFromToday: 8 };
    const bookings = [booking({ bookingId: "A", eventDateISO: "2026-08-15" })];
    expect(eventBookedSeats(spec, bookings, today)).toBe(1);
  });

  it("seatsLabel shows a live count when capacity is set, else the text label", () => {
    expect(seatsLabel({ capacity: 20, bookedSeats: 3 })).toBe("17 of 20 seats left");
    expect(seatsLabel({ capacity: 20, bookedSeats: 20 })).toBe("Fully booked");
    expect(seatsLabel({ capacity: 20, bookedSeats: 25 })).toBe("Fully booked"); // clamped
    expect(seatsLabel({ seats: "Only 12 seats left" })).toBe("Only 12 seats left");
    expect(seatsLabel({})).toBe("Open");
  });

  it("isEventFull only when every seat is taken", () => {
    expect(isEventFull({ capacity: 10, bookedSeats: 10 })).toBe(true);
    expect(isEventFull({ capacity: 10, bookedSeats: 9 })).toBe(false);
    expect(isEventFull({ seats: "Only 1 seat left" })).toBe(false); // no capacity
  });

  it("rescheduling an event booking moves its seat to the new occurrence", () => {
    const users: UserProfile[] = [
      {
        id: "USR1",
        name: "Devotee",
        gotra: "Kaushik",
        city: "Indore",
        phone: "9000000015",
        email: "",
        createdAt: "2026-08-12T05:00:00.000Z",
        bookings: [
          booking({ bookingId: "SK1", eventDateISO: "2026-08-15", seatCount: 1 }),
        ],
      },
    ];
    const oldDate = { slug: "hanuman-pooja", dateISO: "2026-08-15" };
    const newDate = { slug: "hanuman-pooja", dateISO: "2026-08-22" };
    const booked = (ev: { slug: string; dateISO: string }) =>
      eventBookedSeats(ev, users.flatMap((u) => u.bookings));

    expect(booked(oldDate)).toBe(1);
    expect(booked(newDate)).toBe(0);

    const { ok } = rescheduleIn(users, "9000000015", "SK1", {
      date: "Sat, 22 Aug",
      time: "7:00 PM IST",
      dateISO: "2026-08-22",
    });
    expect(ok).toBe(true);

    expect(booked(oldDate)).toBe(0); // old seat freed
    expect(booked(newDate)).toBe(1); // new seat taken
  });

  it("cancelling a booking frees its seat automatically (auto seat release)", () => {
    const users: UserProfile[] = [
      {
        id: "USR1",
        name: "Devotee",
        gotra: "Kaushik",
        city: "Indore",
        phone: "9000000015",
        email: "",
        createdAt: "2026-08-12T05:00:00.000Z",
        bookings: [
          booking({ bookingId: "SK1", eventDateISO: hanuman.dateISO, seatCount: 1 }),
        ],
      },
    ];
    const booked = () => eventBookedSeats(hanuman, users.flatMap((u) => u.bookings));
    expect(booked()).toBe(1);

    const { ok } = cancelIn(users, "9000000015", "SK1");
    expect(ok).toBe(true);
    expect(booked()).toBe(0); // the seat is free again
  });

  it("withEventBookedSeats attaches bookedSeats to every spec", () => {
    const specs = [
      {
        title: "Hanuman Pooja",
        slug: "hanuman-pooja",
        daysFromToday: 8,
        time: "7:00 PM IST",
        seats: "open",
        live: true,
        price: "₹501",
        emoji: "🐒",
        gradient: "from-orange-400 to-rose-500",
        capacity: 20,
      },
      {
        title: "Rudrabhishek",
        slug: "rudrabhishek",
        daysFromToday: 12,
        time: "5:00 AM IST",
        seats: "open",
        live: true,
        price: "₹2,501",
        emoji: "🕉️",
        gradient: "from-indigo-500 to-purple-600",
        capacity: 15,
      },
    ];
    const enriched = withEventBookedSeats(
      specs,
      [booking({ bookingId: "A", eventDateISO: "2026-08-15", seatCount: 1 })],
      today
    );
    expect(enriched.find((s) => s.slug === "hanuman-pooja")?.bookedSeats).toBe(1);
    expect(enriched.find((s) => s.slug === "rudrabhishek")?.bookedSeats).toBe(0);
  });
});

describe("upcoming events", () => {
  // Fixed "today" so results are deterministic no matter when the tests run.
  const today = new Date("2026-08-07T12:00:00");

  it("never returns a past date", () => {
    for (const e of getUpcomingEvents(today)) {
      expect(e.dateISO >= "2026-08-07").toBe(true);
    }
  });

  it("returns events sorted soonest-first", () => {
    const dates = getUpcomingEvents(today).map((e) => e.dateISO);
    expect([...dates].sort()).toEqual(dates);
  });

  it("computes dates from the daysFromToday offsets", () => {
    const events = getUpcomingEvents(today);
    expect(events.find((e) => e.slug === "hanuman-pooja")?.dateISO).toBe(
      "2026-08-15" // today + 8 days
    );
    expect(events.find((e) => e.slug === "satyanarayan-katha")?.dateISO).toBe(
      "2026-08-17" // today + 10 days
    );
  });

  it("is deterministic for the same input date", () => {
    expect(getUpcomingEvents(today)).toEqual(getUpcomingEvents(today));
  });

  it("drops specs whose computed date has already passed", () => {
    const spec = (slug: string, daysFromToday: number) => ({
      title: `${slug} Pooja`,
      slug,
      daysFromToday,
      time: "9:00 AM IST",
      seats: "open",
      live: true,
      price: "₹501",
      emoji: "🪔",
      gradient: "from-saffron-500 to-maroon-700",
    });
    const events = getUpcomingEvents(today, [
      spec("past", -2),
      spec("today", 0),
      spec("future", 5),
    ]);
    expect(events.map((e) => e.slug)).toEqual(["today", "future"]);
  });
});
