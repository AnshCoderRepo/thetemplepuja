import { NextRequest, NextResponse } from "next/server";
import {
  getAllGalleryItems,
  findGalleryItemById,
  saveGalleryItem,
  deleteGalleryItem,
  isValidSessionToken,
} from "@/lib/server-store";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  type GalleryItem,
  type GalleryMediaType,
} from "@/lib/gallery-types";
import { verifyYouTubeDuration } from "@/lib/youtube";
import { broadcastRealtime } from "@/lib/realtime";

export const dynamic = "force-dynamic";

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  try {
    const url = new URL(req.url);
    return url.searchParams.get("token")?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/admin/gallery
 * Returns all gallery items (both active and inactive) for admin management.
 */
export async function GET(req: Request) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const items = await getAllGalleryItems();
    return NextResponse.json({
      ok: true,
      items,
    });
  } catch (err: any) {
    console.error("[admin-gallery] Failed to fetch gallery items:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load gallery items" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gallery
 * Creates or updates a gallery item with full validation.
 */
export async function POST(req: Request) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));

    const title = (body.title || "").trim();
    if (!title || title.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Title is required (minimum 2 characters)." },
        { status: 400 }
      );
    }

    // Collect up to 3 photos from images array and legacy fields
    let rawImages: string[] = [];
    if (Array.isArray(body.images)) {
      rawImages.push(...body.images);
    }
    if (body.imageUrl && typeof body.imageUrl === "string") rawImages.push(body.imageUrl);
    if (body.imageUrl2 && typeof body.imageUrl2 === "string") rawImages.push(body.imageUrl2);
    if (body.imageUrl3 && typeof body.imageUrl3 === "string") rawImages.push(body.imageUrl3);

    // Normalize and validate images
    const images: string[] = [];
    for (const raw of rawImages) {
      if (typeof raw !== "string") continue;
      const trimmed = raw.trim();
      if (!trimmed) continue;

      // Validate format
      if (
        !trimmed.startsWith("http://") &&
        !trimmed.startsWith("https://") &&
        !trimmed.startsWith("data:image/") &&
        !trimmed.startsWith("/")
      ) {
        return NextResponse.json(
          { ok: false, error: "Invalid image format. Images must be valid URLs or web-safe images (JPG, PNG, WebP)." },
          { status: 400 }
        );
      }

      // Validate file size for data URLs (max 5MB)
      if (trimmed.startsWith("data:image/")) {
        const base64Length = trimmed.length - (trimmed.indexOf(",") + 1);
        const approxBytes = (base64Length * 3) / 4;
        if (approxBytes > 5 * 1024 * 1024) {
          return NextResponse.json(
            { ok: false, error: "Image file size exceeds the 5MB limit. Please upload a compressed image." },
            { status: 400 }
          );
        }
      }

      if (!images.includes(trimmed)) {
        images.push(trimmed);
      }
    }

    // SERVER ENFORCEMENT: Max 3 photos simultaneously
    if (images.length > 3) {
      return NextResponse.json(
        { ok: false, error: "Maximum of 3 photos allowed per gallery card." },
        { status: 400 }
      );
    }

    let videoUrl = (body.videoUrl || "").trim();
    let youtubeUrl = (body.youtubeUrl || "").trim();
    let youtubeVideoId = body.youtubeVideoId ? String(body.youtubeVideoId).trim() : undefined;
    let thumbnailUrl = (body.thumbnailUrl || "").trim();
    let videoDurationSeconds = body.videoDurationSeconds
      ? Number(body.videoDurationSeconds)
      : undefined;
    let durationVerified = Boolean(body.durationVerified);

    // SERVER ENFORCEMENT: Max 1 video allowed
    if (youtubeUrl && videoUrl && youtubeUrl !== videoUrl) {
      return NextResponse.json(
        { ok: false, error: "Only 1 video is allowed per gallery card." },
        { status: 400 }
      );
    }

    // Must have at least 1 media item (photo or video)
    if (images.length === 0 && !youtubeUrl && !videoUrl) {
      return NextResponse.json(
        { ok: false, error: "Please provide at least one photo or video for the gallery card." },
        { status: 400 }
      );
    }

    // YouTube Video Validation
    if (youtubeUrl) {
      const extractedId = extractYouTubeVideoId(youtubeUrl);
      if (!extractedId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Invalid YouTube URL. Please provide a standard YouTube video link (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)",
          },
          { status: 400 }
        );
      }
      youtubeVideoId = extractedId;

      // Auto fallback thumbnail from YouTube HQ if none provided and no photos
      if (!thumbnailUrl && images.length === 0) {
        thumbnailUrl = getYouTubeThumbnailUrl(extractedId) || "";
      }

      // Server-side YouTube duration check if API key exists
      const apiCheck = await verifyYouTubeDuration(extractedId);
      if (apiCheck.verified && typeof apiCheck.durationSeconds === "number") {
        if (apiCheck.durationSeconds > 180) {
          return NextResponse.json(
            {
              ok: false,
              error: `Video exceeds the maximum duration limit of 3 minutes (180 seconds). Actual duration: ${apiCheck.durationSeconds}s.`,
            },
            { status: 400 }
          );
        }
        videoDurationSeconds = apiCheck.durationSeconds;
        durationVerified = true;
      } else {
        // If admin manually supplied a duration, validate limit
        if (videoDurationSeconds !== undefined && videoDurationSeconds > 180) {
          return NextResponse.json(
            {
              ok: false,
              error: "Video duration exceeds the maximum limit of 3 minutes (180 seconds).",
            },
            { status: 400 }
          );
        }
        durationVerified = false;
      }
    } else if (videoUrl) {
      // Direct video upload duration check
      if (videoDurationSeconds !== undefined && videoDurationSeconds > 180) {
        return NextResponse.json(
          {
            ok: false,
            error: "Direct video exceeds the maximum duration limit of 3 minutes (180 seconds).",
          },
          { status: 400 }
        );
      }
    }

    const hasVideo = Boolean(youtubeUrl || videoUrl);
    const mediaType: GalleryMediaType = hasVideo
      ? (images.length > 0 ? "mixed" : "video")
      : "photo";

    const id = body.id || body._id || `gal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const existing = await findGalleryItemById(id);

    const item: GalleryItem = {
      id,
      _id: id,
      title,
      description: (body.description || "").trim(),
      mediaType,
      images,
      imageUrl: images[0] || undefined,
      imageUrl2: images[1] || undefined,
      imageUrl3: images[2] || undefined,
      thumbnailUrl: thumbnailUrl || images[0] || (youtubeVideoId ? getYouTubeThumbnailUrl(youtubeVideoId) || undefined : undefined),
      youtubeUrl: youtubeUrl || undefined,
      youtubeVideoId: youtubeVideoId || undefined,
      videoUrl: videoUrl || undefined,
      videoDurationSeconds,
      durationVerified,
      category: (body.category || "Puja Ceremonies").trim(),
      isActive: body.isActive !== false,
      showOnHomepage: Boolean(body.showOnHomepage),
      displayOrder: Number.isFinite(Number(body.displayOrder)) ? Number(body.displayOrder) : 1,
      isDemo: Boolean(body.isDemo),
      createdAt: existing?.createdAt || body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveGalleryItem(item);
    broadcastRealtime({ type: "catalog_updated", section: "gallery", target: item.id });

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (err: any) {
    console.error("[admin-gallery] Failed to save gallery item:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to save gallery item." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/gallery
 * Removes a gallery item.
 */
export async function DELETE(req: Request) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    let id = url.searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id || body?._id;
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Item ID is required for deletion." },
        { status: 400 }
      );
    }

    const success = await deleteGalleryItem(id);
    if (!success) {
      return NextResponse.json(
        { ok: false, error: "Gallery item not found or already deleted." },
        { status: 404 }
      );
    }

    broadcastRealtime({ type: "catalog_updated", section: "gallery", target: id });

    return NextResponse.json({
      ok: true,
      message: "Gallery item deleted successfully.",
    });
  } catch (err: any) {
    console.error("[admin-gallery] Failed to delete gallery item:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to delete gallery item." },
      { status: 500 }
    );
  }
}
