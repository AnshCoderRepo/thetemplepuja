"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Package,
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  HeartHandshake,
  ExternalLink,
} from "lucide-react";
import {
  fetchAdminPackages,
  saveAdminPackage,
  deleteAdminPackage,
} from "@/lib/api";
import { formatINR } from "@/lib/format";
import {
  Field,
  ManagerCard,
  ManagerHeader,
  NumberInput,
  TextAreaInput,
  TextInput,
  Toggle,
} from "./manager-ui";

export interface PackageDraft {
  _id?: string;
  id?: string;
  name: string;
  hindiName?: string;
  price: string;
  originalPrice?: string;
  devoteeLimit: number;
  badge?: string;
  description?: string;
  hindiDescription?: string;
  features: string[];
  status: "draft" | "active";
  attachedPoojaSlugs: string[];
}

const emptyDraft: PackageDraft = {
  name: "",
  hindiName: "",
  price: "1101",
  originalPrice: "",
  devoteeLimit: 1,
  badge: "",
  description: "",
  hindiDescription: "",
  features: ["1 Devotee Gotra & Name Sankalp"],
  status: "active",
  attachedPoojaSlugs: ["all"],
};

export default function PackagesManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError?: () => void;
  onRefresh?: () => void;
}) {
  const [packages, setPackages] = useState<any[]>([]);
  const [availablePoojas, setAvailablePoojas] = useState<{ slug: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");

  // Create / Edit modal state
  const [draft, setDraft] = useState<PackageDraft | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminPackages(token);
      if (!res.ok) {
        if (onAuthError) onAuthError();
        setError(res.error || "Failed to load packages.");
        return;
      }
      setPackages(res.packages);
      setAvailablePoojas(res.availablePoojas);
    } catch {
      setError("Network error loading packages.");
    } finally {
      setLoading(false);
    }
  }, [token, onAuthError]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (statusFilter === "active" && pkg.status !== "active") return false;
      if (statusFilter === "draft" && pkg.status !== "draft") return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = pkg.name?.toLowerCase().includes(q);
        const matchesHindi = pkg.hindiName?.toLowerCase().includes(q);
        const matchesDesc = pkg.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesHindi && !matchesDesc) return false;
      }
      return true;
    });
  }, [packages, statusFilter, search]);

  const handleOpenCreate = () => {
    setDraft({ ...emptyDraft, features: ["1 Devotee Gotra & Name Sankalp"] });
    setFeatureInput("");
  };

  const handleOpenEdit = (pkg: any) => {
    setDraft({
      _id: pkg._id || pkg.id,
      id: pkg.id || pkg._id,
      name: pkg.name || "",
      hindiName: pkg.hindiName || "",
      price: String(pkg.price || 0),
      originalPrice: pkg.originalPrice ? String(pkg.originalPrice) : "",
      devoteeLimit: pkg.devoteeLimit || 1,
      badge: pkg.badge || "",
      description: pkg.description || "",
      hindiDescription: pkg.hindiDescription || "",
      features: Array.isArray(pkg.features) ? [...pkg.features] : [],
      status: pkg.status === "draft" ? "draft" : "active",
      attachedPoojaSlugs: Array.isArray(pkg.attachedPoojaSlugs) ? [...pkg.attachedPoojaSlugs] : ["all"],
    });
    setFeatureInput("");
  };

  const handleAddFeature = () => {
    if (!draft || !featureInput.trim()) return;
    setDraft({
      ...draft,
      features: [...draft.features, featureInput.trim()],
    });
    setFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!draft) return;
    setDraft({
      ...draft,
      features: draft.features.filter((_, i) => i !== index),
    });
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    const price = Number(draft.price);

    if (!name) {
      setError("Package name is required.");
      return;
    }
    if (isNaN(price) || price < 0) {
      setError("Please provide a valid non-negative price.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      _id: draft._id,
      id: draft.id,
      name,
      hindiName: draft.hindiName?.trim() || undefined,
      price,
      originalPrice: draft.originalPrice ? Number(draft.originalPrice) : undefined,
      devoteeLimit: Number(draft.devoteeLimit) || 1,
      badge: draft.badge?.trim() || undefined,
      description: draft.description?.trim() || undefined,
      hindiDescription: draft.hindiDescription?.trim() || undefined,
      features: draft.features,
      status: draft.status,
      attachedPoojaSlugs: draft.attachedPoojaSlugs,
    };

    const res = await saveAdminPackage(payload, token);
    setSaving(false);

    if (!res.ok) {
      if (onAuthError) onAuthError();
      setError(res.error || "Failed to save package.");
      return;
    }

    setDraft(null);
    loadPackages();
    if (onRefresh) onRefresh();
  };

  const handleToggleStatus = async (pkg: any) => {
    const nextStatus = pkg.status === "active" ? "draft" : "active";
    const res = await saveAdminPackage(
      {
        _id: pkg._id || pkg.id,
        id: pkg.id || pkg._id,
        name: pkg.name,
        price: pkg.price,
        status: nextStatus,
      },
      token
    );
    if (res.ok) {
      setPackages((prev) =>
        prev.map((p) =>
          (p._id || p.id) === (pkg._id || pkg.id) ? { ...p, status: nextStatus } : p
        )
      );
      if (onRefresh) onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const res = await deleteAdminPackage(id, token);
    setSaving(false);
    setDeleteConfirmId(null);

    if (!res.ok) {
      if (onAuthError) onAuthError();
      setError(res.error || "Failed to delete package.");
      return;
    }

    setPackages((prev) => prev.filter((p) => (p._id || p.id) !== id));
    if (onRefresh) onRefresh();
  };

  const getPackageIcon = (limit: number, name: string) => {
    const lower = name.toLowerCase();
    if (limit >= 3 || lower.includes("family") || lower.includes("kul")) {
      return <Users className="h-4 w-4 text-saffron-600" />;
    }
    if (limit === 2 || lower.includes("couple") || lower.includes("dampati")) {
      return <HeartHandshake className="h-4 w-4 text-saffron-600" />;
    }
    return <User className="h-4 w-4 text-saffron-600" />;
  };

  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Puja Packages & Seva Tiers"
        subtitle="Manage dynamic packages (Single, Couple, Family, VIP), set fixed prices, devotee limits, and assign packages across Pujas."
        count={packages.length}
        onAdd={handleOpenCreate}
        onReset={loadPackages}
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 shadow-xs">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-saffron-100 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "active", "draft"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-saffron-500 text-white shadow-xs"
                  : "bg-saffron-50 text-ink-soft hover:bg-saffron-100/70"
              }`}
            >
              {st === "all" ? `All Packages (${packages.length})` : st === "active" ? `Active (${packages.filter(p => p.status === 'active').length})` : `Drafts (${packages.filter(p => p.status === 'draft').length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-saffron-100 bg-cream/40 pl-9 pr-3.5 py-1.5 text-xs text-ink outline-none focus:border-saffron-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Packages Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-saffron-500 border-t-transparent" />
          <p className="text-xs font-bold text-ink-soft">Loading dynamic packages from MongoDB...</p>
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-saffron-200 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-ink text-base">No Packages Found</h3>
          <p className="text-xs text-ink-soft max-w-sm mx-auto">
            {search ? "No packages match your search filter." : "Create your first dynamic package tier to assign to Pujas."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-saffron-600 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Package</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => {
            const id = pkg._id || pkg.id;
            const isAll = Array.isArray(pkg.attachedPoojaSlugs) && pkg.attachedPoojaSlugs.includes("all");
            const assignedCount = isAll ? availablePoojas.length : (pkg.attachedPoojaSlugs?.length || 0);

            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-3xl border border-saffron-100 bg-white p-5 shadow-card hover:border-saffron-300 transition-all space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-saffron-50 border border-saffron-200/60 shrink-0">
                        {getPackageIcon(pkg.devoteeLimit || 1, pkg.name)}
                      </span>
                      <div>
                        <h4 className="font-bold text-ink text-sm leading-snug">{pkg.name}</h4>
                        {pkg.hindiName && (
                          <p className="text-xs font-semibold text-saffron-700">{pkg.hindiName}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {pkg.badge && (
                        <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase">
                          {pkg.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(pkg)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                          pkg.status === "active"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }`}
                        title="Click to toggle Active / Draft"
                      >
                        {pkg.status === "active" ? "🟢 Active" : "🟡 Draft"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-lg font-extrabold text-saffron-800">
                      {formatINR(pkg.price)}
                    </span>
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <span className="text-xs text-ink-soft line-through">
                        {formatINR(pkg.originalPrice)}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-ink-soft ml-auto">
                      👥 Max {pkg.devoteeLimit || 1} {pkg.devoteeLimit === 1 ? "Devotee" : "Devotees"}
                    </span>
                  </div>

                  {pkg.description && (
                    <p className="mt-2 text-xs text-ink-soft leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {pkg.features.slice(0, 3).map((feat: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </div>
                      ))}
                      {pkg.features.length > 3 && (
                        <p className="text-[10px] text-saffron-700 font-semibold pl-4">
                          +{pkg.features.length - 3} more features
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-saffron-100/60 pt-3 flex items-center justify-between text-xs">
                  <span className="rounded-lg bg-saffron-50 px-2.5 py-1 text-[11px] font-bold text-saffron-800">
                    🪔 {isAll ? "All Pujas" : `${assignedCount} Pujas`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(pkg)}
                      className="rounded-lg border border-saffron-200 bg-white p-1.5 text-ink-soft hover:bg-saffron-50 hover:text-ink cursor-pointer transition-colors"
                      title="Edit Package"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(id)}
                      className="rounded-lg border border-red-200 bg-white p-1.5 text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Delete Package"
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
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-red-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-bold text-ink text-base">Delete Package</h3>
            </div>
            <p className="text-xs text-ink-soft leading-relaxed">
              Are you sure you want to permanently delete this package? Devotees will no longer be able to select it during booking.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-soft hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Deleting..." : "Delete Package"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Package Modal */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-saffron-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-saffron-100 bg-gradient-to-r from-amber-50 to-saffron-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-saffron-600" />
                <h3 className="font-bold text-ink text-base">
                  {draft._id ? "Edit Package Tier" : "Create New Package Tier"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-full p-1 text-ink-soft hover:bg-saffron-100/60 hover:text-ink cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Package Name (English) *">
                  <TextInput
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Single Devotee Sankalp"
                  />
                </Field>

                <Field label="Package Name (Hindi Optional)">
                  <TextInput
                    value={draft.hindiName || ""}
                    onChange={(e) => setDraft({ ...draft, hindiName: e.target.value })}
                    placeholder="e.g. एकल संकल्प"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Price (₹) *">
                  <NumberInput
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    placeholder="1101"
                  />
                </Field>

                <Field label="Original Price (₹ Strike-through)">
                  <NumberInput
                    value={draft.originalPrice || ""}
                    onChange={(e) => setDraft({ ...draft, originalPrice: e.target.value })}
                    placeholder="e.g. 2100"
                  />
                </Field>

                <Field label="Devotee Limit / Count *">
                  <select
                    value={draft.devoteeLimit}
                    onChange={(e) => setDraft({ ...draft, devoteeLimit: Number(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-saffron-100 bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:border-saffron-400 focus:bg-white"
                  >
                    <option value={1}>1 Devotee (Single Plan)</option>
                    <option value={2}>2 Devotees (Couple Plan)</option>
                    <option value={3}>3 Devotees</option>
                    <option value={4}>4 Devotees</option>
                    <option value={5}>5 Devotees (Family Plan)</option>
                    <option value={8}>8 Devotees (Extended Family)</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Badge Ribbon (e.g. Popular, Best Value)">
                  <TextInput
                    value={draft.badge || ""}
                    onChange={(e) => setDraft({ ...draft, badge: e.target.value })}
                    placeholder="e.g. Popular or Best Value"
                  />
                </Field>

                <Field label="Status">
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as "active" | "draft" })}
                    className="w-full rounded-xl border border-saffron-100 bg-cream px-3.5 py-2.5 text-sm text-ink outline-none focus:border-saffron-400 focus:bg-white font-semibold"
                  >
                    <option value="active">Active (Visible to Devotees)</option>
                    <option value="draft">Draft (Hidden from Booking)</option>
                  </select>
                </Field>
              </div>

              <Field label="Package Description & Sankalp Details">
                <TextAreaInput
                  rows={2}
                  value={draft.description || ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Detail the vidhi, sankalp, or blessings included in this package..."
                />
              </Field>

              {/* Dynamic Features List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-ink">Included Features & Benefits</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="e.g. Personal Gotra & Name Sankalp"
                    className="flex-1 rounded-xl border border-saffron-100 bg-cream/50 px-3.5 py-2 text-xs text-ink outline-none focus:border-saffron-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="rounded-xl bg-saffron-500 hover:bg-saffron-600 px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {draft.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-saffron-100 bg-amber-50/40 px-3 py-1.5 text-xs text-ink"
                    >
                      <span className="truncate">✓ {feat}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold ml-2 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assign to Pujas */}
              <div className="space-y-2 border-t border-saffron-100 pt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-ink">Assign to Pujas</label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-saffron-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.attachedPoojaSlugs.includes("all")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setDraft({ ...draft, attachedPoojaSlugs: ["all"] });
                        } else {
                          setDraft({ ...draft, attachedPoojaSlugs: [] });
                        }
                      }}
                      className="rounded text-saffron-600"
                    />
                    <span>Available on All Pujas</span>
                  </label>
                </div>

                {!draft.attachedPoojaSlugs.includes("all") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-xl border border-saffron-100 bg-cream/30">
                    {availablePoojas.map((p) => {
                      const isChecked = draft.attachedPoojaSlugs.includes(p.slug);
                      return (
                        <label
                          key={p.slug}
                          className="flex items-center gap-2 text-xs text-ink p-1.5 rounded-lg hover:bg-white cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDraft({
                                  ...draft,
                                  attachedPoojaSlugs: [...draft.attachedPoojaSlugs, p.slug],
                                });
                              } else {
                                setDraft({
                                  ...draft,
                                  attachedPoojaSlugs: draft.attachedPoojaSlugs.filter((s) => s !== p.slug),
                                });
                              }
                            }}
                            className="rounded text-saffron-600"
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-saffron-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveDraft}
                className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 px-5 py-2 text-xs font-bold text-white shadow-soft transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving Package..." : draft._id ? "Update Package" : "Create Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
