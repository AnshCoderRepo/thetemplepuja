/**
 * Bulk Puja Excel Template Generation & Parsing Engine
 * Provides formatted .xlsx template generation, robust spreadsheet parsing,
 * strict data sanitization, formula injection protection, and failed-record reporting.
 */

import ExcelJS from "exceljs";
import type { Pooja, PoojaPackage, Temple } from "./data";
import { isTempleActive } from "./data";

export interface ParsedPoojaDraft {
  id: string; // Temporary ID for client editing keys
  rowIndex: number;
  title: string;
  hindiTitle: string;
  category: string;
  type: "temple" | "home";
  templeId?: string;
  templeSlug?: string;
  templeName?: string;
  price: number;
  originalPrice?: number;
  duration: string;
  startDate: string;
  eventTime: string;
  endTime?: string;
  availability: "open" | "closing_soon" | "full";
  capacity: number;
  description: string;
  fullDescription?: string;
  imageUrl?: string;
  galleryImages: string[];
  benefits: string[];
  packages: PoojaPackage[];
  assignedAddonIds: string[];
  seoTitle?: string;
  seoDescription?: string;
  active: boolean; // default false
  showInHero: boolean;
  showInHeroCard: boolean;
  showInCatalog: boolean;
  badge?: string;
  isValid: boolean;
  errors: string[];
}

export interface BulkParsedResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  items: ParsedPoojaDraft[];
}

export interface FailedRowRecord {
  rowIndex: number;
  title?: string;
  hindiTitle?: string;
  category?: string;
  type?: string;
  temple?: string;
  price?: number | string;
  originalPrice?: number | string;
  duration?: string;
  startDate?: string;
  eventTime?: string;
  endTime?: string;
  availability?: string;
  capacity?: number | string;
  description?: string;
  fullDescription?: string;
  imageUrl?: string;
  galleryImages?: string;
  benefits?: string;
  packages?: string;
  addons?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  displayPlacement?: string;
  errors: string[];
}

export const TEMPLATE_COLUMNS = [
  { header: "Puja Name (English) *", key: "title", width: 34 },
  { header: "Puja Name (Hindi) *", key: "hindiTitle", width: 34 },
  { header: "Puja Category *", key: "category", width: 24 },
  { header: "Ritual Type (Temple / Home) *", key: "type", width: 28 },
  { header: "Associated Temple (Name or Slug)", key: "temple", width: 32 },
  { header: "Starting Price (INR) *", key: "price", width: 22 },
  { header: "Original Price (INR)", key: "originalPrice", width: 20 },
  { header: "Duration", key: "duration", width: 18 },
  { header: "Puja Date (YYYY-MM-DD)", key: "startDate", width: 24 },
  { header: "Start Time", key: "eventTime", width: 18 },
  { header: "End Time", key: "endTime", width: 18 },
  { header: "Booking Availability (Open / Closing Soon / Full)", key: "availability", width: 32 },
  { header: "Max Booking Capacity", key: "capacity", width: 22 },
  { header: "Short Description", key: "description", width: 40 },
  { header: "Full Ceremony Description", key: "fullDescription", width: 50 },
  { header: "Featured Image URL", key: "imageUrl", width: 36 },
  { header: "Gallery Image URLs (comma separated)", key: "galleryImages", width: 44 },
  { header: "Benefits & Inclusions (pipe | or comma separated)", key: "benefits", width: 50 },
  { header: "Packages (Format: Name:Price:Desc | Name:Price:Desc)", key: "packages", width: 55 },
  { header: "Add-ons (Comma separated names or IDs)", key: "addons", width: 40 },
  { header: "SEO Meta Title", key: "seoTitle", width: 32 },
  { header: "SEO Meta Description", key: "seoDescription", width: 40 },
  { header: "Publish Status (Draft / Active)", key: "status", width: 26 },
  { header: "Display Placement (Hero / Featured / Catalog)", key: "displayPlacement", width: 36 },
] as const;

/**
 * Strips formula injection characters for CSV/Excel security.
 */
export function sanitizeCellValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  let s = String(val).trim();
  if (/^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  return s;
}

/**
 * Generates an official Excel workbook (.xlsx) containing the standardized
 * bulk creation columns, helpful styling, sample records, and instructions.
 */
