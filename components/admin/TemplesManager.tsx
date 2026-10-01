"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { fetchCatalog, saveCatalogSection } from "@/lib/api";
import { isTempleActive, type Temple } from "@/lib/data";
import ConfirmDialog from "./ConfirmDialog";

const inputCls =
  "w-full rounded-xl border border-saffron-200 bg-white px-3.5 py-2.5 text-xs text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-500 focus:ring-2 focus:ring-saffron-200";

interface TempleDraft {
  slug: string;
  name: string;
  hindiName: string;
  deity: string;
  city: string;
  state: string;
  address: string;
  pincode: string;
  description: string;
  image: string;
  timings: string;
  active: boolean;
}

const emptyDraft: TempleDraft = {
  slug: "",
  name: "",
  hindiName: "",
  deity: "",
  city: "",
  state: "",
  address: "",
  pincode: "",
  description: "",
  image: "",
  timings: "5:00 AM – 9:30 PM",
  active: true,
};

export default function TemplesManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [list, setList] = useState<Temple[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draft, setDraft] = useState<TempleDraft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Temple | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live && Array.isArray(c.temples)) {
        setList(c.temples);
      }
    });
    return () => {
      live = false;
    };
  }, []);

  const showNotification = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
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
    if (list.some((t) => t.slug === draft.slug.trim() && t.slug !== editing)) {
      return "Another temple already uses this slug.";
    }
    return null;
  };

  const toTemple = (): Temple => ({
    slug: draft.slug.trim(),
    name: draft.name.trim(),
    hindiName: draft.hindiName.trim() || undefined,
    deity: draft.deity.trim(),
    city: draft.city.trim(),
    state: draft.state.trim(),
    address: draft.address.trim() || undefined,
    pincode: draft.pincode.trim() || undefined,
    description: draft.description.trim(),
    image: draft.image.trim() || undefined,
    timings: draft.timings.trim() || undefined,
    active: draft.active,
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
    showNotification(editing ? "Temple updated successfully." : "New temple added.");
  };

  const startEdit = (t: Temple) => {
    setEditing(t.slug);
    setAdding(false);
    setError("");
    setDraft({
      slug: t.slug,
      name: t.name,
      hindiName: t.hindiName ?? "",
      deity: t.deity,
      city: t.city,
      state: t.state,
      address: t.address ?? "",
      pincode: t.pincode ?? "",
      description: t.description,
      image: t.image ?? "",
      timings: t.timings ?? "5:00 AM – 9:30 PM",
      active: isTempleActive(t),
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
            Temple Management
          </h2>
          <p className="text-xs text-ink-soft mt-0.5">
            Manage sacred temples, locations, deity relationships, and pilgrimage shrines.
          </p>
        </div>
        {!adding && !editing && (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-saffron-500/20 transition-all hover:from-saffron-600 hover:to-saffron-700 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Add New Temple
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 animate-fadeIn">
          <Check className="h-4 w-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* Add / Edit Form Modal / Card */}
      {(adding || editing) && (
        <div className="rounded-3xl border border-saffron-200 bg-white p-6 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-saffron-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-ink">
                {editing ? "Edit Sacred Temple" : "Add New Sacred Temple"}
              </h3>
              <p className="text-xs text-ink-soft">
                All changes update the booking catalog and pilgrimage portals instantly.
              </p>
            </div>
            <button
              type="button"
              onClick={cancel}
              className="text-ink-soft/60 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

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
                    const slug = !editing && !draft.slug ? val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : draft.slug;
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
                  URL Slug *
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
                  Darshan & Pooja Timings
                </label>
                <input
                  type="text"
                  value={draft.timings}
                  onChange={(e) => setDraft({ ...draft, timings: e.target.value })}
                  placeholder="e.g. 4:00 AM – 11:00 PM"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  Pincode
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

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Detailed Address
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
                Image URL
              </label>
              <input
                type="text"
                value={draft.image}
                onChange={(e) => setDraft({ ...draft, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Spiritual Significance & Description *
              </label>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Describe the ancient lore, significance, and unique blessings of this sacred temple..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500"
                />
                Active (Visible on public portal & catalog)
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-saffron-100">
              <button
                type="button"
                onClick={cancel}
                className="rounded-xl border border-saffron-200 px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-saffron-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-saffron-500/20 hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Temple"}
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft/40 hover:text-ink"
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
              className={`rounded-lg px-3 py-1 transition-all ${
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
              className={`rounded-lg px-3 py-1 transition-all ${
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
              className={`rounded-lg px-3 py-1 transition-all ${
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-700 hover:underline bg-saffron-50 px-2.5 py-1 rounded-lg border border-saffron-200"
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
          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-saffron-700 hover:underline bg-saffron-50 px-3 py-1.5 rounded-lg border border-saffron-200"
            >
              Reset All Filters ✕
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((temple) => {
            const active = isTempleActive(temple);
            return (
              <div
                key={temple.slug}
                className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                  active ? "border-saffron-100" : "border-slate-200 bg-slate-50/50 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-100 text-saffron-700 font-bold text-lg">
                        🛕
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
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
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

                  <div className="space-y-1.5 text-xs text-ink-soft border-t border-saffron-50 pt-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-semibold text-ink">Deity:</span> {temple.deity}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-saffron-500 shrink-0" />
                      <span>{temple.city}, {temple.state}</span>
                    </div>
                    {temple.timings && (
                      <div className="text-[11px] text-ink-soft/70">
                        🕒 {temple.timings}
                      </div>
                    )}
                    <p className="text-[11px] text-ink-soft line-clamp-2 mt-2 pt-1 border-t border-dashed border-saffron-100">
                      {temple.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-saffron-100 pt-3.5 mt-4">
                  <span className="font-mono text-[10px] text-ink-soft/50">
                    /{temple.slug}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(temple)}
                      className="inline-flex items-center gap-1 rounded-lg border border-saffron-200 bg-saffron-50/60 px-2.5 py-1.5 text-xs font-semibold text-saffron-700 hover:bg-saffron-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(temple)}
                      className="inline-flex items-center rounded-lg p-1.5 text-red-500 hover:bg-red-50"
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
