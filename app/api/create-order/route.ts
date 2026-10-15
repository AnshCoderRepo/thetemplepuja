import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const dynamic = "force-dynamic";

/**
 * POST /api/create-order
 * Standard Razorpay Order Creation Endpoint
 *
 * Request Body:
 * {
 *   amount: number,    // amount in paise (min 100 paise = 1 INR)
 *   currency?: string, // e.g. "INR" (default)
 *   receipt?: string,  // optional receipt identifier
 *   notes?: Record<string, string>
 * }
 *
 * Response:
 * {
 *   order_id: string,
 *   amount: number,
 *   currency: string,
 *   key_id: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawAmount = body.amount;

    if (rawAmount === undefined || rawAmount === null || typeof rawAmount !== "number" || isNaN(rawAmount)) {
      return NextResponse.json(
        { error: "Valid amount in paise is required." },
        { status: 400 }
      );
    }

    const amountInPaise = Math.round(rawAmount);

    // Minimum amount validation: 100 paise (1 INR)
    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: "Amount must be at least 100 paise (₹1.00)." },
        { status: 400 }
      );
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 401 }
      );
    }


    const currency = (typeof body.currency === "string" && body.currency.trim()) || "INR";
    const receipt =
      (typeof body.receipt === "string" && body.receipt.trim()) ||
      `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const notes = typeof body.notes === "object" && body.notes !== null ? body.notes : {};

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    try {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes,
      });

      return NextResponse.json({
        order_id: order.id,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
        keyId: keyId,
      });
    } catch (apiErr: any) {
      // Check for authentication failure vs other API error
      const statusCode = apiErr?.statusCode || apiErr?.status;
      const errorMsg =
        apiErr?.error?.description ||
        apiErr?.message ||
        "Razorpay API failed to create order.";

      if (statusCode === 401 || (typeof errorMsg === "string" && errorMsg.toLowerCase().includes("authentication"))) {
        return NextResponse.json(
          { error: "Razorpay authentication failed. Please verify API keys.", details: errorMsg },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred while creating order." },
      { status: 500 }
    );
  }
}
