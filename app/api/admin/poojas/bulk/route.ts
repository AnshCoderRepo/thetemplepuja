import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getResolvedCatalog, isValidSessionToken, saveCatalogOverrides } from "@/lib/server-store";
import { broadcastRealtime } from "@/lib/realtime";
import { registerDataUrl } from "@/lib/media-cache";
import { generateUniquePoojaSlug } from "@/lib/pooja-duplicate";
import { isTempleActive, type Pooja, type Temple, type PoojaPackage } from "@/lib/data";
import type { ParsedPoojaDraft } from "@/lib/pooja-bulk-excel";

export const dynamic = "force-dynamic";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

interface BulkRequestBody {
  poojas: ParsedPoojaDraft[];
  publishAll?: boolean;
}

/**
 * POST /api/admin/poojas/bulk
 * Processes bulk Puja submissions (from Dynamic Form or Excel Import).
 * Validates each Puja independently, enforces business rules:
 * - Temple Puja: Requires an active associated temple from Temple Management.
 * - Home Puja: Doorstep visit, MUST NOT have temple associations.
 * - New records default to Draft/Inactive status unless explicit publish requested.
 * - Generates unique slugs and collision-resistant IDs.
 * - Atomically persists valid records, revalidates cache, and broadcasts realtime events.
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
    const body: BulkRequestBody = await req.json();
    const drafts = Array.isArray(body?.poojas) ? body.poojas : [];

    if (drafts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No Puja records provided for bulk creation." },
        { status: 400 }
      );
    }

    const catalog = await getResolvedCatalog();
    const existingPoojas = [...(catalog.poojas || [])];
    const templesPool = catalog.temples || [];

    const createdPoojas: Pooja[] = [];
    const failedRecords: ParsedPoojaDraft[] = [];

    drafts.forEach((draft, idx) => {
      const errors: string[] = [];
      const title = (draft.title || "").trim();
      const hindiTitle = (draft.hindiTitle || "").trim();
      const category = (draft.category || "").trim();
      const ritualType = draft.type === "home" ? "home" : "temple";
      const price = Number(draft.price);

      // ── Core Field Validation ──
      if (!title) {
        errors.push("Puja Name (English) is required.");
      }
      if (!hindiTitle) {
        errors.push("Puja Name (Hindi) is required.");
      }
      if (!category) {
        errors.push("Puja Category is required.");
      }
      if (isNaN(price) || price <= 0) {
        errors.push("Starting price must be a valid positive number (> 0).");
      }

      // ── Ritual Type & Temple Association Business Rules ──
      let resolvedTempleId: string | undefined;
      let resolvedTempleSlug: string | undefined;
      let resolvedTempleName: string | undefined;

      if (ritualType === "home") {
        // Home Puja: In-person doorstep visit, strictly NO temple association
        resolvedTempleId = undefined;
        resolvedTempleSlug = undefined;
        resolvedTempleName = undefined;
      } else {
        // Temple Puja: MUST have an active temple associated from Temple Management
        const inputTemple = (draft.templeId || draft.templeSlug || draft.templeName || "").trim().toLowerCase();

        const matched = templesPool.find((t) => {
          const tid = t._id ? String(t._id).toLowerCase() : "";
          const tslug = (t.slug || "").toLowerCase();
          const tname = (t.name || "").toLowerCase();
          const thindi = (t.hindiName || "").toLowerCase();

          return (
            (tid && tid === inputTemple) ||
            (tslug && tslug === inputTemple) ||
            (tname && tname === inputTemple) ||
            (thindi && thindi === inputTemple)
          );
        });

        if (!matched) {
          errors.push(
            `Associated Temple is required for Temple Pujas. "${draft.templeName || draft.templeSlug || "Unknown"}" was not found in Temple Management.`
          );
        } else if (!isTempleActive(matched)) {
          errors.push(
            `Temple "${matched.name}" is currently marked as Inactive. Inactive temples cannot be assigned to new Pujas.`
          );
        } else {
          resolvedTempleId = matched._id ? String(matched._id) : (matched.id || matched.slug);
          resolvedTempleSlug = matched.slug;
          resolvedTempleName = matched.name;
        }
      }

      // If validation fails, record as failed draft
      if (errors.length > 0) {
        failedRecords.push({
          ...draft,
          isValid: false,
          errors: Array.from(new Set([...(draft.errors || []), ...errors])),
        });
        return;
      }

      // ── Build Valid Pooja Entity ──
      const uniqueSlug = generateUniquePoojaSlug(title, existingPoojas);
      const generatedId = `pooja-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
      const cleanImageUrl = registerDataUrl(draft.imageUrl) || draft.imageUrl;

      const packages: PoojaPackage[] = Array.isArray(draft.packages) && draft.packages.length > 0
        ? draft.packages.map((pkg, pIdx) => ({
            id: pkg.id || `pkg-${Date.now()}-${pIdx}`,
            name: (pkg.name || "").trim() || "Standard Seva",
            hindiName: pkg.hindiName || undefined,
            price: Number(pkg.price) > 0 ? Number(pkg.price) : price,
            originalPrice: Number(pkg.originalPrice) > 0 ? Number(pkg.originalPrice) : undefined,
            description: (pkg.description || "").trim(),
            hindiDescription: pkg.hindiDescription || undefined,
            benefits: Array.isArray(pkg.benefits) ? pkg.benefits : [],
            isPopular: Boolean(pkg.isPopular),
          }))
        : [
            {
              id: `pkg-${Date.now()}-0`,
              name: "Standard Seva",
              price: price,
              description: "Complete Vedic ritual ceremony conducted with sacred mantras.",
              benefits: Array.isArray(draft.benefits) && draft.benefits.length > 0 ? draft.benefits : ["Sankalp in Devotee's Name & Gotra"],
              isPopular: true,
            },
          ];

      const shouldBeActive = body.publishAll === true ? true : Boolean(draft.active);

      const newPooja: Pooja = {
        id: generatedId,
        _id: generatedId,
        slug: uniqueSlug,
        title,
        hindiTitle,
        category,
        type: ritualType,
        templeId: resolvedTempleId,
        templeSlug: resolvedTempleSlug,
        templeName: resolvedTempleName,
        templeSlugs: resolvedTempleSlug ? [resolvedTempleSlug] : [],
        price,
        originalPrice: Number(draft.originalPrice) > 0 ? Number(draft.originalPrice) : undefined,
        duration: (draft.duration || "").trim() || "45-60 mins",
        bestMuhurat: (draft.eventTime || "").trim() || "Auspicious Morning Muhurat",
        startDate: (draft.startDate || "").trim() || undefined,
        eventTime: (draft.eventTime || "").trim() || undefined,
        capacity: Number(draft.capacity) > 0 ? Number(draft.capacity) : 50,
        description: (draft.description || "").trim() || `${title} conducted by certified Vedic pandits.`,
        fullDescription: (draft.fullDescription || "").trim() || undefined,
        imageUrl: cleanImageUrl || "/images/poojas/default-pooja.jpg",
        benefits: Array.isArray(draft.benefits) && draft.benefits.length > 0
          ? draft.benefits.filter(Boolean)
          : ["Name & Gotra Sankalp", "Prasad Delivery to Home", "Live Panditji Chanting"],
        packages,
        assignedAddonIds: Array.isArray(draft.assignedAddonIds) ? draft.assignedAddonIds.filter(Boolean) : [],
        active: shouldBeActive,
        showInHero: Boolean(draft.showInHero),
        showInHeroCard: Boolean(draft.showInHeroCard),
        showInCatalog: draft.showInCatalog !== false, // defaults to true for catalog discovery
        badge: draft.badge?.trim() || undefined,
        emoji: "🪔",
        gradient: "from-amber-500 to-orange-600",
        createdAt: new Date().toISOString(),
        isNew: true,
      };

      createdPoojas.push(newPooja);
      existingPoojas.push(newPooja); // Avoid duplicate slugs among batch items
    });

    // ── Save to Persistent Store if any succeeded ──
    if (createdPoojas.length > 0) {
      await saveCatalogOverrides({ poojas: existingPoojas });

      try {
        revalidatePath("/", "layout");
        revalidatePath("/book");
        revalidatePath("/book/[service]", "page");
        revalidatePath("/temples");
        revalidatePath("/temples/[slug]", "page");
      } catch {
        // Pass in non-SSR test environments
      }

      broadcastRealtime({
        type: "catalog_updated",
        section: "poojas",
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalSubmitted: drafts.length,
        created: createdPoojas.length,
        failed: failedRecords.length,
        skipped: 0,
      },
      createdPoojas,
      failedRecords,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error occurred while creating bulk Pujas.";
    console.error("[Bulk Puja Create API] Error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

