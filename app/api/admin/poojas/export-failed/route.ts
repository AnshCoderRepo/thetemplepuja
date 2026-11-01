import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken } from "@/lib/server-store";
import { generateFailedPoojaWorkbook, type ParsedPoojaDraft } from "@/lib/pooja-bulk-excel";

export const dynamic = "force-dynamic";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

/**
 * POST /api/admin/poojas/export-failed
 * Generates an Excel spreadsheet containing only the failed records alongside an
 * explicit error column explaining why each record failed validation. Admins can
 * fix the errors in this sheet and re-upload it directly.
 */
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const failedRecords: ParsedPoojaDraft[] = Array.isArray(body?.failedRecords)
      ? body.failedRecords
      : Array.isArray(body?.items)
      ? body.items
      : [];

    if (failedRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: "No failed records provided to export." },
        { status: 400 }
      );
    }

    const buffer = await generateFailedPoojaWorkbook(failedRecords);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Bulk_Puja_Validation_Errors.xlsx"',
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export error report.";
    console.error("[Export Failed API] Error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

