// Day-before WhatsApp reminders for upcoming muhurats. A booking is due when
// its machine-readable muhurat (eventDateISO — set for live-event slots) is
// tomorrow and it hasn't already been reminded for that exact date. Runs from
// the /api/cron/booking-reminders route, which a scheduler (Vercel Cron,
// GitHub Actions, Windows Task Scheduler, …) should call once per day.
// Never import this from a client component.
import {
  devoteeWhatsAppNumber,
  receiptUrlFor,
  reminderAlertText,
  sendWhatsApp,
} from "./whatsapp";
import { getAllUsers, markBookingReminded } from "./server-store";
import type { BookingRecord, UserProfile } from "./storage";

/** Tomorrow's date as YYYY-MM-DD in the server's local timezone — the same
 * semantics lib/data.ts uses to build event muhurats (toISODate), so dates
 * always line up. */
export function tomorrowISO(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

/** The bookings happening on `targetISO` (YYYY-MM-DD) that still need a
 * reminder — confirmed/rescheduled, with a muhurat date, and not already
 * reminded for that date. Pure and fully testable. */
export function dueReminderBookings(
  users: UserProfile[],
  targetISO: string
): { user: UserProfile; booking: BookingRecord }[] {
  const due: { user: UserProfile; booking: BookingRecord }[] = [];
  for (const user of users) {
    for (const booking of user.bookings) {
      const active =
        booking.status === "confirmed" || booking.status === "rescheduled";
      if (
        active &&
        booking.eventDateISO === targetISO &&
        booking.reminderSentForDate !== targetISO
      ) {
        due.push({ user, booking });
      }
    }
  }
  return due;
}

export interface ReminderSummary {
  /** Bookings happening on the target date (incl. already-reminded). */
  total: number;
  /** Already reminded for this date — skipped. */
  skipped: number;
  /** Still due — reminders attempted for these. */
  due: number;
  /** Reminders actually sent (and the booking stamped). */
  sent: number;
  /** Due bookings where the send was rejected (no Twilio, bad number, etc.). */
  failed: number;
}

/** Send the day-before reminders for one target date across a set of users.
 * Fire-and-forget per devotee; a booking is only stamped as reminded once its
 * send succeeded, so an unconfigured/down Twilio lets a later run retry.
 * Returns a summary (never throws). */
export async function sendBookingRemindersFor(
  users: UserProfile[],
  targetISO: string
): Promise<ReminderSummary> {
  const all = users.flatMap((user) =>
    user.bookings
      .filter(
        (b) =>
          (b.status === "confirmed" || b.status === "rescheduled") &&
          b.eventDateISO === targetISO
      )
      .map((booking) => ({ user, booking }))
  );
  const skipped = all.filter(
    ({ booking }) => booking.reminderSentForDate === targetISO
  ).length;
  const due = all.filter(
    ({ booking }) => booking.reminderSentForDate !== targetISO
  );

  let sent = 0;
  let failed = 0;
  for (const { user, booking } of due) {
    const to = devoteeWhatsAppNumber(user.phone);
    if (!to) {
      failed++;
      continue;
    }
    const ok = await sendWhatsApp(
      to,
      reminderAlertText({
        bookingId: booking.bookingId,
        poojaTitle: booking.poojaTitle,
        name: user.name,
        phone: user.phone,
        date: booking.date,
        time: booking.time,
        amount: booking.amount,
        discount: booking.discount ?? 0,
        couponCode: booking.couponCode ?? null,
        // SITE_URL when configured, else the localhost fallback — set
        // SITE_URL in production so the link points at the real site.
        receiptUrl: receiptUrlFor(null, booking.bookingId, user.phone),
      })
    );
    if (ok) {
      sent++;
      // Stamp AFTER a successful send so a failed/absent Twilio retries later.
      await markBookingReminded(user.phone, booking.bookingId, targetISO);
    } else {
      failed++;
    }
  }
  return { total: all.length, skipped, due: due.length, sent, failed };
}

/** Run the reminder job for "tomorrow" against the live store. Used by the
 * cron route. Never throws. */
export async function sendBookingReminders(
  now: Date = new Date()
): Promise<ReminderSummary> {
  const target = tomorrowISO(now);
  const users = await getAllUsers();
  return sendBookingRemindersFor(users, target);
}
