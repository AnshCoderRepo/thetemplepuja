"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import { fetchCatalog, resetCatalogSection, saveCatalogSection } from "@/lib/api";
import { isCouponActive, type Coupon } from "@/lib/data";
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
  active: boolean;
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
  active: true,
};

function toCoupon(d: Draft): Coupon {
  const coupon: Coupon = {
    kind: d.kind,
    label: d.label.trim(),
    description: d.description.trim(),
    active: d.active,
    isActive: d.active,
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
  const [successMsg, setSuccessMsg] = useState("");
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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
    setSuccessMsg("");
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
    setSuccessMsg(
      editing
        ? `Coupon "${code}" updated successfully.`
        : `Coupon "${code}" added successfully.`
    );
    setTimeout(() => setSuccessMsg(""), 4000);
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
  };

  const toggleStatus = async (code: string) => {
    if (updatingCode) return;
    const current = list[code];
    if (!current) return;
    const currentActive = isCouponActive(current);
    const nextActive = !currentActive;

    // Optimistic update
    const previousList = list;
    const nextList: Record<string, Coupon> = {
      ...list,
      [code]: {
        ...current,
        active: nextActive,
        isActive: nextActive,
      },
    };

    setList(nextList);
    setUpdatingCode(code);
    setError("");
    setSuccessMsg("");

    try {
      const res = await saveCatalogSection("coupons", nextList, token);
      if (!res.ok) {
        setList(previousList); // Rollback to previous state
        if (res.status === 401) {
          onAuthError();
          return;
        }
        setError(res.error ?? `Could not update status for coupon "${code}".`);
        return;
      }
      setSuccessMsg(
        `Coupon "${code}" is now ${nextActive ? "Active" : "Inactive"}.`
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      setList(previousList); // Rollback
      setError(
        err instanceof Error
          ? err.message
          : "Network error while saving coupon status."
      );
    } finally {
      setUpdatingCode(null);
    }
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
    setSuccessMsg(`Coupon "${code}" deleted.`);
    setTimeout(() => setSuccessMsg(""), 3500);
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
    setSuccessMsg("Coupons reset to default catalog.");
    setTimeout(() => setSuccessMsg(""), 3500);
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
      active: isCouponActive(c),
    });
  };

  const cancel = () => {
    setAdding(false);
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
  };

  const entries = Object.entries(list);
  const activeCount = entries.filter(([, c]) => isCouponActive(c)).length;
  const inactiveCount = entries.length - activeCount;

  const filteredEntries = entries.filter(([, c]) => {
    const active = isCouponActive(c);
    if (statusFilter === "active") return active;
    if (statusFilter === "inactive") return !active;
    return true;
  });

  return (
    <ManagerCard>
      <ManagerHeader
        title="Coupons"
        subtitle="Coupons are applied at the secure payment checkout only — percent coupons give a cash discount; benefit coupons are free perks."
        count={entries.length}
        onAdd={() => {
          setAdding(true);
          setEditing(null);
          setDraft(emptyDraft);
          setError("");
        }}
        onReset={reset}
      />

      {/* Status Filter Tabs */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100/70 pb-3">
        <div className="flex items-center gap-1 rounded-xl bg-cream/70 p-1 border border-saffron-100 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-saffron-800 shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            All ({entries.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
              statusFilter === "active"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`rounded-lg px-3 py-1 font-semibold transition-all cursor-pointer ${
              statusFilter === "inactive"
                ? "bg-white text-slate-700 shadow-xs"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>

        {statusFilter !== "all" && (
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-xs font-semibold text-saffron-700 hover:text-maroon-700 hover:underline cursor-pointer"
          >
            Show All
          </button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-semibold text-emerald-700">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {successMsg}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="text-emerald-700/60 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {(adding || editing) && (
        <div className="mt-6 rounded-2xl border border-saffron-200 bg-cream/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-ink">
              {editing ? `Edit — ${editing}` : "New Coupon"}
            </h3>
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-maroon-600 cursor-pointer"
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
            <Field label="Label *" hint="Shown on the applied-coupon chip at checkout">
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

            {/* Active Status in Edit / New Form */}
            <div className="flex items-center pt-2">
              <Toggle
                checked={draft.active}
                onChange={(v) => setDraft((d) => ({ ...d, active: v }))}
                label={
                  draft.active
                    ? "Status: Active (usable at checkout)"
                    : "Status: Inactive (hidden & rejected)"
                }
              />
            </div>

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

          <button onClick={save} className="btn-primary mt-5 cursor-pointer">
            {editing ? "Save Changes" : "Add Coupon"}
          </button>
        </div>
      )}

      {/* Coupons List */}
      <div className="mt-6 space-y-2.5">
        {entries.length === 0 ? (
          <p className="rounded-xl bg-saffron-50 px-4 py-6 text-center text-sm text-ink-soft">
            No coupons yet — click “+ Add” to create one.
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className="rounded-xl bg-saffron-50 px-4 py-6 text-center text-sm text-ink-soft">
            No coupons match the &ldquo;{statusFilter}&rdquo; filter.
          </p>
        ) : (
          filteredEntries.map(([code, c]) => {
            const active = isCouponActive(c);
            const isUpdating = updatingCode === code;

            return (
              <div
                key={code}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                  active
                    ? "border-saffron-100 bg-cream/40"
                    : "border-slate-200 bg-slate-50/75 opacity-90"
                }`}
              >
                {/* Coupon Code Pill */}
                <span
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-bold tracking-widest text-white shadow-xs ${
                    active ? "bg-saffron-600" : "bg-slate-500"
                  }`}
                >
                  {code}
                </span>

                {/* Details & Status Badge */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {c.label}
                    </p>
                    {/* Clear Status Badge */}
                    {active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 border border-slate-300 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-ink-soft mt-0.5">
                    {c.kind === "percent" && c.value
                      ? `${c.value}% off`
                      : "Free benefit"}
                    {c.firstBookingOnly ? " · first booking only" : ""}
                    {c.minBookings ? ` · needs ${c.minBookings}+ bookings` : ""}
                    {c.minAmount ? ` · min ${formatINR(c.minAmount)}` : ""}
                  </p>
                </div>

                {/* Controls: Active/Inactive Toggle + Edit + Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Toggle Button */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    disabled={isUpdating}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(code);
                    }}
                    title={active ? `Click to deactivate ${code}` : `Click to activate ${code}`}
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
                      active
                        ? "bg-emerald-50/90 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    } ${isUpdating ? "opacity-60 cursor-not-allowed" : "active:scale-95"}`}
                  >
                    <span
                      className={`relative inline-block h-4 w-7 shrink-0 rounded-full transition-colors ${
                        active ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
                          active ? "left-[14px]" : "left-0.5"
                        }`}
                      />
                    </span>
                    <span className="text-[11px] font-bold">
                      {isUpdating ? "Saving..." : active ? "Active" : "Inactive"}
                    </span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => startEdit(code, c)}
                    aria-label={`Edit ${code}`}
                    title={`Edit coupon ${code}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-saffron-200 bg-white text-saffron-700 transition-colors hover:bg-saffron-50 active:scale-95 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => remove(code)}
                    aria-label={`Delete ${code}`}
                    title={`Delete coupon ${code}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition-colors hover:bg-red-50 active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-ink-soft/70">
        <Plus className="h-3.5 w-3.5" />
        New coupons appear instantly at the secure checkout — for every visitor.
      </p>
    </ManagerCard>
  );
}
