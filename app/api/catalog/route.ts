import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withEventBookedSeats } from "@/lib/data";
import {
  clearCatalogOverrides,
  getAllUsers,
  getResolvedCatalog,
  isValidSessionToken,
  saveCatalogOverrides,
  type CatalogOverrideSection,
} from "@/lib/server-store";
import { broadcastRealtime } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SECTIONS: CatalogOverrideSection[] = [
  "poojas",
  "events",
  "festivals",
  "coupons",
  "poojaDates",
  "temples",
  "blogs",
  "chatbotKnowledge",
  "chatbotSettings",
  "platformSettings",
  "testimonials",
  "faqs",
  "siteContent",
];

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  return header.replace(/^Bearer\s+/i, "").trim() || null;
}

export async function GET() {
  const catalog = await getResolvedCatalog();
  // Attach confirmed-seat counts per event so the home page and admin show
  // live, cross-device availability (remaining = capacity − confirmed seats,
  // so cancellations free a seat automatically on the next fetch).
  const users = await getAllUsers();
  const bookings = users.flatMap((u) => u.bookings);
  return NextResponse.json(
    {
      ...catalog,
      events: withEventBookedSeats(catalog.events, bookings),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const token = bearerToken(req);
  if (!(await isValidSessionToken(token))) {
    return NextResponse.json(
      { error: "Unauthorized — please sign in again." },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  // Reset sections (e.g. { reset: ["poojas"] })
  if (Array.isArray(body.reset)) {
    const sections = body.reset.filter(
      (s): s is CatalogOverrideSection =>
        SECTIONS.includes(s as CatalogOverrideSection)
    );
    await clearCatalogOverrides(sections);
  }

  // Save sections (e.g. { poojas: [...], blogs: [...] })
  const overrides: Record<string, unknown> = {};
  for (const s of SECTIONS) {
    if (body[s] !== undefined) overrides[s] = body[s];
  }

  // Validate and sanitize blogs if provided
  if (Array.isArray(overrides.blogs)) {
    overrides.blogs = overrides.blogs.map((b: any) => {
      const cleanSlug = String(b.slug || "")
        .toLowerCase()
        .trim()
        .replace(/[^\w-]/g, "")
        .replace(/--+/g, "-");
      const cleanTitle = String(b.title || "")
        .replace(/<[^>]*>?/gm, "")
        .trim();
      return {
        ...b,
        slug: cleanSlug,
        title: cleanTitle,
        status: b.status === "draft" || b.status === "archived" ? b.status : "published",
        updatedAt: new Date().toISOString(),
      };
    }).filter((b: any) => b.title && b.slug);
  }

  // Validate and sanitize faqs if provided
  if (Array.isArray(overrides.faqs)) {
    overrides.faqs = overrides.faqs
      .map((f: any, idx: number) => {
        const cleanQ = String(f.q || "").trim();
        const cleanA = String(f.a || "").trim();
        return {
          id: f.id || `faq-${Date.now()}-${idx}`,
          q: cleanQ,
          a: cleanA,
          hindiQ: f.hindiQ ? String(f.hindiQ).trim() : undefined,
          hindiA: f.hindiA ? String(f.hindiA).trim() : undefined,
          teluguQ: f.teluguQ ? String(f.teluguQ).trim() : undefined,
          teluguA: f.teluguA ? String(f.teluguA).trim() : undefined,
          tamilQ: f.tamilQ ? String(f.tamilQ).trim() : undefined,
          tamilA: f.tamilA ? String(f.tamilA).trim() : undefined,
          order: typeof f.order === "number" ? f.order : idx + 1,
          active: f.active !== false,
        };
      })
      .filter((f: any) => f.q && f.a);
  }

  if (Object.keys(overrides).length > 0) {
    await saveCatalogOverrides(
      overrides as Parameters<typeof saveCatalogOverrides>[0]
    );
  }

  // Revalidate Next.js cache so SSR pages and landing page update immediately
  try {
    revalidatePath("/", "layout");
    revalidatePath("/book");
    revalidatePath("/blog");
    revalidatePath("/temples");
  } catch {
    // Ignore during test/standalone execution
  }

  // Instantly notify all connected user frontend tabs and devices via SSE
  const affectedSections = [
    ...(Array.isArray(body.reset) ? body.reset : []),
    ...Object.keys(overrides),
  ].join(",");

  broadcastRealtime({
    type: "catalog_updated",
    section: affectedSections || "catalog",
  });

  return NextResponse.json({ ok: true, catalog: await getResolvedCatalog() });
}
