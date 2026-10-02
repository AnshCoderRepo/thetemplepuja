import { NextResponse } from "next/server";

interface TranslateRequest {
  text?: string;
  texts?: string[];
  source?: string;
  target?: string;
  targets?: string[];
}

async function translateText(text: string, sl: string, tl: string): Promise<string> {
  if (!text || !text.trim()) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      throw new Error(`Translation upstream returned ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].map((item: unknown[]) => item[0]).join("");
    }
    return text;
  } catch (err) {
    console.error(`[translate] Failed to translate to ${tl}:`, err);
    return text;
  }
}

export async function POST(req: Request) {
  try {
    const body: TranslateRequest = await req.json();
    const source = body.source || "en";
    const targets = body.targets || (body.target ? [body.target] : ["hi", "te", "ta"]);

    // If a single text was provided
    if (body.text !== undefined) {
      const results: Record<string, string> = {};
      await Promise.all(
        targets.map(async (tl) => {
          results[tl] = await translateText(body.text || "", source, tl);
        })
      );
      return NextResponse.json({ ok: true, translations: results });
    }

    // If an array of texts was provided (e.g. benefits or batch items)
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
      { ok: false, error: "Please provide either `text` or `texts`" },
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
