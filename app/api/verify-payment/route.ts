import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/verify-payment
 * Authoritative Razorpay Signature Verification Endpoint
 *
 * Request Body:
 * {
 *   razorpay_order_id?: string,
 *   razorpay_payment_id?: string,
 *   razorpay_signature?: string,
 *   // also supports direct alias keys
 *   order_id?: string,
 *   payment_id?: string,
 *   signature?: string
 * }
 *
 * Algorithm:
 *   HMAC-SHA256(order_id + "|" + payment_id, RAZORPAY_KEY_SECRET)
 */
export async function POST(req: NextRequest) {
  try {
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: "Razorpay secret key is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const orderId =
      body.razorpay_order_id ||
      body.order_id ||
      body.orderId ||
      "";
    const paymentId =
      body.razorpay_payment_id ||
      body.payment_id ||
      body.paymentId ||
      "";
    const signature =
      body.razorpay_signature ||
      body.signature ||
      "";

    // Validate presence of required fields
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: order_id, payment_id, and signature are required.",
        },
        { status: 400 }
      );
    }

    // Compute expected HMAC SHA-256 signature
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    let isMatch = false;
    try {
      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      const providedBuf = Buffer.from(String(signature), "utf8");
      if (expectedBuf.length === providedBuf.length) {
        isMatch = timingSafeEqual(expectedBuf, providedBuf);
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed: Signature mismatch.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during verification." },
      { status: 500 }
    );
  }
}
