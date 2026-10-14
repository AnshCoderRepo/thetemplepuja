import { NextRequest, NextResponse } from "next/server";
import { getAdminEmailFromToken, isValidSessionToken } from "@/lib/server-store";
import { executeApprovedRefund } from "@/lib/refund-service";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

/**
 * POST /api/admin/refunds/execute
 * Executes an approved refund request through Razorpay or recorded manual settlement (Step 4).
 * Enforces:
 * - Admin authorization
 * - Idempotency
 * - Only verified gateway responses mark the refund as successful.
 */
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in as an authorized admin." },
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
    requestId?: unknown;
    manualSettlement?: {
      settlementReference?: unknown;
      executionNotes?: unknown;
    };
  };

  if (typeof body.requestId !== "string" || !body.requestId.trim()) {
    return NextResponse.json(
      { error: "Refund request ID is required." },
      { status: 400 }
    );
  }

  const manualSettlement =
    body.manualSettlement && typeof body.manualSettlement === "object"
      ? {
          settlementReference:
            typeof body.manualSettlement.settlementReference === "string"
              ? body.manualSettlement.settlementReference.trim()
              : undefined,
          executionNotes:
            typeof body.manualSettlement.executionNotes === "string"
              ? body.manualSettlement.executionNotes.trim()
              : undefined,
        }
      : undefined;

  try {
    const request = await executeApprovedRefund({
      requestId: body.requestId.trim(),
      executorEmail: adminEmail,
      manualSettlement,
    });

    return NextResponse.json({ ok: true, request });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isAuthError = message.toLowerCase().includes("unauthorized");
    const status = isAuthError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
