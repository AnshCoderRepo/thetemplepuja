import { beforeAll, describe, expect, it } from "vitest";
import {
  DEFAULT_GALLERY_ITEMS,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  type GalleryItem,
} from "@/lib/gallery-types";
import { parseIsoDuration, verifyYouTubeDuration } from "@/lib/youtube";
import {
  getActiveGalleryItems,
  getAllGalleryItems,
  getHomepageGalleryItems,
  findGalleryItemById,
  saveGalleryItem,
  deleteGalleryItem,
  createSessionToken,
} from "@/lib/server-store";
import { GET as getPublicGallery } from "@/app/api/gallery/route";
import {
  GET as getAdminGallery,
  POST as postAdminGallery,
  DELETE as deleteAdminGallery,
} from "@/app/api/admin/gallery/route";
import { translations, type Locale } from "@/lib/i18n";

let validAdminToken = "";

beforeAll(async () => {
  process.env.TTP_STORE = "memory";
  validAdminToken = await createSessionToken("admin@templepujasewa.com");
});

describe("Our Gallery System Test Suite", () => {
  describe("1. YouTube URL and Thumbnail Extraction", () => {
    it("extracts video ID from standard watch URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from youtu.be short URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ?si=abcdef123";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from YouTube Shorts URL", () => {
      const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("extracts video ID from embed URL", () => {
      const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      expect(extractYouTubeVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("returns null for non-YouTube URLs or invalid strings", () => {
      expect(extractYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
      expect(extractYouTubeVideoId("invalid-url-text")).toBeNull();
      expect(extractYouTubeVideoId("")).toBeNull();
      expect(extractYouTubeVideoId(undefined)).toBeNull();
    });

    it("generates correct high-quality thumbnail URL from both videoId and URL", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      expect(getYouTubeThumbnailUrl(url)).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
      expect(getYouTubeThumbnailUrl("dQw4w9WgXcQ")).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
      expect(getYouTubeThumbnailUrl(undefined)).toBeNull();
    });
  });

  describe("2. Video Duration Parsing & Validation", () => {
    it("correctly parses ISO 8601 duration strings into seconds", () => {
      expect(parseIsoDuration("PT1M30S")).toBe(90);
      expect(parseIsoDuration("PT3M")).toBe(180);
      expect(parseIsoDuration("PT2M45S")).toBe(165);
      expect(parseIsoDuration("PT4M15S")).toBe(255);
      expect(parseIsoDuration("PT45S")).toBe(45);
      expect(parseIsoDuration("P1D")).toBe(0);
    });

    it("enforces max 180 seconds limit with parseIsoDuration", () => {
      const validDuration = parseIsoDuration("PT2M59S");
      const invalidDuration = parseIsoDuration("PT3M05S");

      expect(validDuration).toBeLessThanOrEqual(180);
      expect(invalidDuration).toBeGreaterThan(180);
    });

    it("honestly reports unverified duration when no YOUTUBE_API_KEY is configured", async () => {
      delete process.env.YOUTUBE_API_KEY;
      const result = await verifyYouTubeDuration("dQw4w9WgXcQ");
      expect(result.verified).toBe(false);
      expect(result.reason).toBe("NO_API_KEY");
      expect(result.error).toContain("YOUTUBE_API_KEY not configured");
    });
  });

  describe("3. Storage Persistence & Demo Items", () => {
    it("initializes with 6 default demo gallery items", async () => {
      const items = await getAllGalleryItems();
      expect(items.length).toBeGreaterThanOrEqual(6);
      const demoItems = items.filter((i) => i.isDemo);
      expect(demoItems.length).toBe(6);

      // Verify specific expected titles
      const titles = demoItems.map((i) => i.title);
      expect(titles).toContain("Ganesh Puja");
      expect(titles).toContain("Traditional Havan Ceremony");
      expect(titles).toContain("Kalash Sthapana");
      expect(titles).toContain("Pandit Ji Performing Rituals");
      expect(titles).toContain("Puja Samagri Preparation");
      expect(titles).toContain("Traditional Hindu Puja Ceremony");
    });

    it("returns homepage items sorted by displayOrder up to limit", async () => {
      const hpItems = await getHomepageGalleryItems(6);
      expect(hpItems.length).toBeLessThanOrEqual(6);
      expect(hpItems.every((i) => i.isActive && i.showOnHomepage)).toBe(true);

      // Verify sorting order
      for (let i = 1; i < hpItems.length; i++) {
        expect(hpItems[i].displayOrder).toBeGreaterThanOrEqual(hpItems[i - 1].displayOrder);
      }
    });

    it("supports adding, updating, deactivating, and deleting gallery items", async () => {
      const newItem: GalleryItem = {
        id: "test-item-unique-123",
        title: "Test Maha Aarti",
        description: "Special Ganga Aarti ritual demonstration",
        mediaType: "photo",
        imageUrl: "https://images.unsplash.com/photo-test",
        thumbnailUrl: "https://images.unsplash.com/photo-test",
        category: "Puja Ceremonies",
        isActive: true,
        showOnHomepage: true,
        displayOrder: 1,
        isDemo: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save
      await saveGalleryItem(newItem);
      let found = await findGalleryItemById("test-item-unique-123");
      expect(found).not.toBeNull();
      expect(found?.title).toBe("Test Maha Aarti");

      // Deactivate
      await saveGalleryItem({ ...newItem, isActive: false });
      const active = await getActiveGalleryItems();
      expect(active.some((i) => i.id === "test-item-unique-123")).toBe(false);

      // Reactivate
      await saveGalleryItem({ ...newItem, isActive: true });
      const reactivated = await getActiveGalleryItems();
      expect(reactivated.some((i) => i.id === "test-item-unique-123")).toBe(true);

      // Delete
      await deleteGalleryItem("test-item-unique-123");
      found = await findGalleryItemById("test-item-unique-123");
      expect(found).toBeUndefined();
    });
  });

  describe("4. API Route Handlers", () => {
    it("GET /api/gallery returns active items and filters by query parameters", async () => {
      const req = new Request("http://localhost/api/gallery?homepage=true");
      const res = await getPublicGallery(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.every((i: GalleryItem) => i.isActive && i.showOnHomepage)).toBe(true);
    });

    it("GET /api/admin/gallery rejects unauthorized access", async () => {
      const req = new Request("http://localhost/api/admin/gallery");
      const res = await getAdminGallery(req as any);
      expect(res.status).toBe(401);
    });

    it("POST /api/admin/gallery rejects video duration exceeding 180 seconds", async () => {
      const req = new Request("http://localhost/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validAdminToken}`,
        },
        body: JSON.stringify({
          title: "Long Video Test",
          mediaType: "video",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          videoDurationSeconds: 240, // 4 minutes > 180s limit
          category: "Puja Ceremonies",
          isActive: true,
          showOnHomepage: false,
        }),
      });

      const res = await postAdminGallery(req as any);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("3 minutes");
    });

    it("POST /api/admin/gallery allows valid video under 180 seconds", async () => {
      const req = new Request("http://localhost/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${validAdminToken}`,
        },
        body: JSON.stringify({
          id: "admin-created-video-test",
          title: "Valid Short Aarti Video",
          description: "1 minute sacred aarti",
          mediaType: "video",
          youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          videoDurationSeconds: 90,
          category: "Puja Ceremonies",
          isActive: true,
          showOnHomepage: false,
          displayOrder: 10,
        }),
      });

      const res = await postAdminGallery(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.item.youtubeVideoId).toBe("dQw4w9WgXcQ");

      // Clean up
      const delReq = new Request("http://localhost/api/admin/gallery?id=admin-created-video-test", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${validAdminToken}`,
        },
      });
      const delRes = await deleteAdminGallery(delReq as any);
      expect(delRes.status).toBe(200);
    });
  });

  describe("5. i18n Localization Integrity", () => {
    it("ensures all gallery translation keys exist across en, hi, te, ta", () => {
      const locales: Locale[] = ["en", "hi", "te", "ta"];
      const requiredKeys = [
        "gallery.heading",
        "gallery.subheading",
        "gallery.viewAll",
        "gallery.bookPuja",
        "gallery.all",
        "gallery.photos",
        "gallery.videos",
        "gallery.emptyTitle",
        "gallery.emptyDesc",
        "gallery.loadMore",
        "gallery.filterByCategory",
      ];

      for (const loc of locales) {
        const dict = translations[loc] as Record<string, string>;
        for (const key of requiredKeys) {
          expect(dict[key], `Missing ${key} in locale ${loc}`).toBeTruthy();
        }
      }
    });

    it("verifies the exact required English heading and subtitle", () => {
      expect(translations.en["gallery.heading"]).toBe("Our Gallery");
      expect(translations.en["gallery.subheading"]).toBe(
        "Explore the beautiful moments of our puja ceremonies, traditions, and devotion."
      );
    });
  });
});
