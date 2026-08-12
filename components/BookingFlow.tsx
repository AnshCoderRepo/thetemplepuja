"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  Copy,
  FileText,
  Lock,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { submitBooking, syncUserFromServer } from "@/lib/api";
import { activePoojas, poojas, type Pooja } from "@/lib/data";
import { isValidIndianPhone, validateBookingInput } from "@/lib/validation";
import { formatINR } from "@/lib/format";
import { useCatalog } from "./useCatalog";
import RazorpayCheckout, {
  type AppliedCoupon,
  type CheckoutSummary,
  type PaymentProof,
} from "./RazorpayCheckout";

interface ConfirmedBooking {
  id: string;
  total: number;
  discount: number;
  coupon: AppliedCoupon | null;
  date: string; // display, e.g. "Wed, 12 Aug"
  time: string; // display, e.g. "7:00 PM IST" or "—"
  panditName: string | null;
  name: string;
  poojaTitle: string;
  reason: string;
}

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

interface Props {
  pooja?: Pooja;
  initialDate?: string | null;
  initialTime?: string | null;
}

export default function BookingFlow({
  pooja,
  initialDate = null,
  initialTime = null,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    gotra: "",
    city: "",
    phone: "",
    reason: "",
  });
  const [prayerSlug, setPrayerSlug] = useState(pooja?.slug ?? "");
  // The date is only ever provided by a fixed event slot — never chosen in
  // the form itself, so it doesn't need to be state.
  const date = initialDate ?? "";
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingData, setBookingData] = useState<ConfirmedBooking | null>(null);
  const [paymentProof, setPaymentProof] = useState<PaymentProof | undefined>(undefined);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [formError, setFormError] = useState("");

  // Admin-managed catalog (poojas + coupons) from the backend. Initial render
  // uses the static defaults so SSR matches; once fetched we swap in the
  // server catalog.
  const { poojas: catalogPoojas, coupons: catalogCoupons } = useCatalog();

  const selectedPooja = catalogPoojas.find((p) => p.slug === prayerSlug);
  const basePrice = selectedPooja?.price ?? 0;

  // First-booking coupon rules should see the devotee's real history, not just
  // this browser's cache — pull the profile from the server when a phone is
  // entered so eligibility at checkout is judged against cross-device truth.
  useEffect(() => {
    if (isValidIndianPhone(form.phone)) {
      void syncUserFromServer(form.phone);
    }
  }, [form.phone]);

  // The total shown on the form is the base price — coupons are applied at the
  // secure payment checkout, which reports the final amount back.
  const total = basePrice;

  const fromEvent = Boolean(initialDate);
  const phoneValid = isValidIndianPhone(form.phone);
  const input = {
    prayerSlug,
    name: form.name,
    gotra: form.gotra,
    city: form.city,
    reason: form.reason,
    phone: form.phone,
  };
  const detailsValid = validateBookingInput(input).length === 0;

  // Modal's onSuccess stores the booking; the confirmation screen only appears
  // after the modal's "Done" closes it, so the modal success phase stays visible.
  const handleSuccess = (
    id: string,
    payment?: PaymentProof,
    summary?: CheckoutSummary
  ) => {
    setPaymentProof(payment);
    setBookingData({
      id,
      total: summary?.amount ?? total,
      discount: summary?.discount ?? 0,
      coupon: summary?.coupon ?? null,
      date: date ? formatDate(date) : "To be confirmed",
      time: initialTime ?? "—",
      panditName: null,
      name: form.name.trim() || "Devotee",
      poojaTitle: selectedPooja?.title ?? "Pooja",
      reason: form.reason.trim(),
    });
  };

  const handleCheckoutClose = async () => {
    setCheckoutOpen(false);
    if (bookingData && selectedPooja) {
      // Persist the devotee's profile + booking (creates a fresh profile on
      // first payment, appends to it on later bookings from the same number).
      // The server is the authority — if it rejects the booking (e.g. a real
      // payment failed signature verification) we show an error instead of a
      // false confirmation, and the optimistic local copy is rolled back.
      const res = await submitBooking({
        phone: form.phone.trim(),
        name: form.name.trim(),
        gotra: form.gotra.trim(),
        city: form.city.trim(),
        email: "",
        booking: {
          bookingId: bookingData.id,
          poojaSlug: selectedPooja.slug,
          poojaTitle: selectedPooja.title,
          date: bookingData.date,
          time: bookingData.time,
          panditName: bookingData.panditName ?? "Assigned by The Temple Puja",
          reason: bookingData.reason,
          amount: bookingData.total,
          discount: bookingData.discount,
          couponCode: bookingData.coupon?.code ?? null,
          addonCount: 0,
          createdAt: new Date().toISOString(),
          status: "confirmed",
          // Live-event slot: tag the occurrence and the seat it holds, so the
          // event's remaining capacity counts it (and releases it on cancel).
          eventDateISO: date ? date : undefined,
          seatCount: date ? 1 : undefined,
          // Verified real payment (present only when Razorpay was used).
          razorpayOrderId: paymentProof?.razorpayOrderId,
          razorpayPaymentId: paymentProof?.razorpayPaymentId,
          razorpaySignature: paymentProof?.razorpaySignature,
          paidAt: paymentProof ? new Date().toISOString() : undefined,
        },
      });
      if (res.ok) {
        setConfirmed(bookingData);
      } else {
        setPaymentProof(undefined);
        setBookingData(null);
        setFormError(
          "We couldn't confirm your booking — the payment verification didn't " +
            "go through. Please try again, or contact us on WhatsApp +91 87653 01563."
        );
      }
    }
  };

  const proceed = () => {
    setFormError("");
    const missing = validateBookingInput(input);
    if (missing.length > 0) {
      setFormError(
        `Please ${missing.join(", ")} to continue — these are required for your booking.`
      );
      return;
    }
    setCheckoutOpen(true);
  };

  const copyBookingId = async () => {
    if (!confirmed) return;
    try {
      await navigator.clipboard.writeText(confirmed.id);
    } catch {
      // clipboard unavailable — ignore
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const waText = confirmed
    ? encodeURIComponent(
        `Namaste! I have booked ${confirmed.poojaTitle} on The Temple Puja.\n\n` +
          `Booking ID: ${confirmed.id}\n` +
          `Date: ${confirmed.date}\n` +
          `Time: ${confirmed.time}\n` +
          `Pandit: ${confirmed.panditName ?? "Assigned by The Temple Puja"}\n` +
          `Reason: ${confirmed.reason}\n` +
          (confirmed.coupon
            ? `Coupon: ${confirmed.coupon.code} (${confirmed.coupon.label})\n`
            : "") +
          `Amount: ${formatINR(confirmed.total)}\n\n` +
          `Please confirm my booking. Om Shanti!`
      )
    : "";

  // ============ CONFIRMATION SCREEN ============
  if (confirmed) {
    return (
      <section className="container-px pb-24 pt-12 md:pt-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-10 text-center text-white">
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
            <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-emerald-600">
                <Check className="h-7 w-7" strokeWidth={3} />
              </span>
            </span>
            <h2 className="relative mt-5 font-display text-3xl font-bold">
              Booking Confirmed!
            </h2>
            <p className="relative mt-2 text-sm text-emerald-50/90">
              🙏 {confirmed.poojaTitle} · {formatINR(confirmed.total)}
            </p>
            <button
              onClick={copyBookingId}
              className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 font-mono text-sm font-bold tracking-widest backdrop-blur transition-colors hover:bg-white/25"
              aria-label="Copy booking ID"
            >
              {confirmed.id}
              {copiedId ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-white/70" />
              )}
            </button>
            <Link
              href={`/booking/${confirmed.id}?phone=${encodeURIComponent(
                form.phone.trim()
              )}`}
              className="relative mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-100 underline-offset-2 hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              View Receipt
            </Link>
          </div>

          <div className="px-8 py-8">
            <dl className="space-y-4 text-sm">
              {[
                { icon: "🪔", label: "Pooja", value: confirmed.poojaTitle },
                {
                  icon: "📅",
                  label: "Date",
                  value: confirmed.date,
                },
                {
                  icon: "⏰",
                  label: "Time",
                  value: confirmed.time,
                },
                {
                  icon: "🙏",
                  label: "Pandit",
                  value: confirmed.panditName ?? "Assigned by The Temple Puja",
                },
                { icon: "🕉️", label: "Devotee", value: confirmed.name },
                {
                  icon: "🪔",
                  label: "Reason for Pooja",
                  value: confirmed.reason,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 border-b border-dashed border-saffron-100 pb-4 last:border-0"
                >
                  <dt className="flex shrink-0 items-center gap-2 text-ink-soft">
                    <span className="text-lg">{row.icon}</span>
                    {row.label}
                  </dt>
                  <dd className="text-right font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
              {fromEvent && (
                <div className="flex items-start justify-between gap-4 border-b border-dashed border-saffron-100 pb-4">
                  <dt className="flex shrink-0 items-center gap-2 text-ink-soft">
                    <span className="text-lg">🎟️</span>
                    Seat
                  </dt>
                  <dd className="text-right font-semibold text-ink">1 seat held</dd>
                </div>
              )}
            </dl>

            {/* Payment summary with coupon savings */}
            <div className="mt-6 rounded-2xl border border-saffron-100 bg-cream/70 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Payment Summary
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <dt>Pooja Price</dt>
                  <dd>{formatINR(basePrice)}</dd>
                </div>
                {confirmed.discount > 0 && confirmed.coupon && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <dt>
                      Coupon ({confirmed.coupon.code}) —{" "}
                      {confirmed.coupon.label}
                    </dt>
                    <dd>−{formatINR(confirmed.discount)}</dd>
                  </div>
                )}
                {confirmed.coupon?.kind === "benefit" && (
                  <div className="flex justify-between font-semibold text-saffron-600">
                    <dt>Benefit ({confirmed.coupon.code})</dt>
                    <dd>{confirmed.coupon.label}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-saffron-200 pt-2.5">
                  <dt className="font-bold text-ink">Total Paid</dt>
                  <dd className="font-display text-xl font-bold text-saffron-600">
                    {formatINR(confirmed.total)}
                  </dd>
                </div>
              </dl>
              {confirmed.discount > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
                  🎉 You saved {formatINR(confirmed.discount)} with{" "}
                  {confirmed.coupon?.code}
                </p>
              )}
            </div>

            <p className="mt-5 rounded-2xl bg-saffron-50 px-5 py-4 text-center text-xs leading-relaxed text-ink-soft">
              Your booking confirmation will be sent to your WhatsApp within
              2 minutes. After the ritual, you&apos;ll receive the HD video
              recording link. Our admin has been notified instantly.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/918765301563?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !flex-1"
              >
                <MessageCircle className="h-4 w-4" />
                Confirm on WhatsApp
              </a>
              <Link
                href={`/profile?phone=${encodeURIComponent(form.phone.trim())}`}
                className="btn-outline !flex-1"
              >
                <UserRound className="h-4 w-4" />
                View My Profile
              </Link>
              <Link href="/book/form" className="btn-outline !flex-1">
                Book Another Pooja
              </Link>
            </div>
            <Link
              href="/"
              className="mt-4 block text-center text-xs font-semibold text-ink-soft/60 transition-colors hover:text-saffron-600"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ============ BOOKING FORM ============
  return (
    <>
      <section className="section-pad bg-cream">
        <div className="container-px grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* ============ FORM ============ */}
          <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                  🙏
                </span>
                Complete Your Booking
              </h2>
              <p className="mt-1.5 text-sm text-ink-soft">
                Share your details, the prayer you wish to perform, and the
                reason behind it. Your profile is created automatically after
                payment.
              </p>
            </div>

            <div className="mt-7 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Prayer */}
                <div className="sm:col-span-2">
                  <label htmlFor="bk-prayer" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Prayer / Pooja *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                      🪔
                    </span>
                    <select
                      id="bk-prayer"
                      value={prayerSlug}
                      onChange={(e) => setPrayerSlug(e.target.value)}
                      className={`${inputCls} appearance-none pl-11 pr-10`}
                    >
                      <option value="" disabled>
                        Select your prayer…
                      </option>
                      {activePoojas(catalogPoojas).map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.title} — {formatINR(p.price)}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-soft/60">
                      ▼
                    </span>
                  </div>
                </div>

                {/* Date — only shown when booked from a fixed event slot */}
                {fromEvent && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Date of Pooja
                    </label>
                    <div className="flex items-center gap-3 rounded-xl border border-saffron-100 bg-saffron-50/60 px-4 py-3">
                      <CalendarDays className="h-5 w-5 shrink-0 text-saffron-600" />
                      <span className="flex-1 text-sm font-semibold text-ink">
                        {formatDate(date)}
                        {initialTime ? ` · ${initialTime}` : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-saffron-700">
                        🔒 Fixed Slot
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-ink-soft/70">
                      This event is scheduled for {formatDate(date)}
                      {initialTime ? ` at ${initialTime}` : ""} — the date is fixed
                      for this slot.
                    </p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label htmlFor="bk-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Full Name *
                  </label>
                  <input
                    id="bk-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Aarav Sharma"
                    className={inputCls}
                  />
                </div>

                {/* Gotra */}
                <div>
                  <label htmlFor="bk-gotra" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Gotra *
                  </label>
                  <input
                    id="bk-gotra"
                    value={form.gotra}
                    onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))}
                    placeholder="e.g. Kashyap"
                    className={inputCls}
                  />
                </div>

                {/* City */}
                <div>
                  <label htmlFor="bk-city" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    City *
                  </label>
                  <input
                    id="bk-city"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. New Delhi"
                    className={inputCls}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="bk-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Mobile Number *
                  </label>
                  <input
                    id="bk-phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    className={inputCls}
                  />
                  {form.phone.length === 10 && !phoneValid && (
                    <p className="mt-1.5 text-xs font-medium text-red-500">
                      Enter a valid 10-digit Indian mobile number.
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="sm:col-span-2">
                  <label htmlFor="bk-reason" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Why do you want this Pooja? *
                  </label>
                  <textarea
                    id="bk-reason"
                    rows={3}
                    value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="e.g. I want this pooja for my daughter's wedding, for good health, for business growth, to remove obstacles…"
                    className={`${inputCls} resize-none`}
                  />
                  <p className="mt-1.5 text-xs text-ink-soft/70">
                    The pandit will keep your intention (sankalp) in mind while
                    performing the ritual.
                  </p>
                </div>

              </div>

              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
                  {formError}
                </p>
              )}

              <button onClick={proceed} className="btn-primary !w-full !py-4 text-base">
                <Lock className="h-4 w-4" />
                {selectedPooja
                  ? `Proceed to Pay ${formatINR(total)} via Razorpay`
                  : "Choose Your Prayer to Continue"}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-ink-soft/70">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Razorpay Secure
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  256-bit SSL
                </span>
                <span className="flex items-center gap-1.5">↩️ Easy refund policy</span>
              </div>
            </div>
          </div>

          {/* ============ SUMMARY SIDEBAR ============ */}
          <aside className="self-start lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
              {selectedPooja ? (
                <>
                  <div className={`relative h-20 bg-gradient-to-br ${selectedPooja.gradient}`}>
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
                    <span className="absolute -bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-card">
                      {selectedPooja.emoji}
                    </span>
                  </div>
                  <div className="px-6 pb-6 pt-9">
                    <h3 className="font-display text-lg font-bold text-ink">
                      {selectedPooja.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {selectedPooja.duration} · {selectedPooja.bestMuhurat}
                    </p>

                    <dl className="mt-4 space-y-2.5 border-t border-dashed border-saffron-100 pt-4 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-1.5 text-ink-soft">
                          <CalendarDays className="h-3.5 w-3.5" /> Date
                        </dt>
                        <dd className="font-semibold text-ink">
                          {date ? formatDate(date) : "To be confirmed"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-1.5 text-ink-soft">🙏 Pandit</dt>
                        <dd className="max-w-[180px] truncate text-right font-semibold text-ink">
                          Assigned by The Temple Puja
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 space-y-2 border-t border-dashed border-saffron-100 pt-4 text-sm">
                      <div className="flex justify-between text-ink-soft">
                        <span>Pooja Price</span>
                        <span>{formatINR(selectedPooja.price)}</span>
                      </div>
                      <div className="flex items-end justify-between border-t border-saffron-200 pt-3">
                        <span className="font-bold text-ink">Total</span>
                        <span className="font-display text-2xl font-bold text-saffron-600">
                          {formatINR(total)}
                        </span>
                      </div>
                      <p className="rounded-lg bg-saffron-50 px-3 py-1.5 text-center text-[11px] font-semibold text-saffron-700">
                        🎟️ Apply your coupon at the secure checkout
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Payments secured by Razorpay
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-6 py-10 text-center">
                  <span className="text-4xl">🪔</span>
                  <h3 className="mt-4 font-display text-lg font-bold text-ink">
                    Your Booking Summary
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    Select a prayer above and your summary, price and date will
                    appear here.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 flex items-start gap-2 px-2 text-[11px] leading-relaxed text-ink-soft/70">
              <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron-500" />
              Free cancellation & rescheduling up to 24 hours before the muhurat.
            </p>
          </aside>
        </div>
      </section>

      <RazorpayCheckout
        open={checkoutOpen}
        poojaPrice={basePrice}
        poojaTitle={selectedPooja?.title ?? "Pooja"}
        poojaSlug={selectedPooja?.slug}
        couponMap={catalogCoupons}
        devoteeName={form.name.trim()}
        phone={form.phone.trim()}
        onClose={handleCheckoutClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
