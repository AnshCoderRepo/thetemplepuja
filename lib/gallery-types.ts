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
 * Normalizes and extracts all valid image URLs from a gallery item.
 * Preserves backward compatibility with legacy `imageUrl`, `thumbnailUrl`,
 * and new `images` array / `imageUrl2`, `imageUrl3`.
 * No limit on the number of photos returned.
 */
export function getGalleryItemImages(item?: Partial<GalleryItem> | null): string[] {
  if (!item) return [];
  const list: string[] = [];

  const add = (val?: string | null) => {
    if (!val || typeof val !== "string") return;
    const clean = val.trim();
    if (clean && !list.includes(clean)) {
      list.push(clean);
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
    images: [
      "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=600&q=80",
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
    title: "Kalash Sthapana",
    description: "Consecration of the holy Mangal Kalash with coconut, mango leaves, sacred red thread, and Ganga jal, invoking Trideva and universal energies.",
    mediaType: "photo",
    images: [
      "https://images.unsplash.com/photo-1617694820985-7975d27572d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1617694820985-7975d27572d8?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1617694820985-7975d27572d8?auto=format&fit=crop&w=600&q=80",
    category: "Kalash Sthapana",
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
      "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1617694820985-7975d27572d8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1617694820985-7975d27572d8?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1567591414240-e1c459f0c29f?auto=format&fit=crop&w=800&q=80",
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
      "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    ],
    imageUrl: "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=1200&q=80",
    imageUrl2: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
    imageUrl3: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1629814249584-b427b00366eb?auto=format&fit=crop&w=600&q=80",
    category: "Puja Ceremonies",
    isActive: true,
    showOnHomepage: true,
    displayOrder: 6,
    isDemo: true,
    createdAt: "2026-09-06T18:30:00.000Z",
    updatedAt: "2026-09-06T18:30:00.000Z",
  },
];
