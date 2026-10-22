import type { Pooja } from "./data";

export type GalleryMediaType = "photo" | "video" | "mixed";

export interface GalleryItem {
  id: string;
  _id?: string;
  title: string;
  description: string;
  mediaType: GalleryMediaType;
  /** Photos per card (unrestricted number of photos) */
  images?: string[];
  imageUrl?: string; // Photo 1 (legacy & backward-compatible)
  imageUrl2?: string; // Photo 2
  imageUrl3?: string; // Photo 3
  thumbnailUrl?: string;

  /** Videos per card (unrestricted number of videos) */
  videoUrl?: string; // First video (legacy & backward-compatible)
  youtubeUrl?: string; // First YouTube video (legacy & backward-compatible)
  youtubeVideoId?: string;
  videos?: string[]; // All videos (YouTube URLs or direct video URLs)
  videoUrls?: string[]; // Alias for videos
  videoDurationSeconds?: number;
  durationVerified?: boolean;

  /** Associated Puja for direct booking navigation */
  pujaSlug?: string;
  pujaId?: string;
  poojaSlug?: string;
  poojaId?: string;
  bookingUrl?: string;

  category: string;
  isActive: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GALLERY_CATEGORIES = [
  "Puja Ceremonies",
  "Havan & Yagya",
  "Temple Rituals",
  "Kalash Sthapana",
  "Puja Samagri",
  "Festivals & Celebrations",
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

/**
 * Validates and sanitizes a gallery media URL.
 * Automatically heals known deleted/broken image IDs to authentic verified temple photos.
 */
export function sanitizeGalleryMediaUrl(
  url?: string | null,
  context?: { title?: string; slug?: string; youtubeId?: string }
): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const titleLower = (context?.title || "").toLowerCase();
  const slugLower = (context?.slug || "").toLowerCase();
  const isShiva =
    titleLower.includes("someshwar") ||
    titleLower.includes("shiva") ||
    titleLower.includes("mahadev") ||
    slugLower.includes("someshwar") ||
    slugLower.includes("shiva");
  const isGanesh = titleLower.includes("ganesh") || slugLower.includes("ganesh");

  // Check known dead Unsplash photo IDs (removed by Unsplash)
  if (trimmed.includes("photo-1617694820985-7975d27572d8")) {
    if (context?.youtubeId) return getYouTubeThumbnailUrl(context.youtubeId) || "/festivals/shivratri.jpg";
    return "/festivals/shivratri.jpg";
  }

  if (trimmed.includes("photo-1567591414240-e1c459f0c29f")) {
    return "/festivals/ganesha-altar.jpg";
  }

  if (trimmed.includes("photo-1629814249584-b427b00366eb")) {
    return "/festivals/diwali.jpg";
  }

  return trimmed;
}

/**
 * Sanitizes and normalizes all photos, video thumbnails, and media types for a gallery item.
 * Preserves user-uploaded data URLs and valid remote storage URLs intact.
 */
export function sanitizeGalleryItem(item: GalleryItem): GalleryItem {
  const context = {
    title: item.title,
    slug: item.pujaSlug || item.poojaSlug,
    youtubeId: item.youtubeVideoId || extractYouTubeVideoId(item.youtubeUrl) || undefined,
  };

  const isSomeshwar =
    (item.id === "gal-kalash-sthapana" || (item._id && String(item._id) === "gal-kalash-sthapana")) ||
    (item.title && item.title.toLowerCase().includes("someshwar")) ||
    (item.pujaSlug && item.pujaSlug.toLowerCase().includes("someshwar"));

  let images: string[] = [];
  if (Array.isArray(item.images)) {
    for (const img of item.images) {
      const sanitized = sanitizeGalleryMediaUrl(img, context);
      if (sanitized && !images.includes(sanitized)) images.push(sanitized);
    }
  }

  const legacy1 = sanitizeGalleryMediaUrl(item.imageUrl, context);
  if (legacy1 && !images.includes(legacy1)) images.push(legacy1);
  const legacy2 = sanitizeGalleryMediaUrl(item.imageUrl2, context);
  if (legacy2 && !images.includes(legacy2)) images.push(legacy2);
  const legacy3 = sanitizeGalleryMediaUrl(item.imageUrl3, context);
  if (legacy3 && !images.includes(legacy3)) images.push(legacy3);

  // If Someshwar Mahadev Abhisek has no images or had dead images, supply authentic Someshwar photos
  if (isSomeshwar && images.length === 0) {
    images = [
      "/festivals/shivratri.jpg",
      "https://img.youtube.com/vi/P6asWvUY4zY/hqdefault.jpg",
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    ];
  }

  let thumbnailUrl = sanitizeGalleryMediaUrl(item.thumbnailUrl, context);
  if (!thumbnailUrl || thumbnailUrl.includes("photo-1617694820985-7975d27572d8")) {
    if (context.youtubeId) {
      thumbnailUrl = getYouTubeThumbnailUrl(context.youtubeId) || undefined;
    } else if (images.length > 0) {
      thumbnailUrl = images[0];
    }
  }

  const hasVideos =
    (Array.isArray(item.videos) && item.videos.length > 0) ||
    Boolean(item.youtubeUrl || item.youtubeVideoId || item.videoUrl);
  const mediaType: GalleryMediaType = hasVideos ? (images.length > 0 ? "mixed" : "video") : "photo";

  return {
    ...item,
    images: images.length > 0 ? images : undefined,
    imageUrl: images[0] || item.imageUrl || undefined,
    imageUrl2: images[1] || item.imageUrl2 || undefined,
    imageUrl3: images[2] || item.imageUrl3 || undefined,
    thumbnailUrl: thumbnailUrl || images[0] || undefined,
    mediaType,
  };
}

/**
 * Normalizes and extracts all valid image URLs from a gallery item.
 * Preserves backward compatibility with legacy `imageUrl`, `thumbnailUrl`,
 * and new `images` array / `imageUrl2`, `imageUrl3`.
 * No limit on the number of photos returned.
 */
export function getGalleryItemImages(item?: Partial<GalleryItem> | null): string[] {
  if (!item) return [];
  const list: string[] = [];

  const context = {
    title: item.title,
    slug: item.pujaSlug || item.poojaSlug,
    youtubeId: item.youtubeVideoId || extractYouTubeVideoId(item.youtubeUrl) || undefined,
  };

  const add = (val?: string | null) => {
    if (!val || typeof val !== "string") return;
    const sanitized = sanitizeGalleryMediaUrl(val, context);
    if (sanitized && !list.includes(sanitized)) {
      list.push(sanitized);
    }
  };

  // 1. If images array is provided, read in order
  if (Array.isArray(item.images)) {
    for (const img of item.images) {
      add(img);
    }
  }

  // 2. Also check individual photo slots if not already collected
  add(item.imageUrl);
  add(item.imageUrl2);
  add(item.imageUrl3);

  // 3. Fallback to thumbnailUrl if no photos are present
  if (list.length === 0 && item.thumbnailUrl) {
    add(item.thumbnailUrl);
  }

  // 4. Special fallback for Someshwar Mahadev Abhisek if photos are still empty
  const isSomeshwar =
    (item.id === "gal-kalash-sthapana" || (item._id && String(item._id) === "gal-kalash-sthapana")) ||
    (item.title && item.title.toLowerCase().includes("someshwar")) ||
    (item.pujaSlug && item.pujaSlug.toLowerCase().includes("someshwar"));
  if (isSomeshwar && list.length === 0) {
    list.push("/festivals/shivratri.jpg");
    if (context.youtubeId) {
      const ytThumb = getYouTubeThumbnailUrl(context.youtubeId);
      if (ytThumb) list.push(ytThumb);
    }
    list.push("https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80");
  }

  return list;
}

export interface GalleryVideo {
  url: string;
  youtubeId?: string;
  isYouTube: boolean;
}

/**
 * Normalizes and extracts all valid videos from a gallery item.
 * Returns array of objects with url, youtubeId (if applicable), and isYouTube flag.
 */
export function getGalleryItemVideos(item?: Partial<GalleryItem> | null): GalleryVideo[] {
  if (!item) return [];
  const rawUrls: string[] = [];

  const add = (val?: string | null) => {
    if (!val || typeof val !== "string") return;
    const clean = val.trim();
    if (clean && !rawUrls.includes(clean)) {
      rawUrls.push(clean);
    }
  };

  if (Array.isArray(item.videos)) {
    for (const v of item.videos) add(v);
  }
  if (Array.isArray(item.videoUrls)) {
    for (const v of item.videoUrls) add(v);
  }
  add(item.youtubeUrl);
  add(item.videoUrl);

  return rawUrls.map((url) => {
    const ytId = extractYouTubeVideoId(url);
    const isYt = Boolean(ytId || (url === item.youtubeUrl && item.youtubeVideoId));
    return {
      url,
      youtubeId: ytId || (url === item.youtubeUrl && item.youtubeVideoId ? item.youtubeVideoId : undefined),
      isYouTube: isYt,
    };
  });
}

/**
 * Checks whether the gallery item has any valid playable YouTube video attached.
 */
export function hasYouTubeVideo(item?: Partial<GalleryItem> | null): boolean {
  if (!item) return false;
  if ((item.youtubeVideoId && item.youtubeVideoId.trim()) || (item.youtubeUrl && extractYouTubeVideoId(item.youtubeUrl))) {
    return true;
  }
  return getGalleryItemVideos(item).some((v) => v.isYouTube);
}

/**
 * Checks whether the gallery item has any video attached (YouTube or direct URL).
 */
export function hasAnyVideo(item?: Partial<GalleryItem> | null): boolean {
  if (!item) return false;
  return Boolean(
    (item.videoUrl && item.videoUrl.trim()) ||
    (item.youtubeUrl && item.youtubeUrl.trim()) ||
    (item.youtubeVideoId && item.youtubeVideoId.trim()) ||
    getGalleryItemVideos(item).length > 0
  );
}

/**
 * Validates whether a given string is a standard 11-character YouTube video ID.
 */
export function isValidYouTubeVideoId(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
}

/**
 * Parses any standard YouTube URL (desktop, mobile, youtu.be, shorts, embed, raw ID)
 * and safely extracts the 11-character video ID.
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();

  // Handle direct 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) return shortsMatch[1];

  // Handle youtube.com/embed/VIDEO_ID or youtube-nocookie.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/^https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch) return embedMatch[1];

  // Handle standard youtube.com/watch?v=VIDEO_ID (including m.youtube.com, music.youtube.com)
  const standardMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (standardMatch) return standardMatch[1];

  // Handle live streams youtube.com/live/VIDEO_ID
  const liveMatch = trimmed.match(/^https?:\/\/(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch) return liveMatch[1];

  // Handle legacy /v/VIDEO_ID
  const vMatch = trimmed.match(/^https?:\/\/(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i);
  if (vMatch) return vMatch[1];

  return null;
}

/**
 * Builds a standardized, secure YouTube embed URL with optimal parameters.
 */
export function buildYouTubeEmbedUrl(
  videoIdOrUrl: string | null | undefined,
  options?: { autoplay?: boolean; rel?: number; modestbranding?: number; privacyEnhanced?: boolean }
): string | null {
  const id = extractYouTubeVideoId(videoIdOrUrl);
  if (!id || !isValidYouTubeVideoId(id)) return null;
  const domain = options?.privacyEnhanced ? "www.youtube-nocookie.com" : "www.youtube.com";
  const autoplay = (options?.autoplay ?? true) ? 1 : 0;
  const rel = options?.rel ?? 0;
  const modestbranding = options?.modestbranding ?? 1;
  return `https://${domain}/embed/${id}?autoplay=${autoplay}&rel=${rel}&modestbranding=${modestbranding}&enablejsapi=1`;
}

/**
 * Builds a direct canonical YouTube watch URL (e.g. for opening when embedding is disabled).
 */
export function buildYouTubeWatchUrl(videoIdOrUrl: string | null | undefined): string | null {
  const id = extractYouTubeVideoId(videoIdOrUrl);
  if (!id || !isValidYouTubeVideoId(id)) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Returns a high-quality YouTube thumbnail URL from a video ID or YouTube URL.
 */
export function getYouTubeThumbnailUrl(videoIdOrUrl: string | null | undefined): string | null {
  if (!videoIdOrUrl) return null;
  const id = extractYouTubeVideoId(videoIdOrUrl);
  if (!id || !isValidYouTubeVideoId(id)) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export interface GalleryBookingDestination {
  hasPuja: boolean;
  url: string | null;
  pujaTitle?: string;
  pujaSlug?: string;
}

/**
 * Dynamically resolves the booking destination for a gallery item based on its explicit
 * puja association (`pujaSlug`, `pujaId`, `poojaSlug`, `poojaId`, `bookingUrl`),
 * or dynamic match against the puja catalog.
 *
 * If no associated puja exists or if explicitly unlinked, returns hasPuja: false and url: null.
 */
export function getGalleryItemBookingDestination(
  item?: Partial<GalleryItem> | null,
  allPoojas?: Pooja[]
): GalleryBookingDestination {
  if (!item) {
    return { hasPuja: false, url: null };
  }

  // 1. Explicit custom booking URL override
  if (item.bookingUrl && typeof item.bookingUrl === "string" && item.bookingUrl.trim()) {
    const raw = item.bookingUrl.trim();
    if (raw.toLowerCase() === "none" || raw.toLowerCase() === "disabled" || raw.toLowerCase() === "unlinked") {
      return { hasPuja: false, url: null };
    }
    return { hasPuja: true, url: raw };
  }

  // 2. Explicit puja slug (preferred field)
  const rawSlug = (item.pujaSlug || item.poojaSlug)?.trim();
  if (rawSlug) {
    const lower = rawSlug.toLowerCase();
    if (lower === "none" || lower === "disabled" || lower === "unlinked") {
      return { hasPuja: false, url: null };
    }

    // Try finding matching pooja in catalog
    const matched = allPoojas?.find(
      (p) =>
        p.slug.toLowerCase() === lower ||
        (lower === "someshwar-mahadev-abhisek" && p.slug === "someshwar-mahadev-abhishek") ||
        (lower === "someshwar-mahadev-abhishek" && p.slug === "someshwar-mahadev-abhisek") ||
        (lower === "someshwar-rudrabhishek" && p.slug === "someshwar-mahadev-abhisek")
    );

    if (matched) {
      const targetUrl = matched.ctaLink?.trim() || `/book/${matched.slug}`;
      return {
        hasPuja: true,
        url: targetUrl,
        pujaTitle: matched.title,
        pujaSlug: matched.slug,
      };
    }

    // Explicit valid slug provided
    return {
      hasPuja: true,
      url: `/book/${rawSlug}`,
      pujaSlug: rawSlug,
      pujaTitle: rawSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    };
  }

  // 3. Explicit puja ID
  const rawId = (item.pujaId || item.poojaId)?.trim();
  if (rawId) {
    const lowerId = rawId.toLowerCase();
    if (lowerId === "none" || lowerId === "disabled" || lowerId === "unlinked") {
      return { hasPuja: false, url: null };
    }
    const matchedById = allPoojas?.find(
      (p) => (p.id && String(p.id).toLowerCase() === lowerId) || p.slug.toLowerCase() === lowerId
    );
    if (matchedById) {
      const targetUrl = matchedById.ctaLink?.trim() || `/book/${matchedById.slug}`;
      return {
        hasPuja: true,
        url: targetUrl,
        pujaTitle: matchedById.title,
        pujaSlug: matchedById.slug,
      };
    }
  }

  // 4. Dynamic Title / Context Fallback Matching
  const title = (item.title || "").toLowerCase();
  const desc = (item.description || "").toLowerCase();

  // Someshwar Mahadev Abhisek
  if (title.includes("someshwar") || desc.includes("someshwar")) {
    return {
      hasPuja: true,
      url: "/book/someshwar-mahadev-abhisek",
      pujaTitle: "Someshwar Mahadev Abhisek",
      pujaSlug: "someshwar-mahadev-abhisek",
    };
  }

  // Navratri Pujan
  if (title.includes("navratri") || title.includes("durga")) {
    const durga = allPoojas?.find((p) => p.slug === "durga-saptashati-path");
    return {
      hasPuja: true,
      url: durga?.ctaLink || "/book/durga-saptashati-path",
      pujaTitle: durga?.title || "Durga Saptashati Path",
      pujaSlug: "durga-saptashati-path",
    };
  }

  // Mahadev Pujan / Rudrabhishek
  if (title.includes("mahadev pujan") || title.includes("rudrabhishek") || title.includes("rudra")) {
    const rudra = allPoojas?.find((p) => p.slug === "rudrabhishek");
    return {
      hasPuja: true,
      url: rudra?.ctaLink || "/book/rudrabhishek",
      pujaTitle: rudra?.title || "Rudrabhishek",
      pujaSlug: "rudrabhishek",
    };
  }

  // Satyanarayan
  if (title.includes("satyanarayan")) {
    const satya = allPoojas?.find((p) => p.slug === "satyanarayan-katha");
    return {
      hasPuja: true,
      url: satya?.ctaLink || "/book/satyanarayan-katha",
      pujaTitle: satya?.title || "Satyanarayan Katha",
      pujaSlug: "satyanarayan-katha",
    };
  }

  // Shani
  if (title.includes("shani")) {
    const shani = allPoojas?.find((p) => p.slug === "shani-dev-pooja");
    return {
      hasPuja: true,
      url: shani?.ctaLink || "/book/shani-dev-pooja",
      pujaTitle: shani?.title || "Shani Dev Pooja",
      pujaSlug: "shani-dev-pooja",
    };
  }

  // Lakshmi
  if (title.includes("lakshmi")) {
    const lakshmi = allPoojas?.find((p) => p.slug === "lakshmi-pooja");
    return {
      hasPuja: true,
      url: lakshmi?.ctaLink || "/book/lakshmi-pooja",
      pujaTitle: lakshmi?.title || "Lakshmi Pooja",
      pujaSlug: "lakshmi-pooja",
    };
  }

  // Kuber
  if (title.includes("kuber")) {
    const kuber = allPoojas?.find((p) => p.slug === "kuber-pooja");
    return {
      hasPuja: true,
      url: kuber?.ctaLink || "/book/kuber-pooja",
      pujaTitle: kuber?.title || "Kuber Pooja",
      pujaSlug: "kuber-pooja",
    };
  }

  // Griha Pravesh
  if (title.includes("griha pravesh") || title.includes("vastu")) {
    const griha = allPoojas?.find((p) => p.slug === "griha-pravesh");
    return {
      hasPuja: true,
      url: griha?.ctaLink || "/book/griha-pravesh",
      pujaTitle: griha?.title || "Griha Pravesh",
      pujaSlug: "griha-pravesh",
    };
  }

  // Maha Mrityunjaya
  if (title.includes("mrityunjaya")) {
    const mrityu = allPoojas?.find((p) => p.slug === "maha-mrityunjaya-jap");
    return {
      hasPuja: true,
      url: mrityu?.ctaLink || "/book/maha-mrityunjaya-jap",
      pujaTitle: mrityu?.title || "Maha Mrityunjaya Jap",
      pujaSlug: "maha-mrityunjaya-jap",
    };
  }

  // Navgraha Shanti
  if (title.includes("navgraha") || title.includes("navagraha")) {
    const nav = allPoojas?.find((p) => p.slug === "navgraha-shanti");
    return {
      hasPuja: true,
      url: nav?.ctaLink || "/book/navgraha-shanti",
      pujaTitle: nav?.title || "Navgraha Shanti",
      pujaSlug: "navgraha-shanti",
    };
  }

  // Direct title match in catalog
  if (allPoojas && allPoojas.length > 0) {
    const directMatch = allPoojas.find((p) => {
      const pTitle = p.title.toLowerCase();
      return title === pTitle || (pTitle.length > 4 && title.includes(pTitle));
    });
    if (directMatch) {
      return {
        hasPuja: true,
        url: directMatch.ctaLink?.trim() || `/book/${directMatch.slug}`,
        pujaTitle: directMatch.title,
        pujaSlug: directMatch.slug,
      };
    }
  }

  // 5. No associated puja (showcase only)
  return {
    hasPuja: false,
    url: null,
  };
}

/**
 * Standard 6 demo gallery items showcasing authentic Hindu puja rituals.
 * Each card includes up to 3 photos and 1 optional video.
 * Labeled with isDemo: true so the admin can clearly identify and replace them.
 */
export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-ganesh-puja",
    _id: "gal-ganesh-puja",
    title: "Ganesh Puja",
    description: "Auspicious invocation of Bhagwan Ganesha with sacred modak offerings, durva grass, and Vedic mantras for obstacle removal and prosperity.",
    mediaType: "photo",
    pujaSlug: "rudrabhishek",
    images: [
      "/festivals/ganesha-altar.jpg",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "/festivals/ganesha-altar.jpg",
    imageUrl2: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "/festivals/ganesha-altar.jpg",
    category: "Puja Ceremonies",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 1,
    isDemo: true,
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "gal-traditional-havan",
    _id: "gal-traditional-havan",
    title: "Traditional Havan Ceremony",
    description: "Sacred fire ritual (Yagya) with shuddh desi ghee and herbal samagri invoked by Vedic Acharyas for spiritual purification and divine grace.",
    mediaType: "mixed",
    pujaSlug: "durga-saptashati-path",
    images: [
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=7X8II6J-6mU",
    youtubeVideoId: "7X8II6J-6mU",
    thumbnailUrl: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=600&q=80",
    category: "Havan & Yagya",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 2,
    isDemo: true,
    videoDurationSeconds: 120, // 2 minutes (within 180s limit)
    durationVerified: true,
    createdAt: "2026-09-02T11:00:00.000Z",
    updatedAt: "2026-09-02T11:00:00.000Z",
  },
  {
    id: "gal-kalash-sthapana",
    _id: "gal-kalash-sthapana",
    title: "Someshwar Mahadev Abhisek",
    description: "Consecration and Holy Abhishek of Someshwar Mahadev with sacred Ganga jal, Panchamrit, and Bilva patra for divine blessings and peace.",
    mediaType: "mixed",
    pujaSlug: "someshwar-mahadev-abhisek",
    images: [
      "/festivals/shivratri.jpg",
      "https://img.youtube.com/vi/P6asWvUY4zY/hqdefault.jpg",
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "/festivals/shivratri.jpg",
    imageUrl2: "https://img.youtube.com/vi/P6asWvUY4zY/hqdefault.jpg",
    imageUrl3: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=P6asWvUY4zY",
    youtubeVideoId: "P6asWvUY4zY",
    thumbnailUrl: "https://img.youtube.com/vi/P6asWvUY4zY/hqdefault.jpg",
    category: "Puja Ceremonies",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 3,
    isDemo: true,
    createdAt: "2026-09-03T09:30:00.000Z",
    updatedAt: "2026-09-03T09:30:00.000Z",
  },
  {
    id: "gal-pandit-ji-rituals",
    _id: "gal-pandit-ji-rituals",
    title: "Pandit Ji Performing Rituals",
    description: "Certified Vedic Purohit conducting elaborate shodashopachara puja with profound reverence, conch sound, and traditional bell chime.",
    mediaType: "mixed",
    images: [
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
      "/sample-puja.jpg",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "/sample-puja.jpg",
    imageUrl3: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    youtubeVideoId: "kJQP7kiw5Fk",
    thumbnailUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
    category: "Temple Rituals",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 4,
    isDemo: true,
    videoDurationSeconds: 150, // 2m 30s (within 180s limit)
    durationVerified: true,
    createdAt: "2026-09-04T14:15:00.000Z",
    updatedAt: "2026-09-04T14:15:00.000Z",
  },
  {
    id: "gal-puja-samagri-prep",
    _id: "gal-puja-samagri-prep",
    title: "Puja Samagri Preparation",
    description: "Meticulous arrangement of authentic Vedic samagri including fresh marigold garlands, kumkum, chandan, akshat, and fragrant camphor.",
    mediaType: "photo",
    images: [
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80",
    category: "Puja Samagri",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 5,
    isDemo: true,
    createdAt: "2026-09-05T08:00:00.000Z",
    updatedAt: "2026-09-05T08:00:00.000Z",
  },
  {
    id: "gal-traditional-hindu-ceremony",
    _id: "gal-traditional-hindu-ceremony",
    title: "Traditional Hindu Puja Ceremony",
    description: "Heartfelt Maha Aarti with brass deepams, surrounded by chanting devotees offering heartfelt prayers for peace, health, and family prosperity.",
    mediaType: "photo",
    images: [
      "/festivals/diwali.jpg",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "/festivals/diwali.jpg",
    imageUrl2: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "/festivals/diwali.jpg",
    category: "Puja Ceremonies",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 6,
    isDemo: true,
    createdAt: "2026-09-06T18:30:00.000Z",
    updatedAt: "2026-09-06T18:30:00.000Z",
  },
];
