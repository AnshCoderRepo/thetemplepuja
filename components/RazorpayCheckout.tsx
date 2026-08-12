"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Landmark,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from "lucide-react";
import { createRazorpayOrderRemote } from "@/lib/api";
import { formatINR } from "@/lib/format";

type Tab = "upi" | "card" | "netbanking" | "wallet";

export interface PaymentProof {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface Props {
  open: boolean;
  amount: number;
  poojaTitle: string;
  /** Used to create the real Razorpay order server-side (price is derived
   * from the catalog on the server, never from the client). */
  poojaSlug?: string;
  couponCode?: string | null;
  devoteeName?: string;
  phone?: string;
  onClose: () => void;
  /** `payment` is present when the payment went through real Razorpay; the
   * booking route verifies its signature before confirming. */
  onSuccess: (bookingId: string, payment?: PaymentProof) => void;
}

const tabs: { id: Tab; label: string; icon: typeof Smartphone }[] = [
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", icon: Landmark },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Yes Bank",
  "Paytm Payments Bank",
];

const wallets = ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge"];

const upiApps = [
  { name: "GPay", bg: "bg-[#00b962]", letter: "G" },
  { name: "PhonePe", bg: "bg-[#5f259f]", letter: "P" },
  { name: "Paytm", bg: "bg-[#00baf2]", letter: "P" },
  { name: "BHIM", bg: "bg-[#0088ca]", letter: "B" },
];

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function detectBrand(num: string) {
  const d = num.replace(/\s/g, "");
  if (d.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6/.test(d)) return "RuPay";
  return "";
}

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#3395ff] focus:ring-2 focus:ring-[#3395ff]/20";

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<boolean> | null = null;

/** Inject Razorpay's checkout script once and cache the result. */
function loadRazorpayScript(): Promise<boolean> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      if (typeof document === "undefined") {
        resolve(false);
        return;
      }
      if (document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`)) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = CHECKOUT_SCRIPT;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

type RealMode =
  | { kind: "none" } // demo mode — simulated flow
  | { kind: "ready"; keyId: string; orderId: string; amount: number; currency: string }
  | { kind: "error"; message: string }; // configured but order creation failed

function newBookingId(): string {
  return "SK" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function RazorpayCheckout({
  open,
  amount,
  poojaTitle,
  poojaSlug,
  couponCode,
  devoteeName,
  phone,
  onClose,
  onSuccess,
}: Props) {
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");
  const [tab, setTab] = useState<Tab>("upi");
  const [vpa, setVpa] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [bank, setBank] = useState("");
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [copied, setCopied] = useState(false);
  const [realMode, setRealMode] = useState<RealMode>({ kind: "none" });
  const [paymentNote, setPaymentNote] = useState("");

  // On open, ask the server for a real order. In demo mode (no keys) this
  // resolves to `none` and the simulated flow below runs as before.
  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setError("");
    setTab("upi");
    setCopied(false);
    setPaymentNote("");
    setRealMode({ kind: "none" });
    let stale = false;

    if (!poojaSlug) {
      setRealMode({ kind: "none" });
      return;
    }
    void (async () => {
      const start = await createRazorpayOrderRemote({
        poojaSlug,
        couponCode: couponCode ?? null,
        phone: phone ?? "",
      });
      if (stale) return;
      if (start.configured && start.orderId && start.keyId) {
        setRealMode({
          kind: "ready",
          keyId: start.keyId,
          orderId: start.orderId,
          amount: start.amount ?? Math.round(amount * 100),
          currency: start.currency ?? "INR",
        });
      } else if (start.configured && start.error) {
        setRealMode({ kind: "error", message: start.error });
      } else {
        setRealMode({ kind: "none" });
      }
    })();
    return () => {
      stale = true;
    };
  }, [open, poojaSlug, couponCode, phone, amount]);

  if (!open) return null;

  // The authoritative payable amount: whatever the server priced the order at
  // (paise), falling back to the client-computed total in demo mode.
  const displayAmount =
    realMode.kind === "ready" ? realMode.amount / 100 : amount;
  const realReady = realMode.kind === "ready";
  const realBlocked = realMode.kind === "error";

  const simulatePay = () => {
    setPhase("processing");
    setTimeout(() => {
      const id = newBookingId();
      setBookingId(id);
      setPhase("success");
      onSuccess(id);
    }, 2000);
  };

  const openRazorpay = async () => {
    if (realMode.kind !== "ready") return;
    setError("");
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Razorpay couldn't load — please try again.");
      return;
    }
    const Rzp = (window as unknown as { Razorpay: new (o: object) => { open: () => void } }).Razorpay;
    if (!Rzp) {
      setError("Razorpay couldn't load — please try again.");
      return;
    }
    const rzp = new Rzp({
      key: realMode.keyId,
      amount: realMode.amount,
      currency: realMode.currency,
      order_id: realMode.orderId,
      name: "The Temple Puja",
      description: poojaTitle,
      prefill: {
        name: devoteeName ?? "",
        contact: phone ?? "",
      },
      theme: { color: "#0b245b" },
      handler: (response: {
        razorpay_payment_id?: string;
        razorpay_order_id?: string;
        razorpay_signature?: string;
      }) => {
        const paymentId = response.razorpay_payment_id;
        const orderId = response.razorpay_order_id;
        const signature = response.razorpay_signature;
        if (!paymentId || !orderId || !signature) {
          setPaymentNote("Payment was not completed — no booking was created. You can try again.");
          return;
        }
        setPhase("processing");
        setTimeout(() => {
          const id = newBookingId();
          setBookingId(id);
          setPhase("success");
          onSuccess(id, {
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
          });
        }, 1200);
      },
      modal: {
        ondismiss: () => {
          // User closed the Razorpay modal without paying — stay on the form.
          setPaymentNote("Payment was not completed — your booking has not been created yet. You can try again.");
        },
      },
    });
    rzp.open();
  };

  const pay = () => {
    setError("");
    if (realReady) {
      void openRazorpay();
      return;
    }
    if (realBlocked) return;

    if (tab === "upi" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(vpa)) {
      setError("Enter a valid UPI ID, e.g. name@okhdfcbank");
      return;
    }
    if (tab === "card") {
      const num = card.number.replace(/\s/g, "");
      if (num.length < 15) {
        setError("Enter a valid card number");
        return;
      }
      if (!card.name.trim()) {
        setError("Enter the cardholder name");
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) {
        setError("Enter a valid expiry date (MM/YY)");
        return;
      }
      if (card.cvv.length < 3) {
        setError("Enter a valid CVV");
        return;
      }
    }
    if (tab === "netbanking" && !bank) {
      setError("Select your bank");
      return;
    }
    if (tab === "wallet" && !wallet) {
      setError("Select a wallet");
      return;
    }
    simulatePay();
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b245b]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Secure payment checkout"
      onClick={phase === "form" ? onClose : undefined}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-[#0b245b] px-6 pb-5 pt-4 text-white">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#3395ff] via-[#4c9fff] to-[#3395ff]" />
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fb8ff]">
                Secure Checkout
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
                  🕉️
                </span>
                <span className="text-sm font-bold">The Temple Puja</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#a9c6ff]">{poojaTitle}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold">{formatINR(displayAmount)}</div>
              <div className="text-[10px] text-[#a9c6ff]">payable now</div>
            </div>
          </div>
          {phase === "form" && (
            <button
              onClick={onClose}
              aria-label="Close checkout"
              className="absolute -right-1 -top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {phase === "form" && (
          <>
            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Payment method"
              className="flex border-b border-gray-100 bg-[#f3f7fa]"
            >
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 flex-col items-center gap-1 border-b-2 pb-2.5 pt-3 text-[11px] font-semibold transition-colors ${
                      active
                        ? "border-[#3395ff] text-[#0b245b]"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="space-y-4 bg-[#f3f7fa] px-6 py-5">
              {realReady && (
                <p className="flex items-center gap-2 rounded-lg bg-[#0b245b]/5 px-3 py-2.5 text-[11px] font-semibold text-[#0b245b]">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  You&apos;ll be redirected to Razorpay&apos;s secure payment
                  page to complete this payment.
                </p>
              )}

              {!realReady && !realBlocked && tab === "upi" && (
                <>
                  <div className="flex items-center gap-2.5">
                    {upiApps.map((app) => (
                      <button
                        key={app.name}
                        onClick={() => setVpa("")}
                        title={app.name}
                        className="group flex flex-col items-center gap-1"
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${app.bg} text-sm font-bold text-white shadow transition-transform group-hover:scale-110`}
                        >
                          {app.letter}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">
                          {app.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      UPI ID
                    </label>
                    <input
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      placeholder="yourname@okhdfcbank"
                      inputMode="email"
                      autoFocus
                      className={inputCls}
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    You will receive a collect request on your UPI app. Enter
                    your UPI PIN to complete the payment.
                  </p>
                </>
              )}

              {!realReady && !realBlocked && tab === "card" && (
                <>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-gray-500">
                        Card Number
                      </label>
                      {detectBrand(card.number) && (
                        <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#0b245b] shadow-sm">
                          {detectBrand(card.number)}
                        </span>
                      )}
                    </div>
                    <input
                      value={card.number}
                      onChange={(e) =>
                        setCard((c) => ({
                          ...c,
                          number: formatCardNumber(e.target.value),
                        }))
                      }
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      autoFocus
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      Name on Card
                    </label>
                    <input
                      value={card.name}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, name: e.target.value }))
                      }
                      placeholder="AARAV SHARMA"
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                        Expiry
                      </label>
                      <input
                        value={card.expiry}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            expiry: formatExpiry(e.target.value),
                          }))
                        }
                        placeholder="MM/YY"
                        inputMode="numeric"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                        CVV
                      </label>
                      <input
                        value={card.cvv}
                        onChange={(e) =>
                          setCard((c) => ({
                            ...c,
                            cvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        placeholder="•••"
                        inputMode="numeric"
                        type="password"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </>
              )}

              {!realReady && !realBlocked && tab === "netbanking" && (
                <div className="grid grid-cols-2 gap-2">
                  {banks.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBank(b)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                        bank === b
                          ? "border-[#3395ff] bg-white text-[#0b245b] shadow-sm ring-2 ring-[#3395ff]/20"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#3395ff]/40"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              {!realReady && !realBlocked && tab === "wallet" && (
                <div className="grid grid-cols-2 gap-2">
                  {wallets.map((w) => (
                    <button
                      key={w}
                      onClick={() => setWallet(w)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                        wallet === w
                          ? "border-[#3395ff] bg-white text-[#0b245b] shadow-sm ring-2 ring-[#3395ff]/20"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#3395ff]/40"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              )}

              {realBlocked && (
                <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                  {realMode.message} Please close and try again in a moment.
                </p>
              )}

              {paymentNote && (
                <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                  {paymentNote}
                </p>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              <button
                onClick={pay}
                disabled={realBlocked}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3395ff] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#2b7fd9] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Lock className="h-4 w-4" />
                {realReady ? `Pay ${formatINR(displayAmount)} via Razorpay` : `Pay ${formatINR(displayAmount)}`}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                100% secure · 256-bit SSL · Powered by{" "}
                <span className="font-bold text-[#3395ff]">Razorpay</span>
              </div>
            </div>
          </>
        )}

        {phase === "processing" && (
          <div className="flex min-h-[340px] flex-col items-center justify-center bg-[#f3f7fa] px-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#3395ff]" />
            <div className="mt-4 text-sm font-bold text-[#0b245b]">
              Processing payment…
            </div>
            <div className="mt-1.5 text-xs text-gray-500">
              Please do not close this window. You are being redirected to{" "}
              {realReady ? "Razorpay" : tab === "upi" ? "your UPI app" : "Razorpay"}.
            </div>
            <div className="mt-6 w-full max-w-[220px] overflow-hidden rounded-full bg-gray-200">
              <div className="h-1.5 animate-pulse rounded-full bg-[#3395ff]" />
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="flex min-h-[340px] flex-col items-center justify-center bg-[#f3f7fa] px-8 text-center">
            <span className="relative flex h-16 w-16 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                <Check className="h-8 w-8" strokeWidth={3} />
              </span>
            </span>
            <div className="mt-4 text-lg font-bold text-[#0b245b]">
              Payment Successful!
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {formatINR(displayAmount)} paid to The Temple Puja · {poojaTitle}
            </div>
            <button
              onClick={copyId}
              className="mt-5 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#0b245b] shadow-sm transition-colors hover:border-[#3395ff]"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Booking ID: {bookingId}
            </button>
            <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
              Your confirmation will be sent on WhatsApp instantly. Our admin
              has been notified.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full rounded-lg bg-[#0b245b] py-3 text-sm font-bold text-white transition-colors hover:bg-[#12336e]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
