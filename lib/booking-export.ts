/**
 * Booking Export and Devotee Display Utilities
 * Provides sanitized, audit-compliant CSV generation and devotee naming helpers.
 */

import type { BookingRecord, UserProfile } from "./storage";

/**
 * Standard 14 export columns in exact required order.
 */
export const BOOKING_EXPORT_HEADERS = [
  "User Name",
  "User Phone",
  "Booking Date",
  "Booking ID",
  "Email ID",
  "Perform Date",
  "Puja Name",
  "Temple Name",
  "Price",
  "Currency",
  "Devotee / Family Member Names",
  "Gotra",
  "User Address",
  "Quantity",
] as const;

/**
 * Strips legacy composite strings like " & Family (X Members)" from a customer name.
 */
export function cleanCustomerName(rawName?: string): string {
  if (!rawName) return "";
  return rawName.replace(/\s*&\s*Family\s*\(\d+\s*Members\)/gi, "").trim();
}

export interface BookingDevoteeInfo {
  primaryName: string;
  tableDisplayName: string;
  allDevoteeNames: string;
  allGotras: string;
  devoteeCount: number;
}

/**
 * Extracts and formats primary devotee name, table display string,
 * member list, and gotras from a booking and user record.
 */
export function getBookingDevoteeDisplay(
  booking: BookingRecord,
  user: UserProfile
): BookingDevoteeInfo {
  let devoteeList: { name: string; gotra?: string }[] = [];

  if (Array.isArray(booking.devotees) && booking.devotees.length > 0) {
    devoteeList = booking.devotees
      .map((d) => ({
        name: d.name?.trim() || "",
        gotra: d.gotra?.trim() || "",
      }))
      .filter((d) => d.name);
  } else if (Array.isArray(booking.familyMembers) && booking.familyMembers.length > 0) {
    devoteeList = booking.familyMembers
      .map((m) => {
        if (typeof m === "string") {
          return { name: m.trim(), gotra: "" };
        }
        return {
          name: m.name?.trim() || "",
          gotra: m.gotra?.trim() || "",
        };
      })
      .filter((d) => d.name);
  } else if (booking.partnerName && booking.partnerName.trim()) {
    const p1Name =
      booking.primaryDevoteeName?.trim() ||
      cleanCustomerName(user.name) ||
      user.name?.trim() ||
      "";
    const p1Gotra = booking.gotra?.trim() || user.gotra?.trim() || "";
    devoteeList = [
      { name: p1Name, gotra: p1Gotra },
      { name: booking.partnerName.trim(), gotra: booking.partnerGotra?.trim() || "" },
    ].filter((d) => d.name);
  }

  // If no devotee list was constructed, fallback to single devotee
  if (devoteeList.length === 0) {
    const singleName =
      booking.primaryDevoteeName?.trim() ||
      cleanCustomerName(user.name) ||
      user.name?.trim() ||
      "";
    if (singleName) {
      devoteeList = [{ name: singleName, gotra: booking.gotra?.trim() || user.gotra?.trim() || "" }];
    }
  }

  // Calculate actual member count without double counting
  let devoteeCount = devoteeList.length;
  if (devoteeCount <= 1 && user.name) {
    const familyMatch = user.name.match(/&\s*Family\s*\((\d+)\s*Members\)/i);
    if (familyMatch) {
      devoteeCount = parseInt(familyMatch[1], 10);
    }
  }

  const primaryName =
    booking.primaryDevoteeName?.trim() ||
    devoteeList[0]?.name?.trim() ||
    cleanCustomerName(user.name) ||
    user.name?.trim() ||
    "";

  // Table display string
  let tableDisplayName = primaryName;
  if (devoteeCount > 1) {
    tableDisplayName = primaryName
      ? `${primaryName} & Family (${devoteeCount} Members)`
      : `Family (${devoteeCount} Members)`;
  }

  // All devotee names for export
  const allNamesArr = devoteeList.map((d) => d.name).filter(Boolean);
  const allDevoteeNames = allNamesArr.length > 0 ? allNamesArr.join(", ") : primaryName;

  // Collect gotras
  const gotraSet = new Set<string>();
  if (booking.gotra && booking.gotra.trim()) gotraSet.add(booking.gotra.trim());
  for (const d of devoteeList) {
    if (d.gotra && d.gotra.trim()) gotraSet.add(d.gotra.trim());
  }
  if (booking.partnerGotra && booking.partnerGotra.trim()) gotraSet.add(booking.partnerGotra.trim());
  if (gotraSet.size === 0 && user.gotra && user.gotra.trim()) {
    gotraSet.add(user.gotra.trim());
  }
  const allGotras = Array.from(gotraSet).join(", ");

  return {
    primaryName,
    tableDisplayName,
    allDevoteeNames,
    allGotras,
    devoteeCount: Math.max(1, devoteeCount),
  };
}

/**
 * Sanitizes a cell for CSV output.
 * - Protects against spreadsheet formula injection (=, +, -, @)
 * - Escapes double quotes
 * - Wraps in double quotes
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value).trim();
  // Protect against spreadsheet formula injection
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Formats a booking ISO creation date into standard format.
 */
export function formatBookingDateTime(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
  } catch {
    return dateStr || "";
  }
}

/**
 * Generates CSV content conforming to the exact 14 columns requested.
 * Prepends UTF-8 Byte Order Mark (\uFEFF) for proper Excel Unicode / Hindi display.
 */
export function generateBookingsExportCsv(
  records: { booking: BookingRecord; user: UserProfile }[]
): string {
  const headerRow = BOOKING_EXPORT_HEADERS.map((h) => sanitizeCsvCell(h)).join(",");

  const dataRows = records.map(({ booking, user }) => {
    const devoteeInfo = getBookingDevoteeDisplay(booking, user);

    // 1. User Name (customer who placed booking)
    const userName = cleanCustomerName(user.name) || devoteeInfo.primaryName || user.name || "";

    // 2. User Phone
    const userPhone = user.phone || "";

    // 3. Booking Date (order created timestamp)
    const bookingDate = formatBookingDateTime(booking.createdAt);

    // 4. Booking ID
    const bookingId = booking.bookingId || "";

    // 5. Email ID
    const emailId = user.email || "";

    // 6. Perform Date (scheduled date of the puja)
    const performDate = booking.date ? (booking.time ? `${booking.date} (${booking.time})` : booking.date) : (booking.eventDateISO || "");

    // 7. Puja Name
    const pujaName = booking.poojaTitle || "";

    // 8. Temple Name
    const templeName = booking.templeName || booking.templeSlug || "";

    // 9. Price (actual amount paid)
    const price = typeof booking.amount === "number" ? booking.amount : 0;

    // 10. Currency
    const currency = booking.currency || "INR";

    // 11. Devotee / Family Member Names
    const devoteeNames = devoteeInfo.allDevoteeNames || userName;

    // 12. Gotra
    const gotra = devoteeInfo.allGotras;

    // 13. User Address
    const userAddress = (booking.address || user.address || user.city || "").trim();

    // 14. Quantity (puja items / orders purchased, not family count)
    const quantity = booking.quantity && booking.quantity > 0 ? booking.quantity : 1;

    const rowCells = [
      userName,
      userPhone,
      bookingDate,
      bookingId,
      emailId,
      performDate,
      pujaName,
      templeName,
      price,
      currency,
      devoteeNames,
      gotra,
      userAddress,
      quantity,
    ];

    return rowCells.map(sanitizeCsvCell).join(",");
  });

  // UTF-8 BOM + Header + Rows
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Triggers a browser download of the CSV content via a Blob.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
