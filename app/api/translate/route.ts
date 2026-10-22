import { NextResponse } from "next/server";
import { translateText, translateFields } from "@/lib/translate-service";

interface TranslateRequest {
  text?: string;
  texts?: string[];
  fields?: Record<string, string>;
  source?: string;
  target?: string;
  targets?: string[];
}

const ALL_LOCALES = ["en", "hi", "te", "ta"];

export async function POST(req: Request) {
  try {
    const body: TranslateRequest = await req.json();
    const source = body.source || "en";
    const targets =
      body.targets ||
      (body.target
        ? [body.target]
        : ALL_LOCALES.filter((loc) => loc !== source));

    // 1. If a dictionary of fields was provided
    if (body.fields && typeof body.fields === "object" && !Array.isArray(body.fields)) {
      const results = await translateFields(body.fields, source, targets);
      return NextResponse.json({ ok: true, translations: results });
    }

    // 2. If a single text was provided
    if (body.text !== undefined) {
      const results: Record<string, string> = {};
      await Promise.all(
        targets.map(async (tl) => {
          results[tl] = await translateText(body.text || "", source, tl);
        })
      );
      return NextResponse.json({ ok: true, translations: results });
    }

    // 3. If an array of texts was provided (e.g. benefits or batch items)
    if (Array.isArray(body.texts)) {
      const results: Record<string, string[]> = {};
      await Promise.all(
        targets.map(async (tl) => {
          results[tl] = await Promise.all(
            (body.texts || []).map((t) => translateText(t, source, tl))
          );
        })
      );
      return NextResponse.json({ ok: true, translations: results });
    }

    return NextResponse.json(
      { ok: false, error: "Please provide either `text`, `texts`, or `fields`" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[translate] Server error:", error);
    return NextResponse.json(
      { ok: false, error: "Translation processing failed" },
      { status: 500 }
    );
  }
}
