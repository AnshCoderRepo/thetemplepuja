"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Pooja } from "@/lib/data";
import { isPoojaActive } from "@/lib/data";
import { PoojaImage } from "@/components/common";

interface ServiceCardEditModalProps {
  isOpen: boolean;
  pooja: Pooja | null;
  onClose: () => void;
  onSave: (updated: Pooja) => Promise<void>;
  onDelete?: (pooja: Pooja) => void;
}

export default function ServiceCardEditModal({
  isOpen,
  pooja,
  onClose,
  onSave,
  onDelete,
}: ServiceCardEditModalProps) {
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [showBadge, setShowBadge] = useState(true);
  const [active, setActive] = useState(true);
  const [showInHero, setShowInHero] = useState(false);
  const [showInHeroCard, setShowInHeroCard] = useState(false);
  const [showInCatalog, setShowInCatalog] = useState(true);
  const [displayOrder, setDisplayOrder] = useState<number | "">("");
  const [ctaText, setCtaText] = useState("");
  const [ctaLink, setCtaLink] = useState("");

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load selected card's data when modal opens or selected pooja changes
  useEffect(() => {
    if (pooja && isOpen) {
      setTitle(pooja.title || "");
      setDescription(pooja.description || "");
      setImageUrl(pooja.imageUrl || "");
      setBadge(pooja.badge || "");
      setShowBadge(pooja.showBadge !== false);
      setActive(isPoojaActive(pooja));
      setShowInHero(
        pooja.showInHero !== undefined
          ? Boolean(pooja.showInHero)
          : pooja.slug === "satyanarayan-katha" || pooja.slug === "rudrabhishek"
      );
      setShowInHeroCard(
        pooja.showInHeroCard !== undefined
          ? Boolean(pooja.showInHeroCard)
          : pooja.slug === "satyanarayan-katha"
      );
      setShowInCatalog(pooja.showInCatalog !== false);
      setDisplayOrder(pooja.displayOrder !== undefined ? pooja.displayOrder : "");
      setCtaText(pooja.ctaText || "");
      setCtaLink(pooja.ctaLink || "");
      setFormError("");
      setSuccessMessage("");
    }
  }, [pooja, isOpen]);

  if (!isOpen || !pooja) return null;

  // Handle image upload with validation and canvas optimization
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError("");

    // Validate image MIME type and file extension
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/avif",
      "image/gif",
    ];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFormError(
        `Invalid file type "${file.type || "unknown"}". Please select a JPEG, PNG, or WebP image.`
      );
      e.target.value = "";
      return;
    }

    // Maximum file size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError("Image file size exceeds 10 MB. Please choose a smaller image.");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (!dataUrl) {
        setUploadingImage(false);
        return;
      }

      // Optimize image on canvas to maintain high quality without huge base64 payloads
      const img = new Image();
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
          const compressed = canvas.toDataURL("image/jpeg", 0.84);
          setImageUrl(compressed);
        } else {
          setImageUrl(dataUrl);
        }
        setUploadingImage(false);
      };
      img.onerror = () => {
        setImageUrl(dataUrl);
        setUploadingImage(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setFormError("Failed to read image file. Please try again.");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    // Validate required fields
    if (!title.trim()) {
      setFormError("Service title is required.");
      return;
    }

    if (!description.trim()) {
      setFormError("Service description is required.");
      return;
    }

    setSaving(true);

    try {
      // Build updated pooja record preserving all existing optional fields
      const updatedPooja: Pooja = {
        ...pooja,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        badge: badge.trim() || undefined,
        showBadge,
        active,
        showInHero,
        showInHeroCard,
        showInCatalog,
        displayOrder: displayOrder === "" ? undefined : Number(displayOrder),
        ctaText: ctaText.trim() || undefined,
        ctaLink: ctaLink.trim() || undefined,
      };

      await onSave(updatedPooja);
      setSuccessMessage("Changes saved successfully!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save service card changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-saffron-100 bg-white shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-saffron-100/80 px-6 py-4 bg-gradient-to-r from-saffron-50/70 via-cream to-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-500/20 text-lg">
              🪔
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-ink truncate">
                Edit Service Card
              </h2>
              <p className="text-[11px] text-ink-soft truncate">
                Manage card content, banner image, badge text, visibility, and CTA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-saffron-100 hover:text-ink transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* Notifications */}
          {formError && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Live Card Preview Box */}
          <div className="rounded-2xl border border-saffron-200/80 bg-gradient-to-br from-amber-50/50 to-cream/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-saffron-900 uppercase tracking-wider">
              <span>Card Live Preview</span>
              <span className="text-[10px] font-semibold text-ink-soft normal-case">
                Preview of how this service card will appear to devotees
              </span>
            </div>

            <div className="rounded-2xl border border-saffron-200 bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                {imageUrl ? (
                  <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-saffron-200 bg-slate-900 shadow-2xs">
                    <PoojaImage src={imageUrl} alt={title || "Preview"} fallbackSize="sm" />
                  </div>
                ) : (
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-saffron-100 text-2xl border border-saffron-200">
                    {pooja.emoji || "🪔"}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="font-display text-sm font-bold text-ink truncate">
                      {title || "Service Title"}
                    </h4>
                    {showBadge && (badge || "DEMO") && (
                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-xs">
                        {badge || "DEMO"}
                      </span>
                    )}
                    {!active && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                        HIDDEN
                      </span>
                    )}
                    {displayOrder !== "" && (
                      <span className="rounded-full bg-saffron-100 text-saffron-800 px-1.5 py-0.5 text-[9px] font-bold">
                        #{displayOrder}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-ink-soft line-clamp-2 mt-1 leading-relaxed">
                    {description || "Service description will appear here..."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-saffron-100/60 pt-2 text-[11px]">
                <span className="font-semibold text-saffron-800">
                  Target: {ctaLink || `/book/${pooja.slug}`}
                </span>
                <span className="rounded-lg bg-saffron-500 text-white font-bold px-3 py-1 text-[11px] shadow-xs">
                  {ctaText || "Book Now"} →
                </span>
              </div>

              {/* Placement Badges Preview */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-saffron-100/40 text-[10px]">
                <span className="font-semibold text-ink-soft">Placements:</span>
                {showInHero && (
                  <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 font-semibold">
                    ✨ Hero Section
                  </span>
                )}
                {showInHeroCard && (
                  <span className="rounded-md bg-purple-50 text-purple-800 border border-purple-200 px-1.5 py-0.5 font-semibold">
                    🎴 Hero Card
                  </span>
                )}
                {showInCatalog && (
                  <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 font-semibold">
                    📖 Catalog
                  </span>
                )}
                {!showInHero && !showInHeroCard && !showInCatalog && (
                  <span className="rounded-md bg-slate-100 text-slate-500 px-1.5 py-0.5 font-medium">
                    Hidden from all public placements
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1. Service Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Service Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Test Demo Pooja (₹1) or Rudrabhishek"
              className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-100 font-medium"
            />
          </div>

          {/* 2. Service Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink">
              Service Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the divine blessings, rituals, and offerings included in this sacred seva..."
              className="w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none focus:ring-2 focus:ring-saffron-100 leading-relaxed font-medium"
            />
          </div>

          {/* 3. Card/Banner Image with Preview & Replacement Upload */}
          <div className="space-y-2 rounded-2xl border border-saffron-100 bg-cream/30 p-4">
            <label className="block text-xs font-bold text-ink">
              Card / Banner Image
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
              {/* Image Preview Box */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-saffron-200 bg-slate-900 flex items-center justify-center">
                {imageUrl ? (
                  <>
                    <PoojaImage src={imageUrl} alt={title || "Banner Preview"} fallbackSize="md" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-rose-600 transition-colors shadow-md"
                      title="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-3 text-ink-soft/70">
                    <ImageIcon className="h-8 w-8 mx-auto text-saffron-400 mb-1" />
                    <span className="text-[10px]">No banner image set (using deity emoji fallback)</span>
                  </div>
                )}
              </div>

              {/* Upload & URL Controls */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-soft mb-1">
                    Upload Replacement Image (JPEG, PNG, WebP)
                  </label>
                  <label className="flex items-center justify-center gap-2 w-full cursor-pointer rounded-xl border border-dashed border-saffron-300 bg-white px-3 py-2 text-xs font-bold text-saffron-700 hover:bg-saffron-50 hover:border-saffron-400 transition-colors shadow-2xs">
                    <Upload className="h-3.5 w-3.5 text-saffron-600" />
                    <span>{uploadingImage ? "Optimizing image…" : "Choose Image File"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      onChange={handleImageFileChange}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-ink-soft mb-1">
                    Or Direct Image URL / Path
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or /festivals/ganesha-altar.jpg"
                    className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-1.5 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Badge Settings: Badge Text & Visibility Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-saffron-100 bg-cream/30">
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Tag className="h-3.5 w-3.5 text-saffron-600" />
                <span>Badge Text</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. DEMO, Live Demo, Most Popular"
                className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none font-medium"
              />
              <span className="block text-[10px] text-ink-soft/80">
                Text shown in the pill badge on the card (e.g. DEMO)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Badge Visibility
              </label>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowBadge((prev) => !prev)}
                  className={`inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                    showBadge
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {showBadge ? (
                    <>
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Badge Visible on Card</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                      <span>Badge Hidden</span>
                    </>
                  )}
                </button>
              </div>
              <span className="block text-[10px] text-ink-soft/80">
                Toggle whether the top badge is displayed to devotees
              </span>
            </div>
          </div>

          {/* 5. Status & Display Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-saffron-100 bg-cream/30">
            {/* Active / Inactive Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Service Status (Active / Inactive)
              </label>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActive((prev) => !prev)}
                  className={`inline-flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                    active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border-slate-300 bg-slate-100 text-slate-700"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {active ? "Active (Visible to Devotees)" : "Inactive (Hidden from Public)"}
                  </span>
                </button>
              </div>
              <span className="block text-[10px] text-ink-soft/80">
                Inactive cards are safely hidden from the public website but remain editable here
              </span>
            </div>

            {/* Display Order */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                Display Order
              </label>
              <input
                type="number"
                min={1}
                value={displayOrder}
                onChange={(e) =>
                  setDisplayOrder(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="e.g. 1 (Top ranking), 2, 3..."
                className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none font-medium"
              />
              <span className="block text-[10px] text-ink-soft/80">
                Determines card ranking order in the public catalog (lower number = shown first)
              </span>
            </div>
          </div>

          {/* Display Settings — Where should this puja appear? */}
          <div className="space-y-3 rounded-2xl border-2 border-saffron-300 bg-gradient-to-br from-amber-50/70 via-cream to-white p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-saffron-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-saffron-500 text-white text-xs">
                  ✨
                </span>
                <div>
                  <h4 className="text-xs font-bold text-ink">
                    Display Settings — Where should this puja appear?
                  </h4>
                  <p className="text-[10px] text-ink-soft">
                    Choose independent placements across website sections
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-saffron-800 bg-saffron-100 px-2 py-0.5 rounded-full">
                Placements
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Show in Hero Section */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  showInHero
                    ? "border-amber-400 bg-amber-50/90 shadow-xs ring-1 ring-amber-300"
                    : "border-saffron-100 bg-white hover:bg-saffron-50/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showInHero}
                  onChange={(e) => setShowInHero(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-400 accent-saffron-600"
                />
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span>Show in Hero Section (Featured Sacred Rituals)</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
                      Hero Banner
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft leading-normal">
                    Displays this puja as an interactive quick-access chip under Featured Sacred Rituals on the main homepage hero banner.
                  </p>
                </div>
              </label>

              {/* Option 2: Show in Hero Featured Puja Card */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  showInHeroCard
                    ? "border-purple-400 bg-purple-50/90 shadow-xs ring-1 ring-purple-300"
                    : "border-saffron-100 bg-white hover:bg-saffron-50/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showInHeroCard}
                  onChange={(e) => setShowInHeroCard(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-400 accent-purple-600"
                />
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span>Show in Hero Featured Puja Card (right-side booking card)</span>
                    <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-800">
                      Right Card
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft leading-normal">
                    Presents this puja inside the prominent right-side booking card in the hero banner with instant booking navigation.
                  </p>
                </div>
              </label>

              {/* Option 3: Show in Puja Catalog */}
              <label
                className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  showInCatalog
                    ? "border-emerald-400 bg-emerald-50/90 shadow-xs ring-1 ring-emerald-300"
                    : "border-saffron-100 bg-white hover:bg-saffron-50/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showInCatalog}
                  onChange={(e) => setShowInCatalog(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-400 accent-emerald-600"
                />
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span>Show in Puja Catalog</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                      Catalog Grid
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft leading-normal">
                    Lists this puja in the main public Puja Catalog (/poojas) with category filters, deities, and search.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* 6. CTA Button Settings: Button Text & Link URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-saffron-100 bg-cream/30">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-ink">
                CTA Button Text
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="e.g. Book Now or Book for ₹1 →"
                className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none font-medium"
              />
              <span className="block text-[10px] text-ink-soft/80">
                Action text on the button (defaults to &ldquo;Book Now&rdquo;)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <ExternalLink className="h-3 w-3 text-saffron-600" />
                <span>CTA Button Link / URL</span>
              </label>
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
                placeholder={`/book/${pooja.slug}`}
                className="w-full rounded-xl border border-saffron-200 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-soft/40 focus:border-saffron-500 focus:outline-none font-medium"
              />
              <span className="block text-[10px] text-ink-soft/80">
                Target URL when devotee clicks the card or button (defaults to /book/{pooja.slug})
              </span>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-between border-t border-saffron-100 pt-4 mt-6">
            <div>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(pooja)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Card</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-saffron-200 bg-white px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-saffron-50 hover:text-ink transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Changes…</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
