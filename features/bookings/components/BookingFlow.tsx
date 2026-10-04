"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, ChevronLeft, Minus, Plus, Sparkles, User, Users, ShieldCheck, HeartHandshake } from "lucide-react";
import { fetchUserByPhone, syncUserFromServer } from "@/lib/api";
import { SITE_CONFIG } from "@/lib/config";
import {
  defaultChadhavaOfferings,
  getLocalizedPoojaTitle,
  getTempleForPooja,
  type ChadhavaOffering,
  type Pooja,
} from "@/lib/data";
import { formatINR } from "@/lib/format";
import { isValidIndianPhone } from "@/lib/validation";
import type { BookingAddonItem, BookingRecord } from "@/lib/storage";
import { useCatalog } from "@/features/catalog";
import { useI18n } from "@/components/providers";
import RazorpayCheckout from "@/features/payments/components/RazorpayCheckout";
import type {
  CheckoutSummary,
  PaymentProof,
} from "@/features/payments/types/payment.types";
import { submitBooking } from "../api/bookingApi";
import {
  formatBookingDate,
  generateDevoteePassword,
  generateReceiptNumber,
} from "../services/bookingService";
import type {
  ConfirmedBooking,
  PackageTier,
} from "../types/booking.types";
import { calculatePackagePrice } from "./BookingPackages";
import BookingConfirmation from "./BookingConfirmation";

export interface BookingFlowProps {
  pooja?: Pooja;
  initialPoojaSlug?: string | null;
  initialDate?: string | null;
  initialTime?: string | null;
  isModal?: boolean;
  onClose?: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function BookingFlow({
  pooja,
  initialPoojaSlug = null,
  initialDate = null,
  initialTime = null,
  isModal = false,
  onClose,
  scrollContainerRef,
}: BookingFlowProps) {
  const { poojas: catalogPoojas, coupons } = useCatalog();
  const { locale, t } = useI18n();

  // 3-step popup flow:
  // Step 1: Select Option (Single, Couple, Family with price only)
  // Step 2: Select Chadhava (with price and multiple items stepper)
  // Step 3: Enter Name & Mobile Number + Proceed to Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [prayerSlug, setPrayerSlug] = useState<string>(
    pooja?.slug ?? initialPoojaSlug ?? (catalogPoojas[0]?.slug || "satyanarayan-katha")
  );
  const [selectedTier, setSelectedTier] = useState<PackageTier>("single");
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  // Sync pooja slug if changed
  useEffect(() => {
    if (pooja?.slug) {
      setPrayerSlug(pooja.slug);
    } else if (initialPoojaSlug) {
      setPrayerSlug(initialPoojaSlug);
    }
  }, [pooja?.slug, initialPoojaSlug]);

  const selectedPooja =
    catalogPoojas.find((p) => p.slug === prayerSlug) ??
    pooja ??
    catalogPoojas[0];

  const temple = getTempleForPooja(selectedPooja);

  // Calculate pricing
  const rawBasePrice = selectedPooja?.price ?? 1101;
  const singlePrice = rawBasePrice;
  const couplePrice = calculatePackagePrice(rawBasePrice, "couple");
  const familyPrice = calculatePackagePrice(rawBasePrice, "family");

  const packagePrice =
    selectedTier === "couple"
      ? couplePrice
      : selectedTier === "family"
      ? familyPrice
      : singlePrice;

