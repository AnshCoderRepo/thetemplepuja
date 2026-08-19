"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import { computeUpcomingDates, type PoojaDate } from "@/lib/data";
import {
  Field,
  ManagerCard,
  ManagerHeader,
  NumberInput,
  TextInput,
  Toggle,
} from "./manager-ui";

interface Draft {
  id: string;
  dayOfMonth: string;
  time: string;
  active: boolean;
}

const emptyDraft: Draft = {
  id: "",
  dayOfMonth: "8",
  time: "7:00 PM IST",
  active: true,
};

export default function DatesManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [list, setList] = useState<PoojaDate[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setList(c.poojaDates);
    });
    return () => {
      live = false;
    };
  }, []);

  const upcoming = computeUpcomingDates(list);

  const validate = (): string | null => {
    if (!draft.id.trim()) {
      return "A short ID is required (e.g. \"8th-7pm\").";
    }
    if (!/^[a-z0-9-]+$/.test(draft.id.trim())) {
      return "ID must be lowercase letters, numbers and dashes only.";
    }
    const day = Number(draft.dayOfMonth);
    if (Number.isNaN(day) || day < 1 || day > 31) {
      return "Day of month must be between 1 and 31.";
    }
    if (!draft.time.trim()) {
      return "Time is required.";
    }
    if (list.some((d) => d.id === draft.id.trim() && d.id !== editing)) {
      return "Another date already uses this ID.";
    }
    return null;
  };

  const toPoojaDate = (): PoojaDate => ({
    id: draft.id.trim(),
    dayOfMonth: Number(draft.dayOfMonth),
    time: draft.time.trim(),
    active: draft.active,
  });

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const poojaDate = toPoojaDate();
    const next = editing
      ? list.map((d) => (d.id === editing ? poojaDate : d))
      : [...list, poojaDate];
    const res = await saveCatalogSection("poojaDates", next, token);
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

  const remove = async (id: string) => {
    if (!window.confirm(`Delete date "${id}" from the schedule?`)) return;
    const next = list.filter((d) => d.id !== id);
    const res = await saveCatalogSection("poojaDates", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not delete the date.");
      return;
    }
    setList(next);
  };

  const toggleActive = async (d: PoojaDate) => {
    const next = list.map((x) =>
      x.id === d.id ? { ...x, active: !x.active } : x
    );
    const res = await saveCatalogSection("poojaDates", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not update the date.");
      return;
    }
    setError("");
    setList(next);
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Reset pooja dates to the default (empty) list? Any admin changes will be lost."
      )
    ) {
      return;
    }
    const res = await resetCatalogSection("poojaDates", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset the dates.");
      return;
    }
    const c = await fetchCatalog();
    setList(c.poojaDates);
  };

  const startEdit = (d: PoojaDate) => {
    setEditing(d.id);
    setAdding(false);
    setError("");
    setDraft({
      id: d.id,
      dayOfMonth: String(d.dayOfMonth),
      time: d.time,
      active: d.active,
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
        title="Pooja Dates"
        subtitle="Set the recurring dates each month when pujas are conducted (e.g. 8th, 16th, 23rd). Devotees pick from upcoming dates when booking."
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
              {editing ? `Edit — ${editing}` : "New Pooja Date"}
            </h3>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-maroon-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="ID *" hint="Short identifier, e.g. 8th-7pm">
              <TextInput
                value={draft.id}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  }))
                }
                placeholder="8th-7pm"
                disabled={Boolean(editing)}
              />
            </Field>
            <Field label="Day of Month *" hint="1–31">
              <NumberInput
                value={draft.dayOfMonth}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dayOfMonth: e.target.value }))
                }
                min={1}
                max={31}
              />
            </Field>
            <Field label="Time *">
              <TextInput
                value={draft.time}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, time: e.target.value }))
                }
                placeholder="7:00 PM IST"
              />
            </Field>
            <div className="flex items-end pb-1">
              <Toggle
                checked={draft.active}
                onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
                label="Active"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button onClick={save} className="btn-primary mt-5">
            {editing ? "Save Changes" : "Add Date"}
          </button>
        </div>
      )}

      {/* Active dates list */}
      <div className="mt-6 space-y-2.5">
        {list.length === 0 ? (
          <p className="rounded-xl bg-saffron-50 px-4 py-6 text-center text-sm text-ink-soft">
            No pooja dates configured yet — click &ldquo;+ Add&rdquo; to set
            recurring dates (e.g. 8th, 16th, 23rd of each month).
          </p>
        ) : (
          list.map((d) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-100 bg-cream/40 px-4 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-maroon-600 text-lg font-bold text-white shadow-soft">
                {d.dayOfMonth}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {d.id}
                </p>
                <p className="truncate font-mono text-[11px] text-ink-soft">
                  Every {ordinal(d.dayOfMonth)} · {d.time}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  d.active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {d.active ? "Active" : "Inactive"}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => toggleActive(d)}
                  aria-label={`${d.active ? "Deactivate" : "Activate"} ${d.id}`}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-colors ${
                    d.active
                      ? "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
                      : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {d.active ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => startEdit(d)}
                  aria-label={`Edit ${d.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-saffron-200 bg-white text-saffron-700 transition-colors hover:bg-saffron-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(d.id)}
                  aria-label={`Delete ${d.id}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upcoming dates preview */}
      {upcoming.length > 0 && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            📅 Upcoming Dates (what devotees will see)
          </h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {upcoming.slice(0, 9).map((u) => (
              <span
                key={u.id}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700"
              >
                {u.dateDisplay} · {u.time}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-ink-soft/70">
        <Plus className="h-3.5 w-3.5" />
        Dates are shown in the booking flow — devotees pick from upcoming
        dates before filling their details.
      </p>
    </ManagerCard>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
