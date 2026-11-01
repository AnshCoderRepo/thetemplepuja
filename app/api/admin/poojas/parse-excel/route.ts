import { NextRequest, NextResponse } from "next/server";
import { getResolvedCatalog, isValidSessionToken } from "@/lib/server-store";
import { parsePoojaExcelBuffer } from "@/lib/pooja-bulk-excel";

export const dynamic = "force-dynamic";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

/**
 * POST /api/admin/poojas/parse-excel
 * Accepts a multipart/form-data upload containing an Excel (.xlsx/.xls) or .csv file.
 * Parses and validates all rows against current temples and categories, returning
 * structured drafts with row-level validation errors.
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
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "No file was uploaded. Please upload a valid .xlsx or .csv file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the 15MB limit. Please upload a smaller spreadsheet." },
        { status: 400 }
      );
    }

    const filename = (file as File).name || "upload.xlsx";
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    if (!["xlsx", "xls", "csv"].includes(extension)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format. Please upload an Excel spreadsheet (.xlsx, .xls) or a .csv file.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const catalog = await getResolvedCatalog();
    const categoriesSet = new Set<string>();
    (catalog.poojas || []).forEach((p) => {
      if (p.category && typeof p.category === "string") {
        categoriesSet.add(p.category.trim());
      }
    });

    const parsedResult = await parsePoojaExcelBuffer(
      buffer,
      catalog.temples || [],
      Array.from(categoriesSet)
    );

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse the uploaded Excel file.";
    console.error("[Parse Excel API] Error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

