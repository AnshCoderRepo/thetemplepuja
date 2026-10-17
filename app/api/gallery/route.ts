import { NextRequest, NextResponse } from "next/server";
import { getActiveGalleryItems, getHomepageGalleryItems } from "@/lib/server-store";
import type { GalleryMediaType } from "@/lib/gallery-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/gallery
 * Public endpoint to fetch active gallery items.
 *
 * Query params:
 *   - homepage: "true" -> returns active items marked for homepage (limit 6)
 *   - mediaType: "photo" | "video" -> filter by media type
 *   - category: string -> filter by category name
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const isHomepage = searchParams.get("homepage") === "true";
    const mediaType = (searchParams.get("mediaType") || "").toLowerCase().trim() as GalleryMediaType;
    const category = searchParams.get("category") || undefined;

    if (isHomepage) {
      const homepageItems = await getHomepageGalleryItems(6);
      return NextResponse.json({
        ok: true,
        items: homepageItems,
      });
    }

    const items = await getActiveGalleryItems({
      mediaType: mediaType === "photo" || mediaType === "video" ? mediaType : undefined,
      category,
    });

    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (err: any) {
    console.error("[gallery-api] Error fetching gallery items:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load gallery items" },
      { status: 500 }
    );
  }
}
