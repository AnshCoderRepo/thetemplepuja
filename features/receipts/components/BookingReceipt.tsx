"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check, Copy, Printer, UserRound } from "lucide-react";
import type { BookingRecord } from "@/lib/storage";
import { formatINR } from "@/lib/format";
import type { BookingHolder } from "../types/receipt.types";

interface BookingReceiptProps {
  booking: BookingRecord;
  holder: BookingHolder;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
  rescheduled: "bg-amber-100 text-amber-700",
  refunded: "bg-indigo-100 text-indigo-700",
};

export default function BookingReceipt({ booking, holder }: BookingReceiptProps) {
  const [, setCopied] = useState(false);
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
            type="button"
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
