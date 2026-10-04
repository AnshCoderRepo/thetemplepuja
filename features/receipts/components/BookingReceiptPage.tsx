"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { isValidIndianPhone } from "@/lib/validation";
import { fetchBooking } from "../api/receiptApi";
import type { ReceiptPageState } from "../types/receipt.types";
import BookingReceipt from "./BookingReceipt";
import ReceiptGate from "./ReceiptGate";
import ReceiptNotFound from "./ReceiptNotFound";

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

const BackButton = () => (
  <Link
    href="/"
    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-saffron-600"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
    Back to Home
  </Link>
);

export default function BookingReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = typeof params.bookingId === "string" ? params.bookingId : "";
  const urlPhone = searchParams.get("phone") ?? "";
  const [phone, setPhone] = useState(urlPhone);
  const [state, setState] = useState<ReceiptPageState>(
    urlPhone && isValidIndianPhone(urlPhone)
      ? { kind: "loading" }
      : { kind: "gate" }
  );
  const [idLookup, setIdLookup] = useState("");
  const [phoneLookup, setPhoneLookup] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const p = searchParams.get("phone") ?? "";
    setPhone((cur) => (p && p !== cur ? p : cur));
  }, [searchParams]);

  useEffect(() => {
    let live = true;
    const p = phone.trim();
    if (!isValidIndianPhone(p)) {
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

  const submitGate = (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    if (!isValidIndianPhone(p)) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setFormError("");
    router.replace(
      `/booking/${encodeURIComponent(bookingId)}?phone=${encodeURIComponent(p)}`
    );
  };

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
          <BackButton />
          <ReceiptGate
            bookingId={bookingId}
            phone={phone}
            onPhoneChange={setPhone}
            formError={formError}
            onSubmit={submitGate}
            inputCls={inputCls}
          />
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
          <BookingReceipt booking={state.booking} holder={state.holder} />
        </div>
      </section>
    );
  }

  return (
    <section id="receipt-page" className="section-pad bg-cream">
      <div className="container-px">
        <BackButton />
        <ReceiptNotFound
          bookingId={bookingId}
          idLookup={idLookup}
          onIdLookupChange={setIdLookup}
          phoneLookup={phoneLookup}
          onPhoneLookupChange={setPhoneLookup}
          formError={formError}
          onSubmit={submitLookup}
          inputCls={inputCls}
        />
      </div>
    </section>
  );
}
