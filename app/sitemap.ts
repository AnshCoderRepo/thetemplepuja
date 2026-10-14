import type { MetadataRoute } from "next";
import { activePoojas, poojas } from "@/lib/data";
import { BLOG_POSTS } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/seo";

// sitemap.xml — every indexable public page. Pooja detail pages and spiritual
// guides are the ranking targets, so they get high priority after the home page.
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
    {
      url: `${SITE_URL}/blog`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const poojaPages: MetadataRoute.Sitemap = activePoojas(poojas).map((p) => ({
    url: `${SITE_URL}/book/${p.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...poojaPages, ...blogPages];
}
