"use client";

import type { Coupon } from "@/lib/data";
import { formatINR } from "@/lib/format";
import { useI18n } from "@/components/providers";
import type { AppliedCoupon } from "../types/payment.types";

interface CouponInputProps {
  coupon: string;
  onCouponChange: (val: string) => void;
  applied: AppliedCoupon | null;
  discount: number;
  couponMsg: { ok: boolean; text: string } | null;
  couponMap: Record<string, Coupon>;
  onApply: () => void;
  onQuickApply: (code: string) => void;
  onRemove: () => void;
}

export default function CouponInput({
  coupon,
  onCouponChange,
  applied,
  discount,
  couponMsg,
  couponMap,
  onApply,
  onQuickApply,
  onRemove,
}: CouponInputProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      {applied ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-md bg-emerald-600 px-2 py-1 font-mono text-[11px] font-bold tracking-widest text-white">
              {applied.code}
            </span>
            <span className="truncate text-xs font-semibold text-emerald-700">
              {applied.label}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {discount > 0 && (
              <span className="text-xs font-bold text-emerald-600">
                −{formatINR(discount)}
              </span>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-[11px] font-bold text-gray-400 transition-colors hover:text-red-500"
            >
              {t("checkout.remove")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={coupon}
              onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
              placeholder={t("checkout.couponPlaceholder")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 font-mono text-xs font-bold tracking-widest text-gray-900 outline-none transition-all placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#3395ff] focus:ring-2 focus:ring-[#3395ff]/20"
            />
            <button
              type="button"
              onClick={onApply}
              className="shrink-0 rounded-lg bg-[#0b245b] px-4 text-xs font-bold text-white transition-colors hover:bg-[#12336e]"
            >
              {t("checkout.applyCoupon")}
            </button>
          </div>
          {couponMsg && (
            <p
              className={`mt-2 text-[11px] font-semibold ${
                couponMsg.ok ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {couponMsg.text}
            </p>
          )}
          {Object.keys(couponMap).length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {Object.entries(couponMap).map(([code, c]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onQuickApply(code)}
                  title={c.description}
                  className="rounded-full border border-gray-200 bg-[#f3f7fa] px-2.5 py-1 text-[10px] font-bold text-gray-600 transition-colors hover:border-[#3395ff]/40 hover:text-[#0b245b]"
                >
                  {code}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

