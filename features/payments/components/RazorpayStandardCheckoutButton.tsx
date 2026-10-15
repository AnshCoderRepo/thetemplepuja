"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { loadRazorpayScript } from "../services/razorpayScript";
import { createStandardRazorpayOrder, verifyRazorpayPayment } from "../api/paymentApi";

export interface RazorpayStandardCheckoutButtonProps {
  amount: number; // in Rupees (e.g. 100 for ₹100), converted to paise internally
  currency?: string;
  receipt?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  buttonText?: string;
  className?: string;
  onSuccess?: (verificationResult: {
    order_id: string;
    payment_id: string;
    signature: string;
  }) => void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
}

export default function RazorpayStandardCheckoutButton({
  amount,
  currency = "INR",
  receipt,
  name = "templepujasewa",
  description = "Online Vedic Puja & Seva Booking",
  prefill,
  notes,
  buttonText,
  className,
  onSuccess,
  onError,
  onDismiss,
}: RazorpayStandardCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      // 1. Load Razorpay Checkout.js script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const msg = "Failed to load Razorpay checkout SDK. Please check your internet connection.";
        setErrorMessage(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      // Convert amount in Rupees to paise (min 100 paise = 1 INR)
      const amountPaise = Math.round(amount * 100);
      if (amountPaise < 100) {
        const msg = "Minimum payment amount is ₹1.00 (100 paise).";
        setErrorMessage(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      // 2. Call backend /api/create-order
      const orderData = await createStandardRazorpayOrder({
        amount: amountPaise,
        currency,
        receipt,
        notes,
      });

      if (orderData.error || (!orderData.order_id && !orderData.orderId)) {
        const msg = orderData.error || "Failed to initialize payment order with Razorpay.";
        setErrorMessage(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      const orderId = (orderData.order_id || orderData.orderId)!;
      const keyId =
        orderData.key_id ||
        (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();

      if (!keyId) {
        const msg = "Razorpay Public Key ID is missing.";
        setErrorMessage(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: any) => any }).Razorpay;
      if (!RazorpayConstructor) {
        const msg = "Razorpay is unavailable in the browser environment.";
        setErrorMessage(msg);
        onError?.(msg);
        setLoading(false);
        return;
      }

      // 3. Open Razorpay Checkout Modal
      const rzp = new RazorpayConstructor({
        key: keyId,
        amount: orderData.amount || amountPaise,
        currency: orderData.currency || currency,
        name,
        description,
        order_id: orderId,
        image: "/logo.jpeg",
        prefill: {
          name: prefill?.name || "",
          email: prefill?.email || "",
          contact: prefill?.contact || "",
        },
        theme: {
          color: "#ea580c", // Brand Saffron
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            const msg = "Payment was cancelled or closed by user.";
            setErrorMessage(msg);
            onDismiss?.();
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

            if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
              const msg = "Incomplete payment confirmation received from Razorpay.";
              setErrorMessage(msg);
              onError?.(msg);
              setLoading(false);
              return;
            }

            // 4. Send payment credentials to backend /api/verify-payment
            const verifyRes = await verifyRazorpayPayment({
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              signature: razorpay_signature,
            });

            if (!verifyRes.success) {
              const msg = verifyRes.error || "Payment signature verification failed.";
              setErrorMessage(msg);
              onError?.(msg);
              setLoading(false);
              return;
            }

            setLoading(false);
            setErrorMessage("");
            onSuccess?.({
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              signature: razorpay_signature,
            });
          } catch (verifyErr: any) {
            const msg = verifyErr?.message || "An error occurred while verifying your payment.";
            setErrorMessage(msg);
            onError?.(msg);
            setLoading(false);
          }
        },
      });

      // Handle payment.failed event
      if (typeof rzp.on === "function") {
        rzp.on("payment.failed", (failedRes: any) => {
          setLoading(false);
          const failureDesc =
            failedRes?.error?.description ||
            failedRes?.error?.reason ||
            "Payment transaction failed at gateway / bank.";
          setErrorMessage(`Payment failed: ${failureDesc}`);
          onError?.(failureDesc);
        });
      }

      rzp.open();
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message || "Unexpected error occurred starting checkout.";
      setErrorMessage(msg);
      onError?.(msg);
    }
  };

  const defaultBtnText = buttonText || `Pay ₹${amount.toLocaleString("en-IN")}`;

  return (
    <div className="w-full">
      {errorMessage && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={handlePayment}
        className={
          className ||
          "w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        }
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing with Razorpay...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="h-4 w-4 text-white" />
            <span>{defaultBtnText}</span>
          </>
        )}
      </button>
    </div>
  );
}
