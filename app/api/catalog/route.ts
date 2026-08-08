import { NextRequest, NextResponse } from "next/server";
import {
  clearCatalogOverrides,
  getResolvedCatalog,
  isValidSessionToken,
  saveCatalogOverrides,
  type CatalogOverrideSection,
} from "@/lib/server-store";

const SECTIONS: CatalogOverrideSection[] = ["poojas", "events", "coupons"];

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim() || null;
}

export async function GET() {
  return NextResponse.json(await getResolvedCatalog());
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Reset sections (e.g. { reset: ["poojas"] })
  if (Array.isArray(body.reset)) {
    const sections = body.reset.filter(
      (s): s is CatalogOverrideSection =>
        SECTIONS.includes(s as CatalogOverrideSection)
    );
    await clearCatalogOverrides(sections);
  }

  // Save sections (e.g. { poojas: [...] })
  const overrides: Record<string, unknown> = {};
  for (const s of SECTIONS) {
    if (body[s] !== undefined) overrides[s] = body[s];
  }
  if (Object.keys(overrides).length > 0) {
    await saveCatalogOverrides(
      overrides as Parameters<typeof saveCatalogOverrides>[0]
    );
  }

  return NextResponse.json({ ok: true, catalog: await getResolvedCatalog() });
}
