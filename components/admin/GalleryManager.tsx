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
  RotateCcw,
} from "lucide-react";
import type { GalleryItem, GalleryMediaType } from "@/lib/gallery-types";
import {
  GALLERY_CATEGORIES,
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  getGalleryItemImages,
  getGalleryItemVideos,
  hasYouTubeVideo,
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
  photos: string[];
  videos: string[];
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
  photos: [""],
  videos: [""],
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
  const [typeFilter, setTypeFilter] = useState<"all" | "photo" | "video" | "mixed">("all");
  const [homepageFilter, setHomepageFilter] = useState<"all" | "homepage">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modal editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

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

  // Handle client-side image compression & upload for photo index
  const handlePhotoUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError(`Photo ${index + 1}: Selected file is not an image. Please choose a JPG, PNG, or WebP.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError(`Photo ${index + 1}: File size exceeds 5MB limit. Please choose a smaller image.`);
      return;
    }

    setFormError("");
    setUploadingIndex(index);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setUploadingIndex(null);
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
        const finalUrl = ctx
          ? (ctx.drawImage(img, 0, 0, width, height), canvas.toDataURL("image/jpeg", 0.84))
          : rawDataUrl;

        setDraft((prev) => {
          const nextPhotos = [...prev.photos];
          nextPhotos[index] = finalUrl;
          return { ...prev, photos: nextPhotos };
        });

        setUploadingIndex(null);
        showNotification(`🖼️ Photo ${index + 1} uploaded and optimized successfully!`);
      };

      img.onerror = () => {
        setDraft((prev) => {
          const nextPhotos = [...prev.photos];
          nextPhotos[index] = rawDataUrl;
          return { ...prev, photos: nextPhotos };
        });
        setUploadingIndex(null);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setFormError(`Photo ${index + 1}: Could not read image file.`);
      setUploadingIndex(null);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePhotoUrlChange = (index: number, val: string) => {
    setDraft((prev) => {
      const nextPhotos = [...prev.photos];
      nextPhotos[index] = val;
      return { ...prev, photos: nextPhotos };
    });
  };

  const handleAddPhotoSlot = () => {
    setDraft((prev) => ({
      ...prev,
      photos: [...prev.photos, ""],
    }));
  };

  const handleRemovePhoto = (index: number) => {
    setDraft((prev) => {
      const nextPhotos = prev.photos.filter((_, i) => i !== index);
      return {
        ...prev,
        photos: nextPhotos.length > 0 ? nextPhotos : [""],
      };
    });
  };

  const handleVideoUrlChange = (index: number, val: string) => {
    setDraft((prev) => {
      const nextVideos = [...prev.videos];
      nextVideos[index] = val;
      return { ...prev, videos: nextVideos };
    });
  };

  const handleAddVideoSlot = () => {
    setDraft((prev) => ({
      ...prev,
      videos: [...prev.videos, ""],
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setDraft((prev) => {
      const nextVideos = prev.videos.filter((_, i) => i !== index);
      return {
        ...prev,
        videos: nextVideos.length > 0 ? nextVideos : [""],
      };
    });
  };

  const openNewItemModal = () => {
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.displayOrder || 1)) + 1 : 1;
    setDraft({ ...emptyDraft, displayOrder: nextOrder });
    setFormError("");
    setIsEditorOpen(true);
  };

  const openEditModal = (item: GalleryItem) => {
    const existingPhotos = getGalleryItemImages(item);
    const existingVideos = getGalleryItemVideos(item).map((v) => v.url);
    setDraft({
      id: item.id || item._id,
      _id: item.id || item._id,
      title: item.title,
      description: item.description || "",
      photos: existingPhotos.length > 0 ? existingPhotos : [""],
      videos: existingVideos.length > 0 ? existingVideos : [""],
      thumbnailUrl: item.thumbnailUrl || "",
      category: item.category || "Puja Ceremonies",
      isActive: item.isActive !== false,
      showOnHomepage: item.showOnHomepage !== false,
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

    // Collect available photos & videos
    const photos = draft.photos.map((p) => p.trim()).filter(Boolean);
    const videos = draft.videos.map((v) => v.trim()).filter(Boolean);

    // Validate video durations if YouTube links provided
    for (const vUrl of videos) {
      const id = extractYouTubeVideoId(vUrl);
      if (id && draft.videoDurationSeconds > 180) {
        setFormError("Video duration exceeds the maximum limit of 3 minutes (180 seconds).");
        return;
      }
    }

    // Must have at least 1 photo or 1 video
    if (photos.length === 0 && videos.length === 0) {
      setFormError("Please upload at least one photo or provide a video URL.");
      return;
    }

    setSaving(true);

    const hasVideo = videos.length > 0;
    const mediaType: GalleryMediaType =
      hasVideo
        ? photos.length > 0
          ? "mixed"
          : "video"
        : "photo";

    const firstYt = videos.map((v) => ({ url: v, id: extractYouTubeVideoId(v) })).find((v) => v.id);
    const firstDirect = videos.find((v) => !extractYouTubeVideoId(v));

    const payload: Partial<GalleryItem> = {
      id: draft.id,
      _id: draft._id,
      title: draft.title.trim(),
      description: draft.description.trim(),
      mediaType,
      images: photos,
      imageUrl: photos[0] || undefined,
      imageUrl2: photos[1] || undefined,
      imageUrl3: photos[2] || undefined,
      videos,
      videoUrls: videos,
      youtubeUrl: firstYt?.url || undefined,
      youtubeVideoId: firstYt?.id || undefined,
      videoUrl: firstDirect || videos[0] || undefined,
      thumbnailUrl:
        draft.thumbnailUrl.trim() ||
        (firstYt?.id ? getYouTubeThumbnailUrl(firstYt.id) || undefined : photos[0] || undefined),
      category: draft.category,
      isActive: draft.isActive,
      showOnHomepage: draft.showOnHomepage,
      displayOrder: Number(draft.displayOrder) || 1,
      isDemo: draft.isDemo,
      videoDurationSeconds: firstYt ? Number(draft.videoDurationSeconds) : undefined,
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

    showNotification(draft.id ? "✅ Gallery card updated successfully!" : "✨ New gallery card added!");
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

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter === "active" && !item.isActive) return false;
      if (statusFilter === "inactive" && item.isActive) return false;

      if (typeFilter === "photo" && item.mediaType !== "photo") return false;
      if (typeFilter === "video" && item.mediaType !== "video") return false;
      if (typeFilter === "mixed" && item.mediaType !== "mixed") return false;

      if (homepageFilter === "homepage" && !item.showOnHomepage) return false;

      if (categoryFilter !== "all" && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

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
  const videoCardsCount = useMemo(() => items.filter((i) => hasYouTubeVideo(i) || i.videoUrl).length, [items]);

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm font-semibold text-emerald-800 animate-slideDown shadow-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs sm:text-sm font-semibold text-rose-800 shadow-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={loadItems}
            className="ml-auto underline hover:text-rose-950 text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-saffron-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-50 text-saffron-700 border border-saffron-200">
              <Camera className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
              Gallery Management (3 Photos + 1 Video)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Each gallery card supports up to <strong>3 photos simultaneously</strong> and <strong>1 optional YouTube video</strong>. Replace individual photos anytime without re-uploading all three.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={openNewItemModal}
            className="btn-primary !py-2.5 !px-4 !text-xs sm:!text-sm inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Gallery Card</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-saffron-100 bg-[#FFFDF9] p-3 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-ink-soft">Total Cards</span>
          <p className="font-display text-lg font-bold text-ink">{items.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-800">Active Cards</span>
          <p className="font-display text-lg font-bold text-emerald-900">{activeCount}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/40 p-3 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-red-800">Video Cards</span>
          <p className="font-display text-lg font-bold text-red-900">{videoCardsCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-800">Homepage Pinned</span>
          <p className="font-display text-lg font-bold text-amber-900">
            {items.filter((i) => i.showOnHomepage && i.isActive).length}
          </p>
        </div>
      </div>

      {/* Filters Toolbar */}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink cursor-pointer"
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
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200 cursor-pointer"
            >
              <option value="all">Status: All</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200 cursor-pointer"
            >
              <option value="all">Media: All</option>
              <option value="photo">Photos Only</option>
              <option value="mixed">Mixed (Photos + Video)</option>
              <option value="video">Video Only</option>
            </select>

            <select
              value={homepageFilter}
              onChange={(e) => setHomepageFilter(e.target.value as any)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200 cursor-pointer"
            >
              <option value="all">Visibility: All</option>
              <option value="homepage">Homepage Only</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-saffron-200 cursor-pointer"
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
          <p className="text-xs text-ink-soft">Loading gallery cards from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-saffron-200 bg-white p-12 text-center max-w-md mx-auto">
          <span className="text-4xl block mb-2">🖼️</span>
          <h3 className="font-display text-base font-bold text-ink">No Gallery Cards Found</h3>
          <p className="text-xs text-ink-soft mt-1">
            {items.length === 0
              ? "You haven't added any gallery items yet. Click '+ Add Gallery Card' above to get started."
              : "No items match your active search or filter criteria."}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              onClick={openNewItemModal}
              className="btn-primary mt-4 !py-2 !px-4 !text-xs"
            >
              + Add First Gallery Card
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => {
            const photos = getGalleryItemImages(item);
            const videos = getGalleryItemVideos(item);
            const hasVideo = videos.length > 0;
            const hasYouTube = videos.some((v) => v.isYouTube) || hasYouTubeVideo(item);

            return (
              <div
                key={item.id || item._id}
                className={`flex flex-col rounded-2xl border transition-all duration-200 bg-white shadow-2xs overflow-hidden ${
                  item.isActive ? "border-saffron-200 hover:border-saffron-400" : "border-slate-200 opacity-70 bg-slate-50"
                }`}
              >
                {/* Responsive Media Box */}
                <div className="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden">
                  {/* Collage view in admin card */}
                  {photos.length >= 3 ? (
                    <div className="grid grid-cols-3 gap-0.5 h-full w-full">
                      <div className="col-span-2 relative h-full">
                        <Image
                          src={photos[0]}
                          alt={`${item.title} - 1`}
                          fill
                          className="object-cover"
                          sizes="240px"
                        />
                      </div>
                      <div className="col-span-1 grid grid-rows-2 gap-0.5 h-full">
                        <div className="relative h-full">
                          <Image
                            src={photos[1]}
                            alt={`${item.title} - 2`}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </div>
                        <div className="relative h-full">
                          <Image
                            src={photos[2]}
                            alt={`${item.title} - 3`}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                          {photos.length > 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold">
                              +{photos.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : photos.length === 2 ? (
                    <div className="grid grid-cols-2 gap-0.5 h-full w-full">
                      <div className="relative h-full">
                        <Image
                          src={photos[0]}
                          alt={`${item.title} - 1`}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                      </div>
                      <div className="relative h-full">
                        <Image
                          src={photos[1]}
                          alt={`${item.title} - 2`}
                          fill
                          className="object-cover"
                          sizes="180px"
                        />
                      </div>
                    </div>
                  ) : photos.length === 1 ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={photos[0]}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="360px"
                      />
                    </div>
                  ) : (
                    <div className="relative h-full w-full">
                      <Image
                        src={item.thumbnailUrl || (item.youtubeVideoId ? getYouTubeThumbnailUrl(item.youtubeVideoId) || "/logo.jpeg" : "/logo.jpeg")}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="360px"
                      />
                    </div>
                  )}

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white border border-white/20 truncate max-w-[120px]">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1">
                      {hasVideo && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                          <svg className="h-2.5 w-2.5 fill-current" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                          <span>{videos.length > 1 ? `${videos.length} Videos` : "Video"}</span>
                        </span>
                      )}

                      {photos.length > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-ink">
                          <Camera className="h-2.5 w-2.5 text-saffron-600" />
                          <span>{photos.length} {photos.length === 1 ? "Photo" : "Photos"}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play Icon if video is present */}
                  {hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/90 text-white shadow-md">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </span>
                    </div>
                  )}

                  {/* Display Order Pill */}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                    #{item.displayOrder}
                  </span>
                </div>

                {/* Card Content & Action Bar */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-sm font-bold text-ink leading-tight truncate">
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
                      title={item.isActive ? "Click to deactivate" : "Click to activate"}
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
                      title="Preview Card"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg text-ink-soft hover:bg-saffron-50 hover:text-saffron-800 transition-colors cursor-pointer"
                      title="Edit Gallery Card"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-saffron-100 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-saffron-100 px-6 py-4 bg-[#FFFDF9] shrink-0">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-ink">
                  {draft.id ? "Edit Gallery Card" : "Add New Gallery Card"}
                </h3>
                <p className="text-xs text-ink-soft">
                  Configure up to 3 photos and 1 optional YouTube video.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="rounded-full p-1.5 text-ink-soft hover:bg-saffron-50 hover:text-ink cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 animate-shake">
                  ⚠️ {formError}
                </div>
              )}

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Card Title <span className="text-rose-500">*</span>
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
                    className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2 text-sm text-ink focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-200 cursor-pointer"
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

              {/* ────────────────── SECTION 1: UNLIMITED PHOTOS MANAGEMENT ────────────────── */}
              <div className="rounded-2xl border border-saffron-200 bg-saffron-50/40 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-100 text-saffron-800">
                      <Camera className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-saffron-900">
                      Gallery Photos ({draft.photos.filter((p) => p.trim()).length} Added)
                    </h4>
                  </div>
                  <span className="text-[11px] text-ink-soft">
                    Add as many photos as you need. Upload files or paste image URLs.
                  </span>
                </div>

                {/* Photo Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draft.photos.map((photo, idx) => (
                    <div
                      key={`draft-photo-${idx}`}
                      className="rounded-xl border border-saffron-200/80 bg-white p-3 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink flex items-center gap-1">
                          <span>Photo {idx + 1}</span>
                          {idx === 0 && (
                            <span className="rounded bg-saffron-100 px-1 py-0.2 text-[9px] font-bold text-saffron-800">
                              Primary
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {photo && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextPhotos = [...draft.photos];
                                nextPhotos[idx] = "";
                                setDraft((p) => ({ ...p, photos: nextPhotos }));
                              }}
                              className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                              title="Clear photo image"
                            >
                              Clear
                            </button>
                          )}
                          {draft.photos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="text-[10px] font-semibold text-slate-500 hover:text-rose-700 cursor-pointer"
                              title="Delete photo slot"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Preview / Upload Box */}
                      {photo ? (
                        <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border border-saffron-100 bg-slate-100 group">
                          <Image
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label
                              htmlFor={`photo-upload-${idx}`}
                              className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-ink hover:bg-white cursor-pointer shadow-xs"
                            >
                              Replace
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor={`photo-upload-${idx}`}
                          className="flex flex-col items-center justify-center aspect-[4/3] w-full rounded-lg border-2 border-dashed border-saffron-200 bg-cream/30 hover:bg-saffron-50/60 transition-colors cursor-pointer text-center p-3"
                        >
                          <Upload className="h-5 w-5 text-saffron-600 mb-1" />
                          <span className="text-xs font-bold text-saffron-800">
                            {uploadingIndex === idx ? "Optimizing..." : `Upload Photo ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-ink-soft">JPG, PNG, WebP (≤5MB)</span>
                        </label>
                      )}

                      <input
                        id={`photo-upload-${idx}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handlePhotoUpload(idx, e)}
                        disabled={uploadingIndex !== null}
                        className="hidden"
                      />

                      {/* Direct URL input */}
                      <div>
                        <input
                          type="url"
                          value={photo}
                          onChange={(e) => handlePhotoUrlChange(idx, e.target.value)}
                          placeholder={`Or paste photo ${idx + 1} URL...`}
                          className="w-full rounded-lg border border-saffron-200 bg-white px-2.5 py-1 text-[11px] text-ink placeholder:text-slate-400 focus:border-saffron-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* + Add Another Photo Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAddPhotoSlot}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-saffron-400 bg-white px-4 py-2 text-xs font-bold text-saffron-800 hover:bg-saffron-50 hover:border-saffron-600 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-saffron-600" />
                    <span>+ Add Another Photo</span>
                  </button>
                </div>
              </div>

              {/* ────────────────── SECTION 2: UNLIMITED VIDEOS MANAGEMENT ────────────────── */}
              <div className="rounded-2xl border border-red-200/80 bg-red-50/30 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-red-700">
                      <Film className="h-3.5 w-3.5" />
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-ink">
                      Gallery Videos ({draft.videos.filter((v) => v.trim()).length} Added)
                    </h4>
                  </div>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                    Max 3 Mins (180s) each
                  </span>
                </div>

                {/* Video Links List */}
                <div className="space-y-3">
                  {draft.videos.map((videoUrl, idx) => {
                    const videoId = extractYouTubeVideoId(videoUrl);
                    return (
                      <div
                        key={`draft-video-${idx}`}
                        className="rounded-xl border border-red-200 bg-white p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-ink">
                            Video {idx + 1} URL (YouTube or Direct Video)
                          </label>
                          {draft.videos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVideo(idx)}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Remove Video {idx + 1}
                            </button>
                          )}
                        </div>

                        <div className="relative">
                          <input
                            type="url"
                            value={videoUrl}
                            onChange={(e) => handleVideoUrlChange(idx, e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or MP4 link"
                            className="w-full rounded-xl border border-saffron-200 bg-white pl-3.5 pr-24 py-2 text-xs sm:text-sm text-ink placeholder:text-slate-400 focus:border-red-500 focus:outline-none"
                          />
                          {videoId && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-bold text-red-600">
                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                              </svg>
                              <span>Verified</span>
                            </div>
                          )}
                        </div>

                        {/* YouTube Preview if valid ID */}
                        {videoId && (
                          <div className="flex flex-col sm:flex-row items-center gap-3 rounded-lg border border-red-100 bg-red-50/30 p-2.5">
                            <div className="relative aspect-video w-full sm:w-32 rounded overflow-hidden bg-black shrink-0">
                              <Image
                                src={getYouTubeThumbnailUrl(videoId) || "/logo.jpeg"}
                                alt={`Video ${idx + 1} Preview`}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
                                  <Play className="h-3 w-3 fill-white ml-0.5" />
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-mono text-ink-soft">
                                YouTube ID: {videoId}
                              </p>
                              <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-saffron-800 hover:text-saffron-950 mt-0.5"
                              >
                                <span>Open on YouTube</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* + Add Another Video Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleAddVideoSlot}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 hover:border-red-500 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-red-600" />
                    <span>+ Add Another Video Link</span>
                  </button>
                </div>
              </div>

              {/* Display & Order Settings */}
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
                      className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-400 cursor-pointer"
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
                      className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-400 cursor-pointer"
                    />
                    <label htmlFor="show-homepage-check" className="text-xs font-bold text-ink cursor-pointer">
                      Show on Homepage
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons: Save Changes & Cancel */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-xl border border-saffron-200 bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-saffron-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || uploadingIndex !== null}
                  className="btn-primary !py-2 !px-5 !text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>{draft.id ? "Save Changes" : "Create Card"}</span>
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
                  Delete Gallery Card?
                </h3>
                <p className="text-xs text-ink-soft">
                  Are you sure you want to remove &quot;{itemToDelete.title}&quot;?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
              This action cannot be undone. You can also deactivate the card instead so it stays saved in your admin dashboard while hidden from the public gallery.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-xl border border-saffron-200 px-4 py-2 text-xs font-bold text-ink hover:bg-saffron-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors cursor-pointer"
              >
                {saving ? "Deleting..." : "Yes, Delete Card"}
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
