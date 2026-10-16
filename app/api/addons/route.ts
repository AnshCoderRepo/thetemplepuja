import { NextRequest, NextResponse } from "next/server";
import { getResolvedCatalog, getActiveAddons } from "@/lib/server-store";
import { DEMO_POOJA, isDemoSlug, getAssignedAddonsForPooja } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/addons
 * Query parameters:
 *   - poojaSlug: (optional) Filter add-ons assigned strictly to this puja.
 * If poojaSlug is omitted, returns all active add-ons.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const poojaSlug = searchParams.get("poojaSlug") || searchParams.get("pujaId") || searchParams.get("slug");

    const allActive = await getActiveAddons();

    if (poojaSlug) {
      const normalizedSlug = poojaSlug.trim().toLowerCase().replace(/_/g, "-");
      const catalog = await getResolvedCatalog();
      const pooja = isDemoSlug(normalizedSlug)
        ? DEMO_POOJA
        : catalog.poojas.find((p) => p.slug === normalizedSlug);

      if (!pooja) {
        return NextResponse.json({ ok: false, error: "Puja not found", addons: [] }, { status: 404 });
      }

      const assignedAddons = getAssignedAddonsForPooja(pooja, allActive);
      return NextResponse.json({
        ok: true,
        poojaSlug: pooja.slug,
        poojaTitle: pooja.title,
        addons: assignedAddons,
      });
    }

    return NextResponse.json({
      ok: true,
      addons: allActive,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to fetch add-ons." },
      { status: 500 }
    );
  }
}
