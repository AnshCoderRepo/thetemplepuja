import type { Metadata } from "next";
import { Footer } from "@/components/layout";
import { SITE_URL } from "@/lib/seo";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
  title: "Our Gallery | TemplePujaSewa",
  description:
    "Explore the beautiful moments of our puja ceremonies, traditions, and devotion. View photos and videos of Vedic rituals performed by certified pandits.",
  alternates: {
    canonical: `${SITE_URL}/our-gallery`,
  },
  openGraph: {
    title: "Our Gallery | TemplePujaSewa",
    description:
      "Explore the beautiful moments of our puja ceremonies, traditions, and devotion. View photos and videos of authentic Hindu rituals.",
    url: `${SITE_URL}/our-gallery`,
    type: "website",
    siteName: "TemplePujaSewa",
    images: [{ url: "/logo.jpeg", alt: "TemplePujaSewa - Our Gallery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Gallery | TemplePujaSewa",
    description:
      "Explore the beautiful moments of our puja ceremonies, traditions, and devotion.",
    images: ["/logo.jpeg"],
  },
};

export default function OurGalleryPage() {
  return (
    <>
      <main>
        <GalleryClient />
      </main>
      <Footer />
    </>
  );
}
