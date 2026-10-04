"use client";

import Link from "next/link";
import { Search, UserRound } from "lucide-react";

interface DevoteeLookupGateProps {
  inputPhone: string;
  onPhoneChange: (phone: string) => void;
  notFound: boolean;
  onLookup: (phone: string) => void;
  inputCls: string;
}

export default function DevoteeLookupGate({
  inputPhone,
  onPhoneChange,
  notFound,
  onLookup,
  inputCls,
}: DevoteeLookupGateProps) {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-saffron-100 bg-white p-8 text-center shadow-card">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-saffron-50">
        <UserRound className="h-8 w-8 text-saffron-500" />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold text-ink">
        Find Your Profile
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Enter the 10-digit mobile number you used at booking to view your
        profile and pooja history.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onLookup(inputPhone);
        }}
        className="mt-6 space-y-3"
      >
        <input
          value={inputPhone}
          onChange={(e) =>
            onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          placeholder="10-digit mobile number"
          inputMode="numeric"
          autoFocus
          className={`${inputCls} text-center font-mono tracking-widest`}
        />
        {notFound && (
          <p className="text-xs font-semibold text-red-500">
            No profile found for this number. Please check and try again,
            or book a pooja to create one.
          </p>
        )}
        <button type="submit" className="btn-primary !w-full">
          <Search className="h-4 w-4" />
          View My Profile
        </button>
      </form>
      <Link
        href="/book/form"
        className="mt-4 inline-block text-xs font-semibold text-saffron-600 transition-colors hover:text-saffron-700"
      >
        New here? Book a pooja →
      </Link>
    </div>
  );
}
