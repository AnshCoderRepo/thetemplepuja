"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Pencil,
  Plus,
  Trash2,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  fetchAdminAddons,
  saveAdminAddon,
  deleteAdminAddon,
  type EnrichedAddon,
  type AvailablePoojaOption,
} from "@/lib/api";
import type { Addon } from "@/lib/data";
import { formatINR } from "@/lib/format";
import {
  Field,
  ManagerCard,
  ManagerHeader,
  NumberInput,
  SelectInput,
  TextAreaInput,
  TextInput,
  Toggle,
} from "./manager-ui";

interface AddonDraft {
  _id?: string;
  name: string;
  hindiName: string;
  price: string;
  currency: string;
  category: string;
  emoji: string;
  description: string;
  hindiDescription: string;
  type: "chadhava" | "addon";
  active: boolean;
  assignedPoojaSlugs: string[];
}

const emptyDraft: AddonDraft = {
  name: "",
  hindiName: "",
  price: "251",
  currency: "INR",
  category: "Chadhava Seva",
  emoji: "🌸",
  description: "",
  hindiDescription: "",
  type: "chadhava",
  active: true,
  assignedPoojaSlugs: [],
};

const CATEGORIES = [
  "Chadhava Seva",
  "Abhishek Seva",
  "Prasad Seva",
  "Chola Seva",
  "Archana Seva",
  "Bhojan Seva",
  "Temple Donation",
  "Sacred Relic",
  "Samagri",
];

const COMMON_EMOJIS = ["🌸", "🥛", "🍯", "🚩", "🌺", "🥥", "🙏", "🪔", "🪙", "🌿", "🕉️", "🔔"];

