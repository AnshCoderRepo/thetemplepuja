import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getChatbotKnowledge,
  getChatbotSettings,
  getPlatformSettings,
  isValidSessionToken,
  saveChatbotKnowledge,
  saveChatbotSettings,
  savePlatformSettings,
} from "@/lib/server-store";
import { broadcastRealtime } from "@/lib/realtime";
import type {
  ChatbotKnowledgeEntry,
  ChatbotSettings,
  PlatformSettings,
} from "@/lib/chatbot-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim() || null;
}

// GET: Retrieve chatbot knowledge, persona settings, and platform config
export async function GET(req: NextRequest) {
  const [knowledge, settings, platformSettings] = await Promise.all([
    getChatbotKnowledge(),
    getChatbotSettings(),
    getPlatformSettings(),
  ]);

  return NextResponse.json({
    knowledge,
    settings,
    platformSettings,
  });
}

// POST: Save or append chatbot knowledge entries
export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  if (!body || (!Array.isArray(body.knowledge) && !body.entry)) {
    return NextResponse.json(
      { error: "Invalid payload: provide 'knowledge' array or single 'entry'." },
      { status: 400 }
    );
  }

  let current = await getChatbotKnowledge();

  if (body.entry) {
    const entry = body.entry as ChatbotKnowledgeEntry;
    if (!entry.id || !entry.title || !entry.answer) {
      return NextResponse.json(
        { error: "Knowledge entry must have id, title, and answer." },
        { status: 400 }
      );
    }
    const idx = current.findIndex((k) => k.id === entry.id);
    if (idx >= 0) {
      current[idx] = { ...entry, updatedAt: new Date().toISOString() };
    } else {
      current.push({ ...entry, updatedAt: new Date().toISOString() });
    }
  } else if (Array.isArray(body.knowledge)) {
    current = body.knowledge as ChatbotKnowledgeEntry[];
  }

  await saveChatbotKnowledge(current);

  try {
    revalidatePath("/", "layout");
  } catch {}

  broadcastRealtime({
    type: "catalog_updated",
    section: "chatbotKnowledge",
  });

  return NextResponse.json({ ok: true, knowledge: current });
}

// PUT: Update persona system instructions and chatbot welcome/fallback text
export async function PUT(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    settings?: Partial<ChatbotSettings>;
  };

  if (!body.settings || typeof body.settings !== "object") {
    return NextResponse.json(
      { error: "Invalid payload: 'settings' object required." },
      { status: 400 }
    );
  }

  const current = await getChatbotSettings();
  const next: ChatbotSettings = {
    ...current,
    ...body.settings,
  };

  await saveChatbotSettings(next);

  broadcastRealtime({
    type: "catalog_updated",
    section: "chatbotSettings",
  });

  return NextResponse.json({ ok: true, settings: next });
}

// PATCH: Update platform settings (e.g. official WhatsApp Channel URL)
export async function PATCH(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    platformSettings?: PlatformSettings;
  };

  if (!body.platformSettings) {
    return NextResponse.json(
      { error: "Invalid payload: 'platformSettings' required." },
      { status: 400 }
    );
  }

  // Validate URL format if provided
  if (body.platformSettings.whatsappChannelUrl) {
    const raw = body.platformSettings.whatsappChannelUrl.trim();
    if (!raw.startsWith("https://") && !raw.startsWith("http://")) {
      return NextResponse.json(
        { error: "Invalid URL. Must begin with https:// (e.g. https://whatsapp.com/channel/...)" },
        { status: 400 }
      );
    }
  }

  await savePlatformSettings(body.platformSettings);

  try {
    revalidatePath("/", "layout");
  } catch {}

  broadcastRealtime({
    type: "catalog_updated",
    section: "platformSettings",
  });

  return NextResponse.json({
    ok: true,
    platformSettings: await getPlatformSettings(),
  });
}

// DELETE: Delete a single knowledge entry
export async function DELETE(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing 'id' parameter." }, { status: 400 });
  }

  const current = await getChatbotKnowledge();
  const filtered = current.filter((k) => k.id !== id);
  if (filtered.length === current.length) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  await saveChatbotKnowledge(filtered);

  broadcastRealtime({
    type: "catalog_updated",
    section: "chatbotKnowledge",
  });

  return NextResponse.json({ ok: true, knowledge: filtered });
}
