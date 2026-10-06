import { NextRequest, NextResponse } from "next/server";
import {
  addCustomerMediaRecord,
  deleteCustomerMediaRecord,
} from "@/lib/server-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: "add" | "delete";
      userId?: string;
      phone?: string;
      mediaId?: string;
      bookingId?: string;
      media?: {
        title: string;
        url: string;
        description?: string;
        poojaTitle?: string;
        bookingId?: string;
      };
    };

    const targetUser = (body.userId || body.phone || "").trim();
    if (!targetUser) {
      return NextResponse.json(
        { error: "Missing customer userId or phone number." },
        { status: 400 }
      );
    }

    if (body.action === "delete") {
      const mediaId = (body.mediaId || "").trim();
      if (!mediaId) {
        return NextResponse.json({ error: "Missing mediaId to delete." }, { status: 400 });
      }
      const res = await deleteCustomerMediaRecord(targetUser, mediaId);
      if (!res.ok) {
        return NextResponse.json({ error: "Failed to delete video record or user not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, user: res.user });
    }

    // Default action: add media
    if (!body.media || !body.media.title?.trim() || !body.media.url?.trim()) {
      return NextResponse.json(
        { error: "Please provide both a video title and a valid video URL." },
        { status: 400 }
      );
    }

    const payload = {
      title: body.media.title.trim(),
      url: body.media.url.trim(),
      description: body.media.description?.trim(),
      poojaTitle: body.media.poojaTitle?.trim(),
      bookingId: (body.media.bookingId || body.bookingId)?.trim(),
    };

    const res = await addCustomerMediaRecord(targetUser, payload);
    if (!res.ok || !res.user) {
      return NextResponse.json(
        { error: "Customer profile not found. Please ensure the booking or phone is valid." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, user: res.user });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
