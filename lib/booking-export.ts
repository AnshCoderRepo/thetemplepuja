/**
 * Booking Export and Devotee Display Utilities
 * Provides sanitized, audit-compliant CSV generation and devotee naming helpers.
 */

import {
  resolveBookingConsistencyStatus,
  type AmountConsistencyStatus,
  type BookingRecord,
  type UserProfile,
} from "./storage";

/**
 * Legacy 14 export columns preserved for backward compatibility.
 */
export const LEGACY_BOOKING_EXPORT_HEADERS = [
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
 * Enhanced export columns: 14 legacy columns + 7 package and add-on breakdown columns.
 */
export const BOOKING_EXPORT_HEADERS = [
  ...LEGACY_BOOKING_EXPORT_HEADERS,
  "Package Name",
  "Selected Add-on Names",
  "Add-on Quantities",
  "Add-on Individual Prices",
  "Total Add-on Amount",
  "Chadhava Names & Quantities",
  "Total Chadhava Amount",
] as const;

/**
 * Order and payment export columns: 21 booking columns + 6 payment, order, and consistency audit columns.
 */
export const ORDER_EXPORT_HEADERS = [
  ...BOOKING_EXPORT_HEADERS,
  "Payment Status",
  "Booking Status",
  "Payment Method",
  "Razorpay Payment ID",
  "Order ID",
  "Amount Consistency Status",
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

export interface BookingExportOptions {
  /** When true, outputs only the legacy 14 columns. Defaults to false (enhanced 21 columns). */
  legacyColumnsOnly?: boolean;
  /** When true, outputs enhanced columns plus 5 order/payment tracking columns (total 26 columns). */
  includeStatusColumns?: boolean;
}

/**
 * Generates CSV content conforming to the export columns requested.
 * Prepends UTF-8 Byte Order Mark (\uFEFF) for proper Excel Unicode / Hindi display.
 * Appends 7 new columns (Package & Addon details) while strictly preserving the first 14 columns.
 * Optionally appends 5 payment and order tracking columns when includeStatusColumns is enabled.
 */
export function generateBookingsExportCsv(
  records: { booking: BookingRecord; user: UserProfile }[],
  options?: BookingExportOptions
): string {
  const headers = options?.legacyColumnsOnly
    ? LEGACY_BOOKING_EXPORT_HEADERS
    : options?.includeStatusColumns
    ? ORDER_EXPORT_HEADERS
    : BOOKING_EXPORT_HEADERS;
  const headerRow = headers.map((h) => sanitizeCsvCell(h)).join(",");

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

    const rowCells: (string | number)[] = [
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

    if (!options?.legacyColumnsOnly) {
      // 15. Package Name
      const rawTier = (booking.packageTier || "").toLowerCase().trim();
      let packageName = "";
      if (rawTier === "single") {
        packageName = "Single Devotee";
      } else if (rawTier === "couple") {
        packageName = "Couple Plan";
      } else if (rawTier === "family") {
        packageName = "Family Plan";
      } else if (booking.packageTier && booking.packageTier.trim()) {
        packageName = booking.packageTier.trim();
      } else {
        packageName = "Standard";
      }

      // Addons & Chadhavas breakdown
      const allItems = Array.isArray(booking.addons) ? booking.addons : [];
      const regularAddons = allItems.filter(
        (a) => a.itemType !== "chadhava" && a.category?.toLowerCase() !== "chadhava"
      );
      const chadhavaItems = allItems.filter(
        (a) => a.itemType === "chadhava" || a.category?.toLowerCase() === "chadhava"
      );

      // 16. Selected Add-on Names
      const addonNames = regularAddons.map((a) => a.name).join(", ");

      // 17. Add-on Quantities
      const addonQuantities = regularAddons.map((a) => String(a.quantity || 1)).join(", ");

      // 18. Add-on Individual Prices
      const addonIndividualPrices = regularAddons.map((a) => String(a.price || 0)).join(", ");

      // 19. Total Add-on Amount
      const totalAddonAmount = regularAddons.reduce(
        (sum, a) => sum + (Number(a.price) || 0) * (Number(a.quantity) || 1),
        0
      );

      // 20. Chadhava Names & Quantities
      const chadhavaNamesAndQuantities = chadhavaItems
        .map((c) => `${c.name} (${c.quantity || 1})`)
        .join(", ");

      // 21. Total Chadhava Amount
      const totalChadhavaAmount = chadhavaItems.reduce(
        (sum, c) => sum + (Number(c.price) || 0) * (Number(c.quantity) || 1),
        0
      );

      rowCells.push(
        packageName,
        addonNames,
        addonQuantities,
        addonIndividualPrices,
        totalAddonAmount,
        chadhavaNamesAndQuantities,
        totalChadhavaAmount
      );

      if (options?.includeStatusColumns) {
        const paymentStatus =
          booking.status === "confirmed" || booking.status === "rescheduled"
            ? "Successful"
            : booking.status === "pending"
            ? "Pending"
            : booking.status === "failed" || booking.status === "payment_failed"
            ? "Failed"
            : booking.status === "refunded"
            ? "Refunded"
            : booking.status === "cancelled"
            ? "Cancelled"
            : String(booking.status || "Unknown");

        const bookingStatus =
          booking.status === "confirmed"
            ? "Confirmed"
            : booking.status === "rescheduled"
            ? "Rescheduled"
            : booking.status === "pending"
            ? "Pending"
            : booking.status === "failed" || booking.status === "payment_failed"
            ? "Failed"
            : booking.status === "refunded"
            ? "Refunded"
            : booking.status === "cancelled"
            ? "Cancelled"
            : String(booking.status || "Unknown");

        const paymentMethod =
          booking.paymentMethod === "razorpay"
            ? "Razorpay Gateway"
            : booking.paymentMethod === "upi_qr"
            ? "Direct UPI QR"
            : booking.paymentMethod === "simulated"
            ? "Simulated"
            : (booking.paymentMethod || "Razorpay");

        const paymentId = booking.razorpayPaymentId || booking.upiTransactionId || "-";
        const orderId = booking.razorpayOrderId || `ORD-${booking.bookingId}`;
        const consistencyStatus = resolveBookingConsistencyStatus(booking);

        rowCells.push(paymentStatus, bookingStatus, paymentMethod, paymentId, orderId, consistencyStatus);
      }
    }

    return rowCells.map(sanitizeCsvCell).join(",");
  });

  // UTF-8 BOM + Header + Rows
  return "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
}

/**
 * Parses diverse puja date strings (e.g. "2026-11-06", "15 Oct 2026", "Fri, Nov 6") into YYYY-MM-DD.
 */
export function parsePujaDateToYMD(dateStr?: string, referenceYear?: number): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();

  // 1. Direct YYYY-MM-DD or ISO timestamp
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // 2. Formats with explicit 4-digit year: e.g. "15 Oct 2026", "October 15, 2026"
  const yearMatch = trimmed.match(/\b(20\d\d)\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : (referenceYear || new Date().getFullYear());

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime()) && yearMatch) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 3. Month & day formats without year: e.g. "Fri, Nov 6", "Wed, 12 Aug"
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const monthMatch = trimmed.toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  const dayMatch = trimmed.match(/\b(\d{1,2})\b/);

  if (monthMatch && dayMatch) {
    const m = months[monthMatch[1].slice(0, 3)];
    const d = dayMatch[1].padStart(2, "0");
    if (m && d) {
      return `${year}-${m}-${d}`;
    }
  }

  return null;
}

