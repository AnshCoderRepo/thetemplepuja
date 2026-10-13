"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  ChevronLeft,
} from "lucide-react";
import QRCode from "qrcode";
import { SITE_CONFIG, getUpiPaymentUrl } from "@/lib/config";
import { formatINR } from "@/lib/format";

export interface UpiQrCheckoutProps {
  amount: number;
  poojaTitle: string;
  devoteeName: string;
  phone: string;
  bookingId?: string;
  onBack: () => void;
  onConfirm: (utr: string) => Promise<void> | void;
  isSubmitting?: boolean;
}

export default function UpiQrCheckout({
  amount,
  poojaTitle,
  devoteeName,
  phone,
  bookingId,
  onBack,
  onConfirm,
  isSubmitting = false,
}: UpiQrCheckoutProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [inputError, setInputError] = useState("");

  const upiId = SITE_CONFIG.payment.upiId;
  const payeeName = SITE_CONFIG.payment.payeeName;
  const customQrImage = SITE_CONFIG.payment.qrImageUrl;

  const transactionNote = `${poojaTitle.slice(0, 30)} - ${devoteeName.slice(0, 20)}`.trim();
  const upiUri = getUpiPaymentUrl(amount, transactionNote);

  // Generate high-resolution QR code
  useEffect(() => {
    let cancelled = false;
    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(upiUri, {
          width: 380,
          margin: 1.5,
          color: {
            dark: "#1e1b4b", // deep navy/slate
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (err) {
        console.error("QR Code generation error:", err);
      }
    };
    void generate();
    return () => {
      cancelled = true;
    };
  }, [upiUri]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(String(amount));
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQr = () => {
    const src = customQrImage || qrDataUrl;
    if (!src) return;
    const link = document.createElement("a");
    link.href = src;
    link.download = `puja-payment-qr-${amount}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiUri;
  };

  const handleSubmit = async () => {
    setInputError("");
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr) {
      setInputError("Please enter the 12-digit UPI Reference / UTR Number from your payment receipt.");
      return;
    }
    if (cleanUtr.length < 6) {
      setInputError("Please enter a valid UPI Reference / UTR number (typically 12 digits).");
      return;
    }
    await onConfirm(cleanUtr);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Sacred Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-saffron-600 via-amber-600 to-saffron-700 p-4 text-white shadow-md">
        <div className="absolute right-2 -bottom-4 opacity-10 text-8xl font-serif select-none pointer-events-none">
          🕉️
        </div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase text-amber-100">
              <span>🪔</span>
              <span>UPI & QR Code Payment</span>
            </div>
            <h3 className="mt-1 text-base sm:text-lg font-bold font-display text-white">
              Scan & Pay Dakshina
            </h3>
            <p className="text-[11px] text-amber-100/90 line-clamp-1 mt-0.5">
              {poojaTitle} · {devoteeName}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-200 block">
              Total Seva
            </span>
            <div className="font-display text-xl sm:text-2xl font-black text-white">
              {formatINR(amount)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="rounded-2xl border border-saffron-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        {/* QR Code Presentation */}
        <div className="flex flex-col items-center text-center">
          <div className="relative p-3 rounded-2xl bg-gradient-to-b from-amber-50 to-cream border border-saffron-200 shadow-inner">
            <div className="relative bg-white p-2.5 rounded-xl border border-saffron-100 shadow-sm flex items-center justify-center">
              {customQrImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customQrImage}
                  alt="Official UPI Payment QR Code"
                  className="max-h-72 w-auto max-w-full object-contain rounded-lg sm:max-h-80 shadow-xs"
                />
              ) : qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Dynamic UPI Payment QR Code"
                  className="h-48 w-48 object-contain rounded-lg sm:h-52 sm:w-52"
                />
              ) : (
                <div className="h-48 w-48 flex flex-col items-center justify-center text-slate-400 gap-2 sm:h-52 sm:w-52">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-saffron-600 border-t-transparent" />
                  <span className="text-xs font-semibold">Generating QR Code...</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-saffron-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Seva QR · {payeeName}</span>
            </div>
          </div>

          {/* Supported UPI Apps Badges */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Accepts:</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">Google Pay</span>
            <span className="rounded-md bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 font-semibold">PhonePe</span>
            <span className="rounded-md bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 font-semibold">Paytm</span>
            <span className="rounded-md bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 font-semibold">BHIM</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">Cred</span>
          </div>

          {/* Download QR & Mobile Direct Pay */}
          <div className="mt-3 flex items-center justify-center gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-saffron-200 bg-saffron-50/70 px-3 py-2 text-xs font-bold text-saffron-900 transition-colors hover:bg-saffron-100 active:scale-98"
              title="Save QR Code to scan via Gallery in your UPI App"
            >
              <Download className="h-3.5 w-3.5 text-saffron-700" />
              <span>Download QR</span>
            </button>

            <button
              type="button"
              onClick={handleOpenUpiApp}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-saffron-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-saffron-700 active:scale-98"
              title="Open installed UPI App directly on this phone"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Pay on Mobile</span>
            </button>
          </div>
        </div>

        {/* UPI Details Box */}
        <div className="rounded-xl border border-dashed border-saffron-300 bg-amber-50/50 p-3.5 space-y-2.5">
          {/* UPI ID Row */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-saffron-800">
                Official UPI ID
              </span>
              <span className="font-mono text-sm font-bold text-ink select-all">
                {upiId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                copiedUpi
                  ? "bg-emerald-600 text-white"
                  : "border border-saffron-300 bg-white text-saffron-900 hover:bg-saffron-100"
              }`}
            >
              {copiedUpi ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy UPI ID</span>
                </>
              )}
            </button>
          </div>

          {/* Amount Row */}
          <div className="flex items-center justify-between gap-2 border-t border-saffron-200/60 pt-2">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-saffron-800">
                Exact Amount to Transfer
              </span>
              <span className="font-display text-sm font-bold text-ink">
                {formatINR(amount)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAmount}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                copiedAmount
                  ? "bg-emerald-600 text-white"
                  : "border border-saffron-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {copiedAmount ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Amount</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs space-y-1.5 text-slate-700">
          <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
            <span>📋</span> How to complete your payment:
          </p>
          <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
            <li>Open Google Pay, PhonePe, Paytm or any UPI App.</li>
            <li>Scan the QR code above or send {formatINR(amount)} to <strong>{upiId}</strong>.</li>
            <li>Enter your <strong>12-digit UPI Reference / UTR Number</strong> below and confirm.</li>
          </ol>
        </div>

        {/* UTR Input Section */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-bold text-ink">
            Enter 12-Digit UPI Reference No. / UTR <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={utrNumber}
            onChange={(e) => {
              setUtrNumber(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20));
              if (inputError) setInputError("");
            }}
            placeholder="e.g. 428192837491"
            className="w-full rounded-xl border border-saffron-300 bg-white px-3.5 py-2.5 text-sm font-mono text-ink placeholder:font-sans placeholder:text-slate-400 focus:border-saffron-600 focus:outline-none focus:ring-2 focus:ring-saffron-200 shadow-2xs"
          />
          <p className="text-[10px] text-slate-500">
            ℹ️ You can find the 12-digit UTR / UPI Ref ID in your payment app under transaction details.
          </p>

          {inputError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">
              ⚠️ {inputError}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onBack}
            className="flex items-center justify-center gap-1 rounded-xl border border-saffron-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-saffron-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all ${
              isSubmitting
                ? "bg-saffron-600 cursor-wait opacity-90 shadow-saffron-600/20"
                : "bg-gradient-to-r from-saffron-500 to-saffron-600 shadow-saffron-600/20 hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.99]"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Confirming Booking...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Confirm Booking with UTR</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
