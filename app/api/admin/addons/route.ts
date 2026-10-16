import { NextRequest, NextResponse } from "next/server";
import {
  getAllAddons,
  getResolvedCatalog,
  isValidSessionToken,
  saveAddon,
  deleteAddon,
} from "@/lib/server-store";
import type { Addon } from "@/lib/data";
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
 * GET /api/admin/addons
 * Returns all add-ons with their active status, fixed prices, and which pujas they are assigned to.
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
    const addons = await getAllAddons();
    const catalog = await getResolvedCatalog();

    // Map each add-on to the pujas it is assigned to
    const enrichedAddons = addons.map((addon) => {
      const id = addon._id || addon.id;
      const assignedPoojas = catalog.poojas.filter((p) => {
        if (Array.isArray(p.assignedAddonIds)) {
          return p.assignedAddonIds.includes(id) || p.assignedAddonIds.includes(addon.id);
        }
        if (Array.isArray(p.chadhavaOptions)) {
          const legacySet = new Set(p.chadhavaOptions.map((s) => s.trim().toLowerCase()));
          return legacySet.has(addon.name.toLowerCase()) || legacySet.has(addon.id.toLowerCase());
        }
        return false;
      });

      return {
        ...addon,
        _id: id,
        id,
        assignedPoojaCount: assignedPoojas.length,
        assignedPoojaSlugs: assignedPoojas.map((p) => p.slug),
        assignedPoojaTitles: assignedPoojas.map((p) => p.title),
      };
    });

    return NextResponse.json({
      ok: true,
      addons: enrichedAddons,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve add-ons." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/addons
 * Creates or updates an independent add-on record in MongoDB.
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
    const body = (await req.json().catch(() => ({}))) as Partial<Addon>;
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Add-on name is required." },
        { status: 400 }
      );
    }

    if (body.price === undefined || body.price === null || isNaN(Number(body.price)) || Number(body.price) < 0) {
      return NextResponse.json(
        { error: "A valid non-negative fixed price is required." },
        { status: 400 }
      );
    }

    const price = Math.round(Number(body.price));
    const now = new Date().toISOString();

    // Use existing stable id or generate a new stable slug-based identifier
    const incomingId = String(body._id || body.id || "").trim();
    const id = incomingId || `addon-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;

    const addonRecord: Addon = {
      _id: id,
      id,
      name,
      hindiName: body.hindiName?.trim() || undefined,
      teluguName: body.teluguName?.trim() || undefined,
      tamilName: body.tamilName?.trim() || undefined,
      description: body.description?.trim() || "",
      hindiDescription: body.hindiDescription?.trim() || undefined,
      teluguDescription: body.teluguDescription?.trim() || undefined,
      tamilDescription: body.tamilDescription?.trim() || undefined,
      price,
      currency: (body.currency && String(body.currency).trim()) || "INR",
      active: body.active !== false,
      emoji: body.emoji?.trim() || "🌸",
      category: body.category?.trim() || "Chadhava Seva",
      hindiCategory: body.hindiCategory?.trim() || undefined,
      teluguCategory: body.teluguCategory?.trim() || undefined,
      tamilCategory: body.tamilCategory?.trim() || undefined,
      image: body.image?.trim() || undefined,
      type: body.type === "addon" ? "addon" : "chadhava",
      badge: body.badge?.trim() || undefined,
      hindiBadge: body.hindiBadge?.trim() || undefined,
      createdAt: body.createdAt || now,
      updatedAt: now,
    };

    await saveAddon(addonRecord);

    broadcastRealtime({
      type: "catalog_updated",
      section: "addons",
    });

    return NextResponse.json({
      ok: true,
      addon: addonRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save add-on." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/addons
 * Explicitly deletes an add-on record from MongoDB.
 * Critical Rule: Puja deletion never triggers this; only explicit admin action can delete an add-on.
 * Automatically cleans up assignment references in pujas so no broken references remain.
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
    const { searchParams } = req.nextUrl;
    let id = searchParams.get("id");
    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id || body?._id;
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Add-on ID is required for deletion." },
        { status: 400 }
      );
    }

    const deleted = await deleteAddon(id.trim());

    broadcastRealtime({
      type: "catalog_updated",
      section: "addons",
    });

    return NextResponse.json({
      ok: true,
      deleted,
      id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete add-on." },
      { status: 500 }
    );
  }
}
