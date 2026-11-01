import { NextRequest, NextResponse } from "next/server";
import { getResolvedCatalog, isValidSessionToken } from "@/lib/server-store";
import { isTempleActive } from "@/lib/data";
import { generatePoojaTemplateWorkbook } from "@/lib/pooja-bulk-excel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

/**
 * GET /api/admin/poojas/template
 * Generates and downloads the standardized Excel (.xlsx) template for bulk Puja creation.
 * Populates active temples and existing categories in the instructions sheet.
 */
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const catalog = await getResolvedCatalog();
    const activeTemples = (catalog.temples || []).filter(isTempleActive);

    // Collect all unique categories
    const categoriesSet = new Set<string>();
    (catalog.poojas || []).forEach((p) => {
      if (p.category && typeof p.category === "string") {
        categoriesSet.add(p.category.trim());
      }
    });

    const categories = Array.from(categoriesSet);

    const buffer = await generatePoojaTemplateWorkbook(activeTemples, categories);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="TemplePujaSewa_Bulk_Puja_Template.xlsx"',
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate Puja template workbook";
    console.error("[Template Download API] Error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

