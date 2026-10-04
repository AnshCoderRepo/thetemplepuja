"use client";

import { CalendarClock } from "lucide-react";
import type { BookingRecord } from "@/lib/storage";

interface BookingRescheduleFormProps {
  booking: BookingRecord;
  reschedDate: string;
  onDateChange: (val: string) => void;
  reschedTime: string;
  onTimeChange: (val: string) => void;
  reschedMsg: { ok: boolean; text: string } | null;
  onSave: () => void;
  onCancel: () => void;
  inputCls: string;
}

export default function BookingRescheduleForm({
  booking: b,
  reschedDate,
  onDateChange,
  reschedTime,
  onTimeChange,
  reschedMsg,
  onSave,
  onCancel,
  inputCls,
}: BookingRescheduleFormProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
      <p className="text-xs font-bold text-amber-800">
        📅 Move this booking to a new muhurat
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80">
        {b.eventDateISO
          ? "This is an event slot — rescheduling moves your held seat to the new date."
          : "Pick a fresh date and time — the pandit will perform the pooja then."}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-amber-800">
            New Date *
          </label>
          <input
            type="date"
            min={new Date().toLocaleDateString("en-CA")}
            value={reschedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-amber-800">
            New Time *
          </label>
          <input
            value={reschedTime}
            onChange={(e) => onTimeChange(e.target.value)}
            placeholder="e.g. 7:00 PM IST"
            className={inputCls}
          />
        </div>
      </div>
      {reschedMsg && (
        <p
          className={`mt-2.5 text-xs font-semibold ${
            reschedMsg.ok ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {reschedMsg.ok ? "✅ " : "⚠️ "}
          {reschedMsg.text}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-700"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          Save New Muhurat
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
        >
          Keep Current Date
        </button>
      </div>
    </div>
  );
}
