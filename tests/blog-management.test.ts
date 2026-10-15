import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  clearCatalogOverrides,
  getResolvedCatalog,
  saveCatalogOverrides,
} from "@/lib/server-store";
import {
  BLOG_POSTS,
  activeBlogPosts,
  getBlogPost,
  isPostPublished,
  type BlogPost,
} from "@/lib/blog-data";

beforeAll(() => {
  process.env.TTP_STORE = "memory";
});

describe("Blog Management & Persistence System", () => {
  beforeEach(async () => {
    await clearCatalogOverrides(["blogs"]);
  });

  const testDraftPost: BlogPost = {
    slug: "rudrabhishek-secret-mantras-guide",
    title: "Sacred Rudrabhishek Mantras & Divine Phala",
    excerpt: "Ancient Vedic methods to perform holy Shiva Rudrabhishek with bilva patra.",
    category: "Vedic Astrology & Healing",
    author: "Pandit Radheshyam Joshi",
    authorRole: "Senior Sanskrit Ritualist",
    publishedAt: "2026-10-15",
    readTime: "4 min read",
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    tags: ["Rudrabhishek", "Lord Shiva"],
    status: "draft",
    content: {
      introduction: "Rudrabhishek is the highest form of ritualistic adoration to Mahadev.",
      sections: [
        {
          heading: "1. The Power of Laghu Rudra",
          body: "Chanting Sri Rudram purifies planetary karma.",
          keyPoints: ["Purifies Markesh doshas", "Brings peace"],
        },
      ],
      conclusion: "Perform Rudrabhishek for family wellness.",
    },
  };

  const testPublishedPost: BlogPost = {
    ...testDraftPost,
    slug: "navratri-chandi-path-benefits",
    title: "Navratri Chandi Path: Divine Grace of Maa Durga",
    status: "published",
  };

  it("resolves to static default blogs when no override exists", async () => {
    const catalog = await getResolvedCatalog();
    expect(catalog.blogs.length).toBe(BLOG_POSTS.length);
    expect(catalog.blogs.map((b) => b.slug)).toEqual(BLOG_POSTS.map((b) => b.slug));
  });

  it("persists custom blog articles and updates the resolved catalog", async () => {
    const customList = [testDraftPost, testPublishedPost, ...BLOG_POSTS];
    await saveCatalogOverrides({ blogs: customList });

    const catalog = await getResolvedCatalog();
    expect(catalog.blogs.length).toBe(BLOG_POSTS.length + 2);

    const foundDraft = catalog.blogs.find((b) => b.slug === "rudrabhishek-secret-mantras-guide");
    expect(foundDraft).toBeDefined();
    expect(foundDraft?.status).toBe("draft");

    const foundPub = catalog.blogs.find((b) => b.slug === "navratri-chandi-path-benefits");
    expect(foundPub).toBeDefined();
    expect(foundPub?.status).toBe("published");
  });

  it("never includes unpublished drafts in activeBlogPosts", async () => {
    const customList = [testDraftPost, testPublishedPost, ...BLOG_POSTS];
    await saveCatalogOverrides({ blogs: customList });

    const catalog = await getResolvedCatalog();
    const publicList = activeBlogPosts(catalog.blogs);

    // The draft must NOT appear in public listing
    expect(publicList.some((b) => b.slug === "rudrabhishek-secret-mantras-guide")).toBe(false);
    // The published article MUST appear
    expect(publicList.some((b) => b.slug === "navratri-chandi-path-benefits")).toBe(true);
  });

  it("retrieves blog post by slug from dynamic catalog", async () => {
    const customList = [testPublishedPost, ...BLOG_POSTS];
    const match = getBlogPost("navratri-chandi-path-benefits", customList);
    expect(match).toBeDefined();
    expect(match?.title).toContain("Navratri Chandi Path");
  });

  it("clears overrides and restores static blogs", async () => {
    await saveCatalogOverrides({ blogs: [testPublishedPost] });
    let catalog = await getResolvedCatalog();
    expect(catalog.blogs.length).toBe(1);

    await clearCatalogOverrides(["blogs"]);
    catalog = await getResolvedCatalog();
    expect(catalog.blogs.length).toBe(BLOG_POSTS.length);
  });
});
