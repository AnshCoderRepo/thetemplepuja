import { NextRequest, NextResponse } from "next/server";
import {
  computeOrderAmount,
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay";
import { getResolvedCatalog, findUserByPhone, getAllAddons } from "@/lib/server-store";
import { DEMO_POOJA, isDemoSlug, isPoojaActive } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    poojaSlug?: unknown;
    packageTier?: unknown;
    couponCode?: unknown;
    phone?: unknown;
    addons?: unknown;
    checkoutAmount?: unknown;
    expectedAmount?: unknown;
  };

  const poojaSlug = typeof body.poojaSlug === "string" ? body.poojaSlug.trim() : "";
  const packageTier = typeof body.packageTier === "string" ? body.packageTier.trim() : undefined;
  const couponCode =
    typeof body.couponCode === "string" && body.couponCode.trim()
      ? body.couponCode.trim().toUpperCase()
      : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const addons = Array.isArray(body.addons)
    ? (body.addons as { id: string; quantity: number }[])
    : undefined;

  const rawCheckoutAmount =
    typeof body.checkoutAmount === "number"
      ? body.checkoutAmount
      : typeof body.expectedAmount === "number"
      ? body.expectedAmount
      : typeof body.checkoutAmount === "string" && !isNaN(Number(body.checkoutAmount))
      ? Number(body.checkoutAmount)
      : undefined;

  if (!poojaSlug) {
    return NextResponse.json({ error: "Missing pooja." }, { status: 400 });
  }

  if (!razorpayConfigured()) {
    // Demo mode — no keys configured. The client falls back to its simulated
    // checkout; nothing else to do here.
    return NextResponse.json({ configured: false });
  }

  const catalog = await getResolvedCatalog();
  const normalizedSlug = poojaSlug.toLowerCase().replace(/_/g, "-");
  const pooja = isDemoSlug(normalizedSlug)
    ? DEMO_POOJA
    : catalog.poojas.find((p) => p.slug === normalizedSlug);
  if (!pooja || !isPoojaActive(pooja)) {
    return NextResponse.json(
      { error: "This pooja is not available for booking." },
      { status: 404 }
    );
  }

  // Judge coupon eligibility against the phone's real history (server-side),
  // and price the order from the catalog so the client can't tamper.
  const confirmedCount = phone
    ? ((await findUserByPhone(phone))?.bookings.filter(
        (b) => b.status === "confirmed"
      ).length ?? 0)
    : 0;
  const availableAddons = await getAllAddons();
  const { amount, subtotal, discount, validatedAddons, couponProblem: problem } = computeOrderAmount({
    pooja,
    packageTier,
    addons,
    couponCode,
    couponMap: catalog.coupons,
    phone,
    confirmedCount,
    availableAddons,
  });
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  // Phase 10: Strict Amount Comparison & Mismatch Prevention
  // Never trust frontend-submitted prices; never create order if amount does not match authoritative backend calculation.
  if (typeof rawCheckoutAmount === "number") {
    const checkoutPaise = Math.round(rawCheckoutAmount * 100);
    const calculatedPaise = Math.round(amount * 100);
    if (checkoutPaise !== calculatedPaise) {
      return NextResponse.json(
        {
          error: `Price mismatch detected. The total has updated to ₹${amount}. Please review the updated total before proceeding.`,
          code: "PRICE_MISMATCH",
          checkoutAmount: rawCheckoutAmount,
          calculatedAmount: amount,
          difference: Math.abs(amount - rawCheckoutAmount),
        },
        { status: 409 }
      );
    }
  }

  try {
    const receipt = "ttp-" + Date.now().toString(36).toUpperCase();
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: {
        poojaSlug,
        couponCode: couponCode ?? "",
        phone,
        addonCount: String(validatedAddons.length),
        checkoutAmount: String(rawCheckoutAmount ?? amount),
        calculatedAmount: String(amount),
      },
    });
    return NextResponse.json({
      configured: true,
      keyId: razorpayKeyId(),
      orderId: order.id,
      amount: order.amount, // paise — what the checkout should charge
      calculatedAmount: amount,
      subtotal,
      discount,
      validatedAddons,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "We couldn't start your payment right now. Please try again in a moment.",
      },
      { status: 502 }
    );
  }
}
