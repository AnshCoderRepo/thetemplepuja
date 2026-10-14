import { NextRequest, NextResponse } from "next/server";
import { getAllDevotees, isValidSessionToken } from "@/lib/server-store";
import { generateDevoteesExcelWorkbook } from "@/lib/devotee-export";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required to export devotee data." },
      { status: 401 }
    );
  }

  const { searchParams } = req.nextUrl;
  const searchQuery = searchParams.get("search")?.trim() || "";
  const statusFilter = searchParams.get("status")?.trim() || "all";
  const pujaFilter = searchParams.get("puja")?.trim() || "all";
  const pujaTitle = searchParams.get("title")?.trim() || undefined;

  // Retrieve all devotee records securely from database store
  const users = await getAllDevotees();

  const { buffer, filename, distinctCount } = await generateDevoteesExcelWorkbook(
    users,
    {
      pujaFilter,
      pujaTitle,
      statusFilter,
      searchQuery,
    }
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Distinct-Count": String(distinctCount),
    },
  });
}
