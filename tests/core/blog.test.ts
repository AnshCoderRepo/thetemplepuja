import { describe, expect, it } from "vitest";
import {
  BLOG_POSTS,
  getBlogPost,
  getAllBlogSlugs,
  isPostPublished,
  activeBlogPosts,
} from "@/lib/blog-data";
import { poojas } from "@/lib/data";

describe("Spiritual Blog System", () => {
  it("provides valid editorial articles with required SEO and content fields", () => {
    expect(BLOG_POSTS.length).toBeGreaterThan(0);

    for (const post of BLOG_POSTS) {
      expect(post.slug).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.excerpt).toBeTruthy();
      expect(post.category).toBeTruthy();
      expect(post.author).toBeTruthy();
      expect(post.readTime).toMatch(/min read/);
      expect(post.imageUrl).toBeTruthy();
      expect(post.content.introduction).toBeTruthy();
      expect(post.content.sections.length).toBeGreaterThan(0);
      expect(post.content.conclusion).toBeTruthy();
    }
  });

  it("links every blog post to an existing pooja slug in catalog", () => {
    const catalogSlugs = new Set(poojas.map((p) => p.slug));

    for (const post of BLOG_POSTS) {
      if (post.relatedPoojaSlug) {
        expect(catalogSlugs.has(post.relatedPoojaSlug)).toBe(true);
      }
    }
  });

  it("retrieves a post by its slug", () => {
    const post = getBlogPost("mahamrityunjaya-jaap-benefits-significance");
    expect(post).toBeDefined();
    expect(post?.title).toContain("Mahamrityunjaya");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getBlogPost("non-existent-article-slug")).toBeUndefined();
  });

  it("lists all article slugs for static generation and sitemap", () => {
    const slugs = getAllBlogSlugs();
    expect(slugs.length).toBe(BLOG_POSTS.length);
    expect(slugs).toContain("satyanarayan-katha-benefits-muhurat-guide");
  });

  it("correctly identifies published vs draft articles", () => {
    const publishedPost = { ...BLOG_POSTS[0], status: "published" as const };
    const draftPost = { ...BLOG_POSTS[0], status: "draft" as const };
    const archivedPost = { ...BLOG_POSTS[0], status: "archived" as const };
    const legacyPost = { ...BLOG_POSTS[0], status: undefined };

    expect(isPostPublished(publishedPost)).toBe(true);
    expect(isPostPublished(draftPost)).toBe(false);
    expect(isPostPublished(archivedPost)).toBe(false);
    expect(isPostPublished(legacyPost)).toBe(true);

    const filtered = activeBlogPosts([publishedPost, draftPost, archivedPost, legacyPost]);
    expect(filtered.length).toBe(2);
    expect(filtered.map((p: any) => p.status)).toEqual(["published", undefined]);
  });
});
