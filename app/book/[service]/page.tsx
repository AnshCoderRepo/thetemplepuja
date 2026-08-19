import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
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
      title: "Book Pooja Online | The Temple Puja",
      description:
        "Choose from 50+ poojas — Satyanarayan Katha, Rudrabhishek, Griha Pravesh, Shani Dev Pooja, Navgraha Shanti and more. Book certified pandits online with secure Razorpay payment.",
      alternates: { canonical: "/book" },
      robots: { index: false },
    };
  }

  const description = `${pooja.description} Book ${pooja.title} online with The Temple Puja — certified pandits, authentic Vedic rituals, sankalp on your behalf, and an HD video recording of every pooja from ₹${pooja.price.toLocaleString("en-IN")}.`;

  return {
    title: `Book ${pooja.title} Online | The Temple Puja`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `Book ${pooja.title} Online | The Temple Puja`,
      description,
      type: "website",
      url,
      siteName: "The Temple Puja",
      images: [{ url: "/logo.jpeg", alt: "The Temple Puja" }],
    },
  };
}

export default async function BookServicePage({ params }: Params) {
  const { service } = await params;
  const pooja = resolvePooja(service);

  return (
    <>
      {pooja && <JsonLd data={serviceLd(pooja)} />}
      <ServiceClient service={service} />
    </>
  );
}
