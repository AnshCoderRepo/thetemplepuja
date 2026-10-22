"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Image as ImageIcon,
  Info,
  Languages,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { fetchCatalog, saveCatalogSection } from "@/lib/api";
import { isTempleActive, type Pooja, type Temple } from "@/lib/data";
import { TempleImage } from "@/components/common";
import ConfirmDialog from "./ConfirmDialog";

const inputCls =
  "w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200";

interface TempleDraft {
  slug: string;
  name: string;
  hindiName: string;
  teluguName: string;
  tamilName: string;
  deity: string;
  deities: string[];
  city: string;
  state: string;
  country: string;
  address: string;
  pincode: string;
  mapUrl: string;
  description: string;
  hindiDescription: string;
  history: string;
  hindiHistory: string;
  significance: string;
  hindiSignificance: string;
  image: string;
  gallery: string[];
  timings: string;
  openingDays: string;
  officialWebsite: string;
  contactPhone: string;
  contactEmail: string;
  visitorGuidance: string;
  hindiVisitorGuidance: string;
  active: boolean;
  poojaSlugs: string[];
  seoTitle: string;
  seoDescription: string;
}

const emptyDraft: TempleDraft = {
  slug: "",
  name: "",
  hindiName: "",
  teluguName: "",
  tamilName: "",
  deity: "",
  deities: [],
  city: "",
  state: "",
  country: "India",
  address: "",
  pincode: "",
  mapUrl: "",
  description: "",
  hindiDescription: "",
  history: "",
  hindiHistory: "",
  significance: "",
  hindiSignificance: "",
  image: "",
  gallery: [],
  timings: "5:00 AM – 9:30 PM",
  openingDays: "Open all 7 days year-round",
  officialWebsite: "",
  contactPhone: "",
  contactEmail: "",
  visitorGuidance: "Traditional modest attire is recommended. Cloakrooms and footwear counters are available at the entrance.",
  hindiVisitorGuidance: "पारंपरिक सात्विक वेशभूषा अनुशंसित है। प्रवेश द्वार पर जूता घर एवं लॉकर सुविधा उपलब्ध है।",
  active: true,
  poojaSlugs: [],
  seoTitle: "",
  seoDescription: "",
};

