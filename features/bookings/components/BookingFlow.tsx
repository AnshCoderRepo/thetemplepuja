"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Sparkles,
  User,
  Users,
  ShieldCheck,
  HeartHandshake,
  Heart,
  Trash2,
} from "lucide-react";
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
import { loadRazorpayScript } from "@/features/payments/services/razorpayScript";
import { createRazorpayOrderRemote } from "@/features/payments/api/paymentApi";
import CouponInput from "@/features/payments/components/CouponInput";
import { couponDiscount, couponProblem } from "@/lib/coupons";
import type {
  AppliedCoupon,
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
  DevoteeMember,
  PackageTier,
} from "../types/booking.types";
import { COMMON_GOTRAS } from "../types/booking.types";
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
  const { poojas: catalogPoojas, coupons, temples } = useCatalog();
  const { locale, t } = useI18n();

  // 3-step popup flow:
  // Step 1: Select Option (Single, Couple, Family with price only)
  // Step 2: Select Chadhava (with price and multiple items stepper)
  // Step 3: Enter Name(s) & Gotra(s) + 1 Mobile Number + Proceed to Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const [prayerSlug, setPrayerSlug] = useState<string>(
    pooja?.slug ?? initialPoojaSlug ?? (catalogPoojas[0]?.slug || "satyanarayan-katha")
  );
  const [selectedTier, setSelectedTier] = useState<PackageTier>("single");
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({});

  // Single Devotee state:
  const [name, setName] = useState("");
  const [gotra, setGotra] = useState("");

  // Couple Partner state (2 names & 2 gotras):
  const [partnerName, setPartnerName] = useState("");
  const [partnerGotra, setPartnerGotra] = useState("");

  // Family dynamic members list (unlimited people with name & gotra):
  const [familyMembers, setFamilyMembers] = useState<DevoteeMember[]>([
    { id: "1", name: "", gotra: "" },
    { id: "2", name: "", gotra: "" },
  ]);

  // Exactly 1 phone number required for all cases:
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  // Sync primary devotee name & gotra with familyMembers[0]
  const handlePrimaryNameChange = (val: string) => {
    setName(val);
    if (formError) setFormError("");
    setFamilyMembers((prev) => {
      if (prev.length > 0) {
        const copy = [...prev];
        copy[0] = { ...copy[0], name: val };
        return copy;
      }
      return [{ id: "1", name: val, gotra }];
    });
  };

  const handlePrimaryGotraChange = (val: string) => {
    setGotra(val);
    if (formError) setFormError("");
    setFamilyMembers((prev) => {
      if (prev.length > 0) {
        const copy = [...prev];
        copy[0] = { ...copy[0], gotra: val };
        return copy;
      }
      return [{ id: "1", name, gotra: val }];
    });
  };

  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        name: "",
        gotra: prev[0]?.gotra || gotra || "",
      },
    ]);
  };

  const handleUpdateFamilyMember = (
    index: number,
    field: "name" | "gotra",
    value: string
  ) => {
    setFamilyMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    if (index === 0) {
      if (field === "name") setName(value);
      if (field === "gotra") setGotra(value);
    }
  };

  const handleRemoveFamilyMember = (index: number) => {
    setFamilyMembers((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

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

  const temple = getTempleForPooja(selectedPooja, temples);

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
  const discount = appliedCoupon
    ? couponDiscount(appliedCoupon.code, packagePrice, coupons)
    : 0;
  const finalTotal = Math.max(total - discount, 0);
  const phoneValid = isValidIndianPhone(phone);

  const couponEligibility = (code: string): string | null =>
    couponProblem(
      code,
      {
        phone: phone ?? "",
        price: packagePrice,
        poojaTitle: selectedPooja ? getLocalizedPoojaTitle(selectedPooja, locale) : "Sacred Pooja",
      },
      coupons
    );

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const problem = couponEligibility(code);
    if (problem) {
      setAppliedCoupon(null);
      setCouponMsg({ ok: false, text: problem });
      return;
    }
    const c = coupons[code];
    if (!c) {
      setAppliedCoupon(null);
      setCouponMsg({ ok: false, text: `"${code}" is not a valid coupon code.` });
      return;
    }
    setAppliedCoupon({
      code,
      label: c.label,
      description: c.description,
      kind: c.kind,
      value: c.value,
    });
    setCouponMsg({ ok: true, text: `Coupon ${code} applied — ${c.label}!` });
  };

  const handleQuickApplyCoupon = (code: string) => {
    setCouponCode(code);
    const problem = couponEligibility(code);
    if (problem) {
      setAppliedCoupon(null);
      setCouponMsg({ ok: false, text: problem });
      return;
    }
    const c = coupons[code];
    if (!c) return;
    setAppliedCoupon({
      code,
      label: c.label,
      description: c.description,
      kind: c.kind,
      value: c.value,
    });
    setCouponMsg({ ok: true, text: `Coupon ${code} applied — ${c.label}!` });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMsg(null);
    setCouponCode("");
  };

  // Returning devotee auto-fill if phone is entered
  useEffect(() => {
    if (!phoneValid) return;
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    let cancelled = false;
    const loadProfile = async () => {
      const serverUser = await fetchUserByPhone(cleanPhone);
      if (serverUser && !cancelled) {
        syncUserFromServer(cleanPhone);
        if (serverUser.name) handlePrimaryNameChange(serverUser.name);
        if (serverUser.gotra) handlePrimaryGotraChange(serverUser.gotra);
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

  // Step 3 Validation and DIRECT Razorpay Gateway Opening
  const handleProceedToPayment = async () => {
    setFormError("");

    if (selectedTier === "single") {
      if (!name.trim()) {
        setFormError("Please enter the devotee full name.");
        return;
      }
      if (!gotra.trim()) {
        setFormError("Please enter Gotra or click 'Unknown? Use Kashyap'.");
        return;
      }
    } else if (selectedTier === "couple") {
      if (!name.trim()) {
        setFormError("Please enter the first devotee's full name.");
        return;
      }
      if (!gotra.trim()) {
        setFormError("Please enter the first devotee's Gotra (or select Kashyap).");
        return;
      }
      if (!partnerName.trim()) {
        setFormError("Please enter the second devotee / spouse's full name.");
        return;
      }
      if (!partnerGotra.trim()) {
        setFormError("Please enter the second devotee's Gotra (or select Kashyap).");
        return;
      }
    } else if (selectedTier === "family") {
      if (familyMembers.length === 0) {
        setFormError("Please add at least one family member.");
        return;
      }
      for (let i = 0; i < familyMembers.length; i++) {
        const m = familyMembers[i];
        if (!m.name.trim()) {
          setFormError(`Please enter the full name for Family Member #${i + 1}.`);
          return;
        }
        if (!m.gotra.trim()) {
          setFormError(`Please enter Gotra for Family Member #${i + 1} or select Kashyap.`);
          return;
        }
      }
    }

    if (!phone.trim() || !phoneValid) {
      setFormError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const userEmail = `${cleanPhone}@templepujasewa.com`;
    const primaryName =
      selectedTier === "single"
        ? name.trim()
        : selectedTier === "couple"
        ? `${name.trim()} & ${partnerName.trim()}`
        : `${familyMembers[0]?.name.trim() || "Devotee"} & Family (${familyMembers.length} Members)`;

    const primaryGotra =
      selectedTier === "single"
        ? gotra.trim() || "Kashyap"
        : selectedTier === "couple"
        ? gotra.trim() === partnerGotra.trim()
          ? gotra.trim()
          : `${gotra.trim()} / ${partnerGotra.trim()}`
        : familyMembers[0]?.gotra.trim() || "Kashyap";

    const devoteesList: DevoteeMember[] =
      selectedTier === "single"
        ? [{ name: name.trim(), gotra: gotra.trim() || "Kashyap" }]
        : selectedTier === "couple"
        ? [
            { name: name.trim(), gotra: gotra.trim() || "Kashyap" },
            { name: partnerName.trim(), gotra: partnerGotra.trim() || "Kashyap" },
          ]
        : familyMembers.map((m) => ({
            name: m.name.trim(),
            gotra: m.gotra.trim() || "Kashyap",
          }));

    const finalDate = initialDate || selectedPooja?.startDate || new Date().toISOString().slice(0, 10);
    const finalTime = initialTime || selectedPooja?.eventTime || selectedPooja?.bestMuhurat || "06:30 PM IST";
    const temple = getTempleForPooja(selectedPooja, temples);

    // Unique booking ID created upfront so pending -> failed -> confirmed lifecycle is linked
    const activeBookingId = "BK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const activeReceiptNum = generateReceiptNumber(activeBookingId);

    const pendingBookingRecord: BookingRecord = {
      bookingId: activeBookingId,
      receiptNumber: activeReceiptNum,
      poojaSlug: selectedPooja?.slug || prayerSlug,
      poojaTitle: selectedPooja?.title || "Sacred Pooja",
      templeSlug: temple?.slug || "thetemplepuja",
      templeName: temple?.name || SITE_CONFIG.brandName,
      date: finalDate,
      time: finalTime,
      panditName: "Acharya Ji (Vedic Purohit)",
      reason: "General Well-being & Divine Blessings",
      packageTier: selectedTier,
      gotra: primaryGotra,
      partnerName: selectedTier === "couple" ? partnerName.trim() : undefined,
      partnerGotra: selectedTier === "couple" ? partnerGotra.trim() : undefined,
      devotees: devoteesList,
      familyMembers: selectedTier === "family" ? devoteesList : undefined,
      amount: finalTotal,
      discount,
      couponCode: appliedCoupon?.code ?? null,
      addonCount: addonItems.length,
      addons: addonItems,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setIsProcessingPayment(true);

    // Record pending booking immediately in database and client storage so admin orders/analytics reflects it
    try {
      await submitBooking({
        name: primaryName,
        phone: cleanPhone,
        gotra: primaryGotra,
        city: temple?.city || "India",
        email: userEmail,
        booking: pendingBookingRecord,
      });
    } catch {
      // Handled in storage layer fallback
    }

    try {
      const orderResult = await createRazorpayOrderRemote({
        poojaSlug: selectedPooja?.slug || prayerSlug,
        packageTier: selectedTier,
        addons: addonItems.map((a) => ({ id: a.id, quantity: a.quantity })),
        couponCode: appliedCoupon?.code ?? null,
        phone: cleanPhone,
      });

      if (orderResult.configured && orderResult.orderId && orderResult.keyId) {
        pendingBookingRecord.razorpayOrderId = orderResult.orderId;

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setIsProcessingPayment(false);
          setFormError("Razorpay could not load. Please check your internet connection.");
          return;
        }
        const Rzp = (window as unknown as { Razorpay: new (o: object) => any }).Razorpay;
        if (!Rzp) {
          setIsProcessingPayment(false);
          setFormError("Razorpay could not be initialized. Please try again.");
          return;
        }

        const rzp = new Rzp({
          key: orderResult.keyId,
          amount: orderResult.amount,
          currency: orderResult.currency || "INR",
          order_id: orderResult.orderId,
          name: "templepujasewa",
          description: selectedPooja ? getLocalizedPoojaTitle(selectedPooja, locale) : "Sacred Pooja",
          prefill: {
            name: primaryName,
            contact: cleanPhone,
          },
          theme: { color: "#0b245b" },
          modal: {
            ondismiss: async () => {
              setIsProcessingPayment(false);
              setFormError("Payment was cancelled or closed. You can retry paying whenever you are ready.");
              const dismissedRecord: BookingRecord = {
                ...pendingBookingRecord,
                status: "failed",
                failureReason: "Payment dismissed or cancelled by devotee at gateway",
              };
              try {
                await submitBooking({
                  name: primaryName,
                  phone: cleanPhone,
                  gotra: primaryGotra,
                  city: temple?.city || "India",
                  email: userEmail,
                  booking: dismissedRecord,
                });
              } catch {
                // Handled in storage layer fallback
              }
            },
          },
          handler: async (response: {
            razorpay_payment_id?: string;
            razorpay_order_id?: string;
            razorpay_signature?: string;
          }) => {
            const paymentId = response.razorpay_payment_id;
            const orderId = response.razorpay_order_id;
            const signature = response.razorpay_signature;
            if (!paymentId || !orderId || !signature) {
              setIsProcessingPayment(false);
              setFormError("Payment was not completed. Please try again.");
              return;
            }

            await handlePaymentSuccess(
              activeBookingId,
              {
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
              },
              {
                amount: (orderResult.amount ?? Math.round(finalTotal * 100)) / 100,
                subtotal: total,
                addonTotal: chadhavaTotal,
                discount,
                coupon: appliedCoupon,
                addons: addonItems,
              }
            );
            setIsProcessingPayment(false);
          },
        });

        // Listen for gateway payment failure events and link to admin dashboard
        if (typeof rzp.on === "function") {
          rzp.on("payment.failed", async (response: any) => {
            setIsProcessingPayment(false);
            const failureDesc =
              response?.error?.description ||
              response?.error?.reason ||
              "Payment declined or failed at bank/UPI";
            setFormError(`Payment failed: ${failureDesc}`);

            const failedRecord: BookingRecord = {
              ...pendingBookingRecord,
              status: "failed",
              failureReason: failureDesc,
              razorpayOrderId: response?.error?.metadata?.order_id || orderResult.orderId,
              razorpayPaymentId: response?.error?.metadata?.payment_id,
            };

            try {
              await submitBooking({
                name: primaryName,
                phone: cleanPhone,
                gotra: primaryGotra,
                city: temple?.city || "India",
                email: userEmail,
                booking: failedRecord,
              });
            } catch {
              // Handled in storage layer fallback
            }
          });
        }

        rzp.open();
        return;
      }

      if (orderResult.error) {
        setIsProcessingPayment(false);
        setFormError(orderResult.error);
        return;
      }

      // Demo mode fallback — simulate 1s processing and complete booking
      setTimeout(async () => {
        await handlePaymentSuccess(
          activeBookingId,
          undefined,
          {
            amount: finalTotal,
            subtotal: total,
            addonTotal: chadhavaTotal,
            discount,
            coupon: appliedCoupon,
            addons: addonItems,
          }
        );
        setIsProcessingPayment(false);
      }, 1000);
    } catch (err) {
      setIsProcessingPayment(false);
      setFormError(
        err instanceof Error ? err.message : "Unable to initiate payment. Please try again."
      );
    }
  };

  const handlePaymentSuccess = async (
    bookingId: string,
    payment?: PaymentProof,
    summary?: CheckoutSummary
  ) => {

    const generatedPassword = generateDevoteePassword();
    const receiptNum = generateReceiptNumber(bookingId);

    const paidTotal = summary?.amount ?? finalTotal;
    const finalDate = initialDate || selectedPooja?.startDate || new Date().toISOString().slice(0, 10);
    const finalTime = initialTime || selectedPooja?.eventTime || selectedPooja?.bestMuhurat || "06:30 PM IST";

    const devoteesList: DevoteeMember[] =
      selectedTier === "single"
        ? [{ name: name.trim(), gotra: gotra.trim() || "Kashyap" }]
        : selectedTier === "couple"
        ? [
            { name: name.trim(), gotra: gotra.trim() || "Kashyap" },
            { name: partnerName.trim(), gotra: partnerGotra.trim() || "Kashyap" },
          ]
        : familyMembers.map((m) => ({
            name: m.name.trim(),
            gotra: m.gotra.trim() || "Kashyap",
          }));

    const primaryName =
      selectedTier === "single"
        ? name.trim()
        : selectedTier === "couple"
        ? `${name.trim()} & ${partnerName.trim()}`
        : `${familyMembers[0]?.name.trim() || "Devotee"} & Family (${familyMembers.length} Members)`;

    const primaryGotra =
      selectedTier === "single"
        ? gotra.trim() || "Kashyap"
        : selectedTier === "couple"
        ? gotra.trim() === partnerGotra.trim()
          ? gotra.trim()
          : `${gotra.trim()} / ${partnerGotra.trim()}`
        : familyMembers[0]?.gotra.trim() || "Kashyap";

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
      packageTier: selectedTier,
      gotra: primaryGotra,
      partnerName: selectedTier === "couple" ? partnerName.trim() : undefined,
      partnerGotra: selectedTier === "couple" ? partnerGotra.trim() : undefined,
      devotees: devoteesList,
      familyMembers: selectedTier === "family" ? devoteesList : undefined,
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

    let finalPassword = generatedPassword;
    try {
      const submitRes = await submitBooking({
        name: primaryName,
        phone: cleanPhone,
        gotra: primaryGotra,
        city: temple?.city || "India",
        email: userEmail,
        booking: newBookingRecord,
        payment,
        generatedPassword,
      });
      if (submitRes?.credentials?.password) {
        finalPassword = submitRes.credentials.password;
      }
    } catch {
      // Handled in storage layer fallback
    }

    setConfirmed({
      id: bookingId,
      receiptNumber: receiptNum,
      total: paidTotal,
      subtotal: total,
      addonTotal: chadhavaTotal,
      discount: summary?.discount ?? discount,
      coupon: summary?.coupon ?? appliedCoupon,
      addons: addonItems,
      date: formatBookingDate(finalDate),
      time: finalTime,
      panditName: "Acharya Ji (Vedic Purohit)",
      name: primaryName,
      gotra: primaryGotra,
      poojaTitle: selectedPooja?.title || "Sacred Pooja",
      reason: "General Well-being & Divine Blessings",
      packageTier: selectedTier,
      partnerName: selectedTier === "couple" ? partnerName.trim() : undefined,
      partnerGotra: selectedTier === "couple" ? partnerGotra.trim() : undefined,
      devotees: devoteesList,
      familyMembers: selectedTier === "family" ? devoteesList : undefined,
      credentials: {
        username: cleanPhone,
        password: finalPassword,
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
      {/* STEP 3: Enter Name(s) & Gotra(s) + 1 Mobile Number + Pay      */}
      {/* ───────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fadeIn">
          {/* Autocomplete datalist for Vedic Gotras */}
          <datalist id="common-gotras">
            {COMMON_GOTRAS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>

          <div>
            <h3 className="font-display text-base sm:text-lg font-bold text-ink">
              {selectedTier === "single"
                ? "Devotee Details (Single Sankalp)"
                : selectedTier === "couple"
                ? "Couple Devotee Details (2 Devotees)"
                : "Family Devotee Details (Unlimited Members)"}
            </h3>
            <p className="text-xs text-ink-soft">
              {selectedTier === "single"
                ? "Enter devotee name and gotra for the sacred Vedic Sankalp."
                : selectedTier === "couple"
                ? "Enter names and gotras for both partners to be chanted during the Sankalp."
                : "Add names and gotras for all family members. You can add as many people as you want!"}
            </p>
          </div>

          {/* Form error notification */}
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 animate-shake">
              ⚠️ {formError}
            </div>
          )}

          {/* ── CASE 1: SINGLE DEVOTEE (1 Name & 1 Gotra) ── */}
          {selectedTier === "single" && (
            <div className="rounded-2xl border border-saffron-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-saffron-100 pb-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-100 text-saffron-800">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-ink">
                    Devotee Sankalp Information
                  </h4>
                  <p className="text-[11px] text-ink-soft">
                    Purohit ji will chant this name & gotra during the pooja.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Devotee Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handlePrimaryNameChange(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-ink">
                      Gotra <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePrimaryGotraChange("Kashyap")}
                      className="text-[11px] font-bold text-saffron-700 hover:text-saffron-900 hover:underline inline-flex items-center gap-0.5"
                    >
                      Unknown? Use Kashyap
                    </button>
                  </div>
                  <input
                    type="text"
                    list="common-gotras"
                    value={gotra}
                    onChange={(e) => handlePrimaryGotraChange(e.target.value)}
                    placeholder="e.g. Kashyap, Bhardwaj"
                    className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── CASE 2: COUPLE (2 Names & 2 Gotras) ── */}
          {selectedTier === "couple" && (
            <div className="space-y-3">
              {/* Person 1 */}
              <div className="rounded-2xl border border-saffron-200/90 bg-white p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-saffron-100 pb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-saffron-100 text-xs font-bold text-saffron-800">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-ink">
                    Devotee 1 (Primary Yagya Karta)
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handlePrimaryNameChange(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-ink">
                        Gotra <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handlePrimaryGotraChange("Kashyap")}
                        className="text-[11px] font-bold text-saffron-700 hover:text-saffron-900 hover:underline"
                      >
                        Unknown? Use Kashyap
                      </button>
                    </div>
                    <input
                      type="text"
                      list="common-gotras"
                      value={gotra}
                      onChange={(e) => handlePrimaryGotraChange(e.target.value)}
                      placeholder="e.g. Kashyap, Bhardwaj"
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                    />
                  </div>
                </div>
              </div>

              {/* Person 2 / Spouse */}
              <div className="rounded-2xl border border-rose-200/90 bg-rose-50/20 p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 border-b border-rose-100 pb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-xs font-bold text-rose-800">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                    <span>Devotee 2 (Spouse / Partner)</span>
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Spouse / Partner Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => {
                        setPartnerName(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="e.g. Priya Sharma"
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-ink">
                        Gotra <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        {gotra.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerGotra(gotra.trim());
                              if (formError) setFormError("");
                            }}
                            className="text-[10px] font-bold text-rose-700 hover:underline"
                          >
                            Same as Devotee 1
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPartnerGotra("Kashyap");
                            if (formError) setFormError("");
                          }}
                          className="text-[10px] font-bold text-saffron-700 hover:underline"
                        >
                          Kashyap
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      list="common-gotras"
                      value={partnerGotra}
                      onChange={(e) => {
                        setPartnerGotra(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="e.g. Kashyap, Bhardwaj"
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CASE 3: FAMILY (Option to select/add as many people as they want) ── */}
          {selectedTier === "family" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-saffron-50/80 border border-saffron-200/80 px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-saffron-700" />
                  <span className="text-xs font-bold text-saffron-900">
                    Family Members for Vedic Sankalp
                  </span>
                </div>
                <span className="rounded-full bg-saffron-200/80 px-2.5 py-0.5 text-[10px] font-extrabold text-saffron-900">
                  {familyMembers.length} {familyMembers.length === 1 ? "Member" : "Members"}
                </span>
              </div>

              <div className="space-y-2.5">
                {familyMembers.map((member, idx) => {
                  const isFirst = idx === 0;
                  return (
                    <div
                      key={member.id || idx}
                      className="rounded-2xl border border-saffron-200/80 bg-white p-3.5 sm:p-4 shadow-xs space-y-2.5 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-saffron-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-saffron-100 text-[11px] font-bold text-saffron-800">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-ink">
                            {isFirst ? "Member #1 (Primary Devotee)" : `Member #${idx + 1}`}
                          </span>
                        </div>

                        {!isFirst && familyMembers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyMember(idx)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            aria-label={`Remove Member ${idx + 1}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <div>
                          <label className="block text-[11px] font-bold text-ink mb-1">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => {
                              handleUpdateFamilyMember(idx, "name", e.target.value);
                              if (isFirst) setName(e.target.value);
                              if (formError) setFormError("");
                            }}
                            placeholder={`Member #${idx + 1} full name`}
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-ink">
                              Gotra <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-1.5">
                              {!isFirst && familyMembers[0]?.gotra?.trim() && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateFamilyMember(
                                      idx,
                                      "gotra",
                                      familyMembers[0].gotra.trim()
                                    );
                                    if (formError) setFormError("");
                                  }}
                                  className="text-[10px] font-bold text-saffron-700 hover:underline"
                                >
                                  Same Gotra
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  handleUpdateFamilyMember(idx, "gotra", "Kashyap");
                                  if (isFirst) setGotra("Kashyap");
                                  if (formError) setFormError("");
                                }}
                                className="text-[10px] font-bold text-saffron-700 hover:underline"
                              >
                                Kashyap
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            list="common-gotras"
                            value={member.gotra}
                            onChange={(e) => {
                              handleUpdateFamilyMember(idx, "gotra", e.target.value);
                              if (isFirst) setGotra(e.target.value);
                              if (formError) setFormError("");
                            }}
                            placeholder="e.g. Kashyap, Bhardwaj"
                            className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Add Button with NO artificial limit */}
              <button
                type="button"
                onClick={handleAddFamilyMember}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-saffron-300 bg-saffron-50/60 py-3 text-xs sm:text-sm font-bold text-saffron-800 transition-all hover:bg-saffron-100 hover:border-saffron-400 active:scale-[0.99]"
              >
                <Plus className="h-4 w-4 text-saffron-700 stroke-[2.5]" />
                <span>+ Add Another Person / Family Member (No Limit)</span>
              </button>
            </div>
          )}

          {/* ── IN ALL CASES: EXACTLY 1 PHONE NUMBER REQUIRED ── */}
          <div className="rounded-2xl border border-saffron-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-ink">
                Contact Mobile Number (WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Only 1 number required
              </span>
            </div>
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
            <p className="text-[11px] text-ink-soft mt-1.5 flex items-center gap-1.5">
              <span>📲</span>
              <span>
                Only 1 contact number needed. Live darshan link & Vedic sankalp confirmation will be sent here on WhatsApp.
              </span>
            </p>
          </div>

          {/* Coupon Input */}
          {coupons && Object.keys(coupons).length > 0 && (
            <CouponInput
              coupon={couponCode}
              onCouponChange={setCouponCode}
              applied={appliedCoupon}
              discount={discount}
              couponMsg={couponMsg}
              couponMap={coupons}
              onApply={handleApplyCoupon}
              onQuickApply={handleQuickApplyCoupon}
              onRemove={handleRemoveCoupon}
            />
          )}

          {/* Clean Order Price Summary */}
          <div className="rounded-2xl border border-saffron-100 bg-saffron-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <span>
                Selected Option (
                {selectedTier === "single"
                  ? "Single"
                  : selectedTier === "couple"
                  ? "Couple"
                  : `Family - ${familyMembers.length} Members`}
                )
              </span>
              <span className="font-semibold text-ink">{formatINR(packagePrice)}</span>
            </div>

            {addonItems.length > 0 && (
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <span>Chadhavas ({addonItems.reduce((acc, a) => acc + a.quantity, 0)} items)</span>
                <span className="font-semibold text-ink">+{formatINR(chadhavaTotal)}</span>
              </div>
            )}

            {discount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>−{formatINR(discount)}</span>
              </div>
            )}

            <div className="border-t border-saffron-200/80 pt-2 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-ink">
                Total Dakshina
              </span>
              <span className="font-display text-lg font-extrabold text-saffron-700">
                {formatINR(finalTotal)}
              </span>
            </div>
          </div>

          {/* Error notification if payment initiation fails */}
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 animate-shake">
              ⚠️ {formError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={() => {
                setCurrentStep(2);
                scrollToTop();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-ink transition-colors hover:bg-saffron-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleProceedToPayment}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all ${
                isProcessingPayment
                  ? "bg-saffron-600 cursor-wait opacity-90 shadow-saffron-600/20"
                  : "bg-gradient-to-r from-saffron-500 to-saffron-600 shadow-saffron-600/20 hover:from-saffron-400 hover:to-saffron-500 active:scale-[0.99]"
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Opening Razorpay Gateway...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Pay ({formatINR(finalTotal)})</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