  // Chadhava items
  const handleUpdateAddonQty = (id: string, delta: number) => {
    setSelectedAddons((prev) => {
      const curr = prev[id] || 0;
      const next = curr + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const chadhavaList = defaultChadhavaOfferings;

  const addonItems: BookingAddonItem[] = Object.entries(selectedAddons).map(
    ([id, qty]) => {
      const item = chadhavaList.find((c) => c.id === id);
      return {
        id,
        name: item?.name || id,
        price: item?.price || 0,
        quantity: qty,
        emoji: item?.emoji,
        category: item?.category,
        itemType: "chadhava",
      };
    }
  );

  const chadhavaTotal = addonItems.reduce(
    (sum, a) => sum + a.price * a.quantity,
    0
  );

  const total = packagePrice + chadhavaTotal;
  const phoneValid = isValidIndianPhone(phone);

  // Returning devotee auto-fill if phone is entered
  useEffect(() => {
    if (!phoneValid) return;
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    let cancelled = false;
    const loadProfile = async () => {
      const serverUser = await fetchUserByPhone(cleanPhone);
      if (serverUser && !cancelled) {
        syncUserFromServer(cleanPhone);
        setName((prev) => prev || serverUser.name || "");
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [phone, phoneValid]);

  const scrollToTop = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step 3 Validation before opening Razorpay
  const handleProceedToPayment = () => {
    setFormError("");
    if (!name.trim()) {
      setFormError("Please enter the devotee full name.");
      return;
    }
    if (!phone.trim() || !phoneValid) {
      setFormError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePaymentSuccess = async (
    bookingId: string,
    payment?: PaymentProof,
    summary?: CheckoutSummary
  ) => {
    setCheckoutOpen(false);

    const generatedPassword = generateDevoteePassword();
    const receiptNum = generateReceiptNumber(bookingId);

    const paidTotal = summary?.amount ?? total;
    const finalDate = initialDate || selectedPooja?.startDate || new Date().toISOString().slice(0, 10);
    const finalTime = initialTime || selectedPooja?.eventTime || selectedPooja?.bestMuhurat || "06:30 PM IST";

    const newBookingRecord: BookingRecord = {
      bookingId,
      receiptNumber: receiptNum,
      poojaSlug: selectedPooja?.slug || prayerSlug,
      poojaTitle: selectedPooja?.title || "Sacred Pooja",
      templeSlug: temple?.slug || "thetemplepuja",
      templeName: temple?.name || SITE_CONFIG.brandName,
      date: finalDate,
      time: finalTime,
      panditName: "Acharya Ji (Vedic Purohit)",
      reason: "General Well-being & Divine Blessings",
      amount: paidTotal,
      discount: summary?.discount ?? 0,
      couponCode: summary?.coupon?.code ?? null,
      addonCount: addonItems.length,
      addons: addonItems,
      createdAt: new Date().toISOString(),
      status: "confirmed",
      razorpayOrderId: payment?.razorpayOrderId,
      razorpayPaymentId: payment?.razorpayPaymentId,
      razorpaySignature: payment?.razorpaySignature,
      paidAt: payment ? new Date().toISOString() : undefined,
    };

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const userEmail = `${cleanPhone}@templepujasewa.com`;

    try {
      await submitBooking({
        name: name.trim(),
        phone: cleanPhone,
        gotra: "Kashyap",
        city: temple?.city || "India",
        email: userEmail,
        booking: newBookingRecord,
      });
    } catch {
      // Handled in storage layer fallback
    }

    setConfirmed({
      id: bookingId,
      receiptNumber: receiptNum,
      total: paidTotal,
      subtotal: total,
      addonTotal: chadhavaTotal,
      discount: summary?.discount ?? 0,
      coupon: summary?.coupon ?? null,
      addons: addonItems,
      date: formatBookingDate(finalDate),
      time: finalTime,
      panditName: "Acharya Ji (Vedic Purohit)",
      name: name.trim(),
      poojaTitle: selectedPooja?.title || "Sacred Pooja",
      reason: "General Well-being & Divine Blessings",
      packageTier: selectedTier,
      credentials: {
        username: cleanPhone,
        password: generatedPassword,
        email: userEmail,
      },
    });
  };

  if (confirmed) {
    return (
      <BookingConfirmation
        confirmed={confirmed}
        basePrice={packagePrice}
        phone={phone}
      />
    );
  }

  // 3 Options definition
  const packageOptions: { id: PackageTier; label: string; price: number; icon: React.ReactNode }[] = [
    {
      id: "single",
      label: "Single",
      price: singlePrice,
      icon: <User className="h-4 w-4 text-saffron-600" />,
    },
    {
      id: "couple",
      label: "Couple",
      price: couplePrice,
      icon: <HeartHandshake className="h-4 w-4 text-saffron-600" />,
    },
    {
      id: "family",
      label: "Family",
      price: familyPrice,
      icon: <Users className="h-4 w-4 text-saffron-600" />,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Clean 3-Step Indicator */}
      <div className="mb-5 flex items-center justify-between border-b border-saffron-100 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep === 1
                ? "bg-saffron-600 text-white shadow-xs"
                : currentStep > 1
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {currentStep > 1 ? "✓" : "1"}
          </span>
          <span
            className={`text-xs font-bold ${
              currentStep === 1 ? "text-saffron-800" : "text-slate-500"
            }`}
          >
            Option
          </span>
        </div>

        <div className="h-0.5 w-6 bg-slate-200" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep === 2
                ? "bg-saffron-600 text-white shadow-xs"
                : currentStep > 2
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {currentStep > 2 ? "✓" : "2"}
          </span>
          <span
            className={`text-xs font-bold ${
              currentStep === 2 ? "text-saffron-800" : "text-slate-500"
            }`}
          >
            Chadhava
          </span>
        </div>

        <div className="h-0.5 w-6 bg-slate-200" />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              currentStep === 3
                ? "bg-saffron-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            3
          </span>
          <span
            className={`text-xs font-bold ${
              currentStep === 3 ? "text-saffron-800" : "text-slate-500"
            }`}
          >
            Devotee & Pay
          </span>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 1: Select Option from 3 (Single, Couple, Family) with price only */}
      {/* ───────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-center sm:text-left">
            <h3 className="font-display text-base sm:text-lg font-bold text-ink">
              Select Pooja Option
            </h3>
            <p className="text-xs text-ink-soft">
              Choose your sankalp option with consecrated offerings.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {packageOptions.map((opt) => {
              const isSelected = selectedTier === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedTier(opt.id)}
                  className={`group flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-saffron-500 bg-saffron-50/70 shadow-sm ring-2 ring-saffron-400/40"
                      : "border-saffron-200/80 bg-white hover:border-saffron-300 hover:bg-saffron-50/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        isSelected
                          ? "bg-saffron-500 text-white shadow-xs"
                          : "bg-saffron-100/70 text-saffron-700"
                      }`}
                    >
                      {opt.icon}
                    </span>
                    <div>
                      <span className="font-display text-sm font-bold text-ink block">
                        {opt.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-display text-base font-extrabold text-saffron-700">
                      {formatINR(opt.price)}
                    </span>
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? "border-saffron-600 bg-saffron-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentStep(2);
              scrollToTop();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3 text-sm font-bold text-white shadow-md shadow-saffron-600/20 transition-all hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.99] mt-2"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 2: Select Chadhava with price & multiple items stepper   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                Select Sacred Chadhava
              </h3>
              <p className="text-xs text-ink-soft">
                Choose offerings to be consecrated during the pooja.
              </p>
            </div>
            {addonItems.length > 0 && (
              <span className="rounded-full bg-saffron-50 border border-saffron-200 px-2.5 py-0.5 text-xs font-bold text-saffron-800">
                +{formatINR(chadhavaTotal)}
              </span>
            )}
          </div>

          {/* Chadhavas list */}
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {chadhavaList.map((chadhava: ChadhavaOffering) => {
              const qty = selectedAddons[chadhava.id] || 0;
              const isAdded = qty > 0;

              return (
                <div
                  key={chadhava.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isAdded
                      ? "border-saffron-500 bg-saffron-50/60 shadow-xs"
                      : "border-saffron-100 bg-white hover:border-saffron-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-saffron-50 text-lg border border-saffron-100">
                      {chadhava.emoji || "🌸"}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-ink truncate leading-tight">
                        {chadhava.name}
                      </h4>
                      <span className="font-display text-xs font-bold text-saffron-700 block mt-0.5">
                        {formatINR(chadhava.price)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Stepper [- qty +] */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-saffron-200 bg-white px-1.5 py-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateAddonQty(chadhava.id, -1)}
                      disabled={qty === 0}
                      className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                        qty > 0
                          ? "text-saffron-900 hover:bg-saffron-50"
                          : "text-slate-300 cursor-not-allowed"
                      }`}
                      aria-label={`Decrease ${chadhava.name}`}
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <span className="w-5 text-center text-xs font-bold text-ink">
                      {qty}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleUpdateAddonQty(chadhava.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-saffron-900 hover:bg-saffron-50 transition-colors"
                      aria-label={`Increase ${chadhava.name}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                scrollToTop();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-saffron-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(3);
                scrollToTop();
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3 text-sm font-bold text-white shadow-md shadow-saffron-600/20 transition-all hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.99]"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STEP 3: Enter Name & Mobile Number + Proceed to Payment       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-ink">
              Devotee Details
            </h3>
            <p className="text-xs text-ink-soft">
              Provide name & mobile number for sankalp and live pooja updates.
            </p>
          </div>

          {/* Form error notification */}
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 animate-shake">
              ⚠️ {formError}
            </div>
          )}

          {/* Two Inputs Only: Name and Mobile Number */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError("");
                }}
                placeholder="Enter devotee full name"
                className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-slate-500">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(clean);
                    if (formError) setFormError("");
                  }}
                  placeholder="10-digit mobile number"
                  className="w-full rounded-xl border border-saffron-200 bg-white pl-12 pr-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                />
              </div>
              <p className="text-[11px] text-ink-soft mt-1">
                We send live darshan link & sankalp confirmation on this WhatsApp number.
              </p>
            </div>
          </div>

          {/* Clean Order Price Summary */}
          <div className="rounded-2xl border border-saffron-100 bg-saffron-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <span>Selected Option ({selectedTier === "single" ? "Single" : selectedTier === "couple" ? "Couple" : "Family"})</span>
              <span className="font-semibold text-ink">{formatINR(packagePrice)}</span>
            </div>

            {addonItems.length > 0 && (
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span>Chadhavas ({addonItems.reduce((acc, a) => acc + a.quantity, 0)} items)</span>
                <span className="font-semibold text-ink">+{formatINR(chadhavaTotal)}</span>
              </div>
            )}

            <div className="border-t border-saffron-200/80 pt-2 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-ink">
                Total Dakshina
              </span>
              <span className="font-display text-lg font-extrabold text-saffron-700">
                {formatINR(total)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setCurrentStep(2);
                scrollToTop();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-saffron-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToPayment}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 py-3 text-sm font-bold text-white shadow-md shadow-saffron-600/20 transition-all hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.99]"
            >
              <span>Proceed to Payment ({formatINR(total)})</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Checkout Modal */}
      {checkoutOpen && selectedPooja && (
        <RazorpayCheckout
          open={checkoutOpen}
          poojaPrice={packagePrice}
          packageTier={selectedTier}
          poojaTitle={getLocalizedPoojaTitle(selectedPooja, locale)}
          poojaSlug={selectedPooja.slug}
          addons={addonItems}
          couponMap={coupons}
          devoteeName={name}
          phone={phone}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
