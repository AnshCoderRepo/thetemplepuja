import type { Metadata } from "next";
import { getResolvedCatalog } from "@/lib/server-store";
import { SITE_URL } from "@/lib/seo";
import TemplesListingClient from "./TemplesListingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sacred Temples of India | Darshan Timings, History & Sevas | templepujasewa",
  description:
    "Explore ancient consecrated Hindu temples across India. Discover divine histories, darshan timings, sacred traditions, and book authentic Vedic rituals directly at holy shrines.",
  alternates: {
    canonical: `${SITE_URL}/temples`,
  },
  openGraph: {
    title: "Sacred Temples of India | templepujasewa",
    description:
      "Explore ancient consecrated temples across India. Discover divine histories, darshan timings, sacred traditions, and book authentic rituals directly at holy shrines.",
    url: `${SITE_URL}/temples`,
    siteName: "templepujasewa",
    images: [{ url: "/logo.jpeg", alt: "Sacred Temples | templepujasewa" }],
  },
};

export default async function TemplesPage() {
  const catalog = await getResolvedCatalog();
  return <TemplesListingClient initialTemples={catalog.temples} />;
}
