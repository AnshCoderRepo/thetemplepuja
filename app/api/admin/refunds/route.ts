import { NextRequest, NextResponse } from "next/server";
import { getAdminEmailFromToken, isValidSessionToken } from "@/lib/server-store";
import {
  createRefundRequest,
  getAdminRole,
  listAllRefundRequests,
} from "@/lib/refund-service";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

/**
 * GET /api/admin/refunds
 * List refund requests with optional status filtering.
 */
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  const adminEmail = (await getAdminEmailFromToken(token)) || "admin@thetemplepuja.com";
  const role = getAdminRole(adminEmail);

  const { searchParams } = req.nextUrl;
  const statusFilter = searchParams.get("status")?.toLowerCase().trim();
  const search = searchParams.get("search")?.toLowerCase().trim();

  let requests = await listAllRefundRequests();

  if (statusFilter && statusFilter !== "all") {
    requests = requests.filter((r) => r.status === statusFilter);
  }

  if (search) {
    requests = requests.filter(
      (r) =>
        r.id.toLowerCase().includes(search) ||
        r.orderId.toLowerCase().includes(search) ||
        r.bookingId.toLowerCase().includes(search) ||
        r.customerName.toLowerCase().includes(search) ||
        r.customerPhone.includes(search) ||
        r.poojaTitle.toLowerCase().includes(search) ||
        r.reason.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    ok: true,
    requests,
    currentAdminEmail: adminEmail,
    role,
  });
}

/**
 * POST /api/admin/refunds
 * Submit a refund request (Step 1 of approval workflow).
 */
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  const adminEmail = await getAdminEmailFromToken(token);
  if (!adminEmail) {
    return NextResponse.json(
      { error: "Unauthorized — unable to identify administrator." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    bookingId?: unknown;
    orderId?: unknown;
    requestedAmount?: unknown;
    reason?: unknown;
  };

  if (typeof body.bookingId !== "string" || !body.bookingId.trim()) {
    return NextResponse.json(
      { error: "Booking ID is required." },
      { status: 400 }
    );
  }

  if (typeof body.requestedAmount !== "number" || body.requestedAmount <= 0) {
    return NextResponse.json(
      { error: "A valid positive refund amount is required." },
      { status: 400 }
    );
  }

  if (typeof body.reason !== "string" || !body.reason.trim()) {
    return NextResponse.json(
      { error: "A clear reason for the refund request is required." },
      { status: 400 }
    );
  }

  try {
    const request = await createRefundRequest({
      bookingId: body.bookingId.trim(),
      orderId: typeof body.orderId === "string" ? body.orderId.trim() : undefined,
      requestedAmount: body.requestedAmount,
      reason: body.reason.trim(),
      requestedBy: adminEmail,
    });

    return NextResponse.json({ ok: true, request }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
