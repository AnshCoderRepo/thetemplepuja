import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { getMediaDoc, saveMediaDoc } from "./mongo-store";

const MEDIA_DIR = path.join(process.cwd(), ".data", "media");

// Ensure .data/media directory exists
try {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
} catch {
  // Ignore in read-only environments
}

export interface CachedMedia {
  buffer: Buffer;
  contentType: string;
}

// In-memory hot cache for instant zero-disk responses (up to 150 items)
const memoryCache = new Map<string, CachedMedia>();
const MAX_MEMORY_ITEMS = 150;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

/**
 * Normalizes any base64 Data URL to a lightweight, cached, fast HTTP endpoint URL: `/api/media/[hash].[ext]`.
 * Leaves existing remote HTTP/HTTPS or relative URLs completely untouched.
 * Automatically persists to both disk and MongoDB Atlas cloud storage.
 */
export function registerDataUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  const match = trimmed.match(/^data:([a-zA-Z0-9/+-]+);base64,(.+)$/);
  if (!match) return trimmed;

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];
  const ext = MIME_TO_EXT[mimeType] || "jpg";

  // Deterministic 16-character SHA-256 hash of the payload
  const hash = createHash("sha256").update(base64Data).digest("hex").slice(0, 16);
  const filename = `${hash}.${ext}`;

  try {
    const buffer = Buffer.from(base64Data, "base64");

    if (!memoryCache.has(filename)) {
      if (memoryCache.size >= MAX_MEMORY_ITEMS) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }
      memoryCache.set(filename, { buffer, contentType: mimeType });
    }

    // 1. Persist to disk asynchronously
    try {
      const filePath = path.join(MEDIA_DIR, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFile(filePath, buffer, () => {});
      }
    } catch {
      // Disk write failure ignored in read-only / serverless
    }

    // 2. Persist to MongoDB Atlas cloud store for permanent survival across redeploys & cold starts
    void saveMediaDoc(filename, mimeType, buffer);
  } catch {
    // Fallback: return original if buffer parsing fails
    return trimmed;
  }

  return `/api/media/${filename}`;
}

/**
 * Directly registers a binary buffer into memory cache, local disk, and MongoDB.
 */
export async function registerMediaBuffer(
  filename: string,
  contentType: string,
  buffer: Buffer
): Promise<string> {
  const safeFilename = path.basename(filename);
  memoryCache.set(safeFilename, { buffer, contentType });

  try {
    const filePath = path.join(MEDIA_DIR, safeFilename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buffer);
    }
  } catch {
    // Disk write failure ignored
  }

  await saveMediaDoc(safeFilename, contentType, buffer);
  return `/api/media/${safeFilename}`;
}

/**
 * Retrieves cached media synchronously by filename (e.g. "a1b2c3d4e5f67890.jpg").
 * Checks memory cache and disk cache.
 */
export function getMedia(filename: string): CachedMedia | null {
  if (!filename) return null;

  const safeFilename = path.basename(filename);

  // 1. Check memory cache
  if (memoryCache.has(safeFilename)) {
    return memoryCache.get(safeFilename)!;
  }

  // 2. Check disk cache
  try {
    const filePath = path.join(MEDIA_DIR, safeFilename);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      const ext = safeFilename.split(".").pop()?.toLowerCase() || "jpg";
      const contentType = EXT_TO_MIME[ext] || "image/jpeg";
      const item = { buffer, contentType };
      memoryCache.set(safeFilename, item);
      return item;
    }
  } catch {
    // Disk read failed
  }

  return null;
}

/**
 * Retrieves cached media asynchronously with MongoDB Atlas persistent fallback.
 * Guarantees images survive cold starts and serverless environments.
 */
export async function getMediaAsync(filename: string): Promise<CachedMedia | null> {
  if (!filename) return null;

  // 1. Check memory or local disk first
  const local = getMedia(filename);
  if (local) return local;

  const safeFilename = path.basename(filename);

  // 2. Fallback to MongoDB Atlas persistent media collection
  try {
    const mongoItem = await getMediaDoc(safeFilename);
    if (mongoItem && mongoItem.buffer) {
      const item: CachedMedia = {
        buffer: mongoItem.buffer,
        contentType: mongoItem.contentType || "image/jpeg",
      };

      // Populate memory cache
      if (memoryCache.size >= MAX_MEMORY_ITEMS) {
        const firstKey = memoryCache.keys().next().value;
        if (firstKey) memoryCache.delete(firstKey);
      }
      memoryCache.set(safeFilename, item);

      // Populate local disk cache for fast future reads
      try {
        const filePath = path.join(MEDIA_DIR, safeFilename);
        if (!fs.existsSync(filePath)) {
          fs.writeFile(filePath, item.buffer, () => { });
        }
      } catch {
        // Disk write optional
      }

      return item;
    }
  } catch (err) {
    console.error(`[media-cache] Error fetching from MongoDB for ${safeFilename}:`, err);
  }

  return null;
}
