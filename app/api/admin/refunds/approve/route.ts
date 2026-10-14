import { NextRequest, NextResponse } from "next/server";
import { getAdminEmailFromToken, isValidSessionToken } from "@/lib/server-store";
import { approveRefundRequest } from "@/lib/refund-service";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

/**
 * POST /api/admin/refunds/approve
 * Approves a pending refund request (Step 3).
 * Requires Super Admin / Approver role.
 * Enforces separation of duties (requestor !== approver).
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
  };

  if (typeof body.requestId !== "string" || !body.requestId.trim()) {
    return NextResponse.json(
      { error: "Refund request ID is required." },
      { status: 400 }
    );
  }

  try {
    const request = await approveRefundRequest({
      requestId: body.requestId.trim(),
      approverEmail: adminEmail,
    });

    return NextResponse.json({ ok: true, request });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isAuthError = message.toLowerCase().includes("unauthorized");
    const status = isAuthError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
