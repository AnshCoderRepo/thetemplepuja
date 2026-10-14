/**
 * Devotee Profiles Excel Export Service
 * Provides sanitized, audit-compliant Excel (.xlsx) workbook generation
 * with distinct-customer deduplication, formula injection protection,
 * and Unicode / Hindi character support.
 */

import ExcelJS from "exceljs";
import type { BookingRecord, UserProfile } from "./storage";
import { cleanCustomerName, formatBookingDateTime } from "./booking-export";

export const DEVOTEE_EXPORT_COLUMNS = [
  { header: "User Name", key: "userName", width: 28 },
  { header: "Phone Number", key: "phoneNumber", width: 18 },
  { header: "Location / City", key: "location", width: 22 },
  { header: "Puja Name", key: "pujaName", width: 32 },
  { header: "Booking ID", key: "bookingId", width: 20 },
  { header: "Booking Date", key: "bookingDate", width: 24 },
  { header: "Scheduled Puja Date", key: "scheduledDate", width: 24 },
  { header: "Email ID", key: "emailId", width: 28 },
  { header: "All Booking References", key: "allBookings", width: 36 },
] as const;

/**
 * Normalizes phone numbers to standard representation while preserving country codes.
 */
export function normalizePhoneNumber(phone?: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d+]/g, "").trim();
  return cleaned;
}

/**
 * Protects against spreadsheet formula injection (CSV/Excel formula attacks).
 * If a cell string begins with =, +, -, @, or tab/CR, it is prepended with a single quote.
 */
export function sanitizeExcelValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  let str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return str;
}

export interface DevoteeExportRow {
  userName: string;
  phoneNumber: string;
  location: string;
  pujaName: string;
  bookingId: string;
  bookingDate: string;
  scheduledDate: string;
  emailId: string;
  allBookings: string;
}

/**
 * Deduplicates and prepares distinct customer rows for retargeting export.
 * Each distinct user is listed once. If the user has multiple bookings,
 * the primary columns reflect their latest/matching booking, and additional
 * references are listed in the 'All Booking References' column.
 */
export function buildDevoteeExportRows(
  users: UserProfile[],
  filterOptions: {
    pujaFilter?: string; // slug or 'all'
    statusFilter?: string; // booking status or 'all'
    searchQuery?: string;
  } = {}
): { rows: DevoteeExportRow[]; distinctCount: number } {
  const { pujaFilter = "all", statusFilter = "all", searchQuery = "" } = filterOptions;
  const q = searchQuery.toLowerCase().trim();

  const distinctUsers = users.filter((u) => {
    // 1. Search Query Filter
    const cleanDigits = q.replace(/\D/g, "");
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (cleanDigits.length >= 3 && u.phone.replace(/\D/g, "").includes(cleanDigits)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.gotra && u.gotra.toLowerCase().includes(q)) ||
      (u.city && u.city.toLowerCase().includes(q)) ||
      u.bookings.some(
        (b) =>
          b.bookingId.toLowerCase().includes(q) ||
          b.poojaTitle.toLowerCase().includes(q)
      );

    if (!matchSearch) return false;

    // 2. Puja Filter
    const matchPuja =
      pujaFilter === "all" ||
      u.bookings.some(
        (b) =>
          b.poojaSlug === pujaFilter ||
          b.poojaTitle.toLowerCase() === pujaFilter.toLowerCase()
      );

    if (!matchPuja) return false;

    // 3. Status Filter
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "none" && u.bookings.length === 0) ||
      u.bookings.some((b) => b.status === statusFilter);

    if (!matchStatus) return false;

    return true;
  });

  const rows: DevoteeExportRow[] = distinctUsers.map((user) => {
    const rawName = cleanCustomerName(user.name) || user.name || "Devotee";
    const userName = sanitizeExcelValue(rawName);
    const phoneNumber = sanitizeExcelValue(normalizePhoneNumber(user.phone));
    const location = sanitizeExcelValue(user.city || user.address || "Not specified");
    const emailId = sanitizeExcelValue(user.email || "");

    // Find bookings relevant to this user, prioritized by matching puja filter
    let relevantBookings = [...user.bookings];
    if (statusFilter !== "all" && statusFilter !== "none") {
      relevantBookings = relevantBookings.filter((b) => b.status === statusFilter);
    }
    if (pujaFilter !== "all") {
      const pujaSpecific = relevantBookings.filter(
        (b) =>
          b.poojaSlug === pujaFilter ||
          b.poojaTitle.toLowerCase() === pujaFilter.toLowerCase()
      );
      if (pujaSpecific.length > 0) {
        relevantBookings = pujaSpecific;
      }
    }

    // Sort newest booking first
    relevantBookings.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const primaryBooking: BookingRecord | undefined = relevantBookings[0] || user.bookings[0];

    let pujaName = "-";
    let bookingId = "-";
    let bookingDate = "-";
    let scheduledDate = "-";

    if (primaryBooking) {
      pujaName = sanitizeExcelValue(primaryBooking.poojaTitle || "Pooja Seva");
      bookingId = sanitizeExcelValue(primaryBooking.bookingId || "");
      bookingDate = sanitizeExcelValue(formatBookingDateTime(primaryBooking.createdAt));
      scheduledDate = sanitizeExcelValue(
        primaryBooking.date
          ? primaryBooking.time
            ? `${primaryBooking.date} (${primaryBooking.time})`
            : primaryBooking.date
          : primaryBooking.eventDateISO || ""
      );
    }

    // Deduplication context: if multiple bookings, summarize references
    let allBookingsSummary = "";
    if (user.bookings.length > 1) {
      const ids = user.bookings.map((b) => b.bookingId).filter(Boolean);
      allBookingsSummary = sanitizeExcelValue(
        `${ids.join(", ")} (${user.bookings.length} total bookings)`
      );
    } else if (user.bookings.length === 1) {
      allBookingsSummary = sanitizeExcelValue(user.bookings[0].bookingId);
    } else {
      allBookingsSummary = "No bookings registered yet";
    }

    return {
      userName,
      phoneNumber,
      location,
      pujaName,
      bookingId,
      bookingDate,
      scheduledDate,
      emailId,
      allBookings: allBookingsSummary,
    };
  });

  return {
    rows,
    distinctCount: distinctUsers.length,
  };
}

