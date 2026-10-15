import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getResolvedCatalog } from "@/lib/server-store";
import { isTempleActive, type Temple } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";
import TempleDetailClient from "./TempleDetailClient";

interface Params {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

async function resolveTemple(slug: string): Promise<Temple | null> {
  const catalog = await getResolvedCatalog();
  const normalized = slug.toLowerCase().trim();
  const temple = catalog.temples.find((t) => t.slug.toLowerCase().trim() === normalized);
  return temple && isTempleActive(temple) ? temple : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const temple = await resolveTemple(slug);

  if (!temple) {
    return {
      title: "Temple Not Found | templepujasewa",
      description: "The requested temple could not be found or is currently not listed.",
      robots: { index: false, follow: false },
    };
  }

  const title = temple.seoTitle || `${temple.name} (${temple.city}) — History, Timings & Sacred Poojas | templepujasewa`;
  const description =
    temple.seoDescription ||
    (temple.description.length > 160
      ? `${temple.description.slice(0, 157)}...`
      : temple.description);
  const canonicalUrl = `${SITE_URL}/temples/${temple.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: temple.image ? [{ url: temple.image, alt: temple.name }] : [{ url: "/logo.jpeg", alt: temple.name }],
    },
  };
}

export default async function TemplePage({ params }: Params) {
  const { slug } = await params;
  const temple = await resolveTemple(slug);

  if (!temple) {
    notFound();
  }

  const catalog = await getResolvedCatalog();
  return (
    <TempleDetailClient
      initialTemple={temple}
      initialPoojas={catalog.poojas}
    />
  );
}
