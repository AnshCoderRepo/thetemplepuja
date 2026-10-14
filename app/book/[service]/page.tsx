import type { Metadata } from "next";
import { JsonLd } from "@/components/common";
import { getResolvedCatalog } from "@/lib/server-store";
import { DEMO_POOJA, isDemoSlug, isPoojaActive, type Pooja } from "@/lib/data";
import { serviceLd } from "@/lib/seo";
import ServiceClient from "./ServiceClient";

interface Params {
  params: Promise<{ service: string }>;
}

export const dynamic = "force-dynamic";

/** The pooja this slug maps to, per the resolved backend catalog,
 * or null when it doesn't exist / is deactivated. */
async function resolvePooja(service: string): Promise<Pooja | null> {
  if (isDemoSlug(service)) return DEMO_POOJA;
  const catalog = await getResolvedCatalog();
  const normalized = service.toLowerCase().replace(/_/g, "-");
  const pooja = catalog.poojas.find((p) => p.slug === normalized);
  return pooja && isPoojaActive(pooja) ? pooja : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service } = await params;
  const pooja = await resolvePooja(service);
  const url = `/book/${service}`;

  if (!pooja) {
    return {
      title: "Pooja Not Found | templepujasewa",
      description: "The requested pooja could not be found or is inactive.",
      robots: { index: false, follow: false },
    };
  }

  const title = `Book ${pooja.title} Online | templepujasewa`;

  const description =
    pooja.description.length > 160
      ? `${pooja.description.slice(0, 157)}...`
      : pooja.description;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: Params) {
  const { service } = await params;
  const pooja = await resolvePooja(service);

  return (
    <>
      {pooja && <JsonLd data={serviceLd(pooja)} />}
      <ServiceClient service={service} />
    </>
  );
}
