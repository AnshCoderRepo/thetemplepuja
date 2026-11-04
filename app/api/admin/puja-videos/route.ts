import { NextRequest, NextResponse } from "next/server";
import {
  deletePujaSessionVideo,
  getPujaSessionVideos,
  getResolvedCatalog,
  isValidSessionToken,
  savePujaSessionVideo,
} from "@/lib/server-store";
import type { PujaSessionVideo } from "@/lib/persistence";
import { broadcastRealtime } from "@/lib/realtime";

export const dynamic = "force-dynamic";

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header) {
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }
  return req.nextUrl.searchParams.get("token")?.trim() || null;
}

/**
 * GET /api/admin/puja-videos
 * Returns all uploaded ceremony session videos.
 */
export async function GET(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const poojaSlug = req.nextUrl.searchParams.get("poojaSlug") || undefined;
    const date = req.nextUrl.searchParams.get("date") || undefined;
    const videos = await getPujaSessionVideos(poojaSlug, date);
    const catalog = await getResolvedCatalog();

    return NextResponse.json({
      success: true,
      videos,
      availablePoojas: (catalog.poojas || []).map((p) => ({
        slug: p.slug,
        name: p.title,
      })),
    });
  } catch (err: unknown) {
    console.error("[admin-puja-videos] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch puja session videos." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/puja-videos
 * Uploads/saves 1 ceremony video for a puja + date.
 */
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const poojaSlug = String(body.poojaSlug || "").trim();
    const poojaTitle = String(body.poojaTitle || "").trim();
    const date = String(body.date || "").trim();
    const videoUrl = String(body.videoUrl || "").trim();
    const title = String(body.title || "").trim();
    const description = body.description ? String(body.description).trim() : undefined;
    const active = body.active !== false;

    if (!poojaSlug || !date || !videoUrl || !title) {
      return NextResponse.json(
        { error: "Pooja slug, ceremony date, video title, and video URL are required." },
        { status: 400 }
      );
    }

    const id = body.id || body._id || `pvid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: PujaSessionVideo = {
      _id: id,
      id,
      poojaSlug,
      poojaTitle: poojaTitle || poojaSlug,
      date,
      videoUrl,
      title,
      description,
      active,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await savePujaSessionVideo(record);
    broadcastRealtime({ type: "devotee_updated", section: "puja_video", target: id });

    return NextResponse.json({
      success: true,
      video: record,
      message: "Puja session video saved successfully.",
    });
  } catch (err: unknown) {
    console.error("[admin-puja-videos] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save puja session video." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/puja-videos
 * Deletes a puja session video.
 */
export async function DELETE(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const id = req.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing video ID parameter." }, { status: 400 });
    }

    const deleted = await deletePujaSessionVideo(id);
    if (!deleted) {
      return NextResponse.json({ error: "Video record not found or already deleted." }, { status: 404 });
    }

    broadcastRealtime({ type: "devotee_updated", section: "puja_video", target: id });
    return NextResponse.json({ success: true, message: "Puja session video deleted." });
  } catch (err: unknown) {
    console.error("[admin-puja-videos] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete puja session video." },
      { status: 500 }
    );
  }
}
