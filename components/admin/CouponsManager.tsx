"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import type { Coupon } from "@/lib/data";
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

interface Draft {
  code: string;
  kind: "percent" | "benefit";
  value: string;
  label: string;
  description: string;
  firstBookingOnly: boolean;
  minBookings: string;
  minAmount: string;
}

const emptyDraft: Draft = {
  code: "",
  kind: "percent",
  value: "10",
  label: "",
  description: "",
  firstBookingOnly: false,
  minBookings: "",
  minAmount: "",
};

function toCoupon(d: Draft): Coupon {
  const coupon: Coupon = {
    kind: d.kind,
    label: d.label.trim(),
    description: d.description.trim(),
  };
  if (d.kind === "percent") {
    const v = Number(d.value);
    if (!Number.isNaN(v) && v > 0) coupon.value = v;
  }
  if (d.firstBookingOnly) coupon.firstBookingOnly = true;
  const mb = Number(d.minBookings);
  if (!Number.isNaN(mb) && mb > 0) coupon.minBookings = mb;
  const ma = Number(d.minAmount);
  if (!Number.isNaN(ma) && ma > 0) coupon.minAmount = ma;
  return coupon;
}

export default function CouponsManager({
  token,
  onAuthError,
}: {
  token: string;
  onAuthError: () => void;
}) {
  const [list, setList] = useState<Record<string, Coupon>>({});
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setList(c.coupons);
    });
    return () => {
      live = false;
    };
  }, []);

  const validate = (): string | null => {
    const code = draft.code.trim().toUpperCase();
    if (!code) return "Coupon code is required.";
    if (!/^[A-Z0-9-]+$/.test(code)) {
      return "Code must be letters, numbers and dashes only (e.g. GANESHA10).";
    }
    if (!draft.label.trim()) return "A short label is required.";
    if (draft.kind === "percent") {
      const v = Number(draft.value);
      if (Number.isNaN(v) || v <= 0 || v > 100) {
        return "Percent discount must be between 1 and 100.";
      }
    }
    if (list[code] && code !== editing) {
      return "A coupon with this code already exists.";
    }
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    const code = draft.code.trim().toUpperCase();
    const coupon = toCoupon(draft);
    const next = { ...list, [code]: coupon };
    if (editing && editing !== code) delete next[editing];
    const res = await saveCatalogSection("coupons", next, token);
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

  const remove = async (code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    const next = { ...list };
    delete next[code];
    const res = await saveCatalogSection("coupons", next, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not delete the coupon.");
      return;
    }
    setList(next);
  };

  const reset = async () => {
    if (
      !window.confirm(
        "Reset the coupons to the default list? Any admin changes will be lost."
      )
    ) {
      return;
    }
    const res = await resetCatalogSection("coupons", token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset the coupons.");
      return;
    }
    const c = await fetchCatalog();
    setList(c.coupons);
  };

  const startEdit = (code: string, c: Coupon) => {
    setEditing(code);
    setAdding(false);
    setError("");
    setDraft({
      code,
      kind: c.kind,
      value: c.value ? String(c.value) : "",
      label: c.label,
      description: c.description,
      firstBookingOnly: Boolean(c.firstBookingOnly),
      minBookings: c.minBookings ? String(c.minBookings) : "",
      minAmount: c.minAmount ? String(c.minAmount) : "",
    });
  };

  const cancel = () => {
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
  };

  const entries = Object.entries(list);

  return (
    <ManagerCard>
      <ManagerHeader
        title="Coupons"
        subtitle="Coupons appear on the booking form (apply / quick chips) and the home page deals. Percent coupons give a cash discount; benefit coupons are free perks."
        count={entries.length}
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
              {editing ? `Edit — ${editing}` : "New Coupon"}
            </h3>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-maroon-600"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Code *">
              <TextInput
                value={draft.code}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))
                }
                placeholder="GANESHA10"
                className="font-mono tracking-widest"
              />
            </Field>
            <Field label="Kind *">
              <SelectInput
                value={draft.kind}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    kind: e.target.value as "percent" | "benefit",
                  }))
                }
                options={[
                  { value: "percent", label: "Percent discount" },
                  { value: "benefit", label: "Free benefit (no discount)" },
                ]}
              />
            </Field>
            {draft.kind === "percent" ? (
              <Field label="Discount % *">
                <NumberInput
                  value={draft.value}
                  onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                  min={1}
                  max={100}
                />
              </Field>
            ) : (
              <div className="flex items-end pb-1">
                <Toggle
                  checked={draft.firstBookingOnly}
                  onChange={(v) => setDraft((d) => ({ ...d, firstBookingOnly: v }))}
                  label="First booking only"
                />
              </div>
            )}
            <Field label="Label *" hint="Shown on the applied-coupon chip and deals card">
              <TextInput
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="10% off Ganesh poojas"
              />
            </Field>
            <Field label="Min bookings" hint="Optional — e.g. 3 means 3+ poojas booked">
              <NumberInput
                value={draft.minBookings}
                onChange={(e) => setDraft((d) => ({ ...d, minBookings: e.target.value }))}
                min={1}
              />
            </Field>
            <Field label="Min amount (₹)" hint="Optional — minimum pooja price">
              <NumberInput
                value={draft.minAmount}
                onChange={(e) => setDraft((d) => ({ ...d, minAmount: e.target.value }))}
                min={1}
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Description">
                <TextAreaInput
                  rows={2}
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Shown when the coupon is applied."
                />
              </Field>
            </div>
            {draft.kind === "benefit" && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Toggle
                  checked={draft.firstBookingOnly}
                  onChange={(v) => setDraft((d) => ({ ...d, firstBookingOnly: v }))}
                  label="First booking only"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </p>
          )}

          <button onClick={save} className="btn-primary mt-5">
            {editing ? "Save Changes" : "Add Coupon"}
          </button>
        </div>
      )}

      <div className="mt-6 space-y-2.5">
        {entries.length === 0 ? (
          <p className="rounded-xl bg-saffron-50 px-4 py-6 text-center text-sm text-ink-soft">
            No coupons yet — click “+ Add” to create one.
          </p>
        ) : (
          entries.map(([code, c]) => (
            <div
              key={code}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron-100 bg-cream/40 px-4 py-3"
            >
              <span className="rounded-lg bg-saffron-600 px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-white">
                {code}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-ink">
                  {c.label}
                </p>
                <p className="truncate text-[11px] text-ink-soft">
                  {c.kind === "percent" && c.value
                    ? `${c.value}% off`
                    : "Free benefit"}
                  {c.firstBookingOnly ? " · first booking only" : ""}
                  {c.minBookings ? ` · needs ${c.minBookings}+ bookings` : ""}
                  {c.minAmount ? ` · min ${formatINR(c.minAmount)}` : ""}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => startEdit(code, c)}
                  aria-label={`Edit ${code}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-saffron-200 bg-white text-saffron-700 transition-colors hover:bg-saffron-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(code)}
                  aria-label={`Delete ${code}`}
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
        New coupons appear on the booking form and the home page deals instantly —
        for every visitor.
      </p>
    </ManagerCard>
  );
}
