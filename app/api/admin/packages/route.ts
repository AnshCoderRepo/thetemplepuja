import { NextRequest, NextResponse } from "next/server";
import {
  deleteStandalonePackage,
  getResolvedCatalog,
  getStandalonePackages,
  isValidSessionToken,
  saveStandalonePackage,
} from "@/lib/server-store";
import type { StandalonePackage } from "@/lib/persistence";
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
 * GET /api/admin/packages
 * Returns standalone reusable packages (both drafts and active).
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
    const statusParam = req.nextUrl.searchParams.get("status");
    const statusFilter = statusParam === "draft" || statusParam === "active" ? statusParam : undefined;
    const packages = await getStandalonePackages(statusFilter);
    const catalog = await getResolvedCatalog();

    return NextResponse.json({
      success: true,
      packages,
      availablePoojas: (catalog.poojas || []).map((p) => ({
        slug: p.slug,
        name: p.title,
      })),
    });
  } catch (err: unknown) {
    console.error("[admin-packages] GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch packages." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/packages
 * Creates or updates a reusable package with "draft" or "active" status.
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
    const name = String(body.name || "").trim();
    const hindiName = body.hindiName ? String(body.hindiName).trim() : undefined;
    const price = typeof body.price === "number" ? body.price : Number(body.price) || 0;
    const originalPrice = body.originalPrice ? Number(body.originalPrice) : undefined;
    const description = body.description ? String(body.description).trim() : undefined;
    const hindiDescription = body.hindiDescription ? String(body.hindiDescription).trim() : undefined;
    const devoteeLimit = typeof body.devoteeLimit === "number" ? body.devoteeLimit : Number(body.devoteeLimit) || undefined;
    const badge = body.badge ? String(body.badge).trim() : undefined;
    const features = Array.isArray(body.features)
      ? body.features.map(String).map((f: string) => f.trim()).filter(Boolean)
      : [];
    const status: "draft" | "active" = body.status === "draft" ? "draft" : "active";
    const attachedPoojaSlugs = Array.isArray(body.attachedPoojaSlugs)
      ? body.attachedPoojaSlugs.map(String).map((s: string) => s.trim()).filter(Boolean)
      : [];

    if (!name) {
      return NextResponse.json({ error: "Package name is required." }, { status: 400 });
    }

    const id = body.id || body._id || `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: StandalonePackage = {
      _id: id,
      id,
      name,
      hindiName,
      price,
      originalPrice,
      description,
      hindiDescription,
      features,
      devoteeLimit,
      badge,
      status,
      attachedPoojaSlugs,
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveStandalonePackage(record);
    broadcastRealtime({ type: "catalog_updated", section: "packages", target: id });

    return NextResponse.json({
      success: true,
      package: record,
      message: `Package "${name}" saved as ${status}.`,
    });
  } catch (err: unknown) {
    console.error("[admin-packages] POST error:", err);
    return NextResponse.json(
      { error: "Failed to save package." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/packages
 * Deletes a standalone package.
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
      return NextResponse.json({ error: "Missing package ID parameter." }, { status: 400 });
    }

    const deleted = await deleteStandalonePackage(id);
    if (!deleted) {
      return NextResponse.json({ error: "Package record not found or already deleted." }, { status: 404 });
    }

    broadcastRealtime({ type: "catalog_updated", section: "packages", target: id });
    return NextResponse.json({ success: true, message: "Package deleted." });
  } catch (err: unknown) {
    console.error("[admin-packages] DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to delete package." },
      { status: 500 }
    );
  }
}
