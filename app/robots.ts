import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// robots.txt — let search engines crawl everything public, but keep private
// areas (admin, accounts, booking receipts and API endpoints) out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/login", "/signup", "/profile", "/booking"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
