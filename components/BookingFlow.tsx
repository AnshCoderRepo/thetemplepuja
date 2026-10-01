"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Flame,
  Info,
  Lock,
  MessageCircle,
  Minus,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { fetchUserByPhone, submitBooking, syncUserFromServer } from "@/lib/api";
import {
  activePoojas,
  computeUpcomingDates,
  defaultChadhavaOfferings,
  type ChadhavaOffering,
  type Pooja,
} from "@/lib/data";
import { isValidIndianPhone, validateBookingInput } from "@/lib/validation";
import { formatINR } from "@/lib/format";
import type { BookingAddonItem } from "@/lib/storage";
import { useCatalog } from "./useCatalog";
import RazorpayCheckout, {
  type AppliedCoupon,
  type CheckoutSummary,
  type PaymentProof,
} from "./RazorpayCheckout";

interface ConfirmedBooking {
  id: string;
  receiptNumber?: string;
  total: number;
  subtotal?: number;
  addonTotal?: number;
  discount: number;
  coupon: AppliedCoupon | null;
  addons?: BookingAddonItem[];
  date: string; // display, e.g. "Wed, 12 Aug"
  time: string; // display, e.g. "7:00 PM IST" or "—"
  panditName: string | null;
  name: string;
  poojaTitle: string;
  reason: string;
  credentials: { username: string; password: string; email: string };
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
    email: "",
    reason: "",
  });
  const [prayerSlug, setPrayerSlug] = useState(pooja?.slug ?? "");
  const [selectedDateISO, setSelectedDateISO] = useState<string | null>(initialDate ?? null);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime ?? null);
  const date = selectedDateISO ?? "";
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingData, setBookingData] = useState<ConfirmedBooking | null>(null);
  const [paymentProof, setPaymentProof] = useState<PaymentProof | undefined>(undefined);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [formError, setFormError] = useState("");

  // Admin-managed catalog (poojas + coupons) from the backend. Initial render
  // uses the static defaults so SSR matches; once fetched we swap in the
  // server catalog.
  const { poojas: catalogPoojas, coupons: catalogCoupons, poojaDates } = useCatalog();

  const selectedPooja = catalogPoojas.find((p) => p.slug === prayerSlug);
  const basePrice = selectedPooja?.price ?? 0;

  // Auto-prefill devotee profile details if known on the server/local cache
  useEffect(() => {
    if (isValidIndianPhone(form.phone)) {
      void (async () => {
        await syncUserFromServer(form.phone);
        const u = await fetchUserByPhone(form.phone);
        if (u) {
          setForm((prev) => ({
            ...prev,
            name: prev.name || u.name || "",
            gotra: prev.gotra || u.gotra || "",
            city: prev.city || u.city || "",
            email: prev.email || (u.email && !u.email.startsWith("pw:") ? u.email : "") || "",
          }));
        }
      })();
    }
  }, [form.phone]);

  // Construct active addon items list with prices and quantities
  const addonItems: BookingAddonItem[] = Object.entries(selectedAddons)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const offering = defaultChadhavaOfferings.find((c) => c.id === id);
      return {
        id,
        name: offering?.name ?? id,
        price: offering?.price ?? 0,
        quantity: qty,
        emoji: offering?.emoji,
      };
    });

  const addonTotal = addonItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = basePrice + addonTotal;
  const total = subtotal;

  const updateAddonQty = (id: string, delta: number) => {
    setSelectedAddons((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

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

  const generatePassword = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleSuccess = (
    id: string,
    payment?: PaymentProof,
    summary?: CheckoutSummary
  ) => {
    setPaymentProof(payment);
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const generatedReceiptNo = `RCPT-${datePart}-${id.slice(-6).toUpperCase()}`;

    setBookingData({
      id,
      receiptNumber: generatedReceiptNo,
      total: summary?.amount ?? total,
      subtotal: summary?.subtotal ?? subtotal,
      addonTotal: summary?.addonTotal ?? addonTotal,
      discount: summary?.discount ?? 0,
      coupon: summary?.coupon ?? null,
      addons: summary?.addons ?? addonItems,
      date: date ? formatDate(date) : "To be confirmed",
      time: selectedTime ?? "—",
      panditName: null,
      name: form.name.trim() || "Devotee",
      poojaTitle: selectedPooja?.title ?? "Pooja",
      reason: form.reason.trim(),
      credentials: {
        username: form.phone.trim(),
        password: generatePassword(),
        email: form.email.trim(),
      },
    });
  };

  const handleCheckoutClose = async () => {
    setCheckoutOpen(false);
    if (bookingData && selectedPooja) {
      const res = await submitBooking({
        phone: form.phone.trim(),
        name: form.name.trim(),
        gotra: form.gotra.trim(),
        city: form.city.trim(),
        email: form.email.trim(),
        booking: {
          bookingId: bookingData.id,
          receiptNumber: bookingData.receiptNumber,
          poojaSlug: selectedPooja.slug,
          poojaTitle: selectedPooja.title,
          date: bookingData.date,
          time: bookingData.time,
          panditName: bookingData.panditName ?? "Assigned by templepujasewa",
          reason: bookingData.reason,
          amount: bookingData.total,
          discount: bookingData.discount,
          couponCode: bookingData.coupon?.code ?? null,
          addonCount: (bookingData.addons ?? []).reduce((acc, a) => acc + a.quantity, 0),
          addons: bookingData.addons,
          createdAt: new Date().toISOString(),
          status: "confirmed",
          eventDateISO: date ? date : undefined,
          seatCount: date ? 1 : undefined,
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
      // clipboard fallback
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const waText = confirmed
    ? encodeURIComponent(
        `Namaste! I have booked ${confirmed.poojaTitle} on templepujasewa.\n\n` +
          `Booking ID: ${confirmed.id}\n` +
          (confirmed.receiptNumber ? `Receipt No: ${confirmed.receiptNumber}\n` : "") +
          `Date: ${confirmed.date}\n` +
          `Time: ${confirmed.time}\n` +
          `Pandit: ${confirmed.panditName ?? "Assigned by templepujasewa"}\n` +
          `Reason: ${confirmed.reason}\n` +
          (confirmed.addons && confirmed.addons.length > 0
            ? `Chadhavas: ${confirmed.addons.map((a) => `${a.name} x${a.quantity}`).join(", ")}\n`
            : "") +
          (confirmed.coupon
            ? `Coupon: ${confirmed.coupon.code} (${confirmed.coupon.label})\n`
            : "") +
          `Amount: ${formatINR(confirmed.total)}\n\n` +
          `Login Credentials:\n` +
          `Username: ${confirmed.credentials.username}\n` +
          `Password: ${confirmed.credentials.password}\n\n` +
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
              Payment Successful 🎉
            </h2>
            <p className="relative mt-2 text-sm text-emerald-50/90">
              Your Puja booking has been confirmed · {formatINR(confirmed.total)}
            </p>

            <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={copyBookingId}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-mono text-xs font-bold tracking-widest backdrop-blur transition-colors hover:bg-white/25"
                title="Booking ID"
              >
                Booking ID: {confirmed.id}
                {copiedId ? (
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-white/70" />
                )}
              </button>

              {confirmed.receiptNumber && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono text-xs font-semibold backdrop-blur text-emerald-100">
                  <Receipt className="h-3.5 w-3.5 text-emerald-300" />
                  Receipt: {confirmed.receiptNumber}
                </span>
              )}
            </div>

            <div className="relative mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/booking/${confirmed.id}?phone=${encodeURIComponent(
                  form.phone.trim()
                )}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-bold text-emerald-700 shadow-md transition-all hover:bg-emerald-50"
              >
                <FileText className="h-4 w-4" />
                Download & View Receipt
              </Link>
            </div>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Booking Details */}
            <dl className="space-y-3.5 text-sm">
              {[
                { icon: "🪔", label: "Pooja", value: confirmed.poojaTitle },
                {
                  icon: "📅",
                  label: "Date",
                  value: confirmed.date,
                },
                {
                  icon: "⏰",
                  label: "Time Slot",
                  value: confirmed.time,
                },
                {
                  icon: "🙏",
                  label: "Pandit",
                  value: confirmed.panditName ?? "Assigned by templepujasewa",
                },
                { icon: "🕉️", label: "Devotee", value: confirmed.name },
                {
                  icon: "🪔",
                  label: "Intention / Sankalp",
                  value: confirmed.reason,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 border-b border-dashed border-saffron-100 pb-3 last:border-0"
                >
                  <dt className="flex shrink-0 items-center gap-2 text-ink-soft">
                    <span className="text-lg">{row.icon}</span>
                    {row.label}
                  </dt>
                  <dd className="text-right font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* Chadhavas / Addons breakdown */}
            {confirmed.addons && confirmed.addons.length > 0 && (
              <div className="rounded-2xl border border-saffron-100 bg-saffron-50/50 p-4 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-saffron-800">
                  🌸 Offerings & Chadhavas Included
                </p>
                <div className="space-y-1.5">
                  {confirmed.addons.map((addon) => (
                    <div key={addon.id} className="flex justify-between text-xs text-ink">
                      <span>{addon.emoji || "🌸"} {addon.name} (x{addon.quantity})</span>
                      <span className="font-semibold">{formatINR(addon.price * addon.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="rounded-2xl border border-saffron-100 bg-cream/70 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                Financial Summary
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <dt>Base Pooja</dt>
                  <dd>{formatINR(basePrice)}</dd>
                </div>
                {confirmed.addonTotal && confirmed.addonTotal > 0 ? (
                  <div className="flex justify-between text-ink-soft">
                    <dt>Add-ons & Chadhavas</dt>
                    <dd>+{formatINR(confirmed.addonTotal)}</dd>
                  </div>
                ) : null}
                {confirmed.discount > 0 && confirmed.coupon && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <dt>
                      Coupon Savings ({confirmed.coupon.code})
                    </dt>
                    <dd>−{formatINR(confirmed.discount)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-saffron-200 pt-2.5">
                  <dt className="font-bold text-ink">Total Paid</dt>
                  <dd className="font-display text-xl font-bold text-saffron-600">
                    {formatINR(confirmed.total)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Login credentials */}
            <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                🔐 Your Devotee Account Credentials
              </p>
              <p className="mt-1 text-xs text-ink-soft/70">
                Log in anytime to view your pooja progress, recordings, and receipts.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-soft">Username (Mobile)</span>
                  <span className="font-mono text-sm font-bold text-ink">{confirmed.credentials.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-soft">Password</span>
                  <span className="font-mono text-sm font-bold text-ink">{confirmed.credentials.password}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row pt-2">
              <Link
                href={`/booking/${confirmed.id}?phone=${encodeURIComponent(form.phone.trim())}`}
                className="btn-primary !flex-1"
              >
                <FileText className="h-4 w-4" />
                View & Download Receipt
              </Link>
              <Link
                href={`/profile?phone=${encodeURIComponent(form.phone.trim())}`}
                className="btn-outline !flex-1"
              >
                <UserRound className="h-4 w-4" />
                Go to My Bookings
              </Link>
            </div>

            <div className="text-center pt-2">
              <a
                href={`https://wa.me/918765301563?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
              >
                <MessageCircle className="h-4 w-4" />
                Share Booking on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ============ DATE SELECTION (if needed) ============
  const upcomingDates = computeUpcomingDates(poojaDates);
  const needsDateSelection = prayerSlug && !selectedDateISO && !fromEvent && upcomingDates.length > 0;

  if (needsDateSelection) {
    return (
      <section className="section-pad bg-cream">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
            <div className="text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-saffron-100 text-2xl">
                📅
              </span>
              <h2 className="mt-4 font-display text-xl font-bold text-ink sm:text-2xl">
                Choose a Date for Your Pooja
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                Select from our upcoming auspicious dates chosen by our Vedic pandits.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {upcomingDates.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedDateISO(d.dateISO);
                    setSelectedTime(d.time);
                  }}
                  className="group flex items-center gap-4 rounded-2xl border-2 border-saffron-100 bg-cream/40 p-4 text-left transition-all hover:border-saffron-400 hover:bg-saffron-50 hover:shadow-soft"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-maroon-600 font-display text-lg font-bold text-white shadow-soft">
                    {new Date(d.dateISO + "T00:00:00").getDate()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-ink group-hover:text-saffron-700">
                      {d.dateDisplay}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      🕐 {d.time}
                    </p>
                  </div>
                  <span className="text-xs text-saffron-500 opacity-0 transition-opacity group-hover:opacity-100">
                    Select →
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedDateISO("none")}
              className="mt-6 block w-full text-center text-xs font-semibold text-ink-soft/60 transition-colors hover:text-saffron-600"
            >
              I will confirm my date later
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ============ FINAL BOOKING CONFIGURATION PAGE ============
  return (
    <>
      <section className="section-pad bg-cream">
        <div className="container-px grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* ============ MAIN CONFIGURATION & FORM ============ */}
          <div className="space-y-6">
            {/* Devotee & Pooja Details Card */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                    🙏
                  </span>
                  Configure Your Sacred Booking
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft">
                  Provide your devotee details for the sacred sankalp.
                </p>
              </div>

              <div className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  {/* Prayer Selection */}
                  <div className="sm:col-span-2">
                    <label htmlFor="bk-prayer" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Selected Pooja *
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                        🪔
                      </span>
                      <select
                        id="bk-prayer"
                        value={prayerSlug}
                        onChange={(e) => setPrayerSlug(e.target.value)}
                        className={`${inputCls} appearance-none pl-11 pr-10 font-semibold`}
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

                  {/* Fixed Date if from Live Event */}
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
                    </div>
                  )}

                  {/* Devotee Mobile */}
                  <div>
                    <label htmlFor="bk-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Mobile Number (WhatsApp) *
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
                      <p className="mt-1 text-[11px] text-red-500 font-medium">
                        Enter a valid 10-digit Indian mobile number.
                      </p>
                    )}
                  </div>

                  {/* Devotee Name */}
                  <div>
                    <label htmlFor="bk-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Devotee Full Name *
                    </label>
                    <input
                      id="bk-name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Rahul Kumar"
                      className={inputCls}
                    />
                  </div>

                  {/* Gotra */}
                  <div>
                    <label htmlFor="bk-gotra" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Gotra (or Kashyap) *
                    </label>
                    <input
                      id="bk-gotra"
                      value={form.gotra}
                      onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))}
                      placeholder="e.g. Kashyap / Bhardwaj / Vats"
                      className={inputCls}
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="bk-city" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      City / Location *
                    </label>
                    <input
                      id="bk-city"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Mumbai / Varanasi"
                      className={inputCls}
                    />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <label htmlFor="bk-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Email Address (for receipt & video link)
                    </label>
                    <input
                      id="bk-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="rahul@example.com"
                      className={inputCls}
                    />
                  </div>

                  {/* Intention / Sankalp Reason */}
                  <div className="sm:col-span-2">
                    <label htmlFor="bk-reason" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                      Why do you want this Pooja? (Sankalp Intention) *
                    </label>
                    <textarea
                      id="bk-reason"
                      rows={2}
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="e.g. For health, peace, family prosperity and removal of obstacles…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chadhava & Sacred Add-ons Section */}
            <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-saffron-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <span className="text-lg">🌸</span>
                    Add Sacred Chadhava & Offerings (Optional)
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Enhance your ritual with sacred prasad, flower mala, and Brahmin seva.
                  </p>
                </div>
                {addonItems.length > 0 && (
                  <span className="inline-flex items-center gap-1 self-start rounded-full bg-saffron-100 px-3 py-1 text-xs font-bold text-saffron-800">
                    {addonItems.reduce((acc, a) => acc + a.quantity, 0)} added ({formatINR(addonTotal)})
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
                {defaultChadhavaOfferings.map((offering) => {
                  const qty = selectedAddons[offering.id] || 0;
                  const isAdded = qty > 0;

                  return (
                    <div
                      key={offering.id}
                      className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                        isAdded
                          ? "border-saffron-400 bg-saffron-50/40 shadow-xs ring-1 ring-saffron-200"
                          : "border-saffron-100 bg-cream/30 hover:border-saffron-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-xs border border-saffron-100">
                          {offering.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-ink text-xs leading-snug">
                              {offering.name}
                            </h4>
                          </div>
                          <p className="text-[11px] text-ink-soft/80 mt-1 line-clamp-2 leading-relaxed">
                            {offering.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between border-t border-dashed border-saffron-100/80 pt-3">
                        <span className="font-display font-bold text-saffron-700 text-sm">
                          {formatINR(offering.price)}
                        </span>

                        {isAdded ? (
                          <div className="flex items-center gap-2 rounded-xl bg-white border border-saffron-200 px-2 py-1 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateAddonQty(offering.id, -1)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-saffron-700 hover:bg-saffron-50 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-5 text-center font-mono text-xs font-bold text-ink">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateAddonQty(offering.id, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-saffron-700 hover:bg-saffron-50 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateAddonQty(offering.id, 1)}
                            className="inline-flex items-center gap-1 rounded-xl bg-white border border-saffron-300 px-3 py-1.5 text-xs font-bold text-saffron-700 shadow-xs hover:bg-saffron-500 hover:text-white hover:border-saffron-500 transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ============ LIVE ORDER SUMMARY SIDEBAR ============ */}
          <aside className="self-start lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
              {selectedPooja ? (
                <>
                  <div className={`relative h-20 bg-gradient-to-br ${selectedPooja.gradient}`}>
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
                    <span className="absolute -bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-card border border-saffron-100">
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

                    <dl className="mt-4 space-y-2 border-t border-dashed border-saffron-100 pt-3 text-xs">
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-1.5 text-ink-soft">
                          <CalendarDays className="h-3.5 w-3.5 text-saffron-600" /> Date
                        </dt>
                        <dd className="font-semibold text-ink">
                          {date ? formatDate(date) : "To be confirmed"}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="flex items-center gap-1.5 text-ink-soft">🙏 Pandit</dt>
                        <dd className="max-w-[180px] truncate text-right font-semibold text-ink">
                          Certified Vedic Scholar
                        </dd>
                      </div>
                    </dl>

                    {/* Order Financial Breakdown */}
                    <div className="mt-4 space-y-2 border-t border-dashed border-saffron-100 pt-3 text-xs">
                      <div className="flex justify-between text-ink-soft">
                        <span>Pooja Base Seva</span>
                        <span className="font-semibold text-ink">{formatINR(selectedPooja.price)}</span>
                      </div>

                      {addonItems.length > 0 && (
                        <div className="space-y-1 rounded-xl bg-cream/40 p-2.5 border border-saffron-100">
                          <span className="text-[10px] font-bold text-saffron-800 uppercase tracking-wider block">
                            Selected Chadhavas:
                          </span>
                          {addonItems.map((a) => (
                            <div key={a.id} className="flex justify-between text-[11px] text-ink-soft">
                              <span>{a.emoji} {a.name} x{a.quantity}</span>
                              <span className="font-medium text-ink">{formatINR(a.price * a.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-ink-soft pt-1">
                        <span>Subtotal</span>
                        <span className="font-semibold text-ink">{formatINR(subtotal)}</span>
                      </div>

                      <div className="flex items-end justify-between border-t border-saffron-200 pt-3">
                        <div>
                          <span className="font-bold text-ink text-sm block">Total Payable</span>
                          <span className="text-[10px] text-ink-soft">Includes all taxes & seva</span>
                        </div>
                        <span className="font-display text-2xl font-bold text-saffron-600">
                          {formatINR(total)}
                        </span>
                      </div>
                    </div>

                    {formError && (
                      <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-600">
                        {formError}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={proceed}
                      className="btn-primary !w-full !py-3.5 text-sm font-bold mt-5 shadow-md shadow-saffron-500/20"
                    >
                      <Lock className="h-4 w-4" />
                      Proceed to Payment
                    </button>

                    <p className="mt-3 rounded-lg bg-saffron-50 px-3 py-1.5 text-center text-[11px] font-semibold text-saffron-700">
                      🎟️ Apply discount coupons on payment step
                    </p>

                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Razorpay 100% Secure & Encrypted
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
                    Select a prayer and your summary, price and date will
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
        addons={addonItems}
        couponMap={catalogCoupons}
        devoteeName={form.name.trim()}
        phone={form.phone.trim()}
        onClose={handleCheckoutClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
