import type { MetadataRoute } from "next";
import { activePoojas, poojas } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

// sitemap.xml — every indexable public page. Pooja detail pages are the
// ranking targets, so they get the highest priority after the home page.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/book`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/book/form`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const poojaPages: MetadataRoute.Sitemap = activePoojas(poojas).map((p) => ({
    url: `${SITE_URL}/book/${p.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticPages, ...poojaPages];
}
