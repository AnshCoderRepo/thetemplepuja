"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Gift,
  Lock,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import {
  addons,
  coupons,
  pandits,
  timeSlots,
  type Coupon,
  type Pooja,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import RazorpayCheckout from "./RazorpayCheckout";

interface DaySlot {
  key: string;
  weekday: string;
  day: number;
  month: string;
  full: boolean;
  today: boolean;
}

interface ConfirmedBooking {
  id: string;
  total: number;
  date: DaySlot | null;
  time: (typeof timeSlots)[number] | null;
  panditName: string | null;
  name: string;
}

interface AppliedCoupon {
  code: string;
  label: string;
  kind: Coupon["kind"];
  value?: number;
  addonId?: string;
}

const steps = ["Date & Time", "Pandit", "Your Details", "Review & Pay"];

const inputCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

export default function BookingFlow({ pooja }: { pooja: Pooja }) {
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [days, setDays] = useState<DaySlot[]>([]);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [timeId, setTimeId] = useState<string | null>(null);
  const [panditId, setPanditId] = useState<string | null>(null);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    gotra: "",
    city: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bookingData, setBookingData] = useState<ConfirmedBooking | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Generate the next 14 days (client-side to avoid hydration mismatch)
  useEffect(() => {
    const list: DaySlot[] = [];
    const start = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      list.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
        weekday: d.toLocaleDateString("en-IN", { weekday: "short" }),
        day: d.getDate(),
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        full: i % 5 === 3,
        today: i === 0,
      });
    }
    setDays(list);
    setMounted(true);
  }, []);

  const dateIndex = days.findIndex((d) => d.key === dateKey);
  const selectedDay = dateKey ? days.find((d) => d.key === dateKey) ?? null : null;
  const selectedTime = timeId ? timeSlots.find((s) => s.id === timeId) ?? null : null;
  const selectedPandit = pandits.find((p) => p.id === panditId) ?? null;

  const isSlotBooked = (slotIdx: number) => {
    if (dateIndex < 0) return false;
    if (days[dateIndex].full) return true;
    return (dateIndex * 3 + slotIdx * 7) % 5 === 2;
  };

  const selectDate = (day: DaySlot) => {
    if (day.full) return;
    setDateKey(day.key);
    if (timeId) {
      const slotIdx = timeSlots.findIndex((s) => s.id === timeId);
      const idx = days.findIndex((d) => d.key === day.key);
      if (idx >= 0 && (idx * 3 + slotIdx * 7) % 5 === 2) setTimeId(null);
    }
  };

  const toggleAddon = (id: string) => {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const c = coupons[code];
    if (!c) {
      setCouponMsg({ ok: false, text: `"${code}" is not a valid coupon. Try TEMPLE30.` });
      return;
    }
    if (c.kind === "addon" && c.addonId) {
      setAddonIds((prev) =>
        prev.includes(c.addonId!) ? prev : [...prev, c.addonId!]
      );
    }
    setApplied({ code, label: c.label, kind: c.kind, value: c.value, addonId: c.addonId });
    setCouponMsg({ ok: true, text: `Coupon ${code} applied — ${c.label}!` });
  };

  const removeCoupon = () => {
    if (applied?.kind === "addon" && applied.addonId) {
      setAddonIds((prev) => prev.filter((x) => x !== applied.addonId));
    }
    setApplied(null);
    setCouponMsg(null);
  };

  const addonsTotal = useMemo(() => {
    const kundliFree = applied?.kind === "addon";
    return addonIds.reduce((sum, id) => {
      const a = addons.find((x) => x.id === id);
      if (!a) return sum;
      if (a.id === "kundli" && kundliFree) return sum;
      return sum + a.price;
    }, 0);
  }, [addonIds, applied]);

  const subtotal = pooja.price + (selectedPandit?.fee ?? 0) + addonsTotal;
  const discount =
    applied?.kind === "percent" && applied.value
      ? Math.round((subtotal * applied.value) / 100)
      : 0;
  const total = Math.max(subtotal - discount, 0);

  const selectedAddons = addonIds
    .map((id) => addons.find((a) => a.id === id))
    .filter((a): a is (typeof addons)[number] => Boolean(a));

  const phoneValid = /^[6-9]\d{9}$/.test(form.phone.trim());
  const detailsValid = form.name.trim().length > 1 && form.city.trim().length > 1 && phoneValid;
  const canContinue = step === 0 ? !!(dateKey && timeId) : step === 1 ? !!panditId : detailsValid;

  // Modal's onSuccess stores the booking; the confirmation screen only appears
  // after the modal's "Done" closes it, so the modal success phase stays visible.
  const handleSuccess = (id: string) => {
    setBookingData({
      id,
      total,
      date: selectedDay,
      time: selectedTime,
      panditName: selectedPandit?.name ?? null,
      name: form.name.trim() || "Devotee",
    });
  };

  const handleCheckoutClose = () => {
    setCheckoutOpen(false);
    if (bookingData) setConfirmed(bookingData);
  };

  const copyBookingId = async () => {
    if (!confirmed) return;
    try {
      await navigator.clipboard.writeText(confirmed.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const waText = confirmed
    ? encodeURIComponent(
        `Namaste! I have booked ${pooja.title} on The Temple Puja.\n\n` +
          `Booking ID: ${confirmed.id}\n` +
          `Date: ${confirmed.date ? `${confirmed.date.weekday}, ${confirmed.date.day} ${confirmed.date.month}` : "—"}\n` +
          `Time: ${confirmed.time ? confirmed.time.time : "—"}\n` +
          `Pandit: ${confirmed.panditName ?? "Assigned by The Temple Puja"}\n` +
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
              🙏 {pooja.title} · {formatINR(confirmed.total)}
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
          </div>

          <div className="px-8 py-8">
            <dl className="space-y-4 text-sm">
              {[
                { icon: "🪔", label: "Pooja", value: pooja.title },
                {
                  icon: "📅",
                  label: "Date & Time",
                  value: `${confirmed.date ? `${confirmed.date.weekday}, ${confirmed.date.day} ${confirmed.date.month}` : "—"} · ${
                    confirmed.time ? confirmed.time.time : "—"
                  }`,
                },
                {
                  icon: "🙏",
                  label: "Pandit",
                  value: confirmed.panditName ?? "Assigned by The Temple Puja",
                },
                { icon: "🕉️", label: "Devotee", value: confirmed.name },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 border-b border-dashed border-saffron-100 pb-4 last:border-0"
                >
                  <dt className="flex items-center gap-2 text-ink-soft">
                    <span className="text-lg">{row.icon}</span>
                    {row.label}
                  </dt>
                  <dd className="text-right font-semibold text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 rounded-2xl bg-saffron-50 px-5 py-4 text-center text-xs leading-relaxed text-ink-soft">
              Your private streaming link and confirmation will be sent to your
              WhatsApp within 2 minutes. Our admin has been notified instantly.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/919452492060?text=${waText}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !flex-1"
              >
                <MessageCircle className="h-4 w-4" />
                Confirm on WhatsApp
              </a>
              <Link href="/book" className="btn-outline !flex-1">
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

  // ============ STEPPER ============
  const stepper = (
    <div className="border-b border-saffron-100 bg-white/70 py-5 backdrop-blur">
      <div className="container-px">
        <ol className="mx-auto flex max-w-3xl items-center">
          {steps.map((label, i) => (
            <li key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="group flex flex-col items-center gap-1.5"
                aria-current={i === step ? "step" : undefined}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    i < step
                      ? "bg-gradient-to-br from-saffron-500 to-saffron-600 text-white shadow-glow"
                      : i === step
                        ? "border-2 border-saffron-400 bg-white text-saffron-600 shadow-glow"
                        : "border border-saffron-100 bg-saffron-50 text-ink-soft/40"
                  } ${i < step ? "cursor-pointer" : ""}`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={`hidden text-[11px] font-semibold sm:block ${
                    i === step ? "text-saffron-700" : i < step ? "text-ink" : "text-ink-soft/40"
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span
                  className={`mx-2 h-0.5 flex-1 rounded-full sm:mx-3 ${
                    i < step ? "bg-saffron-400" : "bg-saffron-100"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );

  return (
    <>
      {stepper}

      <div className="container-px grid gap-8 pb-24 pt-10 lg:grid-cols-[1fr_360px]">
        {/* ============ MAIN FLOW ============ */}
        <div>
          <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft sm:p-8">
            {/* ---- STEP 0 : DATE & TIME ---- */}
            {step === 0 && (
              <div className="space-y-8">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                      1
                    </span>
                    Choose a Date
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    Pick a muhurat-friendly day for your {pooja.title}.{" "}
                    <span className="font-semibold text-saffron-600">
                      Best: {pooja.bestMuhurat}
                    </span>
                  </p>
                  {!mounted ? (
                    <div className="mt-5 grid animate-pulse grid-cols-4 gap-2.5 sm:grid-cols-7">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-xl bg-saffron-100/60" />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-4 gap-2.5 sm:grid-cols-7">
                      {days.map((d) => {
                        const selected = d.key === dateKey;
                        return (
                          <button
                            key={d.key}
                            onClick={() => selectDate(d)}
                            disabled={d.full}
                            className={`group flex flex-col items-center rounded-xl border py-3 transition-all duration-200 ${
                              d.full
                                ? "cursor-not-allowed border-saffron-50 bg-saffron-50/40 opacity-50"
                                : selected
                                  ? "border-saffron-400 bg-gradient-to-b from-saffron-50 to-amber-50 shadow-glow ring-2 ring-saffron-300"
                                  : "border-saffron-100 bg-white hover:-translate-y-0.5 hover:border-saffron-300 hover:shadow-soft"
                            }`}
                          >
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wide ${
                                selected ? "text-saffron-700" : "text-ink-soft/50"
                              }`}
                            >
                              {d.weekday}
                            </span>
                            <span
                              className={`mt-0.5 font-display text-lg font-bold ${
                                selected ? "text-saffron-700" : "text-ink"
                              }`}
                            >
                              {d.day}
                            </span>
                            <span className="text-[10px] font-medium text-ink-soft/60">
                              {d.full ? "Full" : d.today ? "Today" : d.month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                      2
                    </span>
                    Choose a Time Slot
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    Shubh time slots preferred by our pandits.
                  </p>
                  {!mounted ? (
                    <div className="mt-5 grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-xl bg-saffron-100/60" />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {timeSlots.map((s, i) => {
                        const booked = isSlotBooked(i);
                        const selected = s.id === timeId;
                        return (
                          <button
                            key={s.id}
                            onClick={() => !booked && setTimeId(s.id)}
                            disabled={booked}
                            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                              booked
                                ? "cursor-not-allowed border-saffron-50 bg-saffron-50/40 opacity-50"
                                : selected
                                  ? "border-saffron-400 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-glow"
                                  : "border-saffron-100 bg-white hover:-translate-y-0.5 hover:border-saffron-300 hover:shadow-soft"
                            }`}
                          >
                            <span className="text-xl">{s.emoji}</span>
                            <span className="flex flex-col">
                              <span
                                className={`text-sm font-bold ${selected ? "text-white" : "text-ink"}`}
                              >
                                {s.time}
                              </span>
                              <span
                                className={`text-[10px] font-medium ${
                                  selected ? "text-white/80" : "text-ink-soft/60"
                                }`}
                              >
                                {booked ? "Booked" : s.label}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---- STEP 1 : PANDIT ---- */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                      3
                    </span>
                    Choose Your Pandit
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    All pandits are certified Vedic scholars with 10+ years of
                    experience.
                  </p>
                </div>

                <div className="space-y-3">
                  {pandits.map((p) => {
                    const selected = p.id === panditId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setPanditId(p.id)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 ${
                          selected
                            ? "border-saffron-400 bg-saffron-50/60 ring-2 ring-saffron-200"
                            : "border-saffron-100 bg-white hover:-translate-y-0.5 hover:border-saffron-300 hover:shadow-soft"
                        }`}
                      >
                        <span
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${p.gradient} font-display text-lg font-bold text-white shadow-soft`}
                        >
                          {p.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-base font-bold text-ink">
                              {p.name}
                            </span>
                            {p.badge && (
                              <span className="rounded-full bg-gradient-to-r from-saffron-500 to-maroon-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                {p.badge}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-soft">
                            {p.experience} yrs · {p.speciality}
                          </span>
                          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {p.languages.map((l) => (
                              <span
                                key={l}
                                className="rounded-full bg-saffron-50 px-2 py-0.5 text-[10px] font-semibold text-saffron-700"
                              >
                                {l}
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-xs font-bold text-ink">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {p.rating.toFixed(1)}
                            <span className="font-medium text-ink-soft/60">
                              ({p.reviews})
                            </span>
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              p.fee > 0 ? "text-maroon-600" : "text-emerald-600"
                            }`}
                          >
                            {p.fee > 0 ? `+${formatINR(p.fee)}` : "Included"}
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                              selected
                                ? "border-saffron-500 bg-saffron-500 text-white"
                                : "border-saffron-200 bg-white"
                            }`}
                          >
                            {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                  <BadgeCheck className="h-4 w-4 shrink-0" />
                  Every pandit is background-verified, ID-checked and reviewed by
                  devotees after each ritual.
                </p>
              </div>
            )}

            {/* ---- STEP 2 : DETAILS ---- */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                      4
                    </span>
                    Devotee Details & Add-ons
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    We perform sankalp in your name, so please share accurate
                    details.
                  </p>
                </div>

                <form
                  id="details-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (detailsValid) setStep(3);
                  }}
                  className="space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bk-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                        Full Name *
                      </label>
                      <input
                        id="bk-name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                        placeholder="e.g. Aarav Sharma"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="bk-gotra" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                        Gotra (optional)
                      </label>
                      <input
                        id="bk-gotra"
                        value={form.gotra}
                        onChange={(e) => setForm((f) => ({ ...f, gotra: e.target.value }))}
                        placeholder="e.g. Kashyap"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="bk-city" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                        City *
                      </label>
                      <input
                        id="bk-city"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        required
                        placeholder="e.g. New Delhi"
                        className={inputCls}
                      />
                    </div>
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
                        required
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
                    <div className="sm:col-span-2">
                      <label htmlFor="bk-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                        Email (for receipt)
                      </label>
                      <input
                        id="bk-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="you@example.com"
                        className={inputCls}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="bk-notes" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-ink-soft">
                        Special Instructions (optional)
                      </label>
                      <textarea
                        id="bk-notes"
                        rows={3}
                        value={form.notes}
                        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Add my parents' names to the sankalp…"
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                  </div>

                  {/* Add-ons */}
                  <div className="pt-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
                      <Gift className="h-4 w-4 text-saffron-600" />
                      Add-ons & Offerings
                    </h3>
                    <div className="mt-3 space-y-2.5">
                      {addons.map((a) => {
                        const selected = addonIds.includes(a.id);
                        const free = a.id === "kundli" && applied?.kind === "addon";
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => toggleAddon(a.id)}
                            aria-pressed={selected}
                            className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                              selected
                                ? "border-saffron-400 bg-saffron-50/60 ring-2 ring-saffron-200"
                                : "border-saffron-100 bg-white hover:border-saffron-300"
                            }`}
                          >
                            <span className="text-2xl">{a.emoji}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-bold text-ink">
                                {a.label}
                              </span>
                              <span className="block text-xs text-ink-soft">
                                {a.hint}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span
                                className={`block text-sm font-bold ${
                                  free ? "text-emerald-600" : "text-saffron-600"
                                }`}
                              >
                                {free ? "FREE" : formatINR(a.price)}
                              </span>
                              <span
                                className={`mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                                  selected
                                    ? "border-saffron-500 bg-saffron-500 text-white"
                                    : "border-saffron-200 bg-white"
                                }`}
                              >
                                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="pt-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
                      <span className="text-base">🎟️</span>
                      Have a Coupon Code?
                    </h3>
                    {applied ? (
                      <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-lg bg-emerald-600 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-white">
                            {applied.code}
                          </span>
                          <span className="text-xs font-semibold text-emerald-700">
                            {applied.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="text-xs font-bold text-maroon-600 transition-colors hover:text-maroon-700"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="mt-3 flex gap-2">
                          <input
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                            placeholder="e.g. TEMPLE30"
                            className={`${inputCls} font-mono tracking-widest`}
                          />
                          <button
                            type="button"
                            onClick={applyCoupon}
                            className="btn-primary shrink-0 !px-6 !py-3"
                          >
                            Apply
                          </button>
                        </div>
                        {couponMsg && (
                          <p
                            className={`mt-2 text-xs font-semibold ${
                              couponMsg.ok ? "text-emerald-600" : "text-red-500"
                            }`}
                          >
                            {couponMsg.text}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ---- STEP 3 : REVIEW & PAY ---- */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink sm:text-2xl">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-saffron-100 text-sm text-saffron-700">
                      5
                    </span>
                    Review & Pay Securely
                  </h2>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    Double-check your booking before paying via Razorpay.
                  </p>
                </div>

                <div className="divide-y divide-saffron-100 rounded-2xl border border-saffron-100 bg-cream/60">
                  {[
                    { icon: "🪔", label: "Pooja", value: `${pooja.title} (${pooja.duration})` },
                    {
                      icon: "📅",
                      label: "Date & Time",
                      value: `${selectedDay ? `${selectedDay.weekday}, ${selectedDay.day} ${selectedDay.month}` : "—"} · ${selectedTime ? selectedTime.time : "—"}`,
                    },
                    { icon: "🙏", label: "Pandit", value: selectedPandit?.name ?? "—" },
                    { icon: "🧑", label: "Devotee", value: `${form.name}${form.city ? `, ${form.city}` : ""}` },
                    {
                      icon: "📱",
                      label: "Mobile",
                      value: form.phone ? `${form.phone.slice(0, 4)} ${form.phone.slice(4, 7)} ${form.phone.slice(7)}` : "—",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                    >
                      <dt className="flex items-center gap-2 text-sm text-ink-soft">
                        <span>{row.icon}</span>
                        {row.label}
                      </dt>
                      <dd className="text-right text-sm font-semibold text-ink">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                    Payment Summary
                  </h3>
                  <div className="mt-3 space-y-2 rounded-2xl border border-saffron-100 bg-white p-5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ink-soft">Pooja Price</span>
                      <span className="font-semibold text-ink">{formatINR(pooja.price)}</span>
                    </div>
                    {selectedPandit && selectedPandit.fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Pandit Fee ({selectedPandit.name})</span>
                        <span className="font-semibold text-ink">{formatINR(selectedPandit.fee)}</span>
                      </div>
                    )}
                    {selectedAddons.map((a) => (
                      <div key={a.id} className="flex justify-between">
                        <span className="text-ink-soft">
                          {a.emoji} {a.label}
                        </span>
                        <span className="font-semibold text-ink">
                          {a.id === "kundli" && applied?.kind === "addon" ? "FREE" : formatINR(a.price)}
                        </span>
                      </div>
                    ))}
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Coupon ({applied?.code})</span>
                        <span className="font-semibold">−{formatINR(discount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-dashed border-saffron-200 pt-3">
                      <span className="font-bold text-ink">Total Payable</span>
                      <span className="font-display text-2xl font-bold text-saffron-600">
                        {formatINR(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCheckoutOpen(true)}
                  className="btn-primary !w-full !py-4 text-base"
                >
                  <Lock className="h-4 w-4" />
                  Proceed to Pay {formatINR(total)} via Razorpay
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
            )}
          </div>

          {/* Bottom navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-outline !px-6 !py-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            {step < 3 && (
              <button
                onClick={() => {
                  if (step === 2) {
                    (document.getElementById("details-form") as HTMLFormElement | null)?.requestSubmit();
                  } else if (canContinue) {
                    setStep((s) => s + 1);
                  }
                }}
                disabled={!canContinue}
                className="btn-primary !px-8 !py-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
            {step === 3 && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Check className="h-4 w-4" /> All set — pay securely above
              </span>
            )}
          </div>
        </div>

        {/* ============ SUMMARY SIDEBAR ============ */}
        <aside className="self-start lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
            <div className={`relative h-20 bg-gradient-to-br ${pooja.gradient}`}>
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
              <span className="absolute -bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-card">
                {pooja.emoji}
              </span>
            </div>
            <div className="px-6 pb-6 pt-9">
              <h3 className="font-display text-lg font-bold text-ink">{pooja.title}</h3>
              <p className="mt-0.5 text-xs text-ink-soft">
                {pooja.duration} · {pooja.bestMuhurat}
              </p>

              <dl className="mt-4 space-y-2.5 border-t border-dashed border-saffron-100 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-ink-soft">
                    <CalendarDays className="h-3.5 w-3.5" /> Date
                  </dt>
                  <dd className="font-semibold text-ink">
                    {selectedDay ? `${selectedDay.weekday}, ${selectedDay.day} ${selectedDay.month}` : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-ink-soft">
                    <Clock className="h-3.5 w-3.5" /> Time
                  </dt>
                  <dd className="font-semibold text-ink">{selectedTime ? selectedTime.time : "—"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-ink-soft">🙏 Pandit</dt>
                  <dd className="max-w-[180px] truncate text-right font-semibold text-ink">
                    {selectedPandit ? selectedPandit.name : "—"}
                  </dd>
                </div>
                {selectedAddons.length > 0 && (
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-ink-soft">🎁 Add-ons</dt>
                    <dd className="text-right font-semibold text-ink">
                      {selectedAddons.length} item{selectedAddons.length > 1 ? "s" : ""}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 space-y-2 border-t border-dashed border-saffron-100 pt-4 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Pooja Price</span>
                  <span>{formatINR(pooja.price)}</span>
                </div>
                {selectedPandit && selectedPandit.fee > 0 && (
                  <div className="flex justify-between text-ink-soft">
                    <span>Pandit Fee</span>
                    <span>{formatINR(selectedPandit.fee)}</span>
                  </div>
                )}
                {selectedAddons.length > 0 && (
                  <div className="flex justify-between text-ink-soft">
                    <span>Add-ons</span>
                    <span>{formatINR(addonsTotal)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Coupon ({applied?.code})</span>
                    <span>−{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex items-end justify-between border-t border-saffron-200 pt-3">
                  <span className="font-bold text-ink">Total</span>
                  <span className="font-display text-2xl font-bold text-saffron-600">
                    {formatINR(total)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] font-semibold text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                Payments secured by Razorpay
              </div>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 px-2 text-[11px] leading-relaxed text-ink-soft/70">
            <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-saffron-500" />
            Free cancellation & rescheduling up to 24 hours before the muhurat.
          </p>
        </aside>
      </div>

      <RazorpayCheckout
        open={checkoutOpen}
        amount={total}
        poojaTitle={pooja.title}
        onClose={handleCheckoutClose}
        onSuccess={handleSuccess}
      />
    </>
  );
}