export default function AddonsManager({
  token,
  onAuthError,
  onRefresh,
}: {
  token: string;
  onAuthError: () => void;
  onRefresh?: () => void;
}) {
  const [addons, setAddons] = useState<EnrichedAddon[]>([]);
  const [totalPoojas, setTotalPoojas] = useState<number>(0);
  const [availablePoojas, setAvailablePoojas] = useState<AvailablePoojaOption[]>([]);
  const [pujaSearch, setPujaSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddonDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadAddons = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdminAddons(token);
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error || "Failed to load add-ons.");
      return;
    }
    setAddons(res.addons || []);
    if (typeof res.totalPoojas === "number") {
      setTotalPoojas(res.totalPoojas);
    }
    if (res.availablePoojas && Array.isArray(res.availablePoojas)) {
      setAvailablePoojas(res.availablePoojas);
    }
  }, [token, onAuthError]);

  useEffect(() => {
    if (token) {
      loadAddons();
    }
  }, [token, loadAddons]);

  // Real-time catalog update listener
  useEffect(() => {
    const handleUpdate = () => {
      if (token) loadAddons();
    };
    window.addEventListener("catalog-updated", handleUpdate);
    return () => window.removeEventListener("catalog-updated", handleUpdate);
  }, [token, loadAddons]);

  const filteredAddons = useMemo(() => {
    return addons.filter((addon) => {
      if (statusFilter === "active" && addon.active === false) return false;
      if (statusFilter === "inactive" && addon.active !== false) return false;
      if (!search.trim()) return true;

      const q = search.trim().toLowerCase();
      return (
        addon.name.toLowerCase().includes(q) ||
        (addon.hindiName && addon.hindiName.toLowerCase().includes(q)) ||
        (addon.category && addon.category.toLowerCase().includes(q)) ||
        (addon.description && addon.description.toLowerCase().includes(q)) ||
        (addon.assignedPoojaTitles && addon.assignedPoojaTitles.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [addons, search, statusFilter]);

  const handleOpenCreate = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setPujaSearch("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addon: EnrichedAddon) => {
    setEditingId(addon._id || addon.id);
    setDraft({
      _id: addon._id || addon.id,
      name: addon.name,
      hindiName: addon.hindiName || "",
      price: String(addon.price),
      currency: addon.currency || "INR",
      category: addon.category || "Chadhava Seva",
      emoji: addon.emoji || "🌸",
      description: addon.description || "",
      hindiDescription: addon.hindiDescription || "",
      type: addon.type === "addon" ? "addon" : "chadhava",
      active: addon.active !== false,
      assignedPoojaSlugs: addon.assignedPoojaSlugs ? [...addon.assignedPoojaSlugs] : [],
    });
    setPujaSearch("");
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("Add-on name is required.");
      return;
    }
    const numPrice = Number(draft.price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please enter a valid non-negative fixed price.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload: Partial<Addon & { assignedPoojaSlugs?: string[] }> = {
      _id: editingId || draft._id,
      id: editingId || draft._id,
      name: draft.name.trim(),
      hindiName: draft.hindiName.trim() || undefined,
      price: Math.round(numPrice),
      currency: draft.currency || "INR",
      category: draft.category.trim() || "Chadhava Seva",
      emoji: draft.emoji.trim() || "🌸",
      description: draft.description.trim(),
      hindiDescription: draft.hindiDescription.trim() || undefined,
      type: draft.type,
      active: draft.active,
      assignedPoojaSlugs: draft.assignedPoojaSlugs,
    };

    const res = await saveAdminAddon(payload, token);
    setSaving(false);

    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error || "Failed to save add-on.");
      return;
    }

    setIsModalOpen(false);
    await loadAddons();
    if (onRefresh) onRefresh();
  };

  const handleToggleActive = async (addon: EnrichedAddon) => {
    const nextActive = addon.active === false;
    const res = await saveAdminAddon(
      {
        _id: addon._id || addon.id,
        id: addon._id || addon.id,
        name: addon.name,
        price: addon.price,
        active: nextActive,
      },
      token
    );
    if (res.ok) {
      setAddons((prev) =>
        prev.map((a) =>
          (a._id || a.id) === (addon._id || addon.id) ? { ...a, active: nextActive } : a
        )
      );
      if (onRefresh) onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const res = await deleteAdminAddon(id, token);
    setSaving(false);
    setDeleteConfirmId(null);

    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error || "Failed to delete add-on.");
      return;
    }

    setAddons((prev) => prev.filter((a) => (a._id || a.id) !== id));
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      <ManagerHeader
        title="Puja Add-ons & Offerings"
        subtitle="Manage independent MongoDB add-on records, set fixed prices, and inspect which pujas each add-on is assigned to."
        count={addons.length}
        onAdd={handleOpenCreate}
        onReset={loadAddons}
        addLabel="+ Create New Add-on"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-saffron-100 bg-white p-4 shadow-xs">
          <span className="text-xs font-bold text-ink-soft block uppercase tracking-wider">Total Add-ons</span>
          <span className="font-display text-2xl font-black text-ink mt-1 block">{addons.length}</span>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 block uppercase tracking-wider">Active</span>
          <span className="font-display text-2xl font-black text-emerald-700 mt-1 block">
            {addons.filter((a) => a.active !== false).length}
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-600 block uppercase tracking-wider">Inactive</span>
          <span className="font-display text-2xl font-black text-slate-700 mt-1 block">
            {addons.filter((a) => a.active === false).length}
          </span>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <span className="text-xs font-bold text-amber-900 block uppercase tracking-wider">Total Pujas on Site</span>
          <span className="font-display text-2xl font-black text-amber-800 mt-1 block">
            {totalPoojas || availablePoojas.length}
          </span>
        </div>
        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 shadow-xs">
          <span className="text-xs font-bold text-purple-800 block uppercase tracking-wider">Puja Assignments</span>
          <span className="font-display text-2xl font-black text-purple-700 mt-1 block">
            {addons.reduce((sum, a) => sum + (a.assignedPoojaCount || 0), 0)}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-saffron-100 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search add-on by name, category, or assigned puja..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-saffron-100 bg-cream/30 text-ink placeholder:text-ink-soft/50 focus:border-saffron-400 focus:bg-white focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          {(["all", "active", "inactive"] as const).map((filter) => {
            const count =
              filter === "all"
                ? addons.length
                : filter === "active"
                ? addons.filter((a) => a.active !== false).length
                : addons.filter((a) => a.active === false).length;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === filter
                    ? "bg-saffron-600 text-white shadow-xs"
                    : "bg-cream/40 text-ink-soft hover:bg-cream/80"
                }`}
              >
                {filter} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add-ons List */}
      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-ink-soft">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-saffron-500 border-t-transparent" />
            <span>Loading add-ons from MongoDB...</span>
          </div>
        </div>
      ) : filteredAddons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-saffron-200 bg-cream/20 p-12 text-center">
          <span className="text-3xl">🌸</span>
          <h4 className="mt-2 text-sm font-bold text-ink">No add-ons found</h4>
          <p className="mt-1 text-xs text-ink-soft">
            {search ? "No add-on matching your search query." : "No add-ons created yet."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-saffron-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:bg-saffron-600"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Add-on</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAddons.map((addon) => {
            const isAssigned = (addon.assignedPoojaCount || 0) > 0;
            return (
              <div
                key={addon._id || addon.id}
                className={`flex flex-col justify-between rounded-2xl border p-4.5 transition-all bg-white shadow-xs ${
                  addon.active === false
                    ? "opacity-65 border-slate-200 bg-slate-50/50"
                    : "border-saffron-100 hover:border-saffron-300 hover:shadow-card"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category & Active Toggle */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-saffron-50 border border-saffron-200/80 px-2.5 py-0.5 text-[10px] font-bold text-saffron-800">
                      {addon.category || "Chadhava Seva"}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(addon)}
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        addon.active !== false
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-300"
                      }`}
                      title="Click to toggle active status"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${addon.active !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {addon.active !== false ? "Active" : "Inactive"}
                    </button>
                  </div>

                  {/* Main Add-on Info */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream border border-saffron-100 text-2xl shadow-xs">
                      {addon.emoji || "🌸"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-ink leading-tight truncate">
                        {addon.name}
                      </h4>
                      {addon.hindiName && (
                        <p className="text-[11px] text-ink-soft/80 truncate mt-0.5">
                          {addon.hindiName}
                        </p>
                      )}
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="font-display text-base font-extrabold text-saffron-900">
                          {formatINR(addon.price)}
                        </span>
                        <span className="text-[10px] text-ink-soft">fixed</span>
                      </div>
                    </div>
                  </div>

                  {addon.description && (
                    <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed">
                      {addon.description}
                    </p>
                  )}

                  {/* Puja Assignments Display */}
                  <div className="pt-2 border-t border-saffron-50">
                    <div className="flex items-center justify-between text-[11px] font-bold text-ink-soft mb-1.5">
                      <span>Assigned to Pujas</span>
                      <span className="text-saffron-800 font-extrabold">
                        {addon.assignedPoojaCount || 0}
                      </span>
                    </div>

                    {isAssigned ? (
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                        {(addon.assignedPoojaTitles || []).map((pTitle, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md bg-purple-50 border border-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 truncate max-w-[150px]"
                            title={pTitle}
                          >
                            🪔 {pTitle}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-ink-soft/60 italic block">
                        Not assigned to any puja yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-saffron-100/70 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-ink-soft/70 font-mono">
                    ID: {(addon._id || addon.id).slice(0, 14)}...
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addon)}
                      className="p-1.5 rounded-lg text-ink-soft hover:text-purple-700 hover:bg-purple-50 transition-colors"
                      title="Edit details"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(addon._id || addon.id)}
                      className="p-1.5 rounded-lg text-ink-soft hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete add-on record"
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

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-saffron-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-saffron-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-50 text-xl border border-saffron-200">
                  {draft.emoji || "🌸"}
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink">
                    {editingId ? "Edit Add-on Details" : "Create New Puja Add-on"}
                  </h3>
                  <p className="text-xs text-ink-soft">
                    {editingId ? "Update fixed price, assigned pujas, status or details" : "Creates an independent MongoDB record and binds to selected pujas"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-ink-soft hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <Field label="Add-on Name (English) *">
                  <TextInput
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="e.g. Special Silver Chhatra"
                  />
                </Field>

                <Field label="Hindi Name (Optional)">
                  <TextInput
                    value={draft.hindiName}
                    onChange={(e) => setDraft({ ...draft, hindiName: e.target.value })}
                    placeholder="e.g. विशेष रजत छत्र"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Fixed Price (₹) *">
                  <NumberInput
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    placeholder="251"
                  />
                </Field>

                <Field label="Category">
                  <SelectInput
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                  />
                </Field>

                <Field label="Type">
                  <SelectInput
                    value={draft.type}
                    onChange={(e) => setDraft({ ...draft, type: e.target.value as "chadhava" | "addon" })}
                    options={[
                      { value: "chadhava", label: "Chadhava" },
                      { value: "addon", label: "Other Add-on" },
                    ]}
                  />
                </Field>
              </div>

              {/* Emoji Selector */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">Icon / Emoji</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {COMMON_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setDraft({ ...draft, emoji: e })}
                      className={`h-8 w-8 rounded-lg text-lg flex items-center justify-center transition-transform cursor-pointer ${
                        draft.emoji === e
                          ? "bg-saffron-500 text-white scale-110 shadow-xs"
                          : "bg-cream/50 hover:bg-cream border border-saffron-100"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={draft.emoji}
                    onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                    className="w-12 h-8 text-center text-sm rounded-lg border border-saffron-200 bg-white"
                    maxLength={4}
                  />
                </div>
              </div>

              <Field label="Description (English)">
                <TextAreaInput
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  placeholder="Describe the sacred offering or seva..."
                />
              </Field>

              <Field label="Hindi Description (Optional)">
                <TextAreaInput
                  value={draft.hindiDescription}
                  onChange={(e) => setDraft({ ...draft, hindiDescription: e.target.value })}
                  rows={2}
                  placeholder="हिंदी विवरण..."
                />
              </Field>

              {/* Puja Assignments Section */}
              <div className="pt-3 border-t border-saffron-100 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                  <div>
                    <label className="block text-xs font-bold text-ink">
                      Assign to Specific Pujas
                    </label>
                    <span className="text-[11px] text-ink-soft">
                      {draft.assignedPoojaSlugs.length} of {totalPoojas || availablePoojas.length} pujas selected • This chadava will only display on selected pujas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          assignedPoojaSlugs: availablePoojas.map((p) => p.slug),
                        }))
                      }
                      className="text-[11px] font-bold text-saffron-700 bg-saffron-50 hover:bg-saffron-100 border border-saffron-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          assignedPoojaSlugs: [],
                        }))
                      }
                      className="text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Puja Search inside Modal */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-soft/50" />
                  <input
                    type="text"
                    value={pujaSearch}
                    onChange={(e) => setPujaSearch(e.target.value)}
                    placeholder="Search puja by title, deity or slug to assign..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-saffron-200 bg-cream/30 text-ink placeholder:text-ink-soft/50 focus:border-saffron-400 focus:bg-white focus:outline-none"
                  />
                  {pujaSearch && (
                    <button
                      type="button"
                      onClick={() => setPujaSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Scrollable Puja Selection List */}
                <div className="max-h-52 overflow-y-auto rounded-xl border border-saffron-200 bg-cream/20 p-2 space-y-1.5">
                  {availablePoojas
                    .filter(
                      (p) =>
                        !pujaSearch.trim() ||
                        p.title.toLowerCase().includes(pujaSearch.toLowerCase()) ||
                        p.slug.toLowerCase().includes(pujaSearch.toLowerCase()) ||
                        (p.hindiTitle && p.hindiTitle.toLowerCase().includes(pujaSearch.toLowerCase()))
                    )
                    .map((pooja) => {
                      const isChecked = draft.assignedPoojaSlugs.includes(pooja.slug);
                      return (
                        <label
                          key={pooja.id || pooja.slug}
                          className={`flex items-center justify-between gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-purple-50 border-purple-300 shadow-xs font-semibold text-purple-950"
                              : "bg-white border-slate-200 text-ink hover:border-saffron-300 hover:bg-saffron-50/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setDraft((prev) => {
                                  const next = isChecked
                                    ? prev.assignedPoojaSlugs.filter((s) => s !== pooja.slug)
                                    : [...prev.assignedPoojaSlugs, pooja.slug];
                                  return { ...prev, assignedPoojaSlugs: next };
                                });
                              }}
                              className="h-4 w-4 rounded border-saffron-300 text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                            />
                            <span className="text-base shrink-0">{pooja.emoji || "🪔"}</span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold leading-tight">{pooja.title}</p>
                              {pooja.hindiTitle && (
                                <p className="truncate text-[10px] text-ink-soft/70">{pooja.hindiTitle}</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                              pooja.active
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {pooja.active ? "Active" : "Inactive"}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-saffron-100">
                <Toggle
                  label="Active Status (checked = active & bookable)"
                  checked={draft.active}
                  onChange={(checked) => setDraft((prev) => ({ ...prev, active: checked }))}
                />
              </div>

              {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-saffron-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-saffron-200 px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50"
                >
                  {saving ? "Saving to MongoDB..." : editingId ? "Update Add-on" : "Create Add-on"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-red-100 text-center space-y-4">
            <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-red-100 text-red-600 text-xl">
              ⚠️
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-ink">Delete Add-on Record?</h3>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                Are you sure you want to permanently delete this add-on? It will be safely removed from all assigned pujas. Existing completed booking snapshots will remain preserved.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-saffron-200 px-4 py-2 text-xs font-bold text-ink-soft hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Yes, Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
