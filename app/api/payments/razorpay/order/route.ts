import { NextRequest, NextResponse } from "next/server";
import {
  computeOrderAmount,
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay";
import { getResolvedCatalog, findUserByPhone } from "@/lib/server-store";
import { isPoojaActive } from "@/lib/data";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    poojaSlug?: unknown;
    couponCode?: unknown;
    phone?: unknown;
  };

  const poojaSlug = typeof body.poojaSlug === "string" ? body.poojaSlug.trim() : "";
  const couponCode =
    typeof body.couponCode === "string" && body.couponCode.trim()
      ? body.couponCode.trim().toUpperCase()
      : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!poojaSlug) {
    return NextResponse.json({ error: "Missing pooja." }, { status: 400 });
  }

  if (!razorpayConfigured()) {
    // Demo mode — no keys configured. The client falls back to its simulated
    // checkout; nothing else to do here.
    return NextResponse.json({ configured: false });
  }

  const catalog = await getResolvedCatalog();
  const pooja = catalog.poojas.find((p) => p.slug === poojaSlug);
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
  const { amount, couponProblem: problem } = computeOrderAmount({
    pooja,
    couponCode,
    couponMap: catalog.coupons,
    phone,
    confirmedCount,
  });
  if (problem) {
    return NextResponse.json({ error: problem }, { status: 400 });
  }

  try {
    const receipt = "ttp-" + Date.now().toString(36).toUpperCase();
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: { poojaSlug, couponCode: couponCode ?? "", phone },
    });
    return NextResponse.json({
      configured: true,
      keyId: razorpayKeyId(),
      orderId: order.id,
      amount: order.amount, // paise — what the checkout should charge
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
