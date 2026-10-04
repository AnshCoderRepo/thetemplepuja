"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { couponDiscount, couponProblem } from "@/lib/coupons";
import type { Coupon } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import { createRazorpayOrderRemote } from "../api/paymentApi";
import { loadRazorpayScript } from "../services/razorpayScript";
import type {
  AppliedCoupon,
  CheckoutSummary,
  PaymentProof,
  PaymentTab,
  RealMode,
} from "../types/payment.types";
import CouponInput from "./CouponInput";
import PaymentCard from "./PaymentCard";
import PaymentMethodTabs from "./PaymentMethodTabs";
import PaymentNetbanking from "./PaymentNetbanking";
import PaymentUpi from "./PaymentUpi";
import PaymentWallet from "./PaymentWallet";

export interface RazorpayCheckoutProps {
  open: boolean;
  poojaPrice: number;
  poojaTitle: string;
  poojaSlug?: string;
  packageTier?: string;
  addons?: { id: string; name: string; price: number; quantity: number; emoji?: string }[];
  couponMap: Record<string, Coupon>;
  devoteeName?: string;
  phone?: string;
  onClose: () => void;
  onSuccess: (
    bookingId: string,
    payment?: PaymentProof,
    summary?: CheckoutSummary
  ) => void;
}

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[#3395ff] focus:ring-2 focus:ring-[#3395ff]/20";

function newBookingId(): string {
  return "SK" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function RazorpayCheckout({
  open,
  poojaPrice,
  poojaTitle,
  poojaSlug,
  packageTier,
  addons,
  couponMap,
  devoteeName,
  phone,
  onClose,
  onSuccess,
}: RazorpayCheckoutProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");
  const [tab, setTab] = useState<PaymentTab>("upi");
  const [vpa, setVpa] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [bank, setBank] = useState("");
  const [wallet, setWallet] = useState("");
  const [error, setError] = useState("");
  const [, setBookingId] = useState("");
  const [realMode, setRealMode] = useState<RealMode>({ kind: "none" });
  const [paymentNote, setPaymentNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const addonTotal = (addons || []).reduce((acc, a) => acc + a.price * a.quantity, 0);
  const subtotal = poojaPrice + addonTotal;

  const discount = applied
    ? couponDiscount(applied.code, poojaPrice, couponMap)
    : 0;
  const total = Math.max(subtotal - discount, 0);

  const couponEligibility = (code: string): string | null =>
    couponProblem(
      code,
      { phone: phone ?? "", price: poojaPrice, poojaTitle },
      couponMap
    );

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    const problem = couponEligibility(code);
    if (problem) {
      setApplied(null);
      setCouponMsg({ ok: false, text: problem });
      return;
    }
    const c = couponMap[code];
    setApplied({
      code,
      label: c.label,
      description: c.description,
      kind: c.kind,
      value: c.value,
    });
    setCouponMsg({ ok: true, text: `Coupon ${code} applied — ${c.label}!` });
  };

  const quickApply = (code: string) => {
    setCoupon(code);
    const problem = couponEligibility(code);
    if (problem) {
      setApplied(null);
      setCouponMsg({ ok: false, text: problem });
      return;
    }
    const c = couponMap[code];
    setApplied({
      code,
      label: c.label,
      description: c.description,
      kind: c.kind,
      value: c.value,
    });
    setCouponMsg({ ok: true, text: `Coupon ${code} applied — ${c.label}!` });
  };

  const removeCoupon = () => {
    setApplied(null);
    setCouponMsg(null);
  };

  useEffect(() => {
    if (!open) return;
    setPhase("form");
    setError("");
    setTab("upi");
    setPaymentNote("");
    setRealMode({ kind: "none" });
    setCoupon("");
    setApplied(null);
    setCouponMsg(null);
  }, [open]);

  useEffect(() => {
    if (!open || !poojaSlug) return;
    let stale = false;
    setRealMode({ kind: "none" });
    void (async () => {
      const start = await createRazorpayOrderRemote({
        poojaSlug,
        packageTier,
        addons: addons?.map((a) => ({ id: a.id, quantity: a.quantity })),
        couponCode: applied?.code ?? null,
        phone: phone ?? "",
      });
      if (stale) return;
      if (start.configured && start.orderId && start.keyId) {
        setRealMode({
          kind: "ready",
          keyId: start.keyId,
          orderId: start.orderId,
          amount: start.amount ?? Math.round(total * 100),
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
  }, [open, poojaSlug, applied?.code, phone, total, addons]);

  if (!open) return null;

  const displayAmount =
    realMode.kind === "ready" ? realMode.amount / 100 : total;
  const realReady = realMode.kind === "ready";
  const realBlocked = realMode.kind === "error";

  const simulatePay = () => {
    setPhase("processing");
    setTimeout(() => {
      const id = newBookingId();
      setBookingId(id);
      setPhase("success");
      onSuccess(id, undefined, {
        amount: total,
        subtotal,
        addonTotal,
        discount,
        coupon: applied,
        addons,
      });
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
      name: "templepujasewa",
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
          onSuccess(
            id,
            {
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: signature,
            },
            {
              amount: total,
              subtotal,
              addonTotal,
              discount,
              coupon: applied,
              addons,
            }
          );
        }, 1200);
      },
      modal: {
        ondismiss: () => {
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b245b]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("checkout.title")}
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
                {t("checkout.title")}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs">
                  🕉️
                </span>
                <span className="text-sm font-bold">templepujasewa</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#a9c6ff]">{poojaTitle}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold">{formatINR(displayAmount)}</div>
              <div className="text-[10px] text-[#a9c6ff]">{t("checkout.payableNow")}</div>
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
            <PaymentMethodTabs activeTab={tab} onTabChange={setTab} />

            <div className="space-y-4 bg-[#f3f7fa] px-6 py-5">
              <CouponInput
                coupon={coupon}
                onCouponChange={setCoupon}
                applied={applied}
                discount={discount}
                couponMsg={couponMsg}
                couponMap={couponMap}
                onApply={applyCoupon}
                onQuickApply={quickApply}
                onRemove={removeCoupon}
              />

              {realReady && (
                <p className="flex items-center gap-2 rounded-lg bg-[#0b245b]/5 px-3 py-2.5 text-[11px] font-semibold text-[#0b245b]">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  You&apos;ll be redirected to Razorpay&apos;s secure payment
                  page to complete this payment.
                </p>
              )}

              {!realReady && !realBlocked && tab === "upi" && (
                <PaymentUpi vpa={vpa} onVpaChange={setVpa} inputCls={inputCls} />
              )}

              {!realReady && !realBlocked && tab === "card" && (
                <PaymentCard card={card} onCardChange={setCard} inputCls={inputCls} />
              )}

              {!realReady && !realBlocked && tab === "netbanking" && (
                <PaymentNetbanking bank={bank} onBankSelect={setBank} />
              )}

              {!realReady && !realBlocked && tab === "wallet" && (
                <PaymentWallet wallet={wallet} onWalletSelect={setWallet} />
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
                {t("checkout.payNow")} ({formatINR(displayAmount)})
              </button>

              <div className="flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                {t("checkout.secureNote")}
              </div>
            </div>
          </>
        )}

        {phase === "processing" && (
          <div className="flex min-h-[340px] flex-col items-center justify-center bg-[#f3f7fa] px-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#3395ff]" />
            <div className="mt-4 text-sm font-bold text-[#0b245b]">
              {t("checkout.processing")}
            </div>
            <div className="mt-1.5 text-xs text-gray-500">
              {t("checkout.processingDesc")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