export async function generatePoojaTemplateWorkbook(
  activeTemples: Temple[] = [],
  availableCategories: string[] = []
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "templepujasewa";
  workbook.lastModifiedBy = "Admin Portal";
  workbook.created = new Date();
  workbook.modified = new Date();

  // ── Sheet 1: Main Data Entry Sheet ──
  const sheet = workbook.addWorksheet("Bulk Puja Template", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  sheet.columns = TEMPLATE_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style the Header Row (Deep Sacred Amber #B45309 with White Bold Text)
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB45309" }, // Saffron Amber 700
    };
    cell.font = {
      name: "Segoe UI",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF78350F" } },
      bottom: { style: "medium", color: { argb: "FF78350F" } },
      left: { style: "thin", color: { argb: "FFD97706" } },
      right: { style: "thin", color: { argb: "FFD97706" } },
    };
  });

  // Example 1: Temple Puja
  const sampleTemple = activeTemples[0] || {
    name: "Kashi Vishwanath Temple",
    slug: "kashi-vishwanath",
  };

  sheet.addRow({
    title: "Maha Shivratri Special Rudrabhishek",
    hindiTitle: "महाशिवरात्रि विशेष रुद्राभिषेक",
    category: availableCategories[0] || "Rashifal Pooja",
    type: "Temple",
    temple: sampleTemple.name,
    price: 1101,
    originalPrice: 1501,
    duration: "1.5 hours",
    startDate: "2026-11-15",
    eventTime: "07:00 AM IST",
    endTime: "08:30 AM IST",
    availability: "Open",
    capacity: 50,
    description: "Sacred Panchamrit Abhishekam to Lord Shiva for prosperity and removal of malefic planetary doshas.",
    fullDescription: "Vedic ritual performed by 5 consecrated priests with pure Gangajal, bilva patra, honey, and sacred herbs.",
    imageUrl: "/hero-ganesha-marble.jpg",
    galleryImages: "/sample-puja.jpg, /festivals/shivratri.jpg",
    benefits: "Divine Protection | Removal of Kal Sarp Dosha | Family Peace & Longevity",
    packages: "Individual Sankalp:1101:1 Devotee name | Couple Sankalp:2101:Husband and Wife | Family Sankalp:5101:Up to 4 family members",
    addons: "Gau Seva, Deep Daan, Brahmin Bhojan",
    seoTitle: "Book Maha Shivratri Rudrabhishek Online | templepujasewa",
    seoDescription: "Perform authentic Vedic Rudrabhishek at holy temple with name and Gotra sankalp.",
    status: "Draft",
    displayPlacement: "Hero, Puja Catalog",
  });

  // Example 2: Home Puja
  sheet.addRow({
    title: "Griha Shanti & Vastu Dosh Nivaran Havan",
    hindiTitle: "गृह शांति एवं वास्तु दोष निवारण हवन",
    category: availableCategories[1] || "Dosha Nivaran",
    type: "Home",
    temple: "", // MUST BE EMPTY FOR HOME PUJA
    price: 2501,
    originalPrice: 3100,
    duration: "2.5 hours",
    startDate: "2026-11-20",
    eventTime: "09:00 AM IST",
    endTime: "11:30 AM IST",
    availability: "Open",
    capacity: 20,
    description: "Panditji arrives at your home with pure samagri for peace, prosperity, and positive vibrations.",
    fullDescription: "Complete doorstep ritual including Navagraha sthapana, Vastu purusha pujan, and sacred agni hawan.",
    imageUrl: "/sample-puja.jpg",
    galleryImages: "",
    benefits: "Neutralizes Vastu Doshas | Attracts Positive Energy | Family Harmony",
    packages: "Standard Home Hawan:2501:Complete samagri & 1 Panditji | Maha Vastu Pujan:5101:2 Vedic Brahmins with complete shanti vidhi",
    addons: "Brahmin Bhojan",
    seoTitle: "Book Griha Shanti Hawan at Home | templepujasewa",
    seoDescription: "Certified Vedic Panditji performs Griha Shanti hawan at your residence with pure samagri.",
    status: "Draft",
    displayPlacement: "Puja Catalog",
  });

  // Style Data Rows
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 24;
      row.eachCell((cell) => {
        cell.font = { name: "Segoe UI", size: 10 };
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });
    }
  });

  // ── Sheet 2: Guidelines & Available Values ──
  const guideSheet = workbook.addWorksheet("Instructions & Values");
  guideSheet.columns = [
    { header: "Field Name", key: "field", width: 28 },
    { header: "Allowed Values / Format", key: "allowed", width: 45 },
    { header: "Rules & Notes", key: "notes", width: 60 },
  ];

  const guideHeader = guideSheet.getRow(1);
  guideHeader.height = 26;
  guideHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF475569" }, // Slate 600
    };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  });

  const instructionsData = [
    {
      field: "Puja Name (English)",
      allowed: "Text (minimum 3 characters)",
      notes: "Required. Must be unique. URL slug will be automatically created from this title.",
    },
    {
      field: "Puja Name (Hindi)",
      allowed: "Unicode Hindi text",
      notes: "Required. Used for Hindi locale display and native language devotees.",
    },
    {
      field: "Ritual Type",
      allowed: "Temple OR Home",
      notes: "Required. Temple pujas are performed at temples. Home pujas are performed at devotee's doorstep.",
    },
    {
      field: "Associated Temple",
      allowed: activeTemples.map((t) => t.name).slice(0, 10).join(", ") + (activeTemples.length > 10 ? ", etc." : ""),
      notes: "Required for Temple Pujas. Leave BLANK for Home Pujas. Only active temples can be assigned.",
    },
    {
      field: "Puja Category",
      allowed: availableCategories.join(", ") || "Rashifal Pooja, Dosha Nivaran, Festival Special",
      notes: "Required. Used for public catalog filtering and categorization.",
    },
    {
      field: "Starting Price (INR)",
      allowed: "Positive number (e.g. 501, 1101, 2101)",
      notes: "Required. Base dakshina for the default ceremony package.",
    },
    {
      field: "Original Price (INR)",
      allowed: "Number higher than Starting Price",
      notes: "Optional. Displays as a crossed-out MRP value to indicate offering savings.",
    },
    {
      field: "Puja Date",
      allowed: "YYYY-MM-DD (e.g. 2026-11-15)",
      notes: "Optional. Primary date for scheduled ceremonies. Defaults to today's date if omitted.",
    },
    {
      field: "Packages",
      allowed: "TierName:Price:Description separated by pipes (|)",
      notes: "Example: Single:1101:1 Devotee | Couple:2101:Husband and Wife | Family:5101:Up to 4 Devotees",
    },
    {
      field: "Benefits & Inclusions",
      allowed: "Phrases separated by pipe (|) or comma (,)",
      notes: "Example: Divine Blessings | Removal of Doshas | Sankalp Video",
    },
    {
      field: "Publish Status",
      allowed: "Draft OR Active",
      notes: "Default is 'Draft' (Inactive). Keep as Draft until ready to make publicly visible.",
    },
    {
      field: "Display Placement",
      allowed: "Hero, Featured Card, Puja Catalog (comma separated)",
      notes: "Controls where the puja card is displayed on the homepage and catalog.",
    },
  ];

  instructionsData.forEach((item) => guideSheet.addRow(item));

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Parses an uploaded Excel buffer or ArrayBuffer and validates every Puja row.
 */
