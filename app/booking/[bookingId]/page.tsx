"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Copy,
  Printer,
  SearchX,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { fetchBooking } from "@/lib/api";
import type { BookingRecord } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import { isValidIndianPhone } from "@/lib/validation";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  rescheduled: "bg-amber-100 text-amber-700",
  refunded: "bg-indigo-100 text-indigo-700",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Receipt({
  booking,
  holder,
}: {
  booking: BookingRecord;
  holder: { name: string; phone: string; gotra: string; city: string };
}) {
  const [copied, setCopied] = useState(false);
  const [copiedRcpt, setCopiedRcpt] = useState(false);

  const receiptNumber =
    booking.receiptNumber ||
    `RCPT-${booking.createdAt.slice(0, 10).replace(/-/g, "")}-${booking.bookingId.slice(-6).toUpperCase()}`;
  const orderId = booking.razorpayOrderId || `ORD-${booking.bookingId}`;
  const paymentId = booking.razorpayPaymentId || "PAY-VERIFIED-SEVA";

  const copyText = async (text: string, isRcpt = false) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard fallback
    }
    if (isRcpt) {
      setCopiedRcpt(true);
      setTimeout(() => setCopiedRcpt(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id="receipt-card"
      className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card print:border-none print:shadow-none"
    >
      {/* Receipt header */}
      <div className="relative bg-gradient-to-br from-saffron-500 to-maroon-600 px-8 py-8 text-center text-white print:bg-white print:text-ink print:border-b-2 print:border-saffron-600">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px] print:hidden" />
        <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpeg"
            alt="The Temple Puja"
            className="h-full w-full object-contain"
          />
        </span>
        <h2 className="relative mt-3 font-display text-2xl font-bold print:text-black">
          Official Pooja Booking Receipt
        </h2>
        <p className="relative mt-0.5 text-xs text-amber-100/90 print:text-ink-soft">
          The Temple Puja · Verified Spiritual Platform
        </p>

        <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => copyText(receiptNumber, true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 font-mono text-xs font-bold tracking-wider backdrop-blur transition-colors hover:bg-white/25 print:bg-slate-100 print:text-black"
            aria-label="Copy receipt number"
          >
            {receiptNumber}
            {copiedRcpt ? (
              <Check className="h-3 w-3 text-emerald-300 print:text-emerald-700" />
            ) : (
              <Copy className="h-3 w-3 text-white/70 print:text-slate-600" />
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-6">
        {/* Transaction Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-saffron-100 bg-cream/40 p-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
              Booking ID
            </span>
            <span className="font-mono font-bold text-ink">{booking.bookingId}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
              Order Ref
            </span>
            <span className="font-mono font-semibold text-ink truncate block">{orderId}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
              Payment Date
            </span>
            <span className="font-medium text-ink">
              {new Date(booking.paidAt || booking.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
              Payment Status
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <Check className="h-3 w-3 text-emerald-600" /> PAID
            </span>
          </div>
        </div>

        {/* Status + Pooja Details */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-saffron-100 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-700 block">
              Sacred Ceremony
            </span>
            <h3 className="font-display text-xl font-bold text-ink">
              🪔 {booking.poojaTitle}
            </h3>
            <p className="mt-0.5 text-xs text-ink-soft">
              Scheduled: {booking.date} · {booking.time} · 🙏 {booking.panditName}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
              statusStyles[booking.status] ?? "bg-emerald-100 text-emerald-700"
            }`}
          >
            {booking.status}
          </span>
        </div>

        {booking.reason && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800 border border-amber-200">
            <strong>Intention (Sankalp):</strong> {booking.reason}
          </p>
        )}

        {/* Devotee / Holder Information */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            Devotee Details (Sankalp Patra)
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-xs">
            <div>
              <dt className="text-ink-soft font-medium">Devotee Name</dt>
              <dd className="font-bold text-ink text-sm mt-0.5">{holder.name}</dd>
            </div>
            <div>
              <dt className="text-ink-soft font-medium">Registered Phone</dt>
              <dd className="font-semibold text-ink mt-0.5">+91 {holder.phone}</dd>
            </div>
            <div>
              <dt className="text-ink-soft font-medium">Gotra</dt>
              <dd className="font-semibold text-ink mt-0.5">{holder.gotra || "Kashyap"}</dd>
            </div>
            <div>
              <dt className="text-ink-soft font-medium">City / Location</dt>
              <dd className="font-semibold text-ink mt-0.5">{holder.city || "India"}</dd>
            </div>
          </dl>
        </div>

        {/* Itemized Chadhavas / Addons */}
        {booking.addons && booking.addons.length > 0 && (
          <div className="rounded-2xl border border-saffron-100 bg-cream/30 p-5 space-y-2 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-saffron-800">
              Offerings & Chadhavas Itemization
            </p>
            <div className="space-y-1.5 pt-1">
              {booking.addons.map((addon) => (
                <div key={addon.id} className="flex justify-between items-center text-ink border-b border-dashed border-saffron-100 pb-1.5 last:border-0 last:pb-0">
                  <span>{addon.emoji || "🌸"} {addon.name} <span className="text-ink-soft font-mono">x{addon.quantity}</span></span>
                  <span className="font-semibold">{formatINR(addon.price * addon.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Breakdown Table */}
        <div className="rounded-2xl border border-saffron-100 bg-cream/70 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            Payment & Financial Statement
          </p>
          <dl className="mt-3 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>Pooja Base Seva</dt>
              <dd className="font-medium text-ink">
                {formatINR(
                  booking.amount +
                    booking.discount -
                    (booking.addons
                      ? booking.addons.reduce((sum, a) => sum + a.price * a.quantity, 0)
                      : 0)
                )}
              </dd>
            </div>

            {booking.addons && booking.addons.length > 0 && (
              <div className="flex justify-between text-ink-soft">
                <dt>Total Chadhavas / Add-ons</dt>
                <dd className="font-medium text-ink">
                  +{formatINR(
                    booking.addons.reduce((sum, a) => sum + a.price * a.quantity, 0)
                  )}
                </dd>
              </div>
            )}

            {booking.discount > 0 && booking.couponCode && (
              <div className="flex justify-between font-semibold text-emerald-600">
                <dt>Coupon Savings ({booking.couponCode})</dt>
                <dd>−{formatINR(booking.discount)}</dd>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-saffron-200 pt-3">
              <dt className="font-bold text-ink text-sm">TOTAL AMOUNT PAID</dt>
              <dd className="font-display text-xl font-bold text-saffron-700">
                {formatINR(booking.amount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4 pt-3 border-t border-dashed border-saffron-200 flex flex-wrap items-center justify-between text-[11px] text-ink-soft">
            <span>Transaction Ref: <code className="font-mono font-semibold">{paymentId}</code></span>
            <span>Mode: {booking.razorpayPaymentId ? "Razorpay Online" : "Confirmed Seva"}</span>
          </div>
        </div>

        {/* Official Footer */}
        <div className="text-center pt-2 text-[11px] text-ink-soft space-y-1">
          <p className="font-semibold text-ink">Thank you for booking your sacred seva with The Temple Puja.</p>
          <p className="text-ink-soft/70">This is an authentic, computer-generated official receipt. No physical signature required.</p>
        </div>

        {/* Actions */}
        <div className="no-print mt-6 space-y-3">
          <button
            type="button"
            onClick={() => window.print()}
            title="Open the browser print dialog to save this receipt as a PDF"
            className="btn-primary !w-full"
          >
            <Printer className="h-4 w-4" />
            Download / Print PDF Receipt
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/profile?phone=${encodeURIComponent(holder.phone)}`}
              className="btn-outline !flex-1"
            >
              <UserRound className="h-4 w-4" />
              View My Devotee Profile
            </Link>
            <Link href="/book/form" className="btn-outline !flex-1">
              <BadgeCheck className="h-4 w-4" />
              Book Another Pooja
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type PageState =
  | { kind: "gate" } // need the devotee's mobile number first
  | { kind: "loading" }
  | {
      kind: "found";
      booking: BookingRecord;
      holder: { name: string; phone: string; gotra: string; city: string };
    }
  | { kind: "missing" };

function BookingReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const urlPhone = searchParams.get("phone") ?? "";
  const [phone, setPhone] = useState(urlPhone);
  const [state, setState] = useState<PageState>(
    urlPhone && isValidIndianPhone(urlPhone)
      ? { kind: "loading" }
      : { kind: "gate" }
  );
  const [idLookup, setIdLookup] = useState("");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [formError, setFormError] = useState("");

  // Keep the verified phone in sync with the URL so a retry navigation
  // (different phone on the same booking id) re-fetches instead of using the
  // stale state from the previous lookup.
  useEffect(() => {
    const p = searchParams.get("phone") ?? "";
    setPhone((cur) => (p && p !== cur ? p : cur));
  }, [searchParams]);

  useEffect(() => {
    let live = true;
    const p = phone.trim();
    if (!isValidIndianPhone(p)) {
      // Nothing verified yet — or the number is still being typed. Stay on
      // the gate rather than flashing the not-found screen per keystroke.
      setState({ kind: "gate" });
      return;
    }
    setState({ kind: "loading" });
    fetchBooking(bookingId, p).then((res) => {
      if (!live) return;
      if (res?.booking && res.holder) {
        setState({ kind: "found", booking: res.booking, holder: res.holder });
      } else {
        setState({ kind: "missing" });
      }
    });
    return () => {
      live = false;
    };
  }, [bookingId, phone]);

  // Mobile gate: confirm the number used at booking before showing anything.
  const submitGate = (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    if (!isValidIndianPhone(p)) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setFormError("");
    // Push the number into the URL so the receipt is shareable/bookmarkable.
    router.replace(
      `/booking/${encodeURIComponent(bookingId)}?phone=${encodeURIComponent(p)}`
    );
  };

  // Not-found retry: correct both the id and the mobile number.
  const submitLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const id = idLookup.trim().toUpperCase();
    const p = phoneLookup.trim();
    if (!id || !isValidIndianPhone(p)) {
      setFormError(
        "Enter both the booking id and the 10-digit mobile number used at booking."
      );
      return;
    }
    setFormError("");
    router.push(`/booking/${encodeURIComponent(id)}?phone=${encodeURIComponent(p)}`);
  };

  const BackButton = () => (
    <Link
      href="/"
      className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-saffron-600"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      Back to Home
    </Link>
  );

  if (state.kind === "gate") {
    return (
      <section id="receipt-page" className="section-pad bg-cream">
        <div className="container-px">
          <BackButton />
          <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-8 text-center shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50">
              <ShieldCheck className="h-8 w-8 text-saffron-500" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold text-ink">
              Verify to view your receipt
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Enter the 10-digit mobile number used when booking{" "}
              <span className="font-mono font-bold text-saffron-700">
                {bookingId}
              </span>{" "}
              to view this receipt.
            </p>
            <form onSubmit={submitGate} className="mt-6 space-y-3">
              <input
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
                autoComplete="tel"
                className={`${inputCls} text-center font-mono tracking-widest`}
                autoFocus
              />
              {formError && (
                <p className="text-xs font-semibold text-red-500">{formError}</p>
              )}
              <button type="submit" className="btn-primary !w-full">
                <ShieldCheck className="h-4 w-4" />
                View Receipt
              </button>
            </form>
            <Link
              href="/book/form"
              className="mt-4 inline-block text-xs font-semibold text-saffron-600 transition-colors hover:text-saffron-700"
            >
              Book a pooja instead →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (state.kind === "loading") {
    return (
      <section className="section-pad bg-cream">
        <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-saffron-100/60" />
      </section>
    );
  }

  if (state.kind === "found") {
    return (
      <section id="receipt-page" className="section-pad bg-cream">
        <div className="container-px">
          <BackButton />
          <Receipt booking={state.booking} holder={state.holder} />
        </div>
      </section>
    );
  }

  return (
    <section id="receipt-page" className="section-pad bg-cream">
      <div className="container-px">
        <BackButton />
        <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <SearchX className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold text-ink">
            Booking Not Found
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            We couldn&apos;t match a booking with id{" "}
            <span className="font-mono font-bold text-saffron-700">
              {bookingId}
            </span>{" "}
            and the mobile number you entered. Check both on your confirmation
            screen and try again.
          </p>
          <form onSubmit={submitLookup} className="mt-6 space-y-3 text-left">
            <div>
              <label
                htmlFor="bk-lookup-id"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-soft"
              >
                Booking ID
              </label>
              <input
                id="bk-lookup-id"
                value={idLookup}
                onChange={(e) => setIdLookup(e.target.value.toUpperCase())}
                placeholder="e.g. SKX7Q2LM"
                className={`${inputCls} font-mono tracking-widest`}
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="bk-lookup-phone"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-ink-soft"
              >
                Mobile number used at booking
              </label>
              <input
                id="bk-lookup-phone"
                value={phoneLookup}
                onChange={(e) =>
                  setPhoneLookup(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
                autoComplete="tel"
                className={`${inputCls} font-mono tracking-widest`}
              />
            </div>
            {formError && (
              <p className="text-xs font-semibold text-red-500">{formError}</p>
            )}
            <button type="submit" className="btn-primary !w-full">
              <SearchX className="h-4 w-4" />
              Find My Booking
            </button>
          </form>
          <Link
            href="/book/form"
            className="mt-4 inline-block text-xs font-semibold text-saffron-600 transition-colors hover:text-saffron-700"
          >
            Book a pooja instead →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function BookingReceiptRoute() {
  return (
    <Suspense
      fallback={
        <section className="section-pad bg-cream">
          <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-3xl bg-saffron-100/60" />
        </section>
      }
    >
      <BookingReceiptPage />
    </Suspense>
  );
}
