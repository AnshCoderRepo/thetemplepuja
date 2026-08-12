// Server-side WhatsApp messages via the Twilio REST API — to the admin on
// every booking event AND to the devotee when their booking is confirmed or
// cancelled. Never import this from a client component.
//
// Configuration (environment variables, all optional):
//   TWILIO_ACCOUNT_SID      — Twilio account SID
//   TWILIO_AUTH_TOKEN       — Twilio auth token
//   TWILIO_WHATSAPP_FROM    — Twilio WhatsApp sender, e.g. "whatsapp:+14155238886"
//   ADMIN_WHATSAPP_TO       — the admin's WhatsApp, defaults to the site's
//                             contact number (whatsapp:+918765301563)
//   SITE_URL                — public origin used for the receipt link in the
//                             devotee message (e.g. https://thetemplepuja.com).
//                             Falls back to the request's Host header / localhost.
//
// When any credential is missing the helpers are safe no-ops, so the site
// works (and tests pass) without Twilio. Sends are fire-and-forget from the
// API routes and swallow failures internally — a slow or down Twilio never
// blocks or breaks a booking.

import { formatINR } from "./format";

const TWILIO_API = "https://api.twilio.com/2010-04-01/Accounts";
const SEND_TIMEOUT_MS = 8_000;
const DEFAULT_ADMIN_WHATSAPP = "whatsapp:+918765301563";

export interface BookingAlertInfo {
  bookingId: string;
  poojaTitle: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  amount: number;
  discount: number;
  couponCode: string | null;
  reason?: string;
  /** Public receipt link (e.g. https://site/booking/SKABC123?phone=…). */
  receiptUrl?: string;
}

function whatsappConfig() {
  return {
    sid: process.env.TWILIO_ACCOUNT_SID ?? "",
    token: process.env.TWILIO_AUTH_TOKEN ?? "",
    from: process.env.TWILIO_WHATSAPP_FROM ?? "",
    to: process.env.ADMIN_WHATSAPP_TO ?? DEFAULT_ADMIN_WHATSAPP,
  };
}

/** True when the credentials to actually send a message are present. */
export function whatsappConfigured(): boolean {
  const c = whatsappConfig();
  return Boolean(c.sid && c.token && c.from && c.to);
}

/** The devotee's WhatsApp number (whatsapp:+91…) from a 10-digit mobile. */
export function devoteeWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `whatsapp:+91${digits}` : null;
}

/** Build the public receipt URL used inside the devotee message. */
export function receiptUrlFor(
  host: string | null,
  bookingId: string,
  phone: string
): string {
  const base =
    process.env.SITE_URL ??
    (host ? `http://${host}` : "http://localhost:3000");
  return `${base}/booking/${encodeURIComponent(bookingId)}?phone=${encodeURIComponent(
    phone
  )}`;
}

