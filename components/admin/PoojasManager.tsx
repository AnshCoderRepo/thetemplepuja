"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import { isPoojaActive, type Pooja } from "@/lib/data";
import { formatINR } from "@/lib/format";
import {
  Field,
  GradientPicker,
  ManagerCard,
  ManagerHeader,
  NumberInput,
  TextAreaInput,
  TextInput,
} from "./manager-ui";

interface Draft {
  slug: string;
  title: string;
  hindiTitle: string;
  emoji: string;
  gradient: string;
  price: string;
  duration: string;
  bestMuhurat: string;
  description: string;
  benefits: string;
  // Event scheduling (optional — when set, the pooja appears on the home carousel)
  daysFromToday: string;
  eventTime: string;
  seats: string;
  capacity: string;
  live: boolean;
}

const emptyDraft: Draft = {
  slug: "",
  title: "",
  hindiTitle: "",
  emoji: "🪔",
  gradient: "from-saffron-500 to-saffron-700",
  price: "",
  duration: "1 hour",
  bestMuhurat: "",
  description: "",
  benefits: "",
  daysFromToday: "",
  eventTime: "7:00 PM IST",
  seats: "20 spots open",
  capacity: "",
  live: false,
};

export default function PoojasManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [list, setList] = useState<Pooja[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setList(c.poojas);
    });
    return () => {
      live = false;
    };
  }, []);

  const validate = (): string | null => {
    if (!draft.slug.trim() || !draft.title.trim()) {
      return "Slug and title are required.";
    }
    if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) {
      return "Slug must be lowercase letters, numbers and dashes only (e.g. ganesh-pooja).";
    }
    const price = Number(draft.price);
    if (Number.isNaN(price) || price <= 0) {
      return "Price must be a positive number (in rupees).";
    }
    if (list.some((p) => p.slug === draft.slug.trim() && p.slug !== editing)) {
      return "Another pooja already uses this slug.";
    }
    return null;
  };

  const toPooja = (): Pooja => {
    const p: Pooja = {
      slug: draft.slug.trim(),
      title: draft.title.trim(),
      hindiTitle: draft.hindiTitle.trim(),
      emoji: draft.emoji.trim() || "🪔",
      gradient: draft.gradient,
      price: Number(draft.price),
      duration: draft.duration.trim() || "1 hour",
      bestMuhurat: draft.bestMuhurat.trim(),
      description: draft.description.trim(),
      benefits: draft.benefits
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    };
    // Event scheduling — only set when the admin filled in daysFromToday
    const days = Number(draft.daysFromToday);
    if (draft.daysFromToday.trim() && !Number.isNaN(days) && days >= 0) {
      p.daysFromToday = days;
      p.eventTime = draft.eventTime.trim() || undefined;
      p.seats = draft.seats.trim() || undefined;
      const cap = Number(draft.capacity);
      if (draft.capacity.trim() && !Number.isNaN(cap) && cap > 0) {
        p.capacity = cap;
      }
      p.live = draft.live;
    }
    return p;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const pooja = toPooja();
    // Editing keeps the current visibility; brand-new poojas start active.
    const prev = editing ? list.find((p) => p.slug === editing) : undefined;
    const saved = { ...pooja, active: prev ? prev.active : true };
    const next = editing
      ? list.map((p) => (p.slug === editing ? saved : p))
      : [...list, saved];
    const res = await saveCatalogSection("poojas", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not save changes.");
      return;
    }
    setList(next);
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
  };

  const toggleActive = async (p: Pooja) => {
    const next = list.map((x) =>
      x.slug === p.slug ? { ...x, active: !isPoojaActive(x) } : x
    );
    const res = await saveCatalogSection("poojas", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not update the pooja.");
      return;
    }
    setError("");
    setList(next);
  };

  const remove = async (slug: string) => {
    if (
      !window.confirm(
        `Delete "${slug}" from the pooja catalog? Bookings already made are not affected.`
      )
    ) {
      return;
    }
    const next = list.filter((p) => p.slug !== slug);
    const res = await saveCatalogSection("poojas", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not delete the pooja.");
      return;
    }
    setList(next);
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Reset the pooja catalog to the default list? Any admin changes will be lost."
      )
    ) {
      return;
    }
    const res = await resetCatalogSection("poojas", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset the catalog.");
      return;
    }
    const c = await fetchCatalog();
    setList(c.poojas);
  };

  const startEdit = (p: Pooja) => {
    setEditing(p.slug);
    setAdding(false);
    setError("");
    setDraft({
      slug: p.slug,
      title: p.title,
      hindiTitle: p.hindiTitle,
      emoji: p.emoji,
      gradient: p.gradient,
      price: String(p.price),
      duration: p.duration,
      bestMuhurat: p.bestMuhurat,
      description: p.description,
      benefits: p.benefits.join(", "),
      daysFromToday: p.daysFromToday != null ? String(p.daysFromToday) : "",
      eventTime: p.eventTime ?? "7:00 PM IST",
      seats: p.seats ?? "20 spots open",
      capacity: p.capacity != null ? String(p.capacity) : "",
      live: p.live ?? false,
    });
  };

  const cancel = () => {
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
  };

  return (
    <ManagerCard>
      <ManagerHeader
        title="Pooja Catalog"
        subtitle="These poojas appear on the booking form and the /book catalogue. Deactivate a pooja to hide it site-wide (bookings already made are not affected) — edit its muhurat anytime and activate it again."
        count={list.length}
        onAdd={() => {
          setAdding(true);
          setEditing(null);
          setDraft(emptyDraft);
          setError("");
        }}
        onReset={reset}
      />

      {(adding || editing) && (
        <div className="mt-6 rounded-2xl border border-saffron-200 bg-cream/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">
              {editing ? `Edit — ${editing}` : "New Pooja"}
            </h3>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-maroon-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Slug *" hint="URL-friendly, e.g. ganesh-pooja">
              <TextInput
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase() }))}
                placeholder="ganesh-pooja"
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label="Title *">
              <TextInput
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ganesh Pooja"
              />
            </Field>
            <Field label="Hindi Title">
              <TextInput
                value={draft.hindiTitle}
                onChange={(e) => setDraft((d) => ({ ...d, hindiTitle: e.target.value }))}
                placeholder="गणेश पूजा"
              />
            </Field>
            <Field label="Emoji">
              <TextInput
                value={draft.emoji}
                onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                placeholder="🐘"
              />
            </Field>
            <Field label="Price (₹) *">
              <NumberInput
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                placeholder="1101"
                min={1}
              />
            </Field>
            <Field label="Duration">
              <TextInput
                value={draft.duration}
                onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
                placeholder="1.5 hours"
              />
            </Field>
            <Field label="Best Muhurat" hint="Shown on the pooja detail page">
              <TextInput
                value={draft.bestMuhurat}
                onChange={(e) => setDraft((d) => ({ ...d, bestMuhurat: e.target.value }))}
                placeholder="Wednesday & Sankashti Chaturthi"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Gradient tile">
                <GradientPicker
                  value={draft.gradient}
                  onChange={(v) => setDraft((d) => ({ ...d, gradient: v }))}
                />
              </Field>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description">
                <TextAreaInput
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Short description shown on cards and the detail page."
                />
              </Field>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Benefits" hint="Comma-separated, e.g. Wealth, Prosperity, Business growth">
                <TextInput
                  value={draft.benefits}
                  onChange={(e) => setDraft((d) => ({ ...d, benefits: e.target.value }))}
                  placeholder="Wealth & prosperity, Business growth, Blessings of Ganesha"
                />
              </Field>
            </div>

            {/* ── Event Scheduling Section ── */}
            <div className="sm:col-span-2 lg:col-span-3">
              <div className="rounded-xl border border-dashed border-saffron-300 bg-saffron-50/40 p-4">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-saffron-700">
                  📅 Event Scheduling (optional)
                </h4>
                <p className="mb-4 text-[11px] text-ink-soft/70">
                  Fill these fields to make this pooja appear as a live event on the home page carousel. Leave empty to keep it as a catalogue-only pooja.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Days from today" hint="0 = today; leave empty to hide from carousel">
                    <NumberInput
                      value={draft.daysFromToday}
                      onChange={(e) => setDraft((d) => ({ ...d, daysFromToday: e.target.value }))}
                      placeholder="e.g. 8"
                      min={0}
                    />
                  </Field>
                  <Field label="Event Time">
                    <TextInput
                      value={draft.eventTime}
                      onChange={(e) => setDraft((d) => ({ ...d, eventTime: e.target.value }))}
                      placeholder="7:00 PM IST"
                    />
                  </Field>
                  <Field label="Capacity" hint="Total seats; availability computed from bookings">
                    <NumberInput
                      value={draft.capacity}
                      onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
                      placeholder="e.g. 20"
                      min={1}
                    />
                  </Field>
                  <Field label="Seats label" hint="Fallback when no capacity set">
                    <TextInput
                      value={draft.seats}
                      onChange={(e) => setDraft((d) => ({ ...d, seats: e.target.value }))}
                      placeholder="Only 12 seats left"
                    />
                  </Field>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={draft.live}
                        onChange={(e) => setDraft((d) => ({ ...d, live: e.target.checked }))}
                        className="h-4 w-4 rounded border-saffron-300 text-saffron-600 focus:ring-saffron-500"
                      />
                      <span className="text-sm font-semibold text-ink">🔴 Show Live badge</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button onClick={save} className="btn-primary mt-5">
            {editing ? "Save Changes" : "Add Pooja to Catalog"}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2.5">
        {list.length === 0 ? (
          <p className="rounded-xl bg-saffron-50 px-4 py-6 text-center text-sm text-ink-soft">
            No poojas in the catalog yet — click “+ Add” to create one.
          </p>
        ) : (
          list.map((p) => (
            <div
              key={p.slug}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-100 bg-cream/40 px-4 py-3"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${p.gradient} text-xl shadow-soft`}
              >
                {p.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {p.title}
                  {p.hindiTitle && (
                    <span className="ml-2 font-devanagari text-xs font-medium text-ink-soft">
                      {p.hindiTitle}
                    </span>
                  )}
                  {p.daysFromToday != null && p.live && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600">
                      🔴 Live
                    </span>
                  )}
                  {p.daysFromToday != null && !p.live && (
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-600">
                      📅 Event
                    </span>
                  )}
                </p>
                <p className="truncate font-mono text-[11px] text-ink-soft">
                  {p.slug} · {p.duration}
                  {p.bestMuhurat ? ` · ${p.bestMuhurat}` : ""}
                  {p.daysFromToday != null ? ` · in ${p.daysFromToday}d${p.eventTime ? ` · ${p.eventTime}` : ""}` : ""}
                </p>
              </div>
              <span className="font-display text-sm font-bold text-saffron-600">
                {formatINR(p.price)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  isPoojaActive(p)
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {isPoojaActive(p) ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => toggleActive(p)}
                  aria-label={`${isPoojaActive(p) ? "Deactivate" : "Activate"} ${p.title}`}
                  title={isPoojaActive(p) ? "Hide from the site" : "Show on the site"}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
                    isPoojaActive(p)
                      ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                      : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {isPoojaActive(p) ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => startEdit(p)}
                  aria-label={`Edit ${p.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-saffron-200 bg-white text-saffron-700 transition-colors hover:bg-saffron-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(p.slug)}
                  aria-label={`Delete ${p.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-ink-soft/70">
        <Plus className="h-3.5 w-3.5" />
        Changes are saved to the server and apply instantly to the booking
        form, catalogue and detail pages — for every visitor.
      </p>
    </ManagerCard>
  );
}
