import type { Metadata } from "next";
import { JsonLd } from "@/components/common";
import { getCatalogPoojas } from "@/lib/catalog";
import { isPoojaActive, type Pooja } from "@/lib/data";
import { serviceLd } from "@/lib/seo";
import ServiceClient from "./ServiceClient";

interface Params {
  params: Promise<{ service: string }>;
}

/** The pooja this slug maps to, per the static catalog (the same source the
 * client falls back to), or null when it doesn't exist / is deactivated. */
function resolvePooja(service: string): Pooja | null {
  const pooja = getCatalogPoojas().find((p) => p.slug === service);
  return pooja && isPoojaActive(pooja) ? pooja : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { service } = await params;
  const pooja = resolvePooja(service);
  const url = `/book/${service}`;

  if (!pooja) {
    return {
      title: "Pooja Not Found | The Temple Puja",
      description: "The requested pooja could not be found or is inactive.",
      robots: { index: false, follow: false },
    };
  }

  const title = `Book ${pooja.title} Online | The Temple Puja`;
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
  const pooja = resolvePooja(service);

  return (
    <>
      {pooja && <JsonLd data={serviceLd(pooja)} />}
      <ServiceClient service={service} />
    </>
  );
}
