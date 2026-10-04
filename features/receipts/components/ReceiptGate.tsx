"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface ReceiptGateProps {
  bookingId: string;
  phone: string;
  onPhoneChange: (phone: string) => void;
  formError: string;
  onSubmit: (e: React.FormEvent) => void;
  inputCls: string;
}

export default function ReceiptGate({
  bookingId,
  phone,
  onPhoneChange,
  formError,
  onSubmit,
  inputCls,
}: ReceiptGateProps) {
  return (
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
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input
          value={phone}
          onChange={(e) =>
            onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))
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
  );
}