export interface BookingFilterCriteria {
  search?: string;
  pujaSlug?: string;
  status?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  dateType?: "createdAt" | "pujaDate";
  section?: "bookings" | "orders";
  consistencyStatus?: AmountConsistencyStatus | "all";
}

/**
 * Shared filter routine for both Admin table UI and Backend export API.
 * Ensures 100% parity between what the admin sees on screen and what is exported.
 */
export function filterBookingRecords<T extends { booking: BookingRecord; user: UserProfile }>(
  records: T[],
  criteria: BookingFilterCriteria
): T[] {
  const {
    search,
    pujaSlug,
    status,
    startDate,
    endDate,
    dateType = "createdAt",
    section,
    consistencyStatus,
  } = criteria;

  const q = search ? search.toLowerCase().trim() : "";
  const cleanPuja = pujaSlug && pujaSlug !== "all" ? pujaSlug.toLowerCase().trim() : "";
  const cleanStatus = status && status !== "all" ? status.toLowerCase().trim() : "";

  return records.filter(({ booking, user }) => {
    // 0. Consistency Status Filter
    if (consistencyStatus && consistencyStatus !== "all") {
      const actualConsistency = resolveBookingConsistencyStatus(booking);
      if (actualConsistency !== consistencyStatus) {
        return false;
      }
    }
    // 1. Section Gate
    if (section === "bookings") {
      // Successful Bookings section strictly permits ONLY confirmed or rescheduled bookings
      if (booking.status !== "confirmed" && booking.status !== "rescheduled") {
        return false;
      }
    }

    // 2. Status Filter
    if (cleanStatus) {
      if (cleanStatus === "successful") {
        if (booking.status !== "confirmed" && booking.status !== "rescheduled") return false;
      } else if (cleanStatus === "failed") {
        if (booking.status !== "failed" && booking.status !== "payment_failed") return false;
      } else if (cleanStatus === "pending") {
        if (booking.status !== "pending") return false;
      } else if (cleanStatus === "cancelled") {
        if (booking.status !== "cancelled") return false;
      } else if (cleanStatus === "refunded") {
        if (booking.status !== "refunded") return false;
      } else if (booking.status !== cleanStatus) {
        return false;
      }
    }

    // 3. Puja Filter
    if (cleanPuja) {
      const bSlug = (booking.poojaSlug || "").toLowerCase().trim();
      const bTitle = (booking.poojaTitle || "").toLowerCase().trim();
      if (bSlug !== cleanPuja && !bTitle.includes(cleanPuja) && bSlug !== cleanPuja.replace(/_/g, "-")) {
        return false;
      }
    }

    // 4. Date Range Filter
    if (startDate || endDate) {
      if (dateType === "pujaDate") {
        const refYear = booking.createdAt ? new Date(booking.createdAt).getFullYear() : undefined;
        const targetDateYMD =
          booking.eventDateISO || parsePujaDateToYMD(booking.date, refYear);

        if (targetDateYMD) {
          if (startDate && targetDateYMD < startDate) return false;
          if (endDate && targetDateYMD > endDate) return false;
        } else {
          if (startDate && !booking.date.includes(startDate)) return false;
          if (endDate && !booking.date.includes(endDate)) return false;
        }
      } else {
        // Default: booking/order creation date
        const creationYMD = (booking.createdAt || "").slice(0, 10);
        if (creationYMD) {
          if (startDate && creationYMD < startDate) return false;
          if (endDate && creationYMD > endDate) return false;
        }
      }
    }

    // 5. Search Query
    if (q) {
      const devoteeInfo = getBookingDevoteeDisplay(booking, user);
      const matches =
        (booking.bookingId && booking.bookingId.toLowerCase().includes(q)) ||
        (booking.razorpayOrderId && booking.razorpayOrderId.toLowerCase().includes(q)) ||
        (booking.razorpayPaymentId && booking.razorpayPaymentId.toLowerCase().includes(q)) ||
        (booking.upiTransactionId && booking.upiTransactionId.toLowerCase().includes(q)) ||
        (booking.poojaTitle && booking.poojaTitle.toLowerCase().includes(q)) ||
        (booking.poojaSlug && booking.poojaSlug.toLowerCase().includes(q)) ||
        (user.name && user.name.toLowerCase().includes(q)) ||
        (user.phone && user.phone.includes(q)) ||
        (user.email && user.email.toLowerCase().includes(q)) ||
        (user.city && user.city.toLowerCase().includes(q)) ||
        (user.address && user.address.toLowerCase().includes(q)) ||
        (booking.address && booking.address.toLowerCase().includes(q)) ||
        (user.gotra && user.gotra.toLowerCase().includes(q)) ||
        (booking.gotra && booking.gotra.toLowerCase().includes(q)) ||
        (booking.primaryDevoteeName && booking.primaryDevoteeName.toLowerCase().includes(q)) ||
        (booking.partnerName && booking.partnerName.toLowerCase().includes(q)) ||
        (devoteeInfo.allDevoteeNames && devoteeInfo.allDevoteeNames.toLowerCase().includes(q));

      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Generates an informative, standardized filename for exported CSV files.
 */
export function getExportFilename(
  section: "bookings" | "orders",
  filters?: { status?: string; startDate?: string; endDate?: string }
): string {
  const parts: string[] = [];
  if (section === "bookings") {
    parts.push("confirmed_bookings");
  } else {
    parts.push("orders_and_payments");
  }

  if (filters?.status && filters.status !== "all") {
    parts.push(filters.status.toLowerCase());
  }

  if (filters?.startDate && filters?.endDate) {
    parts.push(`${filters.startDate}_to_${filters.endDate}`);
  } else if (filters?.startDate) {
    parts.push(`from_${filters.startDate}`);
  } else if (filters?.endDate) {
    parts.push(`until_${filters.endDate}`);
  } else {
    parts.push(new Date().toISOString().slice(0, 10));
  }

  return `${parts.join("_")}.csv`;
}

/**
 * Calculates start and end dates (YYYY-MM-DD) for quick preset date filters.
 */
export function getQuickDateRange(
  rangeKey: "today" | "yesterday" | "last7" | "last30"
): { startDate: string; endDate: string } {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
  const today = formatYMD(now);

  if (rangeKey === "today") {
    return { startDate: today, endDate: today };
  }
  if (rangeKey === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = formatYMD(y);
    return { startDate: yStr, endDate: yStr };
  }
  if (rangeKey === "last7") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { startDate: formatYMD(d), endDate: today };
  }
  if (rangeKey === "last30") {
    const d = new Date(now);
    d.setDate(d.getDate() - 29);
    return { startDate: formatYMD(d), endDate: today };
  }
  return { startDate: "", endDate: "" };
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
