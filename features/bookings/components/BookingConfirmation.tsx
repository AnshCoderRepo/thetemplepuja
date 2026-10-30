"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  FileText,
  Home,
  MessageCircle,
  Receipt,
  UserRound,
  ArrowRight,
  Pause,
  Play,
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/config";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import { trackPurchase } from "@/lib/meta-pixel";
import type { ConfirmedBooking } from "../types/booking.types";

interface BookingConfirmationProps {
  confirmed: ConfirmedBooking;
  basePrice: number;
  phone: string;
  onClose?: () => void;
  isModal?: boolean;
}

export default function BookingConfirmation({
  confirmed,
  basePrice,
  phone,
  onClose,
  isModal = true,
}: BookingConfirmationProps) {
  const router = useRouter();
  const { t } = useI18n();

  const [copiedId, setCopiedId] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // 5-second countdown to home page
  const [countdown, setCountdown] = useState(5);
  const [isRedirectPaused, setIsRedirectPaused] = useState(false);

  useEffect(() => {
    if (confirmed?.id && typeof confirmed?.total === "number") {
      const eventId = `pur_${confirmed.id}`;
      trackPurchase(
        {
          order_id: confirmed.id,
          value: confirmed.total,
          currency: "INR",
          content_name: confirmed.poojaTitle || "Sacred Pooja Seva",
          content_type: "product",
          num_items: 1 + (confirmed.addons?.length || 0),
        },
        eventId
      );
    }
  }, [confirmed?.id, confirmed?.total, confirmed?.poojaTitle, confirmed?.addons]);

  const handleGoHome = useCallback(() => {
    if (onClose) {
      onClose();
    }
    router.push("/");
  }, [onClose, router]);

  // Countdown timer effect
  useEffect(() => {
    if (isRedirectPaused) return;

    if (countdown <= 0) {
      handleGoHome();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isRedirectPaused, handleGoHome]);

  const copyBookingId = async () => {
    try {
      await navigator.clipboard.writeText(confirmed.id);
    } catch {
      // clipboard fallback
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(confirmed.credentials.username);
    } catch {
      // fallback
    }
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(confirmed.credentials.password);
    } catch {
      // fallback
    }
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const devoteeSummary =
    confirmed.devotees && confirmed.devotees.length > 1
      ? confirmed.devotees
          .map((d) => `${d.name} (${d.gotra || "Kashyap"})`)
          .join(", ")
      : `${confirmed.name}${confirmed.gotra ? ` (${confirmed.gotra})` : ""}`;

  const waText = encodeURIComponent(
    `Namaste! I have booked ${confirmed.poojaTitle} on templepujasewa.\n\n` +
      `Booking ID: ${confirmed.id}\n` +
      (confirmed.receiptNumber ? `Receipt No: ${confirmed.receiptNumber}\n` : "") +
      `Date: ${confirmed.date}\n` +
      `Time: ${confirmed.time}\n` +
      `Pandit: ${confirmed.panditName ?? "Assigned by templepujasewa"}\n` +
      `Devotee(s): ${devoteeSummary}\n` +
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
  );

  const innerContent = (
    <div className="w-full flex flex-col">
      {/* ── Top Emerald Success Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-4 py-6 sm:px-8 sm:py-8 text-center text-white shadow-sm">
        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />

        <span className="relative inline-flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-white/20 backdrop-blur shadow-inner">
          <span className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
            <Check className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={3} />
          </span>
        </span>

        <h2 className="relative mt-3.5 font-display text-2xl sm:text-3xl font-bold tracking-tight">
          {t("booking.confirm.successBadge")}
        </h2>
        <p className="relative mt-1 text-xs sm:text-sm text-emerald-50/90 font-medium">
          {t("booking.confirm.confirmedSub")} · {formatINR(confirmed.total)}
        </p>

        {/* ── 5-Second Auto-Redirect Alert Banner ── */}
        <div className="relative mt-3.5 mx-auto max-w-md rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 px-3 py-2.5 sm:px-4 sm:py-3 text-white shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-left min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {!isRedirectPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75" />
                )}
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <p className="text-xs sm:text-sm font-semibold truncate">
                {isRedirectPaused
                  ? t("booking.confirm.redirectPaused")
                  : t("booking.confirm.redirecting").replace("{seconds}", String(countdown))}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleGoHome}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-xs transition-all hover:bg-emerald-50 active:scale-95 cursor-pointer touch-manipulation"
              >
                <span>{t("booking.confirm.goToHomeNow")}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsRedirectPaused((p) => !p)}
                className="inline-flex items-center gap-1 rounded-lg bg-white/20 border border-white/30 px-2 py-1 text-[11px] font-semibold text-white transition-all hover:bg-white/30 active:scale-95 cursor-pointer touch-manipulation"
                title={isRedirectPaused ? "Resume auto-redirect" : "Pause auto-redirect"}
              >
                {isRedirectPaused ? (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    <span>{t("booking.confirm.resumeRedirect")}</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3 fill-current" />
                    <span>{t("booking.confirm.stayOnPage")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Booking ID & Receipt Badge ── */}
        <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={copyBookingId}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-3.5 py-1.5 font-mono text-[11px] sm:text-xs font-bold tracking-wider backdrop-blur transition-colors hover:bg-white/25 active:scale-95 cursor-pointer"
            title={t("booking.confirm.bookingId")}
          >
            {t("booking.confirm.bookingId")}: {confirmed.id}
            {copiedId ? (
              <Check className="h-3 w-3 text-emerald-300" />
            ) : (
              <Copy className="h-3 w-3 text-white/70" />
            )}
          </button>

          {confirmed.receiptNumber && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 font-mono text-[11px] sm:text-xs font-semibold backdrop-blur text-emerald-100">
              <Receipt className="h-3 w-3 text-emerald-300" />
              {t("booking.confirm.receiptNumber")}: {confirmed.receiptNumber}
            </span>
          )}
        </div>

        {/* ── Quick Receipt Download ── */}
        <div className="relative mt-3 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/booking/${confirmed.id}?phone=${encodeURIComponent(phone.trim())}`}
            onClick={() => {
              setIsRedirectPaused(true);
              onClose?.();
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-bold text-emerald-700 shadow-md transition-all hover:bg-emerald-50 active:scale-95"
          >
            <FileText className="h-3.5 w-3.5" />
            {t("booking.confirm.downloadReceipt")}
          </Link>
        </div>
      </div>

      {/* ── Details Section ── */}
      <div className="px-4 py-5 sm:px-6 sm:py-6 space-y-4">
        {/* Sacred Details Definition List */}
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-xs">
          <dl className="space-y-3 text-xs sm:text-sm">
            {[
              { icon: "🪔", label: t("booking.confirm.labelPooja"), value: confirmed.poojaTitle },
              {
                icon: "📅",
                label: t("booking.confirm.labelDate"),
                value: confirmed.date,
              },
              {
                icon: "⏰",
                label: t("booking.confirm.labelTime"),
                value: confirmed.time,
              },
              {
                icon: "🙏",
                label: t("booking.confirm.labelPandit"),
                value: confirmed.panditName ?? t("booking.confirm.assignedByTemple"),
              },
              {
                icon: "🕉️",
                label: t("booking.confirm.labelDevotee"),
                value: `${confirmed.name}${confirmed.gotra ? ` (${confirmed.gotra})` : ""}`,
              },
              {
                icon: "🪔",
                label: t("booking.confirm.labelIntention"),
                value: confirmed.reason,
              },
              ...(confirmed.address
                ? [
                    {
                      icon: "🏡",
                      label: "Ritual Location",
                      value: confirmed.address,
                    },
                  ]
                : []),
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 border-b border-dashed border-saffron-100 pb-2.5 last:border-0 last:pb-0"
              >
                <dt className="flex shrink-0 items-center gap-2 text-ink-soft">
                  <span className="text-base">{row.icon}</span>
                  <span>{row.label}</span>
                </dt>
                <dd className="text-right font-semibold text-ink break-words">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Devotees List for Couple / Family */}
        {confirmed.devotees && confirmed.devotees.length > 1 && (
          <div className="rounded-2xl border border-saffron-100 bg-saffron-50/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-saffron-800">
                🕉️ Vedic Sankalp Devotees ({confirmed.devotees.length})
              </p>
              <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-bold text-saffron-900">
                {confirmed.packageTier === "couple" ? "Couple Plan" : "Family Plan"}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {confirmed.devotees.map((devotee, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-white p-2.5 text-xs border border-saffron-100 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-saffron-100 text-[10px] font-bold text-saffron-800">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-ink truncate">{devotee.name}</span>
                  </div>
                  <span className="shrink-0 rounded bg-saffron-50 px-2 py-0.5 text-[10px] font-bold text-saffron-800 border border-saffron-200/60">
                    Gotra: {devotee.gotra || "Kashyap"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Offerings / Chadhavas Included */}
        {confirmed.addons && confirmed.addons.length > 0 && (
          <div className="rounded-2xl border border-saffron-100 bg-saffron-50/50 p-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-saffron-800">
              🌸 {t("booking.confirm.offeringsIncluded")}
            </p>
            <div className="space-y-1.5">
              {confirmed.addons.map((addon) => (
                <div key={addon.id} className="flex justify-between text-xs text-ink">
                  <span>
                    {addon.emoji || "🌸"} {addon.name} (x{addon.quantity})
                  </span>
                  <span className="font-semibold">{formatINR(addon.price * addon.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial Dakshina Breakdown */}
        <div className="rounded-2xl border border-saffron-100 bg-cream/70 p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
            {t("booking.confirm.financialSummary")}
          </p>
          <dl className="mt-3 space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-ink-soft">
              <dt>{t("booking.confirm.basePooja")}</dt>
              <dd>{formatINR(basePrice)}</dd>
            </div>
            {confirmed.addonTotal && confirmed.addonTotal > 0 ? (
              <div className="flex justify-between text-ink-soft">
                <dt>{t("booking.confirm.addonsTotal")}</dt>
                <dd>+{formatINR(confirmed.addonTotal)}</dd>
              </div>
            ) : null}
            {confirmed.discount > 0 && confirmed.coupon && (
              <div className="flex justify-between font-semibold text-emerald-600">
                <dt>
                  {t("booking.confirm.couponSavings")} ({confirmed.coupon.code})
                </dt>
                <dd>−{formatINR(confirmed.discount)}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-saffron-200 pt-2.5">
              <dt className="font-bold text-ink">{t("booking.confirm.totalPaid")}</dt>
              <dd className="font-display text-lg sm:text-xl font-bold text-saffron-600">
                {formatINR(confirmed.total)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Devotee Credentials Card */}
        <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              🔐 {t("booking.confirm.credentialsTitle")}
            </p>
            <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-bold text-saffron-800">
              {t("booking.confirm.accountCreated")}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft/70">
            {t("booking.confirm.credentialsDesc")}
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-saffron-100">
              <span className="text-xs font-semibold text-ink-soft">
                {t("booking.confirm.username")}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-ink">
                  {confirmed.credentials.username}
                </span>
                <button
                  type="button"
                  onClick={copyUsername}
                  className="rounded p-1 text-ink-soft hover:bg-saffron-50 hover:text-saffron-800 transition-colors"
                  title="Copy username"
                >
                  {copiedUsername ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-saffron-100">
              <span className="text-xs font-semibold text-ink-soft">
                {t("booking.confirm.password")}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-ink">
                  {confirmed.credentials.password}
                </span>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="rounded p-1 text-ink-soft hover:bg-saffron-50 hover:text-saffron-800 transition-colors"
                  title="Copy password"
                >
                  {copiedPassword ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row pt-1">
          <Link
            href={`/booking/${confirmed.id}?phone=${encodeURIComponent(phone.trim())}`}
            onClick={() => {
              setIsRedirectPaused(true);
              onClose?.();
            }}
            className="btn-primary !flex-1 text-center justify-center py-2.5 text-xs sm:text-sm"
          >
            <FileText className="h-4 w-4" />
            {t("booking.confirm.downloadReceipt")}
          </Link>
          <Link
            href={`/profile?phone=${encodeURIComponent(phone.trim())}`}
            onClick={() => {
              setIsRedirectPaused(true);
              onClose?.();
            }}
            className="btn-outline !flex-1 text-center justify-center py-2.5 text-xs sm:text-sm"
          >
            <UserRound className="h-4 w-4" />
            {t("booking.confirm.goToBookings")}
          </Link>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleGoHome}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-800 hover:text-saffron-950 hover:underline transition-colors cursor-pointer py-1"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{t("common.backToHome")}</span>
          </button>
          <span className="text-slate-300">•</span>
          <a
            href={getWhatsAppUrl(waText)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Share Booking on WhatsApp"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors py-1"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>{t("booking.confirm.shareWhatsApp")}</span>
          </a>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="w-full h-full min-h-0 flex-1 overflow-y-auto modal-scrollbar overscroll-contain bg-[#FFFDF9]">
        {innerContent}
      </div>
    );
  }

  return (
    <section className="container-px pb-24 pt-8 md:pt-12">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-card">
        {innerContent}
      </div>
    </section>
  );
}
