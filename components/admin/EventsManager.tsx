"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import { seatsLabel, type UpcomingEventSpec } from "@/lib/data";
import {
  Field,
  GradientPicker,
  ManagerCard,
  ManagerHeader,
  NumberInput,
  TextInput,
  Toggle,
} from "./manager-ui";

interface Draft {
  title: string;
  slug: string;
  daysFromToday: string;
  time: string;
  seats: string;
  capacity: string;
  live: boolean;
  price: string;
  emoji: string;
  gradient: string;
}

const emptyDraft: Draft = {
  title: "",
  slug: "",
  daysFromToday: "7",
  time: "7:00 PM IST",
  seats: "20 spots open",
  capacity: "",
  live: true,
  price: "₹1,001",
  emoji: "🪔",
  gradient: "from-saffron-500 to-saffron-700",
};

export default function EventsManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [list, setList] = useState<UpcomingEventSpec[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setList(c.events);
    });
    return () => {
      live = false;
    };
  }, []);

  const validate = (): string | null => {
    if (!draft.title.trim() || !draft.slug.trim()) {
      return "Title and slug are required.";
    }
    if (!/^[a-z0-9-]+$/.test(draft.slug.trim())) {
      return "Slug must be lowercase letters, numbers and dashes only.";
    }
    const days = Number(draft.daysFromToday);
    if (Number.isNaN(days) || days < 0) {
      return "Days from today must be 0 or more.";
    }
    if (!draft.time.trim() || !draft.price.trim()) {
      return "Time and price are required.";
    }
    const cap = Number(draft.capacity);
    if (draft.capacity.trim() && (!Number.isInteger(cap) || cap < 1)) {
      return "Capacity must be a whole number of 1 or more (leave blank for unlimited).";
    }
    if (list.some((e) => e.slug === draft.slug.trim() && e.slug !== editing)) {
      return "Another event already uses this slug.";
    }
    return null;
  };

  const toSpec = (): UpcomingEventSpec => ({
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    daysFromToday: Number(draft.daysFromToday),
    time: draft.time.trim(),
    seats: draft.seats.trim() || "Open",
    capacity: draft.capacity.trim() ? Number(draft.capacity.trim()) : undefined,
    live: draft.live,
    price: draft.price.trim(),
    emoji: draft.emoji.trim() || "🪔",
    gradient: draft.gradient,
  });

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const spec = toSpec();
    const next = editing
      ? list.map((e) => (e.slug === editing ? spec : e))
      : [...list, spec];
    const res = await saveCatalogSection("events", next, token);
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

  const remove = async (slug: string) => {
    if (!window.confirm(`Delete event "${slug}" from the schedule?`)) return;
    const next = list.filter((e) => e.slug !== slug);
    const res = await saveCatalogSection("events", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not delete the event.");
      return;
    }
    setList(next);
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Reset the events schedule to the default list? Any admin changes will be lost."
      )
    ) {
      return;
    }
    const res = await resetCatalogSection("events", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset the schedule.");
      return;
    }
    const c = await fetchCatalog();
    setList(c.events);
  };

  const startEdit = (e: UpcomingEventSpec) => {
    setEditing(e.slug);
    setAdding(false);
    setError("");
    setDraft({
      title: e.title,
      slug: e.slug,
      daysFromToday: String(e.daysFromToday),
      time: e.time,
      seats: e.seats,
      capacity: e.capacity != null ? String(e.capacity) : "",
      live: e.live,
      price: e.price,
      emoji: e.emoji,
      gradient: e.gradient,
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
        title="Live Events Schedule"
        subtitle="These cards appear in the coverflow on the home page. Dates are computed from “days from today” so past events drop off automatically."
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
              {editing ? `Edit — ${editing}` : "New Event"}
            </h3>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-maroon-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Title *">
              <TextInput
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="Ganesh Utsav Pooja"
              />
            </Field>
            <Field label="Slug *" hint="Must match a pooja slug for the Book Slot link">
              <TextInput
                value={draft.slug}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase() }))}
                placeholder="ganesh-pooja"
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label="Days from today *" hint="0 = today; past events are hidden automatically">
              <NumberInput
                value={draft.daysFromToday}
                onChange={(e) => setDraft((d) => ({ ...d, daysFromToday: e.target.value }))}
                min={0}
              />
            </Field>
            <Field label="Time *">
              <TextInput
                value={draft.time}
                onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                placeholder="7:00 PM IST"
              />
            </Field>
            <Field label="Capacity (optional)" hint="Total seats; availability is computed from confirmed bookings, so a cancel frees a seat automatically">
              <NumberInput
                value={draft.capacity}
                onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))}
                placeholder="e.g. 20"
                min={1}
              />
            </Field>
            <Field label="Seats label" hint="Fallback text shown when no capacity is set">
              <TextInput
                value={draft.seats}
                onChange={(e) => setDraft((d) => ({ ...d, seats: e.target.value }))}
                placeholder="Only 12 seats left"
              />
            </Field>
            <Field label="Price *">
              <TextInput
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                placeholder="₹1,001"
              />
            </Field>
            <Field label="Emoji">
              <TextInput
                value={draft.emoji}
                onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value }))}
                placeholder="🐘"
              />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle
                checked={draft.live}
                onChange={(v) => setDraft((d) => ({ ...d, live: v }))}
                label="🔴 Live badge"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Gradient tile">
                <GradientPicker
                  value={draft.gradient}
                  onChange={(v) => setDraft((d) => ({ ...d, gradient: v }))}
                />
              </Field>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button onClick={save} className="btn-primary mt-5">
            {editing ? "Save Changes" : "Add Event"}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2.5">
        {list.length === 0 ? (
          <p className="rounded-xl bg-saffron-50 px-4 py-6 text-center text-sm text-ink-soft">
            No events scheduled yet — click “+ Add” to create one.
          </p>
        ) : (
          list.map((e) => (
            <div
              key={e.slug}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-100 bg-cream/40 px-4 py-3"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${e.gradient} text-xl shadow-soft`}
              >
                {e.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {e.title}
                  {e.live && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600">
                      🔴 Live
                    </span>
                  )}
                </p>
                <p className="truncate font-mono text-[11px] text-ink-soft">
                  {e.slug} · in {e.daysFromToday} day{e.daysFromToday === 1 ? "" : "s"} · {e.time} ·{" "}
                  {seatsLabel(e)}
                </p>
              </div>
              <span className="font-display text-sm font-bold text-saffron-600">
                {e.price}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => startEdit(e)}
                  aria-label={`Edit ${e.title}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-saffron-200 bg-white text-saffron-700 transition-colors hover:bg-saffron-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(e.slug)}
                  aria-label={`Delete ${e.title}`}
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
        Events render on the home page coverflow; the “Book Slot” button links to
        the matching pooja slug. Saved to the server for every visitor.
      </p>
    </ManagerCard>
  );
}
