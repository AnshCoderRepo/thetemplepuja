import type { Pooja } from "@/lib/data";
import { getPoojaSchedule } from "@/lib/data";

export const TIMEZONE_INDIA = "Asia/Kolkata";

const indiaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE_INDIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Returns the calendar date formatted as YYYY-MM-DD in Asia/Kolkata timezone.
 * Safe from UTC day-boundary drift.
 */
export function getIndiaDateISO(date: Date = new Date()): string {
  return indiaDateFormatter.format(date);
}

/**
 * Parses a time string into minutes from midnight (0–1439) for ascending chronological comparison.
 * - Live/Instant/Now events resolve to 0 (earliest possible time on that date).
 * - 12-hour format ("5:00 AM IST", "08:00 AM", "6:30 PM IST", "7:00 PM") correctly parsed.
 * - 24-hour format ("05:00", "18:30") supported.
 * - Missing or invalid times safely fallback to 9999 so they sort after known times.
 */
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== "string") {
    return 9999;
  }

  const clean = timeStr.trim().toLowerCase();
  if (
    clean.includes("live") ||
    clean.includes("instant") ||
    clean.includes("now")
  ) {
    return 0;
  }

  // 12-hour format with AM/PM (e.g. "5:00 AM IST", "08:00 AM", "6:30 PM IST", "7 PM")
  const match12 = clean.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3].toLowerCase();
    if (meridian === "pm" && hours < 12) hours += 12;
    if (meridian === "am" && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  // 24-hour format (e.g. "05:00", "18:30")
  const match24 = clean.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return hours * 60 + minutes;
    }
  }

  return 9999;
}

export interface PoojaScheduleInfo {
  dateISO: string;
  time: string;
  timeMinutes: number;
  isValid: boolean;
  group: number; // 1: Today, 2: Tomorrow & Later, 3: Past, 4: Undated/Invalid
}

/**
 * Resolves the scheduled date, time, and chronological group for a pooja in Asia/Kolkata timezone.
 * Group 1: Scheduled for today (dateISO === todayISO)
 * Group 2: Scheduled for tomorrow or later dates (dateISO > todayISO)
 * Group 3: Past events (dateISO < todayISO)
 * Group 4: Undated or invalid dates
 */
export function resolvePoojaScheduleInfo(
  p: Pooja,
  now: Date = new Date(),
  todayISOOverride?: string
): PoojaScheduleInfo {
  const todayISO = todayISOOverride || getIndiaDateISO(now);
  let resolvedDateISO = "";
  let resolvedTime = (p.eventTime || "").trim();

  // 1. Explicit startDate on the pooja record (e.g., "2026-10-25" or parseable date string)
  if (p.startDate && p.startDate.trim()) {
    const raw = p.startDate.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      resolvedDateISO = raw;
    } else {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        resolvedDateISO = getIndiaDateISO(parsed);
      }
    }
  }

  // 2. Resolve via getPoojaSchedule
  if (!resolvedDateISO) {
    try {
      const schedule = getPoojaSchedule(p, now);
      if (schedule.dateISO && /^\d{4}-\d{2}-\d{2}$/.test(schedule.dateISO)) {
        resolvedDateISO = schedule.dateISO;
      }
      if (!resolvedTime && schedule.time) {
        resolvedTime = schedule.time.trim();
      }
    } catch {
      // Safely catch any unexpected errors
    }
  }

  const isValid = Boolean(resolvedDateISO && /^\d{4}-\d{2}-\d{2}$/.test(resolvedDateISO));
  const timeMinutes = parseTimeToMinutes(resolvedTime);

  let group = 4; // default invalid or undated
  if (isValid) {
    if (resolvedDateISO === todayISO) {
      group = 1; // Today
    } else if (resolvedDateISO > todayISO) {
      group = 2; // Tomorrow and later dates
    } else {
      group = 3; // Past
    }
  }

  return {
    dateISO: resolvedDateISO,
    time: resolvedTime,
    timeMinutes,
    isValid,
    group,
  };
}

/**
 * Chronologically sorts customer-facing puja cards:
 * 1. Eligible pujas scheduled for today appear first, ordered by start time ascending.
 * 2. Tomorrow's pujas appear next, followed by later dates in ascending calendar order.
 * 3. When multiple pujas share the same date, they are sorted by start time in ascending order.
 * 4. Past events (if any) are kept after all upcoming pujas.
 * 5. Undated/invalid records safely appear at the end.
 * 6. Uses a stable tie-break on original order so records with identical date/time stay consistently ordered.
 */
export function sortPoojasChronologically(
  list: Pooja[],
  now: Date = new Date(),
  todayISOOverride?: string
): Pooja[] {
  const todayISO = todayISOOverride || getIndiaDateISO(now);

  const decorated = list.map((pooja, index) => ({
    pooja,
    index,
    key: resolvePoojaScheduleInfo(pooja, now, todayISO),
  }));

  decorated.sort((a, b) => {
    // 1. Group comparison (1: Today, 2: Future, 3: Past, 4: Undated)
    if (a.key.group !== b.key.group) {
      return a.key.group - b.key.group;
    }

    // 2. Group 1 (Today): All share today's date; sort by start time ascending
    if (a.key.group === 1) {
      if (a.key.timeMinutes !== b.key.timeMinutes) {
        return a.key.timeMinutes - b.key.timeMinutes;
      }
      return a.index - b.index;
    }

    // 3. Group 2 (Future) & Group 3 (Past): Sort by dateISO ascending, then time ascending
    if (a.key.group === 2 || a.key.group === 3) {
      const dateCmp = a.key.dateISO.localeCompare(b.key.dateISO);
      if (dateCmp !== 0) {
        return dateCmp;
      }
      if (a.key.timeMinutes !== b.key.timeMinutes) {
        return a.key.timeMinutes - b.key.timeMinutes;
      }
      return a.index - b.index;
    }

    // 4. Group 4 (Undated/Invalid): Maintain original relative order
    return a.index - b.index;
  });

  return decorated.map((item) => item.pooja);
}
