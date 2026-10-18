"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  User,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { fetchCatalog, saveCatalogSection } from "@/lib/api";
import { BLOG_POSTS, isPostPublished, type BlogPost, type BlogStatus } from "@/lib/blog-data";
import type { Pooja } from "@/lib/data";
import ConfirmDialog from "./ConfirmDialog";

const inputCls =
  "w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200";

interface BlogDraft {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  relatedPoojaSlug: string;
  relatedPoojaTitle: string;
  tags: string[];
  status: BlogStatus;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  content: {
    introduction: string;
    sections: {
      heading: string;
      body: string;
      keyPoints?: string[];
    }[];
    conclusion: string;
  };
}

const emptyDraft: BlogDraft = {
  slug: "",
  title: "",
  excerpt: "",
  category: "Vedic Astrology & Healing",
  author: "Acharya Vidyadhar Shastri",
  authorRole: "Head Vedic Scholar, templepujasewa",
  publishedAt: new Date().toISOString().split("T")[0],
  readTime: "5 min read",
  imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
  relatedPoojaSlug: "",
  relatedPoojaTitle: "",
  tags: ["Vedic Rituals", "Spiritual Insights"],
  status: "published",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  content: {
    introduction: "",
    sections: [
      {
        heading: "1. The Sacred Spiritual Significance",
        body: "",
        keyPoints: [],
      },
    ],
    conclusion: "",
  },
};

const COMMON_CATEGORIES = [
  "Vedic Astrology & Healing",
  "Family & Prosperity",
  "Planetary Remedies (Navagraha)",
  "Home & Vastu",
  "Temple Traditions",
  "Festivals & Muhurats",
];

