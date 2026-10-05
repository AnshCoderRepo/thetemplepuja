"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, FileText, MessageCircle, Receipt, UserRound } from "lucide-react";
import { getWhatsAppUrl } from "@/lib/config";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { ConfirmedBooking } from "../types/booking.types";

interface BookingConfirmationProps {
  confirmed: ConfirmedBooking;
  basePrice: number;
  phone: string;
}

export default function BookingConfirmation({
  confirmed,
  basePrice,
  phone,
}: BookingConfirmationProps) {
  const { t } = useI18n();
  const [copiedId, setCopiedId] = useState(false);

  const copyBookingId = async () => {
    try {
      await navigator.clipboard.writeText(confirmed.id);
    } catch {
      // clipboard fallback
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
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
            {t("booking.confirm.successBadge")}
          </h2>
          <p className="relative mt-2 text-sm text-emerald-50/90">
            {t("booking.confirm.confirmedSub")} · {formatINR(confirmed.total)}
          </p>

          <div className="relative mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={copyBookingId}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 font-mono text-xs font-bold tracking-widest backdrop-blur transition-colors hover:bg-white/25"
              title={t("booking.confirm.bookingId")}
            >
              {t("booking.confirm.bookingId")}: {confirmed.id}
              {copiedId ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-white/70" />
              )}
            </button>

            {confirmed.receiptNumber && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 font-mono text-xs font-semibold backdrop-blur text-emerald-100">
                <Receipt className="h-3.5 w-3.5 text-emerald-300" />
                {t("booking.confirm.receiptNumber")}: {confirmed.receiptNumber}
              </span>
            )}
          </div>

          <div className="relative mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/booking/${confirmed.id}?phone=${encodeURIComponent(phone.trim())}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-xs font-bold text-emerald-700 shadow-md transition-all hover:bg-emerald-50"
            >
              <FileText className="h-4 w-4" />
              {t("booking.confirm.downloadReceipt")}
            </Link>
          </div>
        </div>

        <div className="px-8 py-8 space-y-6">
          <dl className="space-y-3.5 text-sm">
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
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-saffron-100 text-[10px] font-bold text-saffron-800">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-ink">{devotee.name}</span>
                    </div>
                    <span className="rounded bg-saffron-50 px-2 py-0.5 text-[10px] font-bold text-saffron-800 border border-saffron-200/60">
                      Gotra: {devotee.gotra || "Kashyap"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {confirmed.addons && confirmed.addons.length > 0 && (
            <div className="rounded-2xl border border-saffron-100 bg-saffron-50/50 p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-saffron-800">
                🌸 {t("booking.confirm.offeringsIncluded")}
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

          <div className="rounded-2xl border border-saffron-100 bg-cream/70 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              {t("booking.confirm.financialSummary")}
            </p>
            <dl className="mt-3 space-y-2 text-sm">
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
                <dd className="font-display text-xl font-bold text-saffron-600">
                  {formatINR(confirmed.total)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-saffron-200 bg-saffron-50 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">
              🔐 {t("booking.confirm.credentialsTitle")}
            </p>
            <p className="mt-1 text-xs text-ink-soft/70">
              {t("booking.confirm.credentialsDesc")}
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">{t("booking.confirm.username")}</span>
                <span className="font-mono text-sm font-bold text-ink">{confirmed.credentials.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink-soft">{t("booking.confirm.password")}</span>
                <span className="font-mono text-sm font-bold text-ink">{confirmed.credentials.password}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            <Link
              href={`/booking/${confirmed.id}?phone=${encodeURIComponent(phone.trim())}`}
              className="btn-primary !flex-1"
            >
              <FileText className="h-4 w-4" />
              {t("booking.confirm.downloadReceipt")}
            </Link>
            <Link
              href={`/profile?phone=${encodeURIComponent(phone.trim())}`}
              className="btn-outline !flex-1"
            >
              <UserRound className="h-4 w-4" />
              {t("booking.confirm.goToBookings")}
            </Link>
          </div>

          <div className="text-center pt-2">
            <a
              href={getWhatsAppUrl(waText)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share Booking on WhatsApp"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
            >
              <MessageCircle className="h-4 w-4" />
              {t("booking.confirm.shareWhatsApp")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

