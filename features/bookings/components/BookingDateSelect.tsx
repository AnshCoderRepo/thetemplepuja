"use client";

import { Calendar, Clock, Sparkles } from "lucide-react";
import type { Pooja } from "@/lib/data";
import { useI18n } from "@/components/providers";

export interface UpcomingDateOption {
  id: string;
  dateISO: string;
  dateDisplay: string;
  time: string;
}

interface BookingDateSelectProps {
  selectedDate: string;
  onDateChange: (dateISO: string) => void;
  selectedTime: string;
  onTimeChange: (time: string) => void;
  upcomingDates: UpcomingDateOption[];
  selectedPooja?: Pooja;
}

export default function BookingDateSelect({
  selectedDate,
  onDateChange,
  selectedTime,
  onTimeChange,
  upcomingDates,
  selectedPooja,
}: BookingDateSelectProps) {
  const { locale, t } = useI18n();

  const getTimeSlots = () => {
    if (locale === "hi") {
      return [
        { id: "brahma", time: "06:00 AM IST", label: "प्रातः काल / ब्रह्म मुहूर्त" },
        { id: "abhijit", time: "11:30 AM IST", label: "अभिजित मुहूर्त" },
        { id: "sandhya", time: "06:30 PM IST", label: "प्रदोष / संध्या काल" },
        { id: "ratra", time: "08:00 PM IST", label: "निशीथ काल / रात्रि पूजन" },
      ];
    }
    if (locale === "te") {
      return [
        { id: "brahma", time: "06:00 AM IST", label: "బ్రహ్మ ముహూర్తం" },
        { id: "abhijit", time: "11:30 AM IST", label: "అభిజిత్ ముహూర్తం" },
        { id: "sandhya", time: "06:30 PM IST", label: "ప్రదోష / సంధ్యా సమయం" },
        { id: "ratra", time: "08:00 PM IST", label: "రాత్రి పూజ" },
      ];
    }
    if (locale === "ta") {
      return [
        { id: "brahma", time: "06:00 AM IST", label: "பிரம்ம முகூர்த்தம்" },
        { id: "abhijit", time: "11:30 AM IST", label: "அபிஜித் முகூர்த்தம்" },
        { id: "sandhya", time: "06:30 PM IST", label: "பிரதோஷ / மாலை நேரம்" },
        { id: "ratra", time: "08:00 PM IST", label: "இரவு பூஜை" },
      ];
    }
    return [
      { id: "brahma", time: "06:00 AM IST", label: "Brahma Muhurat" },
      { id: "abhijit", time: "11:30 AM IST", label: "Abhijit Kaal" },
      { id: "sandhya", time: "06:30 PM IST", label: "Pradosh / Evening" },
      { id: "ratra", time: "08:00 PM IST", label: "Night Ritual" },
    ];
  };

  const timeSlots = getTimeSlots();

  return (
    <div className="rounded-3xl border border-saffron-100 bg-white p-5 sm:p-7 shadow-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-saffron-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-saffron-700">
            <Sparkles className="h-3 w-3" /> {t("booking.dates.eyebrow")}
          </span>
          <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
            {t("booking.dates.title")}
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            {t("booking.dates.subtitle")}
          </p>
        </div>

        {selectedDate && (
          <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-bold text-saffron-800 border border-saffron-200">
            📅 {selectedDate} {selectedTime ? `• ${selectedTime}` : ""}
          </span>
        )}
      </div>

      {/* Upcoming Panchang Dates */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-ink mb-2">
            {t("booking.dates.upcomingLabel")}
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {upcomingDates.slice(0, 4).map((d) => {
              const isSelected = selectedDate === d.dateISO;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onDateChange(d.dateISO);
                    if (d.time) onTimeChange(d.time);
                  }}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-saffron-500 bg-saffron-50/80 shadow-sm ring-1 ring-saffron-400"
                      : "border-saffron-100 bg-cream/30 hover:border-saffron-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-saffron-800">
                    <Calendar className="h-3.5 w-3.5 text-saffron-600" />
                    <span>{d.dateDisplay}</span>
                  </div>
                  <span className="mt-1 text-[11px] text-ink-soft font-medium">
                    {d.time || "7:00 PM IST"}
                  </span>
                  <span
                    className={`mt-2 text-[10px] font-bold ${
                      isSelected ? "text-saffron-900" : "text-saffron-700"
                    }`}
                  >
                    {isSelected ? `✓ ${t("booking.dates.selected")}` : t("booking.dates.selectDate")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date & Time Picker */}
        <div className="grid gap-4 sm:grid-cols-2 border-t border-saffron-100 pt-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              {t("booking.dates.customDateLabel")}
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-xl border border-saffron-200 bg-cream/40 px-3.5 py-2.5 text-sm font-semibold text-ink outline-none focus:border-saffron-400 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              {t("booking.dates.timeSlotLabel")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot.time;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onTimeChange(slot.time)}
                    className={`rounded-xl border px-2.5 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? "border-saffron-500 bg-saffron-500 text-white shadow-xs font-bold"
                        : "border-saffron-100 bg-white text-ink hover:border-saffron-300"
                    }`}
                  >
                    <span className="block truncate font-semibold">{slot.time}</span>
                    <span className={`block truncate text-[10px] ${isSelected ? "text-white/80" : "text-ink-soft"}`}>
                      {slot.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
