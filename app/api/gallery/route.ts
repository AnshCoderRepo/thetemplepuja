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
import { registerDataUrl } from "@/lib/media-cache";
import type { GalleryItem } from "@/lib/gallery-types";

function optimizeGalleryItem(item: GalleryItem): GalleryItem {
  const images = item.images?.map((img) => registerDataUrl(img) || img);
  const imageUrl = registerDataUrl(item.imageUrl) || item.imageUrl;
  const thumbnailUrl = registerDataUrl(item.thumbnailUrl) || item.thumbnailUrl;
  return {
    ...item,
    images: images && images.length > 0 ? images : undefined,
    imageUrl: imageUrl || images?.[0],
    thumbnailUrl: thumbnailUrl || imageUrl || images?.[0],
  };
}

let cachedHomepageGallery: any = null;
let cachedHomepageGalleryTime = 0;
const GALLERY_CACHE_TTL_MS = 60 * 1000;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const isHomepage = searchParams.get("homepage") === "true";
    const mediaType = (searchParams.get("mediaType") || "").toLowerCase().trim() as GalleryMediaType;
    const category = searchParams.get("category") || undefined;

    if (isHomepage) {
      const now = Date.now();
      if (cachedHomepageGallery && now - cachedHomepageGalleryTime < GALLERY_CACHE_TTL_MS) {
        return NextResponse.json(cachedHomepageGallery, {
          headers: {
            "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
          },
        });
      }

      const homepageItems = await getHomepageGalleryItems(6);
      const payload = {
        ok: true,
        items: homepageItems.map(optimizeGalleryItem),
      };
      cachedHomepageGallery = payload;
      cachedHomepageGalleryTime = now;

      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
        },
      });
    }

    const items = await getActiveGalleryItems({
      mediaType: mediaType === "photo" || mediaType === "video" ? mediaType : undefined,
      category,
    });

    return NextResponse.json(
      {
        ok: true,
        items: items.map(optimizeGalleryItem),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    console.error("[gallery-api] Error fetching gallery items:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load gallery items" },
      { status: 500 }
    );
  }
}
