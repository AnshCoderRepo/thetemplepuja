import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingRecord, UserProfile } from "../lib/storage";
import { reminderAlertText } from "../lib/whatsapp";

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
let reminders: typeof import("../lib/reminders");
let serverStore: typeof import("../lib/server-store");

beforeEach(async () => {
  vi.resetModules();
  process.env.TTP_STORE = "memory";
  reminders = await import("../lib/reminders");
  serverStore = await import("../lib/server-store");
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const k of [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "ADMIN_WHATSAPP_TO",
    "SITE_URL",
  ]) {
    delete process.env[k];
  }
});

function makeUser(phone: string, bookings: BookingRecord[] = []): UserProfile {
  return {
    id: "U" + phone,
    name: "Dev " + phone,
    gotra: "Kashyap",
    city: "Delhi",
    phone,
    email: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    bookings,
  };
}

function makeBooking(
  overrides: Partial<BookingRecord> = {}
): BookingRecord {
  return {
    bookingId: "SKREM1",
    poojaSlug: "ganesh-pooja",
    poojaTitle: "Ganesh Pooja",
    date: "Fri, 21 Aug",
    time: "7:00 AM",
    panditName: "Pt. Test",
    amount: 501,
    discount: 0,
    couponCode: null,
    addonCount: 0,
    createdAt: "2026-08-10T00:00:00.000Z",
    status: "confirmed",
    eventDateISO: "2026-08-21",
    ...overrides,
  };
}

describe("tomorrowISO", () => {
  it("returns the next day as YYYY-MM-DD", () => {
    expect(reminders.tomorrowISO(new Date("2026-08-20T12:00:00Z"))).toBe(
      "2026-08-21"
    );
    expect(reminders.tomorrowISO(new Date("2026-12-31T12:00:00Z"))).toBe(
      "2027-01-01"
    );
  });
});

describe("reminderAlertText", () => {
  it("greets the devotee and includes the muhurat, id and receipt link", () => {
    const t = reminderAlertText({
      bookingId: "SKREM1",
      poojaTitle: "Ganesh Pooja",
      name: "Aarav Sharma",
      phone: "9876543210",
      date: "Fri, 21 Aug",
      time: "7:00 AM",
      amount: 501,
      discount: 0,
      couponCode: null,
      receiptUrl: "https://thetemplepuja.com/booking/SKREM1?phone=9876543210",
    });
    expect(t).toContain("Namaste Aarav Sharma");
    expect(t).toContain("Ganesh Pooja is TOMORROW");
    expect(t).toContain("Fri, 21 Aug · 7:00 AM");
    expect(t).toContain("SKREM1");
    expect(t).toContain("View your booking: https://thetemplepuja.com");
  });
});

describe("dueReminderBookings", () => {
  const target = "2026-08-21";

  it("picks confirmed/rescheduled bookings on the target date, once each", () => {
    const users = [
      makeUser("9876543210", [
        makeBooking({ eventDateISO: target }), // due
        makeBooking({ bookingId: "SKREM2", status: "cancelled", eventDateISO: target }), // cancelled
        makeBooking({ bookingId: "SKREM3", status: "refunded", eventDateISO: target }), // refunded
        makeBooking({ bookingId: "SKREM4", eventDateISO: "2026-08-22" }), // other date
        makeBooking({ bookingId: "SKREM5", eventDateISO: undefined }), // no muhurat date (non-event)
        makeBooking({ bookingId: "SKREM6", status: "rescheduled", eventDateISO: target }), // due
        makeBooking({ bookingId: "SKREM7", eventDateISO: target, reminderSentForDate: target }), // already reminded
      ]),
    ];
    const due = reminders.dueReminderBookings(users, target);
    expect(due.map((d) => d.booking.bookingId).sort()).toEqual([
      "SKREM1",
      "SKREM6",
    ]);
  });
});

describe("sendBookingRemindersFor", () => {
  it("marks nothing and reports failures when Twilio isn't configured", async () => {
    await serverStore.upsertUserBooking({
      phone: "9876543210",
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "Delhi",
      email: "",
      booking: makeBooking({ eventDateISO: "2026-08-21" }),
    });
    const users = await serverStore.getAllUsers();
    const summary = await reminders.sendBookingRemindersFor(users, "2026-08-21");

    expect(summary).toMatchObject({ total: 1, due: 1, sent: 0, failed: 1 });
    const user = await serverStore.findUserByPhone("9876543210");
    expect(user?.bookings[0].reminderSentForDate).toBeUndefined();
  });

  it("sends, stamps the booking, and is idempotent on a second run", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await serverStore.upsertUserBooking({
      phone: "9876543210",
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "Delhi",
      email: "",
      booking: makeBooking({ eventDateISO: "2026-08-21" }),
    });
    const users = await serverStore.getAllUsers();

    const first = await reminders.sendBookingRemindersFor(users, "2026-08-21");
    expect(first).toMatchObject({ total: 1, due: 1, sent: 1, failed: 0 });

    // The devotee's WhatsApp number got the message.
    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain("To=whatsapp%3A%2B919876543210");
    expect(body).toContain("Body=");

    // Booking is stamped for this date.
    const user = await serverStore.findUserByPhone("9876543210");
    expect(user?.bookings[0].reminderSentForDate).toBe("2026-08-21");

    // Second run: nothing due, nothing re-sent.
    const again = await reminders.sendBookingRemindersFor([user!], "2026-08-21");
    expect(again).toMatchObject({ total: 1, skipped: 1, due: 0, sent: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports failed sends and does not stamp (retryable later)", async () => {
    process.env.TWILIO_ACCOUNT_SID = "AC123";
    process.env.TWILIO_AUTH_TOKEN = "tok123";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 }))
    );

    await serverStore.upsertUserBooking({
      phone: "9876543210",
      name: "Aarav Sharma",
      gotra: "Kashyap",
      city: "Delhi",
      email: "",
      booking: makeBooking({ eventDateISO: "2026-08-21" }),
    });
    const users = await serverStore.getAllUsers();

    const summary = await reminders.sendBookingRemindersFor(users, "2026-08-21");
    expect(summary).toMatchObject({ total: 1, due: 1, sent: 0, failed: 1 });

    const user = await serverStore.findUserByPhone("9876543210");
    expect(user?.bookings[0].reminderSentForDate).toBeUndefined();
  });
});

describe("sendBookingReminders", () => {
  it("runs against the live store and finds nothing due (demo users have no muhurat date)", async () => {
    const summary = await reminders.sendBookingReminders(
      new Date("2026-08-20T12:00:00Z")
    );
    expect(summary.total).toBe(0);
    expect(summary.sent).toBe(0);
  });
});
