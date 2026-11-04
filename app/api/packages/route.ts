import { NextRequest, NextResponse } from "next/server";
import { getResolvedCatalog, getStandalonePackages } from "@/lib/server-store";
import { isDemoSlug, DEMO_POOJA } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/packages
 * Public endpoint to fetch active packages created by admin.
 * Query parameter:
 *   - poojaSlug: (optional) Filter packages assigned to this specific puja.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const poojaSlug = searchParams.get("poojaSlug") || searchParams.get("pujaId") || searchParams.get("slug");

    const allActive = await getStandalonePackages("active");

    if (poojaSlug) {
      const normalizedSlug = poojaSlug.trim().toLowerCase().replace(/_/g, "-");
      const catalog = await getResolvedCatalog();
      const pooja = isDemoSlug(normalizedSlug)
        ? DEMO_POOJA
        : catalog.poojas.find(
            (p) =>
              p.slug.toLowerCase().trim() === normalizedSlug ||
              (p.id && String(p.id).toLowerCase().trim() === normalizedSlug) ||
              (p._id && String(p._id).toLowerCase().trim() === normalizedSlug)
          );

      if (!pooja) {
        return NextResponse.json({ ok: false, error: "Puja not found", packages: [] }, { status: 404 });
      }

      // 1. Packages explicitly on the pooja
      const embeddedPackages = Array.isArray(pooja.packages) ? pooja.packages : [];

      // 2. Standalone packages attached to this pooja by admin
      const attachedPackages = allActive.filter((pkg) => {
        if (!Array.isArray(pkg.attachedPoojaSlugs)) return false;
        return (
          pkg.attachedPoojaSlugs.includes("all") ||
          pkg.attachedPoojaSlugs.some((s) => s.toLowerCase().trim() === normalizedSlug)
        );
      });

      // Merge: embedded + attached (avoiding duplicate IDs)
      const seenIds = new Set<string>();
      const combinedPackages = [];

      for (const ep of embeddedPackages) {
        const id = ep.id || ep.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (!seenIds.has(id)) {
          seenIds.add(id);
          combinedPackages.push(ep);
        }
      }

      for (const ap of attachedPackages) {
        const id = ap.id || ap.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        if (!seenIds.has(id)) {
          seenIds.add(id);
          combinedPackages.push({
            id: ap.id,
            name: ap.name,
            hindiName: ap.hindiName,
            price: ap.price,
            originalPrice: ap.originalPrice,
            description: ap.description,
            hindiDescription: ap.hindiDescription,
            features: ap.features,
            benefits: ap.features,
            devoteeLimit: ap.devoteeLimit,
            badge: ap.badge,
            isPopular: ap.badge?.toLowerCase().includes("popular"),
          });
        }
      }

      return NextResponse.json({
        ok: true,
        poojaSlug: pooja.slug,
        poojaTitle: pooja.title,
        packages: combinedPackages,
      });
    }

    return NextResponse.json({
      ok: true,
      packages: allActive,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch packages.";
    return NextResponse.json(
      { ok: false, error: errorMsg },
      { status: 500 }
    );
  }
}

