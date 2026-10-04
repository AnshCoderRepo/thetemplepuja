"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";

interface ReceiptNotFoundProps {
  bookingId: string;
  idLookup: string;
  onIdLookupChange: (val: string) => void;
  phoneLookup: string;
  onPhoneLookupChange: (val: string) => void;
  formError: string;
  onSubmit: (e: React.FormEvent) => void;
  inputCls: string;
}

export default function ReceiptNotFound({
  bookingId,
  idLookup,
  onIdLookupChange,
  phoneLookup,
  onPhoneLookupChange,
  formError,
  onSubmit,
  inputCls,
}: ReceiptNotFoundProps) {
  return (
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
      <form onSubmit={onSubmit} className="mt-6 space-y-3 text-left">
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
            onChange={(e) => onIdLookupChange(e.target.value.toUpperCase())}
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
              onPhoneLookupChange(e.target.value.replace(/\D/g, "").slice(0, 10))
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
  );
}