export default function BlogsManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}) {
  const [list, setList] = useState<BlogPost[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTabInModal, setActiveTabInModal] = useState<"content" | "author" | "seo">("content");

  // Draft Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState<BlogDraft>(emptyDraft);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; blog: BlogPost | null }>({
    open: false,
    blog: null,
  });
  const [resetConfirm, setResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const catalog = await fetchCatalog();
      setList(catalog.blogs ?? BLOG_POSTS);
      setPoojas(catalog.poojas ?? []);
      setError("");
    } catch {
      setError("Failed to load blog posts. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save full list to backend catalog
  const persistBlogs = async (nextList: BlogPost[]): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await saveCatalogSection("blogs", nextList, token);
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return false;
        }
        setError(res.error || "Failed to save blog changes.");
        return false;
      }
      setList(nextList);
      setError("");
      if (onRefresh) onRefresh();
      return true;
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Open modal for new blog
  const handleCreateNew = () => {
    setDraft({
      ...emptyDraft,
      publishedAt: new Date().toISOString().split("T")[0],
    });
    setOriginalSlug(null);
    setTagInput("");
    setActiveTabInModal("content");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (post: BlogPost) => {
    setDraft({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      author: post.author,
      authorRole: post.authorRole,
      publishedAt: post.publishedAt,
      readTime: post.readTime,
      imageUrl: post.imageUrl,
      relatedPoojaSlug: post.relatedPoojaSlug || "",
      relatedPoojaTitle: post.relatedPoojaTitle || "",
      tags: post.tags || [],
      status: post.status || "published",
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      canonicalUrl: post.canonicalUrl || "",
      content: {
        introduction: post.content?.introduction || "",
        sections: post.content?.sections && post.content.sections.length > 0
          ? post.content.sections.map((s) => ({
              heading: s.heading,
              body: s.body,
              keyPoints: s.keyPoints ? [...s.keyPoints] : [],
            }))
          : [
              {
                heading: "1. The Sacred Spiritual Significance",
                body: "",
                keyPoints: [],
              },
            ],
        conclusion: post.content?.conclusion || "",
      },
    });
    setOriginalSlug(post.slug);
    setTagInput("");
    setActiveTabInModal("content");
    setIsModalOpen(true);
  };

  // Toggle quick publish/unpublish
  const handleTogglePublish = async (post: BlogPost) => {
    const isCurrentlyPub = isPostPublished(post);
    const newStatus: BlogStatus = isCurrentlyPub ? "draft" : "published";
    const nextList = list.map((item) =>
      item.slug === post.slug
        ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
        : item
    );
    const ok = await persistBlogs(nextList);
    if (ok) {
      showNotification(
        newStatus === "published"
          ? `✅ Article "${post.title.substring(0, 30)}..." is now Published!`
          : `⏸️ Article "${post.title.substring(0, 30)}..." moved to Drafts.`
      );
    }
  };

  // Auto-generate slug from title
  const handleGenerateSlug = () => {
    if (!draft.title.trim()) return;
    const generated = draft.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setDraft((prev) => ({ ...prev, slug: generated }));
  };

  // Handle image upload with canvas compression
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsUploadingImage(false);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL("image/jpeg", 0.85);
          setDraft((prev) => ({ ...prev, imageUrl: optimized }));
        } else {
          setDraft((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        }
        setIsUploadingImage(false);
        showNotification("🖼️ Featured article image uploaded and optimized!");
      };
      img.onerror = () => {
        setDraft((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        setIsUploadingImage(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setError("Could not read image file.");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Add tag
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!draft.tags.includes(trimmed)) {
      setDraft((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setTagInput("");
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Dynamic sections handlers
  const handleAddSection = () => {
    setDraft((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        sections: [
          ...prev.content.sections,
          {
            heading: `${prev.content.sections.length + 1}. New Ritual Section`,
            body: "",
            keyPoints: [],
          },
        ],
      },
    }));
  };

  const handleRemoveSection = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        sections: prev.content.sections.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleUpdateSectionHeading = (idx: number, heading: string) => {
    setDraft((prev) => {
      const nextSections = [...prev.content.sections];
      nextSections[idx] = { ...nextSections[idx], heading };
      return { ...prev, content: { ...prev.content, sections: nextSections } };
    });
  };

  const handleUpdateSectionBody = (idx: number, body: string) => {
    setDraft((prev) => {
      const nextSections = [...prev.content.sections];
      nextSections[idx] = { ...nextSections[idx], body };
      return { ...prev, content: { ...prev.content, sections: nextSections } };
    });
  };

  const handleAddKeyPoint = (sectionIdx: number, point: string) => {
    if (!point.trim()) return;
    setDraft((prev) => {
      const nextSections = [...prev.content.sections];
      const cur = nextSections[sectionIdx];
      const nextPoints = cur.keyPoints ? [...cur.keyPoints, point.trim()] : [point.trim()];
      nextSections[sectionIdx] = { ...cur, keyPoints: nextPoints };
      return { ...prev, content: { ...prev.content, sections: nextSections } };
    });
  };

  const handleRemoveKeyPoint = (sectionIdx: number, pointIdx: number) => {
    setDraft((prev) => {
      const nextSections = [...prev.content.sections];
      const cur = nextSections[sectionIdx];
      const nextPoints = (cur.keyPoints || []).filter((_, i) => i !== pointIdx);
      nextSections[sectionIdx] = { ...cur, keyPoints: nextPoints };
      return { ...prev, content: { ...prev.content, sections: nextSections } };
    });
  };

  // Save Modal Draft
  const handleSaveModal = async (statusOverride?: BlogStatus) => {
    if (!draft.title.trim()) {
      setError("Please enter an article title.");
      return;
    }
    if (!draft.slug.trim()) {
      setError("Please specify a URL slug.");
      return;
    }
    if (!draft.excerpt.trim()) {
      setError("Please provide a short excerpt.");
      return;
    }

    const finalStatus: BlogStatus = statusOverride || draft.status;
    const finalPost: BlogPost = {
      ...draft,
      status: finalStatus,
      updatedAt: new Date().toISOString(),
      createdAt: originalSlug
        ? list.find((p) => p.slug === originalSlug)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    let nextList: BlogPost[];
    if (originalSlug) {
      // Editing existing post
      nextList = list.map((item) => (item.slug === originalSlug ? finalPost : item));
    } else {
      // New post - ensure unique slug
      if (list.some((item) => item.slug === finalPost.slug)) {
        setError(`A blog with slug "${finalPost.slug}" already exists. Please choose another slug.`);
        return;
      }
      nextList = [finalPost, ...list];
    }

    const ok = await persistBlogs(nextList);
    if (ok) {
      setIsModalOpen(false);
      showNotification(
        finalStatus === "published"
          ? `🎉 Article published successfully!`
          : `💾 Draft saved successfully!`
      );
    }
  };

  // Delete article handler
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.blog) return;
    const slugToDelete = deleteConfirm.blog.slug;
    const nextList = list.filter((item) => item.slug !== slugToDelete);
    const ok = await persistBlogs(nextList);
    if (ok) {
      showNotification(`🗑️ Article "${deleteConfirm.blog.title.substring(0, 30)}..." deleted.`);
      setDeleteConfirm({ open: false, blog: null });
    }
  };

  // Reset to static defaults
  const handleResetDefaults = async () => {
    const ok = await persistBlogs(BLOG_POSTS);
    if (ok) {
      showNotification("🔄 Blog articles reset to default Vedic guides.");
      setResetConfirm(false);
    }
  };

  // Filtered list
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const matchesSearch =
        search === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.slug.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.author.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const isPub = isPostPublished(item);
      let matchesStatus = true;
      if (statusFilter === "published" || statusFilter === "active") matchesStatus = isPub;
      else if (statusFilter === "draft" || statusFilter === "inactive") matchesStatus = !isPub;
      else if (statusFilter === "archived") matchesStatus = item.status === "archived";

      const matchesCat = categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCat;
    });
  }, [list, search, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const published = list.filter(isPostPublished).length;
    const drafts = list.filter((p) => p.status === "draft").length;
    return { total: list.length, published, drafts };
  }, [list]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-xs font-bold text-emerald-900 shadow-xl animate-in slide-in-from-right duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Header Card */}
      <div className="rounded-3xl border border-saffron-100 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 p-6 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-white shadow-sm">
                <BookOpen className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
                Spiritual Blog & Ritual Guides Management
              </h2>
            </div>
            <p className="mt-1 text-xs text-ink-soft max-w-2xl leading-relaxed">
              Create, curate, edit, and publish authentic Vedic articles, astrology guides, and ritual explanations. Manage drafts safely before publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/blog"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-saffron-50 hover:text-ink transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-saffron-600" />
              <span>View Public Blog</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>

            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:from-saffron-600 hover:to-saffron-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Article</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-saffron-100/70 pt-4">
          <div className="rounded-2xl border border-saffron-100 bg-white/80 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">
              Total Articles
            </span>
            <span className="font-display text-2xl font-extrabold text-ink">
              {stats.total}
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Live & Published
            </span>
            <span className="font-display text-2xl font-extrabold text-emerald-900">
              {stats.published}
            </span>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Unpublished Drafts
            </span>
            <span className="font-display text-2xl font-extrabold text-amber-900">
              {stats.drafts}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, tag, slug, author..."
            className={`${inputCls} pl-10`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Buttons */}
          <div className="flex rounded-xl bg-cream/70 p-1 border border-saffron-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-saffron-900 shadow-xs font-bold"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "active" || statusFilter === "published"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-emerald-700 hover:text-emerald-800"
              }`}
            >
              Active ({stats.published})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === "inactive" || statusFilter === "draft"
                  ? "bg-slate-700 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              Inactive ({stats.drafts})
            </button>
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter articles by publication status"
            className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-saffron-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter articles by editorial category"
            className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-saffron-500"
          >
            <option value="all">All Categories</option>
            {COMMON_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-bold text-ink-soft hover:bg-red-50 hover:text-red-700 transition-colors"
            title="Reset articles to initial defaults"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Article Cards Grid */}
      {loading ? (
        <div className="flex h-60 items-center justify-center rounded-3xl border border-saffron-100 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-saffron-600" />
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-3xl border border-saffron-100 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-saffron-400" />
          <h3 className="mt-3 font-display text-base font-bold text-ink">No articles found</h3>
          <p className="mt-1 text-xs text-ink-soft">
            {search || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your search query or filters."
              : "Get started by creating your first Vedic spiritual article!"}
          </p>
          <button
            type="button"
            onClick={handleCreateNew}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-4 py-2 text-xs font-bold text-white hover:bg-saffron-600 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Article</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((post) => {
            const isPub = isPostPublished(post);
            return (
              <div
                key={post.slug}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-saffron-100 bg-white p-4 shadow-soft transition-all duration-300 hover:border-saffron-300 hover:shadow-card"
              >
                <div>
                  {/* Image with status badge */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* Status Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isPub ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur shadow-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                          <span>Published</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 border border-amber-300/40 px-2.5 py-0.5 text-[10px] font-bold text-white backdrop-blur shadow-xs">
                          <EyeOff className="h-3 w-3" />
                          <span>Draft</span>
                        </span>
                      )}
                    </div>

                    {/* Category pill */}
                    <span className="absolute bottom-2 left-2.5 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-amber-200 backdrop-blur border border-white/20">
                      {post.category}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 text-[10px] text-ink-soft">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-saffron-600" />
                        {post.publishedAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-saffron-600" />
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="mt-1 font-display text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-saffron-800 transition-colors">
                      {post.title}
                    </h3>

                    <p className="mt-1 text-[11px] text-ink-soft line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Author & Pooja link */}
                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-ink-soft border-t border-saffron-100/60 pt-2">
                      <span className="truncate font-semibold text-ink">
                        ✍️ {post.author}
                      </span>
                      {post.relatedPoojaTitle && (
                        <span className="font-medium text-saffron-700 truncate max-w-[120px]">
                          🪔 {post.relatedPoojaTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-saffron-100 pt-3">
                  <div className="flex items-center gap-1.5">
                    {/* Live Preview Button */}
                    <Link
                      href={`/blog/${post.slug}?preview=true`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-cream/40 px-2.5 py-1 text-[11px] font-bold text-ink-soft hover:bg-saffron-100 hover:text-ink transition-colors"
                      title="Preview article (works for both drafts and published)"
                    >
                      <Eye className="h-3 w-3 text-saffron-600" />
                      <span>Preview</span>
                    </Link>

                    {/* Publish / Unpublish Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(post)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                        isPub
                          ? "border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      }`}
                      title={isPub ? "Unpublish and move to Drafts" : "Publish to live website"}
                    >
                      {isPub ? <span>Unpublish</span> : <span>Publish</span>}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(post)}
                      className="rounded-lg p-1.5 text-ink-soft hover:bg-saffron-100 hover:text-saffron-800 transition-colors"
                      title="Edit article"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ open: true, blog: post })}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete article"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE & EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-3xl border border-saffron-200 bg-white p-5 sm:p-7 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-saffron-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-white font-bold text-sm shadow-xs">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-extrabold text-ink">
                    {originalSlug ? "Edit Spiritual Article" : "Create New Spiritual Article"}
                  </h3>
                  <p className="text-[11px] text-ink-soft">
                    {draft.slug ? `/blog/${draft.slug}` : "Drafting new Vedic content"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-saffron-100 my-4 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTabInModal("content")}
                className={`pb-2.5 px-3 border-b-2 transition-all ${
                  activeTabInModal === "content"
                    ? "border-saffron-600 text-saffron-800"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                1. Article & Sections
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInModal("author")}
                className={`pb-2.5 px-3 border-b-2 transition-all ${
                  activeTabInModal === "author"
                    ? "border-saffron-600 text-saffron-800"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                2. Author & Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInModal("seo")}
                className={`pb-2.5 px-3 border-b-2 transition-all ${
                  activeTabInModal === "seo"
                    ? "border-saffron-600 text-saffron-800"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                3. SEO & Status
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-4">
              {/* TAB 1: Content & Sections */}
              {activeTabInModal === "content" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Article Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. The Spiritual Power & Benefits of Mahamrityunjaya Jaap"
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-ink">
                          URL Slug <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateSlug}
                          className="text-[10px] font-bold text-saffron-700 hover:underline"
                        >
                          Auto-generate from Title
                        </button>
                      </div>
                      <input
                        type="text"
                        value={draft.slug}
                        onChange={(e) => setDraft((p) => ({ ...p, slug: e.target.value }))}
                        placeholder="mahamrityunjaya-jaap-benefits"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink block mb-1">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={draft.category}
                        onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                        className={inputCls}
                      >
                        {COMMON_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Short Excerpt (Summary for Cards & Meta Description) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={draft.excerpt}
                      onChange={(e) => setDraft((p) => ({ ...p, excerpt: e.target.value }))}
                      placeholder="Concise 1-2 sentence overview of the Vedic guide..."
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Introduction Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={draft.content.introduction}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          content: { ...p.content, introduction: e.target.value },
                        }))
                      }
                      placeholder="Opening callout setting the scriptural context..."
                      className={inputCls}
                    />
                  </div>

                  {/* Sections */}
                  <div className="space-y-3 pt-3 border-t border-saffron-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        Article Content Sections ({draft.content.sections.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="inline-flex items-center gap-1 rounded-lg bg-saffron-50 px-2.5 py-1 text-[11px] font-bold text-saffron-800 hover:bg-saffron-100 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    {draft.content.sections.map((section, sIdx) => (
                      <div
                        key={sIdx}
                        className="rounded-2xl border border-saffron-200/80 bg-cream/20 p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={section.heading}
                            onChange={(e) => handleUpdateSectionHeading(sIdx, e.target.value)}
                            placeholder="Section Heading (e.g. 1. The Divine Meaning)"
                            className={`${inputCls} font-bold text-xs`}
                          />
                          {draft.content.sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(sIdx)}
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Delete this section"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <textarea
                          rows={3}
                          value={section.body}
                          onChange={(e) => handleUpdateSectionBody(sIdx, e.target.value)}
                          placeholder="Detailed paragraphs explaining Vedic principles..."
                          className={inputCls}
                        />

                        {/* Key Insights bullet points */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                            Key Bullet Points (Optional)
                          </span>
                          {(section.keyPoints || []).map((point, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2">
                              <span className="text-emerald-600 text-xs font-bold">•</span>
                              <span className="text-xs text-ink flex-1">{point}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveKeyPoint(sIdx, pIdx)}
                                className="text-slate-400 hover:text-red-500 text-xs px-1"
                              >
                                ✕
                              </button>
                            </div>
                          ))}

                          {/* Add bullet point input */}
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              id={`add-point-${sIdx}`}
                              placeholder="Add key insight bullet..."
                              className="flex-1 rounded-lg border border-saffron-200 bg-white px-2.5 py-1 text-[11px] text-ink outline-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddKeyPoint(sIdx, e.currentTarget.value);
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById(
                                  `add-point-${sIdx}`
                                ) as HTMLInputElement;
                                if (el) {
                                  handleAddKeyPoint(sIdx, el.value);
                                  el.value = "";
                                }
                              }}
                              className="rounded-lg bg-saffron-100 px-2.5 py-1 text-[11px] font-bold text-saffron-800 hover:bg-saffron-200"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Conclusion & Blessings
                    </label>
                    <textarea
                      rows={2}
                      value={draft.content.conclusion}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          content: { ...p.content, conclusion: e.target.value },
                        }))
                      }
                      placeholder="Final words of guidance and call-to-action for devotees..."
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Author, Image & Links */}
              {activeTabInModal === "author" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-ink block mb-1">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={draft.author}
                        onChange={(e) => setDraft((p) => ({ ...p, author: e.target.value }))}
                        placeholder="Acharya Vidyadhar Shastri"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink block mb-1">
                        Author Role / Credentials
                      </label>
                      <input
                        type="text"
                        value={draft.authorRole}
                        onChange={(e) => setDraft((p) => ({ ...p, authorRole: e.target.value }))}
                        placeholder="Head Vedic Scholar, templepujasewa"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-ink block mb-1">
                        Published Date (YYYY-MM-DD)
                      </label>
                      <input
                        type="date"
                        value={draft.publishedAt}
                        onChange={(e) => setDraft((p) => ({ ...p, publishedAt: e.target.value }))}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink block mb-1">
                        Read Time (Estimate)
                      </label>
                      <input
                        type="text"
                        value={draft.readTime}
                        onChange={(e) => setDraft((p) => ({ ...p, readTime: e.target.value }))}
                        placeholder="5 min read"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="rounded-2xl border border-saffron-200/80 bg-cream/20 p-4 space-y-3">
                    <label className="text-xs font-bold text-ink block">
                      Featured Article Image
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-xl border border-saffron-200 bg-slate-900">
                        {draft.imageUrl ? (
                          <img
                            src={draft.imageUrl}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-saffron-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-saffron-600 transition-colors shadow-xs">
                          {isUploadingImage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span>Upload From Computer</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-ink-soft">
                          Image will be client-side compressed to optimized JPEG format.
                        </p>

                        <div>
                          <input
                            type="text"
                            value={draft.imageUrl}
                            onChange={(e) => setDraft((p) => ({ ...p, imageUrl: e.target.value }))}
                            placeholder="Or paste external image URL..."
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Related Pooja Link */}
                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Link Auspicious Pooja from Catalog (Optional CTA)
                    </label>
                    <select
                      value={draft.relatedPoojaSlug}
                      onChange={(e) => {
                        const slug = e.target.value;
                        const match = poojas.find((p) => p.slug === slug);
                        setDraft((p) => ({
                          ...p,
                          relatedPoojaSlug: slug,
                          relatedPoojaTitle: match?.title || "",
                        }));
                      }}
                      className={inputCls}
                    >
                      <option value="">-- None --</option>
                      {poojas.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.title} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Tags & Keywords
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {draft.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 rounded-md bg-saffron-100 px-2.5 py-1 text-[11px] font-semibold text-saffron-900 border border-saffron-200"
                        >
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-saffron-600 hover:text-saffron-900"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tag and press Enter..."
                        className={inputCls}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="rounded-xl bg-saffron-100 px-3 py-2 text-xs font-bold text-saffron-800 hover:bg-saffron-200"
                      >
                        Add Tag
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SEO, Status & Publication */}
              {activeTabInModal === "seo" && (
                <div className="space-y-4">
                  {/* Status Selection */}
                  <div className="rounded-2xl border border-saffron-200/80 bg-amber-50/40 p-4 space-y-2">
                    <label className="text-xs font-bold text-ink block">
                      Publication Status <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, status: "published" }))}
                        className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                          draft.status === "published"
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                            : "bg-white text-ink border-saffron-200 hover:bg-emerald-50"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        <span>Published (Live Public)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDraft((p) => ({ ...p, status: "draft" }))}
                        className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold transition-all border ${
                          draft.status === "draft"
                            ? "bg-amber-600 text-white border-amber-700 shadow-md"
                            : "bg-white text-ink border-saffron-200 hover:bg-amber-50"
                        }`}
                      >
                        <EyeOff className="h-4 w-4" />
                        <span>Save as Draft (Private)</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-ink-soft">
                      Drafts are hidden from public visitors and search engine crawlers. Administrators can preview them via secret preview link.
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      SEO Meta Title (Defaults to article title if blank)
                    </label>
                    <input
                      type="text"
                      value={draft.seoTitle}
                      onChange={(e) => setDraft((p) => ({ ...p, seoTitle: e.target.value }))}
                      placeholder="Optimal for Google search results (50-60 chars)..."
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      SEO Meta Description (Defaults to excerpt if blank)
                    </label>
                    <textarea
                      rows={2}
                      value={draft.seoDescription}
                      onChange={(e) => setDraft((p) => ({ ...p, seoDescription: e.target.value }))}
                      placeholder="Search snippet summary (120-160 chars)..."
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink block mb-1">
                      Canonical URL (Optional override)
                    </label>
                    <input
                      type="text"
                      value={draft.canonicalUrl}
                      onChange={(e) => setDraft((p) => ({ ...p, canonicalUrl: e.target.value }))}
                      placeholder="https://thetemplepuja.com/blog/..."
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-saffron-100 pt-4">
              <div>
                {draft.slug && (
                  <Link
                    href={`/blog/${draft.slug}?preview=true`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-saffron-700 hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Open Live Preview</span>
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveModal("draft")}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveModal("published")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2 text-xs font-bold text-white shadow-soft hover:from-saffron-600 hover:to-saffron-700 transition-all disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Publish Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        danger={true}
        title="Delete Spiritual Article?"
        message={`Are you sure you want to permanently delete "${deleteConfirm.blog?.title}"? This cannot be undone.`}
        confirmLabel="Delete Article"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ open: false, blog: null })}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        open={resetConfirm}
        danger={true}
        title="Reset All Blog Articles?"
        message="This will reset all articles back to the default editorial articles. Any custom blog posts or draft edits will be lost."
        confirmLabel="Reset Articles"
        onConfirm={handleResetDefaults}
        onCancel={() => setResetConfirm(false)}
      />
    </div>
  );
}
