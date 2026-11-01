/**
 * Devotee Feedback & Review Store
 * Dual-mode persistence: MongoDB collection 'feedbacks' with JSON file fallback.
 * Server-only module — never import from client components.
 */

import { randomBytes } from "crypto";
import { MongoClient, type Db } from "mongodb";
import { ensureDnsPatch } from "./dns-fix";

ensureDnsPatch();

export type FeedbackStatus = "pending" | "approved" | "rejected";

export interface FeedbackItem {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  message: string;
  rating: number; // 1 to 5
  status: FeedbackStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicFeedbackItem {
  id: string;
  name: string;
  message: string;
  rating: number;
  isFeatured: boolean;
  createdAt: string;
}

export interface FeedbackCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
  averageRating: number;
}

const inMemoryFeedbacks: FeedbackItem[] = [];

// Helper to sanitize HTML tags to prevent XSS
export function sanitizeText(text: string): string {
  if (!text) return "";
  return text
    .replace(/<[^>]*>?/gm, "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

async function getMongoClient(): Promise<MongoClient | null> {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri) return null;
  ensureDnsPatch();
  try {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    return client;
  } catch (err) {
    console.warn("[feedback-store] MongoDB connection failed, falling back to local store:", err);
    return null;
  }
}

async function readLocalFile(): Promise<FeedbackItem[]> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
    const filePath = path.join(dir, "feedbacks.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
  } catch {
    // fallback
  }
  return inMemoryFeedbacks;
}

async function writeLocalFile(items: FeedbackItem[]): Promise<void> {
  try {
    const fs = await import("fs");
    const path = await import("path");
    const dir = process.env.TTP_DATA_DIR || path.join(process.cwd(), ".data");
    const filePath = path.join(dir, "feedbacks.json");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(items.slice(0, 1000), null, 2), "utf8");
  } catch {
    // fallback
  }
}

/**
 * Creates and persists a new devotee feedback entry.
 * Defaults status to 'pending' and isFeatured to false.
 */
export async function createFeedback(input: {
  name: string;
  phone?: string;
  email?: string;
  message: string;
  rating: number;
}): Promise<FeedbackItem> {
  const cleanName = sanitizeText(input.name).slice(0, 100);
  const cleanMessage = sanitizeText(input.message).slice(0, 3000);
  const cleanPhone = input.phone ? sanitizeText(input.phone).slice(0, 30) : undefined;
  const cleanEmail = input.email ? sanitizeText(input.email).toLowerCase().slice(0, 120) : undefined;
  const ratingNum = Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5)));

  const now = new Date().toISOString();
  const newItem: FeedbackItem = {
    id: `fb_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`,
    name: cleanName || "Devotee",
    phone: cleanPhone || undefined,
    email: cleanEmail || undefined,
    message: cleanMessage,
    rating: ratingNum,
    status: "pending",
    isFeatured: false,
    createdAt: now,
    updatedAt: now,
  };

  inMemoryFeedbacks.unshift(newItem);

  const client = await getMongoClient();
  if (client) {
    try {
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      await db.collection("feedbacks").insertOne({ ...newItem });
    } catch (err) {
      console.warn("[feedback-store] MongoDB insertOne error:", err);
    } finally {
      await client.close();
    }
  }

  const existing = await readLocalFile();
  existing.unshift(newItem);
  await writeLocalFile(existing);

  return newItem;
}

/**
 * Fetches approved feedback for public display on the landing page.
 * Strips phone and email to protect privacy.
 */
export async function getPublicApprovedFeedback(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<PublicFeedbackItem[]> {
  const limit = options?.limit || 50;
  const client = await getMongoClient();

  if (client) {
    try {
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      const query: Record<string, unknown> = { status: "approved" };
      if (options?.featuredOnly) {
        query.isFeatured = true;
      }

      const docs = await db
        .collection("feedbacks")
        .find(query)
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit)
        .toArray();

      if (docs && docs.length > 0) {
        return docs.map((d: any) => ({
          id: d.id,
          name: d.name,
          message: d.message,
          rating: Number(d.rating) || 5,
          isFeatured: Boolean(d.isFeatured),
          createdAt: d.createdAt,
        }));
      }
    } catch (err) {
      console.warn("[feedback-store] MongoDB getPublicApprovedFeedback error:", err);
    } finally {
      await client.close();
    }
  }

  // Fallback to local store / memory
  const all = await readLocalFile();
  const approved = all.filter((item) => {
    if (item.status !== "approved") return false;
    if (options?.featuredOnly && !item.isFeatured) return false;
    return true;
  });

  approved.sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return approved.slice(0, limit).map((d) => ({
    id: d.id,
    name: d.name,
    message: d.message,
    rating: Number(d.rating) || 5,
    isFeatured: Boolean(d.isFeatured),
    createdAt: d.createdAt,
  }));
}

/**
 * Admin: List all feedbacks with filtering, search, and status counts.
 */
