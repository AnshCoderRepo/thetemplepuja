"use client";

import { useEffect, useState } from "react";
import { fetchUserByPhone, syncUserFromServer } from "@/lib/api";
import { SITE_CONFIG } from "@/lib/config";
import {
  computeUpcomingDates,
  defaultChadhavaOfferings,
  getLocalizedPoojaTitle,
  type Pooja,
} from "@/lib/data";
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
  BookingFormData,
  ConfirmedBooking,
  PackageTier,
} from "../types/booking.types";
import BookingAddons from "./BookingAddons";
import BookingConfirmation from "./BookingConfirmation";
import BookingDateSelect from "./BookingDateSelect";
import BookingDevoteeDetails from "./BookingDevoteeDetails";
import BookingPackages, { calculatePackagePrice } from "./BookingPackages";
import BookingProgress from "./BookingProgress";
import BookingStickyBar from "./BookingStickyBar";
import BookingSummarySection from "./BookingSummarySection";

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
  const { poojas: catalogPoojas, poojaDates, coupons } = useCatalog();
  const { locale, t } = useI18n();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxStepUnlocked, setMaxStepUnlocked] = useState<number>(1);

  const [prayerSlug, setPrayerSlug] = useState<string>(
    pooja?.slug ?? initialPoojaSlug ?? (catalogPoojas[0]?.slug || "satyanarayan-katha")
  );
  const [selectedTier, setSelectedTier] = useState<PackageTier>("single");
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || "");
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || "06:30 PM IST");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<BookingFormData>({
    name: "",
    phone: "",
    gotra: "",
    city: "",
    reason: "",
    email: "",
    packageTier: "single",
    partnerName: "",
    familyMembers: [],
    address: "",
  });

  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  // Update prayerSlug if prop changes
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

  const upcomingDates = computeUpcomingDates(poojaDates);

  // Sync tier to form
  const handleSelectTier = (tier: PackageTier) => {
    setSelectedTier(tier);
    setForm((prev) => ({ ...prev, packageTier: tier }));
  };

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

  const addonItems: BookingAddonItem[] = Object.entries(selectedAddons).map(
    ([id, qty]) => {
      const item = defaultChadhavaOfferings.find((c) => c.id === id);
      return {
        id,
        name: item?.name || id,
        price: item?.price || 0,
        quantity: qty,
        category: item?.category,
      };
    }
  );

  const addonTotal = addonItems.reduce(
    (sum, a) => sum + a.price * a.quantity,
    0
  );
  const rawBasePrice = selectedPooja?.price ?? 1101;
  const packagePrice = calculatePackagePrice(rawBasePrice, selectedTier);
  const total = packagePrice + addonTotal;

  const phoneValid = isValidIndianPhone(form.phone);

  // Returning devotee auto-fill
  useEffect(() => {
    if (!phoneValid) return;
    const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);

    let cancelled = false;
    const loadProfile = async () => {
      const serverUser = await fetchUserByPhone(cleanPhone);
      if (serverUser && !cancelled) {
        syncUserFromServer(cleanPhone);
        setForm((prev) => ({
          ...prev,
          name: prev.name || serverUser.name || "",
          gotra: prev.gotra || serverUser.gotra || "",
          city: prev.city || serverUser.city || "",
          email: prev.email || serverUser.email || "",
        }));
      }
    };
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [form.phone, phoneValid]);

  // Scroll helper
  const scrollToTop = () => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: isModal ? 0 : 180, behavior: "smooth" });
    }
  };

  // Step 1 -> Step 2 Validation
  const validateStep1 = (): boolean => {
    setFormError("");
    return true;
  };

  // Step 2 -> Step 3 Validation
  const validateStep2 = (): boolean => {
    setFormError("");
    if (!form.name.trim()) {
      setFormError(t("booking.error.name"));
      return false;
    }
    if (!form.gotra.trim()) {
      setFormError(t("booking.error.gotra"));
      return false;
    }
    if (selectedTier === "couple" && !form.partnerName?.trim()) {
      setFormError(t("booking.error.partnerName"));
      return false;
    }
    if (!form.phone.trim() || !phoneValid) {
      setFormError(t("booking.error.phone"));
      return false;
    }
    if (!form.city.trim()) {
      setFormError(t("booking.error.city"));
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
      setMaxStepUnlocked((prev) => Math.max(prev, 2));
      scrollToTop();
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
      setMaxStepUnlocked((prev) => Math.max(prev, 3));
      scrollToTop();
    } else {
      handleProceedToPayment();
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= maxStepUnlocked) {
      setCurrentStep(step);
      scrollToTop();
    }
  };

  const handleProceedToPayment = () => {
    setFormError("");
    if (!validateStep2()) {
      setCurrentStep(2);
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
    const finalDate = selectedDate || new Date().toISOString().slice(0, 10);
    const finalTime = selectedTime || "7:00 PM IST";

    const newBookingRecord: BookingRecord = {
      bookingId,
      receiptNumber: receiptNum,
      poojaSlug: selectedPooja?.slug || prayerSlug,
      poojaTitle: selectedPooja?.title || "Sacred Pooja",
      templeSlug: "thetemplepuja",
      templeName: SITE_CONFIG.brandName,
      date: finalDate,
      time: finalTime,
      panditName: "Acharya Ji (Vedic Purohit)",
      reason: form.reason,
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

    const userEmail = form.email || `${form.phone.replace(/\D/g, "")}@templepujasewa.com`;

    try {
      await submitBooking({
        name: form.name,
        phone: form.phone,
        gotra: form.gotra || "Kashyap",
        city: form.city,
        email: userEmail,
        booking: newBookingRecord,
      });
    } catch {
      // Offline fallback handling already inside storage
    }

    setConfirmed({
      id: bookingId,
      receiptNumber: receiptNum,
      total: paidTotal,
      subtotal: total,
      addonTotal,
      discount: summary?.discount ?? 0,
      coupon: summary?.coupon ?? null,
      addons: addonItems,
      date: formatBookingDate(finalDate),
      time: finalTime,
      panditName: "Acharya Ji (Vedic Purohit)",
      name: form.name,
      poojaTitle: selectedPooja?.title || "Sacred Pooja",
      reason: form.reason || "Universal wellbeing & family peace",
      packageTier: selectedTier,
      partnerName: form.partnerName,
      familyMembers: form.familyMembers,
      address: form.address,
      credentials: {
        username: form.phone,
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
        phone={form.phone}
      />
    );
  }

  return (
    <div className={`mx-auto max-w-5xl space-y-6 ${isModal ? "pb-24" : "pb-28"}`}>
      {/* Progress Bar */}
      <BookingProgress
        currentStep={currentStep}
        onStepClick={handleStepClick}
        maxStepUnlocked={maxStepUnlocked}
      />

      {/* Step 1: Package, Date & Chadhava */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <BookingPackages
            basePrice={rawBasePrice}
            selectedTier={selectedTier}
            onSelectTier={handleSelectTier}
          />

          <BookingDateSelect
            selectedDate={selectedDate}
            onDateChange={(d: string) => setSelectedDate(d)}
            selectedTime={selectedTime}
            onTimeChange={(t: string) => setSelectedTime(t)}
            upcomingDates={upcomingDates}
            selectedPooja={selectedPooja}
          />

          <BookingAddons
            selectedAddons={selectedAddons}
            onUpdateQty={handleUpdateAddonQty}
            addonItems={addonItems}
            addonTotal={addonTotal}
          />
        </div>
      )}

      {/* Step 2: Devotee & Sankalp Details */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <BookingDevoteeDetails
            form={form}
            onFormChange={setForm}
            prayerSlug={prayerSlug}
            onPrayerSlugChange={setPrayerSlug}
            catalogPoojas={catalogPoojas}
            fromEvent={Boolean(initialDate)}
            date={selectedDate}
            initialTime={selectedTime}
            phoneValid={phoneValid}
          />
        </div>
      )}

      {/* Step 3: Review & Pay */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <BookingSummarySection
            selectedPooja={selectedPooja}
            selectedTier={selectedTier}
            packagePrice={packagePrice}
            total={total}
            addonItems={addonItems}
            addonTotal={addonTotal}
            form={form}
            date={selectedDate}
            time={selectedTime}
            formError={formError}
            onProceed={handleProceedToPayment}
            onEditStep={handleStepClick}
          />
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <BookingStickyBar
        currentStep={currentStep}
        total={total}
        selectedTier={selectedTier}
        addonCount={addonItems.reduce((acc, a) => acc + a.quantity, 0)}
        onNext={handleNextStep}
      />

      {/* Razorpay Checkout Modal */}
      {checkoutOpen && selectedPooja && (
        <RazorpayCheckout
          open={checkoutOpen}
          poojaPrice={packagePrice}
          poojaTitle={getLocalizedPoojaTitle(selectedPooja, locale)}
          poojaSlug={selectedPooja.slug}
          addons={addonItems}
          couponMap={coupons}
          devoteeName={form.name}
          phone={form.phone}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
