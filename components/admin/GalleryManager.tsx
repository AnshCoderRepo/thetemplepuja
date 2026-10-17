"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  Camera,
  Film,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  Upload,
  Layers,
  Home,
  Check,
  ExternalLink,
  Clock,
  Play,
} from "lucide-react";
import type { GalleryItem, GalleryMediaType } from "@/lib/gallery-types";
import {
  GALLERY_CATEGORIES,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from "@/lib/gallery-types";
import {
  fetchAdminGallery,
  saveAdminGalleryItem,
  deleteAdminGalleryItem,
} from "@/lib/api";
import GalleryModal from "@/components/gallery/GalleryModal";

interface GalleryManagerProps {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}

interface ItemDraft {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  mediaType: GalleryMediaType;
  imageUrl: string;
  videoUrl: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  category: string;
  isActive: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  isDemo: boolean;
  videoDurationSeconds: number;
}

const emptyDraft: ItemDraft = {
  title: "",
  description: "",
  mediaType: "photo",
  imageUrl: "",
  videoUrl: "",
  youtubeUrl: "",
  youtubeVideoId: "",
  thumbnailUrl: "",
  category: "Puja Ceremonies",
  isActive: true,
  showOnHomepage: true,
  displayOrder: 1,
  isDemo: false,
  videoDurationSeconds: 60,
};

export default function GalleryManager({ token, onAuthError, onRefresh }: GalleryManagerProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "photo" | "video">("all");
  const [homepageFilter, setHomepageFilter] = useState<"all" | "homepage">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Delete confirm modal state
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);

  // Live preview modal
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4500);
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    const res = await fetchAdminGallery(token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setErrorMessage(res.error || "Failed to load gallery items");
    } else {
      setItems(res.items);
    }
    setLoading(false);
  }, [token, onAuthError]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Handle client-side image compression & upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Selected file is not an image. Please choose a JPG, PNG, or WebP.");
      return;
    }

    setFormError("");
    setIsUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsUploadingPhoto(false);
        return;
      }

      const img = document.createElement("img");
      img.onload = () => {
        const maxDim = 1400;
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
          const compressed = canvas.toDataURL("image/jpeg", 0.84);
          setDraft((prev) => ({
            ...prev,
            imageUrl: compressed,
            thumbnailUrl: prev.thumbnailUrl || compressed,
          }));
        } else {
          setDraft((prev) => ({
            ...prev,
            imageUrl: rawDataUrl,
            thumbnailUrl: prev.thumbnailUrl || rawDataUrl,
          }));
        }
        setIsUploadingPhoto(false);
        showNotification("🖼️ Photo uploaded and optimized successfully!");
      };
      img.onerror = () => {
        setDraft((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        setIsUploadingPhoto(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setFormError("Could not read image file.");
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // Auto-detect and parse YouTube URL changes
  const handleYouTubeUrlChange = (url: string) => {
    const videoId = extractYouTubeVideoId(url);
    setDraft((prev) => {
      const next = { ...prev, youtubeUrl: url };
      if (videoId) {
        next.youtubeVideoId = videoId;
        if (!prev.thumbnailUrl || prev.thumbnailUrl.includes("img.youtube.com")) {
          next.thumbnailUrl = getYouTubeThumbnailUrl(videoId) || "";
        }
      }
      return next;
    });
  };

  const openNewItemModal = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.displayOrder || 1)) + 1 : 1;
    setDraft({ ...emptyDraft, displayOrder: nextOrder });
    setFormError("");
    setIsEditorOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    setDraft({
      id: item.id || item._id,
      _id: item.id || item._id,
      title: item.title,
      description: item.description || "",
      mediaType: item.mediaType || "photo",
      imageUrl: item.imageUrl || "",
      videoUrl: item.videoUrl || "",
      youtubeUrl: item.youtubeUrl || "",
      youtubeVideoId: item.youtubeVideoId || "",
      thumbnailUrl: item.thumbnailUrl || "",
      category: item.category || "Puja Ceremonies",
      isActive: item.isActive !== false,
      showOnHomepage: Boolean(item.showOnHomepage),
      displayOrder: item.displayOrder || 1,
      isDemo: Boolean(item.isDemo),
      videoDurationSeconds: item.videoDurationSeconds || 60,
    });
    setFormError("");
    setIsEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!draft.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (draft.mediaType === "photo") {
      if (!draft.imageUrl.trim()) {
        setFormError("Please upload a photo or provide an Image URL.");
        return;
      }
    } else {
      if (!draft.youtubeUrl.trim() && !draft.videoUrl.trim()) {
        setFormError("Please provide a valid YouTube URL or direct video URL.");
        return;
      }
      if (draft.youtubeUrl.trim()) {
        const id = extractYouTubeVideoId(draft.youtubeUrl);
        if (!id) {
          setFormError("Invalid YouTube URL. Please provide a standard YouTube video link.");
          return;
        }
      }
      if (draft.videoDurationSeconds > 180) {
        setFormError("Video duration exceeds the maximum limit of 3 minutes (180 seconds).");
        return;
      }
    }

    setSaving(true);
    const payload: Partial<GalleryItem> = {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      displayOrder: Number(draft.displayOrder) || 1,
      videoDurationSeconds: draft.mediaType === "video" ? Number(draft.videoDurationSeconds) : undefined,
    };

    const res = await saveAdminGalleryItem(payload, token);
    setSaving(false);

    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setFormError(res.error || "Failed to save gallery item.");
      return;
    }

    showNotification(draft.id ? "✅ Gallery item updated successfully!" : "✨ New gallery item added!");
    setIsEditorOpen(false);
    loadItems();
    onRefresh?.();
  };

  // Toggle active/inactive in 1-click
  const handleToggleActive = async (item: GalleryItem) => {
    const nextState = !item.isActive;
    const res = await saveAdminGalleryItem({ ...item, isActive: nextState }, token);
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => ((i.id || i._id) === (item.id || item._id) ? { ...i, isActive: nextState } : i))
      );
      showNotification(`Item "${item.title}" is now ${nextState ? "Active" : "Inactive"}.`);
      onRefresh?.();
    } else {
      setErrorMessage(res.error || "Failed to update item status");
    }
  };

  // Toggle showOnHomepage in 1-click
  const handleToggleHomepage = async (item: GalleryItem) => {
    const nextState = !item.showOnHomepage;
    const res = await saveAdminGalleryItem({ ...item, showOnHomepage: nextState }, token);
    if (res.ok) {
      setItems((prev) =>
        prev.map((i) => ((i.id || i._id) === (item.id || item._id) ? { ...i, showOnHomepage: nextState } : i))
      );
      showNotification(`Item "${item.title}" ${nextState ? "will appear on homepage" : "hidden from homepage"}.`);
      onRefresh?.();
    } else {
      setErrorMessage(res.error || "Failed to update homepage status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    const id = itemToDelete.id || itemToDelete._id;
    if (!id) return;

    setSaving(true);
    const res = await deleteAdminGalleryItem(id, token);
    setSaving(false);

    if (!res.ok) {
      setErrorMessage(res.error || "Failed to delete item.");
    } else {
      setItems((prev) => prev.filter((i) => (i.id || i._id) !== id));
      showNotification(`🗑️ Deleted item "${itemToDelete.title}".`);
      setItemToDelete(null);
      onRefresh?.();
    }
  };

  // Filtered gallery items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;
      if (typeFilter !== "all" && item.mediaType !== typeFilter) return false;
      if (homepageFilter === "homepage" && !item.showOnHomepage) return false;
      if (categoryFilter !== "all" && item.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const mTitle = item.title.toLowerCase().includes(q);
        const mDesc = item.description?.toLowerCase().includes(q);
        const mCat = item.category?.toLowerCase().includes(q);
        if (!mTitle && !mDesc && !mCat) return false;
      }
      return true;
    });
  }, [items, statusFilter, typeFilter, homepageFilter, categoryFilter, search]);

  const activeCount = useMemo(() => items.filter((i) => i.isActive).length, [items]);
  const inactiveCount = useMemo(() => items.filter((i) => !i.isActive).length, [items]);
  const homepageCount = useMemo(() => items.filter((i) => i.showOnHomepage && i.isActive).length, [items]);
  const photoCount = useMemo(() => items.filter((i) => i.mediaType === "photo").length, [items]);
  const videoCount = useMemo(() => items.filter((i) => i.mediaType === "video").length, [items]);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <span>{notification}</span>
          <button onClick={() => setNotification("")} className="text-emerald-600 hover:text-emerald-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm font-semibold text-red-800 flex items-center justify-between shadow-xs animate-fadeIn">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="text-red-600 hover:text-red-900">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Main Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-saffron-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink">
              Our Gallery Management
            </h1>
            <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-xs font-bold text-saffron-800">
              {items.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Manage authentic puja ceremony photos and short videos (max 3 mins) displayed on homepage and dedicated gallery.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewItemModal}
          className="btn-primary !py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Add Gallery Item</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Active Items</span>
          <p className="font-display text-lg font-bold text-emerald-600 mt-0.5">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Inactive Items</span>
          <p className="font-display text-lg font-bold text-slate-500 mt-0.5">{inactiveCount}</p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">On Homepage</span>
          <p className="font-display text-lg font-bold text-saffron-700 mt-0.5">{homepageCount}</p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Photos</span>
          <p className="font-display text-lg font-bold text-indigo-600 mt-0.5">{photoCount}</p>
        </div>
        <div className="rounded-2xl border border-saffron-100 bg-white p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">Videos (≤3m)</span>
          <p className="font-display text-lg font-bold text-rose-600 mt-0.5">{videoCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description, or category..."
              className="w-full rounded-xl border border-saffron-200 bg-cream/30 pl-10 pr-9 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200"
            >
              <option value="all">Type: All</option>
              <option value="photo">Photos Only</option>
              <option value="video">Videos Only</option>
            </select>

            <select
              value={homepageFilter}
              onChange={(e) => setHomepageFilter(e.target.value as any)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200"
            >
              <option value="all">Visibility: All</option>
              <option value="homepage">Homepage Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200"
            >
              <option value="all">Category: All</option>
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Items Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-saffron-600 border-t-transparent" />
          <p className="text-xs text-ink-soft">Loading gallery records from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-saffron-200 bg-white p-12 text-center max-w-md mx-auto">
          <span className="text-4xl block mb-2">🖼️</span>
          <h3 className="font-display text-base font-bold text-ink">No Gallery Items Found</h3>
          <p className="text-xs text-ink-soft mt-1">
            {items.length === 0
              ? "You haven't added any gallery items yet. Click '+ Add Gallery Item' above to get started."
              : "No items match your active search or filter criteria."}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              onClick={openNewItemModal}
              className="btn-primary mt-4 !py-2 !px-4 !text-xs"
            >
              + Add First Gallery Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const isVideo = item.mediaType === "video";
            const hasYouTube = Boolean(isVideo && item.youtubeUrl && item.youtubeVideoId);
            const thumb = item.thumbnailUrl || item.imageUrl || "/logo.jpeg";

            return (
              <div
                key={item.id || item._id}
                className={`flex flex-col rounded-2xl border transition-all duration-200 bg-white shadow-2xs overflow-hidden ${
                  item.isActive ? "border-saffron-200 hover:border-saffron-400" : "border-slate-200 opacity-65 bg-slate-50"
                }`}
              >
                {/* Media Thumbnail Container */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={thumb}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 360px"
                  />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/20">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasYouTube && (
                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          YouTube
                        </span>
                      )}
                      <span className="rounded-full bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-ink">
                        {isVideo ? (
                          <span className="flex items-center gap-1">
                            <Play className="h-2.5 w-2.5 fill-saffron-600 text-saffron-600" />
                            {item.videoDurationSeconds ? `${item.videoDurationSeconds}s` : "Video"}
                          </span>
                        ) : (
                          "Photo"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Center Play Button for Videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-600/90 text-white shadow-md">
                        <Play className="h-5 w-5 fill-white ml-0.5" />
                      </span>
                    </div>
                  )}

                  {/* Display Order Pill */}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                    Order #{item.displayOrder}
                  </span>
                </div>

                {/* Card Content & Action Bar */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-ink leading-tight">
                        {item.title}
                      </h3>
                      {item.isDemo && (
                        <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase">
                          Demo
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-ink-soft line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Toggles Row */}
                  <div className="pt-2 border-t border-saffron-100/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      <span>{item.isActive ? "Active" : "Inactive"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleHomepage(item)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                        item.showOnHomepage
                          ? "bg-saffron-50 text-saffron-800 border border-saffron-200"
                          : "bg-slate-50 text-slate-400 border border-slate-200"
                      }`}
                      title="Toggle homepage display"
                    >
                      <Home className="h-3 w-3" />
                      <span>{item.showOnHomepage ? "Homepage: Yes" : "Homepage: No"}</span>
                    </button>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-2 border-t border-saffron-100/70 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 rounded-lg text-ink-soft hover:bg-saffron-50 hover:text-saffron-800 transition-colors cursor-pointer"
                      title="Preview Media"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-ink-soft hover:bg-saffron-50 hover:text-saffron-800 transition-colors cursor-pointer"
                      title="Edit Item"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-lg text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-saffron-100 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-saffron-100 px-6 py-4 bg-[#FFFDF9] shrink-0">
              <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                {draft.id ? "Edit Gallery Item" : "Add New Gallery Item"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-full p-1 text-ink-soft hover:bg-saffron-50 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 animate-shake">
                  ⚠️ {formError}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={draft.title}
                    onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Ganesh Puja, Maha Aarti"
                    className="w-full rounded-xl border border-saffron-200 bg-cream/30 px-3.5 py-2 text-sm text-ink focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}
                    className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-sm text-ink focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200"
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Sacred rituals, Vedic mantras, and spiritual devotion consecrated by Acharyas."
                  className="w-full rounded-xl border border-saffron-200 bg-cream/30 px-3.5 py-2 text-sm text-ink focus:border-saffron-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-saffron-200 resize-none"
                />
              </div>

              {/* Media Type Selector */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Media Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, mediaType: "photo" }))}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      draft.mediaType === "photo"
                        ? "border-saffron-500 bg-saffron-50 text-saffron-900 ring-2 ring-saffron-400/40"
                        : "border-saffron-200 bg-white text-ink-soft hover:bg-slate-50"
                    }`}
                  >
                    <Camera className="h-4 w-4" />
                    <span>Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, mediaType: "video" }))}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      draft.mediaType === "video"
                        ? "border-saffron-500 bg-saffron-50 text-saffron-900 ring-2 ring-saffron-400/40"
                        : "border-saffron-200 bg-white text-ink-soft hover:bg-slate-50"
                    }`}
                  >
                    <Film className="h-4 w-4" />
                    <span>Video (≤ 3 Minutes)</span>
                  </button>
                </div>
              </div>

              {/* PHOTO CONTROLS */}
              {draft.mediaType === "photo" && (
                <div className="rounded-2xl border border-saffron-200 bg-saffron-50/40 p-4 space-y-3">
                  <h4 className="text-xs font-bold text-saffron-800 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Photo Upload & Source</span>
                  </h4>

                  {/* Upload from Computer */}
                  <div>
                    <label
                      htmlFor="photo-upload-input"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-saffron-300 bg-white py-3 text-xs font-bold text-saffron-800 hover:bg-saffron-50 transition-all cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      <span>{isUploadingPhoto ? "Optimizing & Compressing..." : "Upload Photo from Computer"}</span>
                    </label>
                    <input
                      id="photo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <span className="flex-1 h-px bg-saffron-200" />
                    <span>OR PASTE IMAGE URL</span>
                    <span className="flex-1 h-px bg-saffron-200" />
                  </div>

                  {/* Direct Image URL input */}
                  <div>
                    <input
                      type="url"
                      value={draft.imageUrl}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          imageUrl: e.target.value,
                          thumbnailUrl: p.thumbnailUrl || e.target.value,
                        }))
                      }
                      placeholder="https://example.com/photo.jpg"
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none"
                    />
                  </div>

                  {/* Image Preview */}
                  {draft.imageUrl && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-saffron-200 bg-slate-100">
                      <Image
                        src={draft.imageUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* VIDEO CONTROLS */}
              {draft.mediaType === "video" && (
                <div className="rounded-2xl border border-saffron-200 bg-saffron-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-saffron-800 flex items-center gap-1.5">
                      <Film className="h-3.5 w-3.5" />
                      <span>Video Details & YouTube Link</span>
                    </h4>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                      Max Duration: 3 Mins (180s)
                    </span>
                  </div>

                  {/* YouTube URL input */}
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      YouTube URL (Supports Standard, Shorts, and youtu.be)
                    </label>
                    <input
                      type="url"
                      value={draft.youtubeUrl}
                      onChange={(e) => handleYouTubeUrlChange(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none"
                    />
                    {draft.youtubeVideoId && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        ✓ Valid YouTube Video ID: {draft.youtubeVideoId}
                      </p>
                    )}
                  </div>

                  {/* Duration Control */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        Video Duration (Seconds) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={180}
                        value={draft.videoDurationSeconds}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, videoDurationSeconds: Math.min(180, Number(e.target.value)) }))
                        }
                        className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-ink focus:border-saffron-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-ink-soft mt-0.5">
                        {Math.floor(draft.videoDurationSeconds / 60)}m {draft.videoDurationSeconds % 60}s (Must be ≤ 180s)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">
                        Custom Thumbnail (Optional)
                      </label>
                      <input
                        type="url"
                        value={draft.thumbnailUrl}
                        onChange={(e) => setDraft((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                        placeholder="https://example.com/thumbnail.jpg"
                        className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Video Thumbnail Preview */}
                  {draft.thumbnailUrl && (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-saffron-200 bg-slate-900">
                      <Image
                        src={draft.thumbnailUrl}
                        alt="Video Thumbnail Preview"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-saffron-600/90 text-white shadow-md">
                          <Play className="h-5 w-5 fill-white ml-0.5" />
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Display Settings: Order, Active, Homepage */}
              <div className="rounded-2xl border border-saffron-100 bg-cream/40 p-4 space-y-3">
                <h4 className="text-xs font-bold text-ink">Display & Visibility Settings</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">
                      Display Order #
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={draft.displayOrder}
                      onChange={(e) => setDraft((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-ink focus:border-saffron-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is-active-check"
                      checked={draft.isActive}
                      onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.checked }))}
                      className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-400"
                    />
                    <label htmlFor="is-active-check" className="text-xs font-bold text-ink cursor-pointer">
                      Active (Visible to Public)
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="show-homepage-check"
                      checked={draft.showOnHomepage}
                      onChange={(e) => setDraft((p) => ({ ...p, showOnHomepage: e.target.checked }))}
                      className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-400"
                    />
                    <label htmlFor="show-homepage-check" className="text-xs font-bold text-ink cursor-pointer">
                      Show on Homepage
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-saffron-200 bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-saffron-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || isUploadingPhoto}
                  className="btn-primary !py-2 !px-5 !text-xs font-bold inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{draft.id ? "Update Item" : "Save Item"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-saffron-100 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertCircle className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink">
                  Delete Gallery Item?
                </h3>
                <p className="text-xs text-ink-soft">
                  Are you sure you want to remove &quot;{itemToDelete.title}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              This action cannot be undone. You can also choose to deactivate the item instead so it is hidden from the public without deleting.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-saffron-200 px-4 py-2 text-xs font-bold text-ink hover:bg-saffron-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors"
              >
                {saving ? "Deleting..." : "Yes, Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Lightbox */}
      <GalleryModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
