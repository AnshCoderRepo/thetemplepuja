"use client";

import {
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Calendar, X } from "lucide-react";

export const fieldCls =
  "w-full rounded-xl border border-saffron-100 bg-cream px-3.5 py-2.5 text-sm text-ink outline-none transition-all placeholder:text-ink-soft/40 focus:border-saffron-400 focus:bg-white focus:ring-2 focus:ring-saffron-200";

/**
 * Converts any date representation (ISO "2026-10-04", text "Oct 4, 2026", etc.)
 * into standard HTML5 date format "YYYY-MM-DD".
 */
export function toISODateString(val?: string | null): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

/** Formats a date string (ISO or human text) into e.g. "Sun, 4 Oct 2026" */
export function formatDateDisplay(val?: string | null): string {
  const iso = toISODateString(val);
  if (!iso) return val || "";
  try {
    const [y, m, d] = iso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val || "";
  }
}

/** Converts "days from today" to an ISO "YYYY-MM-DD" string */
export function daysFromTodayToDate(days: number | string): string {
  const num = typeof days === "number" ? days : parseInt(days, 10);
  if (isNaN(num)) return "";
  const d = new Date();
  d.setDate(d.getDate() + num);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Converts an ISO "YYYY-MM-DD" date string to days from today */
export function dateToDaysFromToday(dateStr: string): number {
  const iso = toISODateString(dateStr);
  if (!iso) return 0;
  try {
    const target = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

export interface DateInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  showPreview?: boolean;
  showQuickActions?: boolean;
}

export function DateInput({
  value,
  onChange,
  showPreview = true,
  showQuickActions = true,
  className = "",
  min,
  max,
  placeholder,
  disabled,
  ...rest
}: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isoValue = toISODateString(value);
  const displayLabel = isoValue ? formatDateDisplay(isoValue) : "";

  const openPicker = () => {
    if (disabled) return;
    try {
      if (inputRef.current && "showPicker" in inputRef.current) {
        inputRef.current.showPicker();
        return;
      }
    } catch {
      // fallback to focus
    }
    inputRef.current?.focus();
  };

  const setOffsetDays = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  };

  return (
    <div className="space-y-1.5">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="date"
          value={isoValue}
          min={min}
          max={max}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          className={`${fieldCls} pr-10 cursor-pointer font-medium ${className}`}
          placeholder={placeholder}
          {...rest}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker}
          title="Click to select from calendar"
          aria-label="Open calendar picker"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-saffron-600 hover:bg-saffron-100 hover:text-saffron-800 transition-colors"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {showPreview && displayLabel && (
        <div className="flex items-center justify-between text-[11px] text-ink-soft">
          <span className="inline-flex items-center gap-1 font-semibold text-saffron-800 bg-saffron-50 px-2 py-0.5 rounded-md border border-saffron-200">
            🗓️ {displayLabel}
          </span>
          {showQuickActions && isoValue && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-ink-soft/60 hover:text-red-600 transition-colors inline-flex items-center gap-0.5"
              title="Clear date"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      )}

      {showQuickActions && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => setOffsetDays(0)}
            className="rounded-md border border-saffron-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-soft hover:border-saffron-400 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setOffsetDays(1)}
            className="rounded-md border border-saffron-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-soft hover:border-saffron-400 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => setOffsetDays(7)}
            className="rounded-md border border-saffron-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-soft hover:border-saffron-400 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
          >
            +7 Days
          </button>
          <button
            type="button"
            onClick={() => setOffsetDays(14)}
            className="rounded-md border border-saffron-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-soft hover:border-saffron-400 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
          >
            +14 Days
          </button>
          <button
            type="button"
            onClick={() => setOffsetDays(30)}
            className="rounded-md border border-saffron-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-ink-soft hover:border-saffron-400 hover:text-saffron-700 hover:bg-saffron-50 transition-colors"
          >
            +30 Days
          </button>
        </div>
      )}
    </div>
  );
}

export function CalendarDayPicker({
  value,
  onChange,
}: {
  value: string | number;
  onChange: (day: number) => void;
}) {
  const selectedDay = typeof value === "number" ? value : parseInt(String(value), 10);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="space-y-2 rounded-2xl border border-saffron-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-ink">
          Select Day of Month:
        </span>
        {selectedDay >= 1 && selectedDay <= 31 ? (
          <span className="rounded-lg bg-saffron-100 px-2 py-0.5 font-bold text-saffron-800">
            Selected: Every {getOrdinal(selectedDay)}
          </span>
        ) : (
          <span className="text-ink-soft text-[11px]">Click a day on the calendar below</span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {days.map((d) => {
          const isSelected = selectedDay === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className={`h-8 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-saffron-600 to-maroon-600 text-white shadow font-bold scale-105"
                  : "bg-cream/60 text-ink hover:bg-saffron-100 hover:text-saffron-800"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
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

export function ManagerCard({
  children,
  active = true,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-saffron-100 bg-white p-6 shadow-soft transition-opacity ${
        active ? "opacity-100" : "opacity-60 bg-slate-50"
      }`}
    >
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
  addLabel = "+ Add",
}: {
  title: string;
  subtitle: string;
  count?: number;
  onAdd: () => void;
  onReset: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-[11px] font-bold text-saffron-700">
              {count}
            </span>
          )}
        </h2>
        <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onReset}
          className="btn-outline !px-4 !py-2.5 text-xs"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="btn-primary !px-4 !py-2.5 text-xs"
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
