"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const fieldCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-ink-soft">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-ink-soft/60">{hint}</span>
      )}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldCls} ${props.className ?? ""}`} />;
}

export function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      className={`${fieldCls} ${props.className ?? ""}`}
    />
  );
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${fieldCls} resize-none ${props.className ?? ""}`}
    />
  );
}

export function SelectInput({
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <select {...props} className={`${fieldCls} ${props.className ?? ""}`}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5"
    >
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-saffron-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
      <span className="text-sm font-semibold text-ink">{label}</span>
    </button>
  );
}

export const GRADIENTS = [
  "from-orange-400 to-rose-500",
  "from-amber-400 to-orange-600",
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-slate-600 to-gray-900",
  "from-fuchsia-500 to-pink-600",
  "from-yellow-400 to-amber-600",
  "from-sky-500 to-blue-700",
  "from-rose-400 to-pink-600",
  "from-red-500 to-rose-700",
  "from-amber-500 to-yellow-600",
  "from-emerald-400 to-green-600",
];

export function GradientPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {GRADIENTS.map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange(g)}
          aria-label={g}
          title={g}
          className={`h-8 w-14 rounded-lg bg-gradient-to-br ${g} transition-all ${
            value === g
              ? "scale-105 ring-2 ring-saffron-500 ring-offset-2"
              : "opacity-60 hover:opacity-100"
          }`}
        />
      ))}
    </div>
  );
}

export function ManagerCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft">
      {children}
    </div>
  );
}

export function ManagerHeader({
  title,
  subtitle,
  count,
  onAdd,
  onReset,
}: {
  title: string;
  subtitle: string;
  count: number;
  onAdd: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          {title}
          <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-[11px] font-bold text-saffron-700">
            {count}
          </span>
        </h2>
        <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
      </div>
      <div className="flex gap-2.5">
        <button onClick={onReset} className="btn-outline !px-4 !py-2.5 text-xs">
          Reset to defaults
        </button>
        <button onClick={onAdd} className="btn-primary !px-4 !py-2.5 text-xs">
          + Add
        </button>
      </div>
    </div>
  );
}
