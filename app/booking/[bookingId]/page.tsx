"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  Check,
  Copy,
  FileText,
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

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(booking.bookingId);
    } catch {
      // clipboard unavailable — still show feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="receipt-card"
      className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card"
    >
      {/* Receipt header */}
      <div className="relative bg-gradient-to-br from-saffron-500 to-maroon-600 px-8 py-8 text-center text-white">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <FileText className="h-7 w-7" />
        </span>
        <h2 className="relative mt-4 font-display text-2xl font-bold">
          Pooja Booking Receipt
        </h2>
        <p className="relative mt-1 text-xs text-amber-100/90">
          The Temple Puja · Digital Spiritual Platform
        </p>
        <button
          onClick={copyId}
          className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 font-mono text-sm font-bold tracking-widest backdrop-blur transition-colors hover:bg-white/25"
          aria-label="Copy booking ID"
        >
          {booking.bookingId}
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-white/70" />
          )}
        </button>
      </div>

      <div className="px-8 py-8">
        {/* Status + pooja */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-ink">
              🪔 {booking.poojaTitle}
            </h3>
            <p className="mt-0.5 text-xs text-ink-soft">
              {booking.date} · {booking.time} · 🙏 {booking.panditName}
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
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            🪔 Reason: {booking.reason}
          </p>
        )}
        {booking.status === "cancelled" && booking.cancelledAt && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
            ↩️ Cancelled on {formatDate(booking.cancelledAt)} — refund initiated
          </p>
        )}
        {booking.status === "refunded" && booking.refundedAt && (
          <p className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-xs font-semibold text-indigo-600">
            💸 Refunded on {formatDate(booking.refundedAt)}
          </p>
        )}
        {booking.status === "rescheduled" && booking.rescheduledAt && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
            🔁 Rescheduled on {formatDate(booking.rescheduledAt)}
            {booking.previousDate && !booking.previousDate.startsWith("To be")
              ? ` — was ${booking.previousDate}${
                  booking.previousTime && booking.previousTime !== "—"
                    ? ` · ${booking.previousTime}`
                    : ""
                }`
              : ""}
          </p>
        )}

        {/* Holder */}
        <div className="mt-6 rounded-2xl border border-saffron-100 bg-cream/70 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            Booking Holder
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Name", value: holder.name },
              { label: "Mobile", value: `+91 ${holder.phone}` },
              { label: "Gotra", value: holder.gotra || "—" },
              { label: "City", value: holder.city || "—" },
            ].map((row) => (
              <div key={row.label}>
                <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Payment summary */}
        <div className="mt-4 rounded-2xl border border-saffron-100 bg-cream/70 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            Payment Summary
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>Pooja Price</dt>
              <dd>{formatINR(booking.amount + booking.discount)}</dd>
            </div>
            {booking.discount > 0 && booking.couponCode && (
              <div className="flex justify-between font-semibold text-emerald-600">
                <dt>Coupon ({booking.couponCode})</dt>
                <dd>−{formatINR(booking.discount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-saffron-200 pt-2.5">
              <dt className="font-bold text-ink">Total Paid</dt>
              <dd className="font-display text-xl font-bold text-saffron-600">
                {formatINR(booking.amount)}
              </dd>
            </div>
          </dl>
          {booking.discount > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-700">
              🎉 Saved {formatINR(booking.discount)} with {booking.couponCode}
            </p>
          )}
          <p className="mt-3 border-t border-dashed border-saffron-200 pt-3 text-[11px] text-ink-soft">
            Booked on {formatDate(booking.createdAt)}
            {booking.eventDateISO ? " · Event slot seat (1)" : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="no-print mt-7 space-y-3">
          <button
            type="button"
            onClick={() => window.print()}
            title="Open the browser print dialog to save this receipt as a PDF"
            className="btn-outline !w-full"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/profile?phone=${encodeURIComponent(holder.phone)}`}
              className="btn-primary !flex-1"
            >
              <UserRound className="h-4 w-4" />
              View My Profile
            </Link>
            <Link href="/book/form" className="btn-outline !flex-1">
              <BadgeCheck className="h-4 w-4" />
              Book Another Pooja
            </Link>
          </div>
        </div>
        <Link
          href="/"
          className="no-print mt-4 block text-center text-xs font-semibold text-ink-soft/60 transition-colors hover:text-saffron-600"
        >
          ← Back to Home
        </Link>
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

  if (state.kind === "gate") {
    return (
      <section id="receipt-page" className="section-pad bg-cream">
        <div className="container-px">
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
          <Receipt booking={state.booking} holder={state.holder} />
        </div>
      </section>
    );
  }

  return (
    <section id="receipt-page" className="section-pad bg-cream">
      <div className="container-px">
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