export async function parsePoojaExcelBuffer(
  buffer: ArrayBuffer | Buffer,
  templesPool: Temple[] = [],
  categoriesPool: string[] = []
): Promise<BulkParsedResult> {
  const workbook = new ExcelJS.Workbook();
  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  await workbook.xlsx.load(nodeBuf as unknown as ArrayBuffer);

  // Read the primary template sheet or the first sheet
  const worksheet = workbook.getWorksheet("Bulk Puja Template") || workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("No worksheets found in uploaded Excel file.");
  }

  const items: ParsedPoojaDraft[] = [];
  const activeTemples = templesPool.filter(isTempleActive);

  // Map header text to key
  const headerMap = new Map<number, string>();
  const firstRow = worksheet.getRow(1);
  firstRow.eachCell((cell, colNumber) => {
    const rawText = String(cell.value || "").trim().toLowerCase();
    if (rawText.includes("hindi")) {
      headerMap.set(colNumber, "hindiTitle");
    } else if (rawText.includes("english") || rawText === "puja name" || rawText.includes("title")) {
      headerMap.set(colNumber, "title");
    } else if (rawText.includes("category")) {
      headerMap.set(colNumber, "category");
    } else if (rawText.includes("ritual type") || rawText === "type") {
      headerMap.set(colNumber, "type");
    } else if (rawText.includes("temple")) {
      headerMap.set(colNumber, "temple");
    } else if (rawText.includes("packages") || rawText.includes("package")) {
      headerMap.set(colNumber, "packages");
    } else if (rawText.includes("original price")) {
      headerMap.set(colNumber, "originalPrice");
    } else if (!rawText.includes("package") && (rawText.includes("starting price") || rawText.includes("price"))) {
      headerMap.set(colNumber, "price");
    } else if (rawText.includes("duration")) {
      headerMap.set(colNumber, "duration");
    } else if (rawText.includes("date")) {
      headerMap.set(colNumber, "startDate");
    } else if (rawText.includes("end time")) {
      headerMap.set(colNumber, "endTime");
    } else if (rawText.includes("start time") || rawText === "time") {
      headerMap.set(colNumber, "eventTime");
    } else if (rawText.includes("availability")) {
      headerMap.set(colNumber, "availability");
    } else if (rawText.includes("capacity")) {
      headerMap.set(colNumber, "capacity");
    } else if (rawText.includes("full") || rawText.includes("ceremony description")) {
      headerMap.set(colNumber, "fullDescription");
    } else if (rawText.includes("short description") || rawText === "description") {
      headerMap.set(colNumber, "description");
    } else if (rawText.includes("featured image") || rawText.includes("image url")) {
      headerMap.set(colNumber, "imageUrl");
    } else if (rawText.includes("gallery")) {
      headerMap.set(colNumber, "galleryImages");
    } else if (rawText.includes("benefits") || rawText.includes("inclusions")) {
      headerMap.set(colNumber, "benefits");
    } else if (rawText.includes("packages") || rawText.includes("package")) {
      headerMap.set(colNumber, "packages");
    } else if (rawText.includes("addons") || rawText.includes("add-ons")) {
      headerMap.set(colNumber, "addons");
    } else if (rawText.includes("seo title") || rawText.includes("meta title")) {
      headerMap.set(colNumber, "seoTitle");
    } else if (rawText.includes("seo description") || rawText.includes("meta desc")) {
      headerMap.set(colNumber, "seoDescription");
    } else if (rawText.includes("status")) {
      headerMap.set(colNumber, "status");
    } else if (rawText.includes("placement")) {
      headerMap.set(colNumber, "displayPlacement");
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    // Extract values
    const raw: Record<string, string> = {};
    row.eachCell((cell, colNumber) => {
      const fieldKey = headerMap.get(colNumber);
      if (fieldKey) {
        let cellVal: unknown = cell.value;
        if (typeof cellVal === "object" && cellVal !== null) {
          if ("text" in cellVal && typeof (cellVal as { text: unknown }).text === "string") {
            cellVal = (cellVal as { text: string }).text;
          } else if ("result" in cellVal) {
            cellVal = (cellVal as { result: unknown }).result;
          }
        }
        raw[fieldKey] = String(cellVal ?? "").trim();
      }
    });

    // Skip entirely empty row
    if (Object.values(raw).every((v) => !v)) return;

    const errors: string[] = [];

    // Title validation
    const title = raw.title?.trim() || "";
    if (!title || title.length < 3) {
      errors.push("Puja Name (English) is required (minimum 3 characters).");
    }

    // Hindi Title validation
    const hindiTitle = raw.hindiTitle?.trim() || "";
    if (!hindiTitle) {
      errors.push("Puja Name (Hindi) is required.");
    }

    // Category validation
    const rawCat = raw.category?.trim();
    if (!rawCat) {
      errors.push("Puja Category is required.");
    }
    const category = rawCat || (categoriesPool.length > 0 ? categoriesPool[0] : "Rashifal Pooja");

    // Ritual Type validation
    const rawType = (raw.type || "temple").toLowerCase().trim();
    const isHome = rawType === "home" || rawType === "doorstep" || rawType === "in-person";
    const ritualType: "temple" | "home" = isHome ? "home" : "temple";

    // Associated Temple validation
    let templeId: string | undefined = undefined;
    let templeSlug: string | undefined = undefined;
    let templeName: string | undefined = undefined;

    if (ritualType === "home") {
      // Home Puja: strictly clear any temple association
      templeId = undefined;
      templeSlug = undefined;
      templeName = undefined;
    } else {
      // Temple Puja: requires an active temple
      const rawTemple = raw.temple?.trim() || "";
      if (!rawTemple) {
        errors.push("Associated Temple is required for Temple Pujas. Please provide an active temple name or slug.");
      } else {
        const matched = activeTemples.find((t) => {
          const tid = t._id ? String(t._id) : "";
          const tIdProp = t.id ? String(t.id) : "";
          const nameLower = t.name.toLowerCase();
          const slugLower = t.slug.toLowerCase();
          const queryLower = rawTemple.toLowerCase();
          return (
            nameLower === queryLower ||
            slugLower === queryLower ||
            tid === rawTemple ||
            tIdProp === rawTemple ||
            nameLower.includes(queryLower) ||
            queryLower.includes(nameLower)
          );
        });

        if (matched) {
          templeId = matched._id ? String(matched._id) : (matched.id || matched.slug);
          templeSlug = matched.slug;
          templeName = matched.name;
        } else {
          // Check if it matched an inactive temple
          const inactiveMatch = templesPool.find((t) => !isTempleActive(t) && (
            t.name.toLowerCase() === rawTemple.toLowerCase() ||
            t.slug.toLowerCase() === rawTemple.toLowerCase() ||
            (t._id && String(t._id) === rawTemple)
          ));
          if (inactiveMatch) {
            errors.push(`Temple "${rawTemple}" is marked as Inactive in Temple Management and cannot be selected for new Pujas.`);
          } else {
            errors.push(`Associated Temple "${rawTemple}" was not found in Temple Management or is invalid.`);
          }
        }
      }
    }

    // Price validation
    const rawPriceTrimmed = (raw.price || "").trim();
    const isNegative = rawPriceTrimmed.startsWith("-");
    const cleanPriceStr = rawPriceTrimmed.replace(/[^0-9.]/g, "");
    const price = isNegative ? -Number(cleanPriceStr) : Number(cleanPriceStr);
    if (!cleanPriceStr || Number.isNaN(price) || price <= 0) {
      errors.push("Starting price must be a valid positive number (> 0).");
    }

    // Original Price (optional)
    let originalPrice: number | undefined = undefined;
    if (raw.originalPrice) {
      const cleanOrig = raw.originalPrice.replace(/[^0-9.]/g, "");
      const numOrig = Number(cleanOrig);
      if (!Number.isNaN(numOrig) && numOrig > 0) {
        originalPrice = numOrig;
      }
    }

    // Capacity validation
    let capacity = 30;
    if (raw.capacity) {
      const parsedCap = Number(raw.capacity.replace(/[^0-9]/g, ""));
      if (!Number.isNaN(parsedCap) && parsedCap > 0) {
        capacity = parsedCap;
      }
    }

    // Availability validation
    let availability: "open" | "closing_soon" | "full" = "open";
    const rawAvail = (raw.availability || "").toLowerCase();
    if (rawAvail.includes("close") || rawAvail.includes("closing")) {
      availability = "closing_soon";
    } else if (rawAvail.includes("full")) {
      availability = "full";
    }

    // Packages parsing
    // Format: "TierName:Price:Desc | TierName:Price:Desc"
    const parsedPackages: PoojaPackage[] = [];
    if (raw.packages && raw.packages.trim()) {
      const segments = raw.packages.split("|");
      for (const seg of segments) {
        const parts = seg.split(":").map((s) => s.trim());
        if (parts.length >= 2) {
          const pkgName = parts[0] || "Custom Package";
          const pkgPrice = Number(parts[1].replace(/[^0-9.]/g, "")) || price;
          const pkgDesc = parts[2] || `${pkgName} Sankalp Participation`;
          parsedPackages.push({
            name: pkgName,
            price: pkgPrice,
            description: pkgDesc,
          });
        }
      }
    }

    // If no packages specified, provide standard single sankalp tier
    if (parsedPackages.length === 0) {
      parsedPackages.push({
        name: "Individual Sankalp",
        price: price || 1101,
        description: "1 Devotee name in Sankalp",
      });
    }

    // Benefits parsing
    const benefits: string[] = [];
    if (raw.benefits) {
      const splitChar = raw.benefits.includes("|") ? "|" : ",";
      raw.benefits
        .split(splitChar)
        .map((b) => b.trim())
        .filter(Boolean)
        .forEach((b) => benefits.push(b));
    }
    if (benefits.length === 0) {
      benefits.push("Vedic ritual consecrated by verified priests");
      benefits.push("Live audio/video sankalp darshan");
    }

    // Gallery images parsing
    const galleryImages: string[] = [];
    if (raw.galleryImages) {
      raw.galleryImages
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean)
        .forEach((img) => galleryImages.push(img));
    }

    // Addons parsing
    const assignedAddonIds: string[] = [];
    if (raw.addons) {
      raw.addons
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .forEach((a) => assignedAddonIds.push(a));
    }

    // Display placement
    const placementRaw = (raw.displayPlacement || "puja catalog").toLowerCase();
    const showInHero = placementRaw.includes("hero");
    const showInHeroCard = placementRaw.includes("featured");
    const showInCatalog = !placementRaw.includes("none");

    // Publish status (safe default: false / draft)
    const rawStatus = (raw.status || "draft").toLowerCase().trim();
    const active = rawStatus === "active" || rawStatus === "published" || rawStatus === "live";

    const draft: ParsedPoojaDraft = {
      id: `bulk-${Date.now()}-${rowNumber}-${Math.random().toString(36).substring(2, 6)}`,
      rowIndex: rowNumber,
      title,
      hindiTitle,
      category,
      type: ritualType,
      templeId,
      templeSlug,
      templeName,
      price: price || 1101,
      originalPrice,
      duration: raw.duration?.trim() || "1.5 hours",
      startDate: raw.startDate?.trim() || new Date().toISOString().slice(0, 10),
      eventTime: raw.eventTime?.trim() || "07:00 AM IST",
      endTime: raw.endTime?.trim() || undefined,
      availability,
      capacity,
      description: raw.description?.trim() || `${title} conducted by verified Vedic pandits with sacred rituals.`,
      fullDescription: raw.fullDescription?.trim() || undefined,
      imageUrl: raw.imageUrl?.trim() || undefined,
      galleryImages,
      benefits,
      packages: parsedPackages,
      assignedAddonIds,
      seoTitle: raw.seoTitle?.trim() || undefined,
      seoDescription: raw.seoDescription?.trim() || undefined,
      active,
      showInHero,
      showInHeroCard,
      showInCatalog,
      isValid: errors.length === 0,
      errors,
    };

    items.push(draft);
  });

  const validCount = items.filter((i) => i.isValid).length;
  const errorCount = items.length - validCount;

  return {
    totalRows: items.length,
    validCount,
    errorCount,
    items,
  };
}