export default function TemplesManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}) {
  const [list, setList] = useState<Temple[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draft, setDraft] = useState<TempleDraft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Temple | null>(null);
  const [saving, setSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Media upload state
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [newCustomDeity, setNewCustomDeity] = useState("");

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setError("");
    try {
      const c = await fetchCatalog();
      if (Array.isArray(c.temples)) {
        setList(c.temples);
      }
      if (Array.isArray(c.poojas)) {
        setPoojas(c.poojas);
      }
      await onRefresh?.();
      showNotification("Temples and puja relationships reloaded with latest server data.");
    } catch {
      setError("Failed to reload temple data.");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) {
        if (Array.isArray(c.temples)) setList(c.temples);
        if (Array.isArray(c.poojas)) setPoojas(c.poojas);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

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
          const optimizedUrl = canvas.toDataURL("image/jpeg", 0.85);
          setDraft((prev) => ({ ...prev, image: optimizedUrl }));
        } else {
          setDraft((prev) => ({ ...prev, image: rawDataUrl }));
        }
        setIsUploadingImage(false);
        showNotification("🖼️ Primary temple photo uploaded and optimized from your computer!");
      };
      img.onerror = () => {
        setDraft((prev) => ({ ...prev, image: rawDataUrl }));
        setIsUploadingImage(false);
        showNotification("🖼️ Primary temple photo attached!");
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setError("Could not read image file. Please try another image.");
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingGallery(true);

    let processedCount = 0;
    const newImages: string[] = [];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
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
              newImages.push(canvas.toDataURL("image/jpeg", 0.82));
            } else {
              newImages.push(rawDataUrl);
            }
            processedCount++;
            if (processedCount === files.length) {
              setDraft((prev) => ({
                ...prev,
                gallery: [...prev.gallery, ...newImages],
              }));
              setIsUploadingGallery(false);
              showNotification(`📸 Added ${newImages.length} photos to temple gallery!`);
            }
          };
          img.onerror = () => {
            newImages.push(rawDataUrl);
            processedCount++;
            if (processedCount === files.length) {
              setDraft((prev) => ({
                ...prev,
                gallery: [...prev.gallery, ...newImages],
              }));
              setIsUploadingGallery(false);
            }
          };
          img.src = rawDataUrl;
        } else {
          processedCount++;
          if (processedCount === files.length) setIsUploadingGallery(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddGalleryUrl = () => {
    const trimmed = newGalleryUrl.trim();
    if (!trimmed) return;
    if (!draft.gallery.includes(trimmed)) {
      setDraft((prev) => ({ ...prev, gallery: [...prev.gallery, trimmed] }));
      setNewGalleryUrl("");
      showNotification("📸 Gallery photo added from URL!");
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setDraft((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const autoTranslateDetails = async () => {
    if (!draft.name.trim() && !draft.description.trim()) {
      setError("Please enter English Temple Name or Description first to translate.");
      return;
    }
    const srcName = draft.name.trim() || draft.hindiName.trim();
    if (!srcName && !draft.description.trim() && !draft.hindiDescription.trim()) {
      setError("Please enter the Temple Name or Description in at least one language first.");
      return;
    }

    setIsTranslating(true);
    setError("");
    try {
      if (srcName) {
        const sourceLang = draft.name.trim() ? "en" : "hi";
        const targets = ["en", "hi", "te", "ta"].filter((l) => l !== sourceLang);
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: srcName, source: sourceLang, targets }),
        });
        const data = await res.json();
        if (data.ok && data.translations) {
          setDraft((prev) => ({
            ...prev,
            name: sourceLang === "en" ? srcName : data.translations.en || prev.name || srcName,
            hindiName: sourceLang === "hi" ? srcName : data.translations.hi || prev.hindiName || srcName,
            teluguName: data.translations.te || prev.teluguName,
            tamilName: data.translations.ta || prev.tamilName,
          }));
        }
      }

      const srcDesc = draft.description.trim() || draft.hindiDescription.trim();
      if (srcDesc) {
        const sourceLang = draft.description.trim() ? "en" : "hi";
        const targets = ["en", "hi", "te", "ta"].filter((l) => l !== sourceLang);
        const resDesc = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: srcDesc, source: sourceLang, targets }),
        });
        const dataDesc = await resDesc.json();
        if (dataDesc.ok && dataDesc.translations) {
          setDraft((prev) => ({
            ...prev,
            description: sourceLang === "en" ? srcDesc : dataDesc.translations.en || prev.description || srcDesc,
            hindiDescription: sourceLang === "hi" ? srcDesc : dataDesc.translations.hi || prev.hindiDescription || srcDesc,
          }));
        }
      }

      if (draft.history.trim()) {
        const resHist = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.history.trim(), targets: ["hi"] }),
        });
        const dataHist = await resHist.json();
        if (dataHist.ok && dataHist.translations) {
          setDraft((prev) => ({
            ...prev,
            hindiHistory: dataHist.translations.hi || prev.hindiHistory,
          }));
        }
      }

      if (draft.significance.trim()) {
        const resSig = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: draft.significance.trim(), targets: ["hi"] }),
        });
        const dataSig = await resSig.json();
        if (dataSig.ok && dataSig.translations) {
          setDraft((prev) => ({
            ...prev,
            hindiSignificance: dataSig.translations.hi || prev.hindiSignificance,
          }));
        }
      }

      showNotification("✨ Temple details translated across all languages!");
    } catch {
      setError("Could not complete automatic translation.");
    } finally {
      setIsTranslating(false);
    }
  };

  const validate = (): string | null => {
    if (!draft.name.trim()) return "Temple name is required.";
    if (!draft.slug.trim()) return "Slug is required.";
    if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) {
      return "Slug must contain only lowercase letters, numbers, and hyphens (e.g. kashi-vishwanath).";
    }
    if (!draft.deity.trim()) return "Primary deity is required.";
    if (!draft.city.trim() || !draft.state.trim()) {
      return "City and state are required.";
    }
    if (
      list.some(
        (t) =>
          t.slug.trim().toLowerCase() === draft.slug.trim().toLowerCase() &&
          t.slug.trim().toLowerCase() !== editing?.trim().toLowerCase()
      )
    ) {
      return "Another temple already uses this slug.";
    }
    return null;
  };

  const toTemple = (): Temple => ({
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    hindiName: draft.hindiName.trim() || undefined,
    teluguName: draft.teluguName.trim() || undefined,
    tamilName: draft.tamilName.trim() || undefined,
    deity: draft.deity.trim(),
    deities: draft.deities.length > 0 ? draft.deities : undefined,
    city: draft.city.trim(),
    state: draft.state.trim(),
    country: draft.country.trim() || "India",
    address: draft.address.trim() || undefined,
    pincode: draft.pincode.trim() || undefined,
    mapUrl: draft.mapUrl.trim() || undefined,
    description: draft.description.trim(),
    hindiDescription: draft.hindiDescription.trim() || undefined,
    history: draft.history.trim() || undefined,
    hindiHistory: draft.hindiHistory.trim() || undefined,
    significance: draft.significance.trim() || undefined,
    hindiSignificance: draft.hindiSignificance.trim() || undefined,
    image: draft.image.trim() || undefined,
    gallery: draft.gallery.length > 0 ? draft.gallery : undefined,
    timings: draft.timings.trim() || undefined,
    openingDays: draft.openingDays.trim() || undefined,
    officialWebsite: draft.officialWebsite.trim() || undefined,
    contactPhone: draft.contactPhone.trim() || undefined,
    contactEmail: draft.contactEmail.trim() || undefined,
    visitorGuidance: draft.visitorGuidance.trim() || undefined,
    hindiVisitorGuidance: draft.hindiVisitorGuidance.trim() || undefined,
    active: draft.active,
    poojaSlugs: draft.poojaSlugs.length > 0 ? draft.poojaSlugs : undefined,
    seoTitle: draft.seoTitle.trim() || undefined,
    seoDescription: draft.seoDescription.trim() || undefined,
  });

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSaving(true);

    const temple = toTemple();
    const next = editing
      ? list.map((t) => (t.slug === editing ? temple : t))
      : [...list, temple];

    const res = await saveCatalogSection("temples", next, token);
    setSaving(false);

    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not save temple changes.");
      return;
    }

    setList(next);
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
    showNotification(editing ? `✨ Temple "${temple.name}" updated successfully.` : `✨ New temple "${temple.name}" published.`);
  };

  const startEdit = (t: Temple) => {
    setEditing(t.slug);
    setAdding(false);
    setError("");
    setDraft({
      slug: t.slug,
      name: t.name,
      hindiName: t.hindiName ?? "",
      teluguName: t.teluguName ?? "",
      tamilName: t.tamilName ?? "",
      deity: t.deity,
      deities: t.deities ? [...t.deities] : [],
      city: t.city,
      state: t.state,
      country: t.country ?? "India",
      address: t.address ?? "",
      pincode: t.pincode ?? "",
      mapUrl: t.mapUrl ?? "",
      description: t.description ?? "",
      hindiDescription: t.hindiDescription ?? "",
      history: t.history ?? "",
      hindiHistory: t.hindiHistory ?? "",
      significance: t.significance ?? "",
      hindiSignificance: t.hindiSignificance ?? "",
      image: t.image ?? "",
      gallery: t.gallery ? [...t.gallery] : [],
      timings: t.timings ?? "5:00 AM – 9:30 PM",
      openingDays: t.openingDays ?? "Open all 7 days year-round",
      officialWebsite: t.officialWebsite ?? "",
      contactPhone: t.contactPhone ?? "",
      contactEmail: t.contactEmail ?? "",
      visitorGuidance: t.visitorGuidance ?? "",
      hindiVisitorGuidance: t.hindiVisitorGuidance ?? "",
      active: isTempleActive(t),
      poojaSlugs: t.poojaSlugs ? [...t.poojaSlugs] : [],
      seoTitle: t.seoTitle ?? "",
      seoDescription: t.seoDescription ?? "",
    });
  };

  const startAdd = () => {
    setAdding(true);
    setEditing(null);
    setError("");
    setDraft(emptyDraft);
  };

  const cancel = () => {
    setAdding(false);
    setEditing(null);
    setError("");
    setDraft(emptyDraft);
  };

  const toggleActive = async (slug: string) => {
    const target = list.find((t) => t.slug === slug);
    if (!target) return;
    const nextActive = !isTempleActive(target);
    const next = list.map((t) => (t.slug === slug ? { ...t, active: nextActive } : t));

    const res = await saveCatalogSection("temples", next, token);
    if (!res.ok) {
      if (res.status === 401) onAuthError();
      return;
    }
    setList(next);
    showNotification(`Temple marked as ${nextActive ? "Active" : "Inactive"}.`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const next = list.filter((t) => t.slug !== deleteTarget.slug);
    const res = await saveCatalogSection("temples", next, token);
    if (!res.ok) {
      if (res.status === 401) onAuthError();
      return;
    }
    setList(next);
    setDeleteTarget(null);
    showNotification("Temple removed from catalog.");
  };

  const togglePoojaSlug = (poojaSlug: string) => {
    setDraft((prev) => {
      const exists = prev.poojaSlugs.includes(poojaSlug);
      return {
        ...prev,
        poojaSlugs: exists
          ? prev.poojaSlugs.filter((s) => s !== poojaSlug)
          : [...prev.poojaSlugs, poojaSlug],
      };
    });
  };

  const filtered = list.filter((t) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.hindiName && t.hindiName.toLowerCase().includes(q)) ||
      t.deity.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.state.toLowerCase().includes(q);

    const active = isTempleActive(t);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && active) ||
      (statusFilter === "inactive" && !active);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Building2 className="h-6 w-6 text-saffron-600" />
            Sacred Temple Management
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Manage complete temple profiles, consecrated sanctums, photo galleries, and puja associations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/temples"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-300 bg-saffron-50 px-3.5 py-2.5 text-xs font-bold text-saffron-800 hover:bg-saffron-100 shadow-xs transition-all"
            title="Preview customer-facing temple directory"
          >
            <span>Public Directory</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs font-bold text-ink-soft hover:bg-saffron-50 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            title="Reload latest temple catalog data from server"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-saffron-600 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {!adding && !editing && (
            <button
              type="button"
              onClick={startAdd}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-saffron-500/20 transition-all hover:from-saffron-600 hover:to-saffron-700 hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add New Temple
            </button>
          )}
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          {success}
        </div>
      )}

      {/* Add / Edit Form Modal / Card */}
      {(adding || editing) && (
        <div className="rounded-3xl border border-saffron-200 bg-white p-6 sm:p-8 shadow-xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-saffron-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-ink">
                  {editing ? `Edit Temple: ${draft.name}` : "Add New Sacred Temple"}
                </h3>
                {draft.slug && (
                  <Link
                    href={`/temples/${draft.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-700 bg-saffron-50 border border-saffron-200 px-2.5 py-0.5 rounded-full hover:bg-saffron-100"
                  >
                    <span>Preview Live Page</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
              <p className="text-xs text-ink-soft mt-0.5">
                Complete details update the public temple directory, booking venue cards, and pilgrimage guides immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={cancel}
              className="text-ink-soft/60 hover:text-ink cursor-pointer p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Card 1: Core Temple Names & Multi-Language */}
            <div className="rounded-2xl border border-saffron-200/80 bg-cream/15 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-saffron-100/80 pb-2">
                <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-saffron-600" />
                  <span>1. Names & Regional Languages</span>
                </span>
                <button
                  type="button"
                  onClick={autoTranslateDetails}
                  disabled={isTranslating}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-saffron-700 hover:text-saffron-800 bg-white border border-saffron-200 px-3 py-1 rounded-lg shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`h-3 w-3 ${isTranslating ? "animate-spin" : ""}`} />
                  <span>{isTranslating ? "Translating..." : "Auto-Translate to Indian Languages"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple Name (English) *
                  </label>
                  <input
                    type="text"
                    value={draft.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const slug =
                        !editing && !draft.slug
                          ? val
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/^-|-$/g, "")
                          : draft.slug;
                      setDraft({ ...draft, name: val, slug });
                    }}
                    placeholder="e.g. Kashi Vishwanath Temple"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple Name (Hindi)
                  </label>
                  <input
                    type="text"
                    value={draft.hindiName}
                    onChange={(e) => setDraft({ ...draft, hindiName: e.target.value })}
                    placeholder="e.g. काशी विश्वनाथ मंदिर"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    URL Slug * (Unique)
                  </label>
                  <input
                    type="text"
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value.toLowerCase() })}
                    placeholder="e.g. kashi-vishwanath"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple Name (Telugu)
                  </label>
                  <input
                    type="text"
                    value={draft.teluguName}
                    onChange={(e) => setDraft({ ...draft, teluguName: e.target.value })}
                    placeholder="e.g. కాశీ విశ్వనాథ ఆలయం"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple Name (Tamil)
                  </label>
                  <input
                    type="text"
                    value={draft.tamilName}
                    onChange={(e) => setDraft({ ...draft, tamilName: e.target.value })}
                    placeholder="e.g. காசி விஸ்வநாதர் கோயில்"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Primary Deity *
                  </label>
                  <input
                    type="text"
                    value={draft.deity}
                    onChange={(e) => setDraft({ ...draft, deity: e.target.value })}
                    placeholder="e.g. Lord Shiva / Mahakal"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Status Visibility
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink p-2 rounded-xl border border-saffron-200 bg-white">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                      className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500"
                    />
                    <span>Active (Published on public directory and search)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 2: Temple Photographs & Gallery */}
            <div className="rounded-2xl border border-saffron-200/80 bg-cream/15 p-4 sm:p-5 space-y-4">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-saffron-100/80 pb-2">
                <ImageIcon className="h-4 w-4 text-saffron-600" />
                <span>2. Temple Photographs & Sacred Gallery</span>
              </span>

              {/* Main Featured Photo */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div>
                    <label className="block text-xs font-bold text-ink">
                      Main Featured Temple Photograph
                    </label>
                    <p className="text-[11px] text-ink-soft">
                      Upload high quality photo from computer or paste web URL.
                    </p>
                  </div>
                  {draft.image && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                      ✓ Photo Attached
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Upload from Computer */}
                  <div className="flex flex-col justify-center rounded-xl border-2 border-dashed border-saffron-300 bg-white p-3.5 text-center hover:bg-saffron-50/40 transition-colors relative">
                    <input
                      type="file"
                      id="temple-primary-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="sr-only"
                    />
                    <label
                      htmlFor="temple-primary-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-saffron-100 text-saffron-700">
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-ink">
                        {isUploadingImage ? "Compressing & Attaching..." : "Upload from Computer"}
                      </span>
                      <span className="text-[10px] text-ink-soft">
                        PNG, JPG, WebP (Optimized client-side)
                      </span>
                    </label>
                  </div>

                  {/* Web Image URL */}
                  <div className="flex flex-col justify-center rounded-xl border border-saffron-200 bg-white p-3.5 space-y-1.5">
                    <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5 text-saffron-600" />
                      <span>Or Paste Web Image URL</span>
                    </label>
                    <input
                      type="url"
                      value={draft.image}
                      onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Primary Image Preview */}
                {draft.image && (
                  <div className="relative h-44 w-full sm:w-72 rounded-2xl overflow-hidden border border-saffron-200 shadow-sm bg-slate-900 group">
                    <TempleImage src={draft.image} alt="Preview" className="h-full w-full" />
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, image: "" })}
                      className="absolute top-2 right-2 rounded-full bg-red-600/90 text-white p-1 hover:bg-red-700 shadow-sm transition-colors"
                      title="Remove Photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Multi-Photo Gallery */}
              <div className="pt-3 border-t border-saffron-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-ink">
                      Temple Photo Gallery
                    </label>
                    <p className="text-[11px] text-ink-soft">
                      Add additional sanctum, architecture, or festival photographs.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-ink-soft">
                    {draft.gallery.length} Photos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gallery Multi-Upload */}
                  <div className="flex flex-col justify-center rounded-xl border-2 border-dashed border-saffron-200 bg-white p-3 text-center hover:bg-saffron-50/40 relative">
                    <input
                      type="file"
                      id="temple-gallery-upload"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      disabled={isUploadingGallery}
                      className="sr-only"
                    />
                    <label
                      htmlFor="temple-gallery-upload"
                      className="cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4 w-4 text-saffron-600" />
                      <span className="text-xs font-bold text-ink">
                        {isUploadingGallery ? "Adding Photos..." : "Upload Photos from Computer"}
                      </span>
                    </label>
                  </div>

                  {/* Add URL */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={newGalleryUrl}
                      onChange={(e) => setNewGalleryUrl(e.target.value)}
                      placeholder="Paste image URL & click add..."
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={handleAddGalleryUrl}
                      className="rounded-xl bg-saffron-600 px-3 py-2 text-xs font-bold text-white hover:bg-saffron-700 shrink-0"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Gallery Thumbnails Grid */}
                {draft.gallery.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
                    {draft.gallery.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative h-20 rounded-xl overflow-hidden border border-saffron-200 bg-slate-900 group"
                      >
                        <TempleImage src={imgUrl} alt={`Gallery ${idx + 1}`} className="h-full w-full" />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-0.5 hover:bg-red-700 opacity-90 transition-opacity"
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Location, Map & Timings */}
            <div className="rounded-2xl border border-saffron-200/80 bg-cream/15 p-4 sm:p-5 space-y-4">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-saffron-100/80 pb-2">
                <MapPin className="h-4 w-4 text-saffron-600" />
                <span>3. Location, Maps & Darshan Timings</span>
              </span>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={draft.city}
                    onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                    placeholder="e.g. Varanasi"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={draft.state}
                    onChange={(e) => setDraft({ ...draft, state: e.target.value })}
                    placeholder="e.g. Uttar Pradesh"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={draft.country}
                    onChange={(e) => setDraft({ ...draft, country: e.target.value })}
                    placeholder="e.g. India"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Postal Code (Pincode)
                  </label>
                  <input
                    type="text"
                    value={draft.pincode}
                    onChange={(e) => setDraft({ ...draft, pincode: e.target.value })}
                    placeholder="e.g. 221001"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={draft.address}
                    onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                    placeholder="e.g. Lahori Tola, Varanasi, Uttar Pradesh"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Google Maps Link or Coordinates
                  </label>
                  <input
                    type="url"
                    value={draft.mapUrl}
                    onChange={(e) => setDraft({ ...draft, mapUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=..."
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Darshan & Aarti Timings
                  </label>
                  <input
                    type="text"
                    value={draft.timings}
                    onChange={(e) => setDraft({ ...draft, timings: e.target.value })}
                    placeholder="e.g. 4:00 AM – 11:00 PM (Mangala Aarti 4:00 AM)"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Visiting Days & Festivals
                  </label>
                  <input
                    type="text"
                    value={draft.openingDays}
                    onChange={(e) => setDraft({ ...draft, openingDays: e.target.value })}
                    placeholder="e.g. Open all 7 days year-round"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Complete Lore, History & Significance */}
            <div className="rounded-2xl border border-saffron-200/80 bg-cream/15 p-4 sm:p-5 space-y-4">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-saffron-100/80 pb-2">
                <Info className="h-4 w-4 text-saffron-600" />
                <span>4. Lore, History & Devotee Guidance</span>
              </span>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Short Description (English) *
                </label>
                <textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="One or two sentences highlighting the temple's sanctity and location..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple History & Background (English)
                  </label>
                  <textarea
                    rows={4}
                    value={draft.history}
                    onChange={(e) => setDraft({ ...draft, history: e.target.value })}
                    placeholder="Ancient origin, royal patrons, Vedic lore, Skanda Purana mentions..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple History & Background (Hindi)
                  </label>
                  <textarea
                    rows={4}
                    value={draft.hindiHistory}
                    onChange={(e) => setDraft({ ...draft, hindiHistory: e.target.value })}
                    placeholder="मंदिर का पावन इतिहास, प्राचीन कथाएं एवं पौराणिक महत्व..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Spiritual Significance & Traditions (English)
                  </label>
                  <textarea
                    rows={3}
                    value={draft.significance}
                    onChange={(e) => setDraft({ ...draft, significance: e.target.value })}
                    placeholder="Specific blessings, why rituals performed here are especially auspicious..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Spiritual Significance & Traditions (Hindi)
                  </label>
                  <textarea
                    rows={3}
                    value={draft.hindiSignificance}
                    onChange={(e) => setDraft({ ...draft, hindiSignificance: e.target.value })}
                    placeholder="धार्मिक महत्व, विशेष अनुष्ठान एवं फल..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Visitor Guidelines & Accessibility
                </label>
                <textarea
                  rows={2}
                  value={draft.visitorGuidance}
                  onChange={(e) => setDraft({ ...draft, visitorGuidance: e.target.value })}
                  placeholder="Dress code, mobile phone rules, footwear counters, wheelchair accessibility..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            {/* Card 5: Official Contacts & Related Pujas */}
            <div className="rounded-2xl border border-saffron-200/80 bg-cream/15 p-4 sm:p-5 space-y-4">
              <span className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-saffron-100/80 pb-2">
                <Flame className="h-4 w-4 text-saffron-600" />
                <span>5. Verified Contact & Associated Sacred Pujas</span>
              </span>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Official Website
                  </label>
                  <input
                    type="url"
                    value={draft.officialWebsite}
                    onChange={(e) => setDraft({ ...draft, officialWebsite: e.target.value })}
                    placeholder="https://shrikashivishwanath.org"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple Helpline Phone
                  </label>
                  <input
                    type="tel"
                    value={draft.contactPhone}
                    onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
                    placeholder="+91 542 2392629"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Temple Contact Email
                  </label>
                  <input
                    type="email"
                    value={draft.contactEmail}
                    onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                    placeholder="helpdesk@shrikashivishwanath.org"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Associated Pujas Multi-select */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Associate Relevant Sacred Pujas Performed at This Temple
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-xl border border-saffron-200">
                  {poojas.map((p) => {
                    const isSelected = draft.poojaSlugs.includes(p.slug);
                    return (
                      <label
                        key={p.slug}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-saffron-50 border-saffron-300 font-bold text-saffron-900"
                            : "bg-cream/10 border-slate-100 text-ink hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePoojaSlug(p.slug)}
                          className="h-3.5 w-3.5 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500"
                        />
                        <span className="line-clamp-1">{p.title}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-ink-soft mt-1">
                  Selected pujas will show direct booking links on this temple&apos;s details page.
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-saffron-100">
              <button
                type="button"
                onClick={cancel}
                className="rounded-xl border border-saffron-200 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-saffron-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : editing ? "Save Temple Changes" : "Publish New Temple"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3.5 rounded-2xl border border-saffron-100 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search temples by name, deity, or city..."
            className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink focus:border-saffron-400 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-cream/60 p-1 border border-saffron-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-saffron-700 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              All ({list.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Active ({list.filter(isTempleActive).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`rounded-lg px-3 py-1 transition-all cursor-pointer ${
                statusFilter === "inactive"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              Inactive ({list.filter((t) => !isTempleActive(t)).length})
            </button>
          </div>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1 rounded-lg border border-saffron-200 cursor-pointer"
            >
              Reset Filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Temples List Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-saffron-200 bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-saffron-300 mb-3" />
          <h3 className="text-base font-semibold text-ink">No temples found</h3>
          <p className="text-xs text-ink-soft mt-1">
            {search || statusFilter !== "all"
              ? "No temples match your current search or status criteria."
              : "Get started by adding your first temple."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((temple) => {
            const active = isTempleActive(temple);
            return (
              <div
                key={temple.slug}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-all hover:shadow-md ${
                  active ? "border-saffron-100" : "border-slate-200 bg-slate-50/50 opacity-80"
                }`}
              >
                <div>
                  {/* Temple Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-saffron-100">
                        <TempleImage src={temple.image} alt={temple.name} className="h-full w-full" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-ink leading-snug">
                          {temple.name}
                        </h3>
                        {temple.hindiName && (
                          <p className="text-xs text-saffron-700 font-medium">
                            {temple.hindiName}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleActive(temple.slug)}
                      title={active ? "Deactivate temple" : "Activate temple"}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {active ? (
                        <>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </div>

                  {/* Details metadata */}
                  <div className="space-y-1.5 text-xs text-ink-soft border-t border-saffron-50 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold text-ink">Deity:</span> {temple.deity}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-saffron-500 shrink-0" />
                      <span>
                        {temple.city}, {temple.state}
                      </span>
                    </div>
                    {temple.timings && (
                      <div className="text-[11px] text-ink-soft/70">
                        🕒 {temple.timings}
                      </div>
                    )}
                    {temple.poojaSlugs && temple.poojaSlugs.length > 0 && (
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        🪔 {temple.poojaSlugs.length} Associated Pujas
                      </div>
                    )}
                    <p className="text-[11px] text-ink-soft line-clamp-2 mt-2 pt-1 border-t border-dashed border-saffron-100">
                      {temple.description}
                    </p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-saffron-100 pt-3.5 mt-4">
                  <Link
                    href={`/temples/${temple.slug}`}
                    target="_blank"
                    className="font-mono text-[11px] text-saffron-700 hover:underline inline-flex items-center gap-1"
                  >
                    <span>/{temple.slug}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(temple)}
                      className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50/60 px-2.5 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-100 cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(temple)}
                      className="inline-flex items-center rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer"
                      title="Delete Temple"
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Temple"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Historical bookings referencing this temple will remain safe.`}
        confirmLabel="Yes, Delete Temple"
        danger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