/**
 * Creates an Excel (.xlsx) binary buffer using ExcelJS with styled headers,
 * auto-column widths, and UTF-8 support.
 */
export async function generateDevoteesExcelWorkbook(
  users: UserProfile[],
  filterOptions: {
    pujaFilter?: string;
    pujaTitle?: string;
    statusFilter?: string;
    searchQuery?: string;
  } = {}
): Promise<{ buffer: Uint8Array; filename: string; distinctCount: number }> {
  const { rows, distinctCount } = buildDevoteeExportRows(users, filterOptions);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "templepujasewa Admin Console";
  workbook.lastModifiedBy = "Authorized Administrator";
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheetName = filterOptions.pujaTitle
    ? `${filterOptions.pujaTitle.slice(0, 25)} Devotees`
    : "Devotee Retargeting";
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  // Setup columns
  worksheet.columns = DEVOTEE_EXPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Calibri",
      size: 11,
      bold: true,
      color: { argb: "FF7C2D12" }, // deep saffron/brown
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFEDD5" }, // light saffron cream #FFEDD5
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: false,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFFDBA74" } },
      bottom: { style: "medium", color: { argb: "FFF97316" } },
      left: { style: "thin", color: { argb: "FFFED7AA" } },
      right: { style: "thin", color: { argb: "FFFED7AA" } },
    };
  });

  // Add Data Rows
  rows.forEach((row, idx) => {
    const dataRow = worksheet.addRow({
      userName: row.userName,
      phoneNumber: row.phoneNumber,
      location: row.location,
      pujaName: row.pujaName,
      bookingId: row.bookingId,
      bookingDate: row.bookingDate,
      scheduledDate: row.scheduledDate,
      emailId: row.emailId,
      allBookings: row.allBookings,
    });

    dataRow.height = 20;

    // Alternate row zebra styling
    const isEven = idx % 2 === 0;
    dataRow.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 10 };
      cell.alignment = { vertical: "middle" };
      if (!isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFAFAF9" },
        };
      }
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFF5F5F4" } },
      };
    });
  });

  // Auto-calculate dynamic filename
  const dateStr = new Date().toISOString().slice(0, 10);
  const slugPart = filterOptions.pujaFilter && filterOptions.pujaFilter !== "all"
    ? filterOptions.pujaFilter.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    : "all-devotees";
  const filename = `${slugPart}-devotees-${dateStr}.xlsx`;

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: new Uint8Array(arrayBuffer),
    filename,
    distinctCount,
  };
}