/**
 * Generates an Excel spreadsheet containing failed bulk records with
 * error descriptions in the first column so admins can review, fix, and re-upload.
 */
export async function generateFailedPoojaWorkbook(failedItems: ParsedPoojaDraft[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Failed Records To Correct", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 1 }],
  });

  const columns = [
    { header: "⚠️ Validation Errors / Reasons", key: "errorReport", width: 45 },
    ...TEMPLATE_COLUMNS,
  ];

  sheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colNumber === 1 ? "FFDC2626" : "FFB45309" }, // Red for error col, Amber for data
    };
    cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  });

  failedItems.forEach((item) => {
    const errorString = item.errors.join(" | ");
    const packagesStr = item.packages.map((p) => `${p.name}:${p.price}:${p.description || ""}`).join(" | ");
    const benefitsStr = item.benefits.join(" | ");
    const placementStr = [
      item.showInHero ? "Hero" : "",
      item.showInHeroCard ? "Featured Card" : "",
      item.showInCatalog ? "Puja Catalog" : "",
    ]
      .filter(Boolean)
      .join(", ");

    sheet.addRow({
      errorReport: errorString,
      title: item.title,
      hindiTitle: item.hindiTitle,
      category: item.category,
      type: item.type === "home" ? "Home" : "Temple",
      temple: item.templeName || item.templeSlug || "",
      price: item.price,
      originalPrice: item.originalPrice || "",
      duration: item.duration,
      startDate: item.startDate,
      eventTime: item.eventTime,
      endTime: item.endTime || "",
      availability: item.availability === "closing_soon" ? "Closing Soon" : item.availability === "full" ? "Full" : "Open",
      capacity: item.capacity,
      description: item.description,
      fullDescription: item.fullDescription || "",
      imageUrl: item.imageUrl || "",
      galleryImages: item.galleryImages.join(", "),
      benefits: benefitsStr,
      packages: packagesStr,
      addons: item.assignedAddonIds.join(", "),
      seoTitle: item.seoTitle || "",
      seoDescription: item.seoDescription || "",
      status: item.active ? "Active" : "Draft",
      displayPlacement: placementStr,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
