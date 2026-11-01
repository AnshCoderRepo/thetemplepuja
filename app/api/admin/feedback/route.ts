import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isValidSessionToken } from "@/lib/server-store";
import {
  getAdminFeedback,
  updateFeedbackItem,
  deleteFeedbackItem,
  type FeedbackStatus,
} from "@/lib/feedback-store";
import { broadcastRealtime } from "@/lib/realtime";

export const dynamic = "force-dynamic";

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  return req.headers.get("x-admin-token") || req.nextUrl.searchParams.get("token") || null;
}

/**
 * GET /api/admin/feedback
 * Admin endpoint: Lists all submitted feedbacks with status filter, search, and aggregate metrics.
 */
export async function GET(req: NextRequest) {
  const token = extractToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusParam = (searchParams.get("status") || "all") as FeedbackStatus | "all" | "featured";
    const search = searchParams.get("search") || undefined;
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "200", 10)));
    const skip = Math.max(0, parseInt(searchParams.get("skip") || "0", 10));

    const result = await getAdminFeedback({
      status: statusParam,
      search,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error("[Admin Feedback GET Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedbacks." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/feedback
 * Admin endpoint: Approve, reject, feature/unfeature, or edit feedback contents.
 */
export async function PATCH(req: NextRequest) {
  const token = extractToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id, status, isFeatured, name, message, rating } = body as {
      id?: unknown;
      status?: unknown;
      isFeatured?: unknown;
      name?: unknown;
      message?: unknown;
      rating?: unknown;
    };

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "Feedback id is required." },
        { status: 400 }
      );
    }

    const updated = await updateFeedbackItem(id.trim(), {
      status: typeof status === "string" ? (status as FeedbackStatus) : undefined,
      isFeatured: typeof isFeatured === "boolean" ? isFeatured : undefined,
      name: typeof name === "string" ? name : undefined,
      message: typeof message === "string" ? message : undefined,
      rating: typeof rating === "number" ? rating : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Feedback item not found." },
        { status: 404 }
      );
    }

    // Purge cached landing page and notify connected tabs
    try {
      revalidatePath("/", "page");
      revalidatePath("/", "layout");
    } catch {
      // pass
    }

    broadcastRealtime({
      type: "feedback_updated",
      section: "feedback",
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Feedback updated successfully.",
    });
  } catch (err: unknown) {
    console.error("[Admin Feedback PATCH Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update feedback." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/feedback
 * Admin endpoint: Deletes a feedback item permanently.
 */
export async function DELETE(req: NextRequest) {
  const token = extractToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || (typeof body?.id === "string" ? body.id : null);

    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { success: false, error: "Feedback id is required." },
        { status: 400 }
      );
    }

    const deleted = await deleteFeedbackItem(id.trim());

    try {
      revalidatePath("/", "page");
      revalidatePath("/", "layout");
    } catch {
      // pass
    }

    broadcastRealtime({
      type: "feedback_updated",
      section: "feedback",
    });

    return NextResponse.json({
      success: true,
      deleted,
      message: "Feedback deleted successfully.",
    });
  } catch (err: unknown) {
    console.error("[Admin Feedback DELETE Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete feedback." },
      { status: 500 }
    );
  }
}