/** The WhatsApp message for a newly confirmed booking (sent to the admin). */
export function bookingAlertText(info: BookingAlertInfo): string {
  const lines = [
    "🙏 New Booking — The Temple Puja",
    "",
    `Booking ID: ${info.bookingId}`,
    `Pooja: ${info.poojaTitle}`,
    `Devotee: ${info.name} (${info.phone})`,
    `Muhurat: ${info.date} · ${info.time}`,
    `Amount: ${formatINR(info.amount)}`,
    info.discount > 0 && info.couponCode
      ? `Coupon: ${info.couponCode} (saved ${formatINR(info.discount)})`
      : null,
    info.reason ? `Reason: ${info.reason}` : null,
    "Status: CONFIRMED ✅",
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

/** The WhatsApp confirmation sent to the devotee after a successful booking. */
export function devoteeBookingAlertText(info: BookingAlertInfo): string {
  const lines = [
    `🙏 Namaste ${info.name}! Your pooja booking is CONFIRMED.`,
    "",
    `Booking ID: ${info.bookingId}`,
    `Pooja: ${info.poojaTitle}`,
    `Muhurat: ${info.date} · ${info.time}`,
    `Amount paid: ${formatINR(info.amount)}`,
    info.discount > 0 && info.couponCode
      ? `Coupon ${info.couponCode} applied — you saved ${formatINR(
          info.discount
        )} 🎉`
      : null,
    info.receiptUrl ? `View your receipt: ${info.receiptUrl}` : null,
    "",
    "Om Shanti 🪔",
    "— The Temple Puja",
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

/** The WhatsApp message for a cancelled booking (sent to the admin). */
export function cancelAlertText(info: BookingAlertInfo): string {
  const lines = [
    "↩️ Booking Cancelled — The Temple Puja",
    "",
    `Booking ID: ${info.bookingId}`,
    `Pooja: ${info.poojaTitle}`,
    `Devotee: ${info.name} (${info.phone})`,
    `Muhurat was: ${info.date} · ${info.time}`,
    `Refund of ${formatINR(info.amount)} initiated (5–7 business days)`,
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

/** The day-before reminder sent to the devotee for an upcoming muhurat. */
export function reminderAlertText(info: BookingAlertInfo): string {
  const lines = [
    `🙏 Namaste ${info.name}!`,
    "",
    `Gentle reminder: your ${info.poojaTitle} is TOMORROW.`,
    `Muhurat: ${info.date} · ${info.time}`,
    `Booking ID: ${info.bookingId}`,
    "",
    "Our pandit ji will keep your sankalp in mind. We look forward to serving you.",
    info.receiptUrl ? `View your booking: ${info.receiptUrl}` : null,
    "",
    "Om Shanti 🪔",
    "— The Temple Puja",
  ];
  return lines.filter((l): l is string => Boolean(l)).join("\n");
}

/** The WhatsApp cancellation notice sent to the devotee. */
export function devoteeCancelAlertText(info: BookingAlertInfo): string {
  const lines = [
    `🙏 Namaste ${info.name},`,
    "",
    `Your booking ${info.bookingId} (${info.poojaTitle}) has been cancelled as requested.`,
    `A refund of ${formatINR(info.amount)} will be processed within 5–7 business days.`,
    "",
    "If you'd like to rebook, visit our website anytime.",
    "— The Temple Puja",
  ];
  return lines.join("\n");
}

/** Send one WhatsApp message to any recipient. Never throws; returns whether
 * the send was accepted. No-op (false) when Twilio isn't configured. */
export async function sendWhatsApp(to: string, text: string): Promise<boolean> {
  const c = whatsappConfig();
  if (!c.sid || !c.token || !c.from || !to) return false;
  try {
    const res = await fetch(`${TWILIO_API}/${c.sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${c.sid}:${c.token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: c.from,
        To: to,
        Body: text,
      }).toString(),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    return res.ok;
  } catch (err) {
    console.error(
      "[whatsapp] send failed:",
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/** Send a WhatsApp message to the admin. */
export async function sendAdminWhatsApp(text: string): Promise<boolean> {
  return sendWhatsApp(whatsappConfig().to, text);
}

/** Fire-and-forget alerts used by the API routes: the admin is notified and
 * the devotee receives their confirmation on WhatsApp. */
export function notifyBookingConfirmed(info: BookingAlertInfo): void {
  void sendAdminWhatsApp(bookingAlertText(info));
  const to = devoteeWhatsAppNumber(info.phone);
  if (to) void sendWhatsApp(to, devoteeBookingAlertText(info));
}

/** Fire-and-forget alerts when a booking is cancelled: admin + devotee. */
export function notifyBookingCancelled(info: BookingAlertInfo): void {
  void sendAdminWhatsApp(cancelAlertText(info));
  const to = devoteeWhatsAppNumber(info.phone);
  if (to) void sendWhatsApp(to, devoteeCancelAlertText(info));
}
