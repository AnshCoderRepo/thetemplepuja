"use client";

import { Calendar, Clock } from "lucide-react";
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
}: BookingDateSelectProps) {
  const { locale } = useI18n();

  const timeSlots = [
    {
      time: "06:00 AM IST",
      label:
        locale === "hi"
          ? "ब्रह्म मुहूर्त (प्रातः 6:00)"
          : locale === "te"
          ? "బ్రహ్మ ముహూర్తం (ఉదయం 6:00)"
          : locale === "ta"
          ? "பிரம்ம முகூர்த்தம் (காலை 6:00)"
          : "Brahma Muhurat (06:00 AM)",
    },
    {
      time: "11:30 AM IST",
      label:
        locale === "hi"
          ? "अभिजित मुहूर्त (दोपहर 11:30)"
          : locale === "te"
          ? "అభిజిత్ ముహూర్తం (మధ్యాహ్నం 11:30)"
          : locale === "ta"
          ? "அபிஜித் முகூர்த்தம் (பகல் 11:30)"
          : "Abhijit Kaal (11:30 AM)",
    },
    {
      time: "06:30 PM IST",
      label:
        locale === "hi"
          ? "संध्या / प्रदोष (शाम 6:30)"
          : locale === "te"
          ? "ప్రదోష కాలం (సాయంత్రం 6:30)"
          : locale === "ta"
          ? "பிரதோஷ காலம் (மாலை 6:30)"
          : "Pradosh Kaal (06:30 PM)",
    },
    {
      time: "08:00 PM IST",
      label:
        locale === "hi"
          ? "निशीथ / रात्रि (रात 8:00)"
          : locale === "te"
          ? "రాత్రి పూజ (రాత్రి 8:00)"
          : locale === "ta"
          ? "இரவு பூஜை (இரவு 8:00)"
          : "Night Ritual (08:00 PM)",
    },
  ];

  return (
    <div className="rounded-2xl border border-saffron-100 bg-white p-4 sm:p-5 shadow-xs space-y-4">
      {/* Date Selection */}
      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Calendar className="h-3.5 w-3.5 text-saffron-600" />
            <span>
              {locale === "hi"
                ? "शुभ मुहूर्त तिथि"
                : locale === "te"
                ? "శుభ ముహూర్త తేదీ"
                : locale === "ta"
                ? "சுப முகூர்த்த தேதி"
                : "Auspicious Date"}
            </span>
          </label>
          {selectedDate && (
            <span className="text-[11px] font-semibold text-saffron-800 bg-saffron-50 px-2 py-0.5 rounded-full border border-saffron-200">
              {selectedDate}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {upcomingDates.slice(0, 4).map((d) => {
            const isSelected = selectedDate === d.dateISO;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDateChange(d.dateISO)}
                className={`rounded-xl border py-2.5 px-3 text-center transition-all ${
                  isSelected
                    ? "border-saffron-500 bg-saffron-50 text-saffron-900 font-bold ring-1 ring-saffron-400"
                    : "border-saffron-100 bg-white text-ink hover:border-saffron-300 hover:bg-cream/40"
                }`}
              >
                <div className="text-xs font-bold">{d.dateDisplay}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Selection */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-bold text-ink mb-2.5">
          <Clock className="h-3.5 w-3.5 text-saffron-600" />
          <span>
            {locale === "hi"
              ? "पूजा समय (मुहूर्त)"
              : locale === "te"
              ? "పూజ సమయం"
              : locale === "ta"
              ? "பூஜை நேரம்"
              : "Muhurat Time"}
          </span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {timeSlots.map((slot) => {
            const isSelected = selectedTime === slot.time;
            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => onTimeChange(slot.time)}
                className={`rounded-xl border py-2 px-2.5 text-center transition-all ${
                  isSelected
                    ? "border-saffron-500 bg-saffron-50 text-saffron-900 font-bold ring-1 ring-saffron-400"
                    : "border-saffron-100 bg-white text-ink hover:border-saffron-300 hover:bg-cream/40"
                }`}
              >
                <div className="text-xs font-bold">{slot.time}</div>
                <div className="text-[10px] text-ink-soft truncate">{slot.label.split("(")[0]}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