export async function getAdminFeedback(params?: {
  status?: FeedbackStatus | "all" | "featured";
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<{ items: FeedbackItem[]; counts: FeedbackCounts }> {
  let allItems: FeedbackItem[] = [];
  const client = await getMongoClient();

  if (client) {
    try {
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      const docs = await db.collection("feedbacks").find({}).sort({ createdAt: -1 }).toArray();
      if (docs && docs.length > 0) {
        allItems = docs.map((d: any) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
          email: d.email,
          message: d.message,
          rating: Number(d.rating) || 5,
          status: (d.status as FeedbackStatus) || "pending",
          isFeatured: Boolean(d.isFeatured),
          createdAt: d.createdAt,
          updatedAt: d.updatedAt || d.createdAt,
        }));
      }
    } catch (err) {
      console.warn("[feedback-store] MongoDB getAdminFeedback error:", err);
    } finally {
      await client.close();
    }
  }

  if (allItems.length === 0) {
    allItems = await readLocalFile();
  }

  // Compute overall counts
  const total = allItems.length;
  let pendingCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;
  let featuredCount = 0;
  let ratingSum = 0;

  allItems.forEach((i) => {
    if (i.status === "pending") pendingCount++;
    else if (i.status === "approved") approvedCount++;
    else if (i.status === "rejected") rejectedCount++;
    if (i.isFeatured) featuredCount++;
    ratingSum += Number(i.rating) || 5;
  });

  const averageRating = total > 0 ? Number((ratingSum / total).toFixed(1)) : 5.0;

  // Apply filters
  let filtered = [...allItems];
  const statusFilter = params?.status || "all";
  if (statusFilter === "featured") {
    filtered = filtered.filter((i) => i.isFeatured);
  } else if (statusFilter !== "all") {
    filtered = filtered.filter((i) => i.status === statusFilter);
  }

  const query = (params?.search || "").toLowerCase().trim();
  if (query) {
    filtered = filtered.filter((i) => {
      return (
        i.name.toLowerCase().includes(query) ||
        i.message.toLowerCase().includes(query) ||
        (i.phone && i.phone.toLowerCase().includes(query)) ||
        (i.email && i.email.toLowerCase().includes(query))
      );
    });
  }

  const limit = params?.limit || 200;
  const skip = params?.skip || 0;
  const pagedItems = filtered.slice(skip, skip + limit);

  return {
    items: pagedItems,
    counts: {
      total,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      featured: featuredCount,
      averageRating,
    },
  };
}

/**
 * Admin: Update a feedback's status, featured flag, or contents.
 */
export async function updateFeedbackItem(
  id: string,
  updates: Partial<Pick<FeedbackItem, "status" | "isFeatured" | "name" | "message" | "rating">>
): Promise<FeedbackItem | null> {
  const now = new Date().toISOString();
  const sanitizedUpdates: Record<string, unknown> = {
    updatedAt: now,
  };

  if (updates.status && ["pending", "approved", "rejected"].includes(updates.status)) {
    sanitizedUpdates.status = updates.status;
  }
  if (typeof updates.isFeatured === "boolean") {
    sanitizedUpdates.isFeatured = updates.isFeatured;
  }
  if (typeof updates.name === "string" && updates.name.trim()) {
    sanitizedUpdates.name = sanitizeText(updates.name).slice(0, 100);
  }
  if (typeof updates.message === "string" && updates.message.trim()) {
    sanitizedUpdates.message = sanitizeText(updates.message).slice(0, 3000);
  }
  if (typeof updates.rating === "number" && !isNaN(updates.rating)) {
    sanitizedUpdates.rating = Math.min(5, Math.max(1, Math.round(updates.rating)));
  }

  const client = await getMongoClient();
  if (client) {
    try {
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      await db.collection("feedbacks").updateOne({ id }, { $set: sanitizedUpdates });
    } catch (err) {
      console.warn("[feedback-store] MongoDB updateFeedbackItem error:", err);
    } finally {
      await client.close();
    }
  }

  // Update in-memory & local file
  const localList = await readLocalFile();
  const target = localList.find((i) => i.id === id);
  if (target) {
    Object.assign(target, sanitizedUpdates);
    await writeLocalFile(localList);
    return target;
  }

  return null;
}

/**
 * Admin: Delete a feedback item.
 */
export async function deleteFeedbackItem(id: string): Promise<boolean> {
  const client = await getMongoClient();
  if (client) {
    try {
      const db = client.db(process.env.MONGODB_DB || "templepuja");
      await db.collection("feedbacks").deleteOne({ id });
    } catch (err) {
      console.warn("[feedback-store] MongoDB deleteFeedbackItem error:", err);
    } finally {
      await client.close();
    }
  }

  const localList = await readLocalFile();
  const filtered = localList.filter((i) => i.id !== id);
  const deleted = filtered.length !== localList.length;
  if (deleted) {
    await writeLocalFile(filtered);
  }

  return deleted;
}

