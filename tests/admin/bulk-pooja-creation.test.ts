import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import {
  generatePoojaTemplateWorkbook,
  parsePoojaExcelBuffer,
  generateFailedPoojaWorkbook,
  sanitizeCellValue,
  TEMPLATE_COLUMNS,
  type ParsedPoojaDraft,
} from "@/lib/pooja-bulk-excel";
import { generateUniquePoojaSlug } from "@/lib/pooja-duplicate";
import type { Temple, Pooja } from "@/lib/data";

describe("Bulk Puja Creation System", () => {
  const mockActiveTemples: Temple[] = [
    {
      _id: "temple-kashi-123",
      id: "temple-kashi-123",
      slug: "kashi-vishwanath",
      name: "Kashi Vishwanath Temple",
      hindiName: "काशी विश्वनाथ मंदिर",
      city: "Varanasi",
      state: "Uttar Pradesh",
      deity: "Lord Shiva",
      description: "Sacred Jyotirlinga",
      active: true,
    },
    {
      _id: "temple-mahakal-456",
      id: "temple-mahakal-456",
      slug: "mahakaleshwar",
      name: "Mahakaleshwar Jyotirlinga",
      hindiName: "महाकालेश्वर ज्योतिर्लिंग",
      city: "Ujjain",
      state: "Madhya Pradesh",
      deity: "Lord Shiva",
      description: "Dakshinmukhi Jyotirlinga",
      active: true,
    },
    {
      _id: "temple-inactive-789",
      id: "temple-inactive-789",
      slug: "inactive-temple",
      name: "Old Abandoned Mandir",
      city: "Ayodhya",
      state: "Uttar Pradesh",
      deity: "Lord Rama",
      description: "Under renovation",
      active: false, // Inactive
    },
  ];

  const mockCategories = [
    "Rashifal Pooja",
    "Dosha Nivaran",
    "Festival Special",
    "Havan & Yagya",
  ];

  describe("Excel Template Generation", () => {
    it("generates a valid .xlsx template workbook buffer with all required columns", async () => {
      const buffer = await generatePoojaTemplateWorkbook(mockActiveTemples, mockCategories);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);

      // Verify workbook structure using ExcelJS
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

      const templateSheet = workbook.getWorksheet("Bulk Puja Template");
      expect(templateSheet).toBeDefined();

      const instructionsSheet = workbook.getWorksheet("Instructions & Values");
      expect(instructionsSheet).toBeDefined();

      // Check header row in template sheet
      const headerRow = templateSheet?.getRow(1);
      expect(headerRow?.cellCount).toBe(TEMPLATE_COLUMNS.length);
      expect(headerRow?.getCell(1).value).toContain("Puja Name (English)");
      expect(headerRow?.getCell(4).value).toContain("Ritual Type");
      expect(headerRow?.getCell(5).value).toContain("Associated Temple");
      expect(headerRow?.getCell(6).value).toContain("Starting Price");

      // Verify sample rows: 1 Temple Puja, 1 Home Puja
      expect(templateSheet?.rowCount).toBeGreaterThanOrEqual(3);
      const templeSample = templateSheet?.getRow(2);
      expect(templeSample?.getCell(4).value).toBe("Temple");
      expect(templeSample?.getCell(5).value).toBeTruthy(); // Has associated temple

      const homeSample = templateSheet?.getRow(3);
      expect(homeSample?.getCell(4).value).toBe("Home");
      expect(homeSample?.getCell(5).value || "").toBe("");
    });
  });

  describe("Spreadsheet Parsing and Business Rules Validation", () => {
    it("correctly parses valid Temple Puja and associates with active temple", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Test");

      sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key }));
      sheet.addRow({
        title: "Kashi Rudrabhishek Maha Puja",
        hindiTitle: "काशी रुद्राभिषेक महापूजा",
        category: "Havan & Yagya",
        type: "Temple",
        temple: "Kashi Vishwanath Temple",
        price: 2100,
        originalPrice: 3100,
        duration: "60 mins",
        startDate: "2026-11-15",
        eventTime: "08:00 AM",
        availability: "Open",
        capacity: 100,
        description: "Powerful Vedic Rudrabhishek at Kashi Vishwanath.",
        packages: "Single Devotee:2100:Complete sankalp | Family Pack:5100:For 4 family members",
        benefits: "Sankalp in Gotra | Gangajal Prashad",
        status: "Draft",
        displayPlacement: "Puja Catalog",
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await parsePoojaExcelBuffer(buffer, mockActiveTemples, mockCategories);

      expect(result.totalRows).toBe(1);
      expect(result.validCount).toBe(1);
      expect(result.errorCount).toBe(0);

      const draft = result.items[0];
      expect(draft.isValid).toBe(true);
      expect(draft.type).toBe("temple");
      expect(draft.templeSlug).toBe("kashi-vishwanath");
      expect(draft.templeName).toBe("Kashi Vishwanath Temple");
      expect(draft.price).toBe(2100);
      expect(draft.packages.length).toBe(2);
      expect(draft.packages[0].name).toBe("Single Devotee");
      expect(draft.packages[0].price).toBe(2100);
      expect(draft.packages[1].name).toBe("Family Pack");
      expect(draft.packages[1].price).toBe(5100);
    });

    it("correctly parses Home Puja and strictly clears temple associations", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Test");

      sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key }));
      sheet.addRow({
        title: "Griha Pravesh & Vastu Shanti Puja",
        hindiTitle: "गृह प्रवेश एवं वास्तु शांति पूजा",
        category: "Family & Home",
        type: "Home",
        temple: "Kashi Vishwanath Temple", // Even if someone enters a temple, it must be cleared for Home Puja
        price: 5100,
        duration: "2-3 hours",
        availability: "Open",
        capacity: 10,
        description: "Panditji visits home with sacred samagri.",
        benefits: "Doorstep Panditji visit | Complete Hawan Samagri",
        status: "Draft",
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await parsePoojaExcelBuffer(buffer, mockActiveTemples, mockCategories);

      expect(result.validCount).toBe(1);
      const draft = result.items[0];
      expect(draft.isValid).toBe(true);
      expect(draft.type).toBe("home");
      // Business Rule: Home Puja must have NO temple association
      expect(draft.templeId).toBeUndefined();
      expect(draft.templeSlug).toBeUndefined();
      expect(draft.templeName).toBeUndefined();
    });

    it("rejects Temple Puja assigned to an inactive temple", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Test");

      sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key }));
      sheet.addRow({
        title: "Ram Navami Puja",
        hindiTitle: "राम नवमी पूजा",
        category: "Festival Special",
        type: "Temple",
        temple: "Old Abandoned Mandir", // Inactive temple
        price: 1100,
        description: "Special ritual",
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await parsePoojaExcelBuffer(buffer, mockActiveTemples, mockCategories);

      expect(result.validCount).toBe(0);
      expect(result.errorCount).toBe(1);

      const draft = result.items[0];
      expect(draft.isValid).toBe(false);
      expect(draft.errors.some((err) => err.includes("marked as Inactive"))).toBe(true);
    });

    it("rejects Temple Puja with missing or unfindable temple", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Test");

      sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key }));
      sheet.addRow({
        title: "Unknown Temple Puja",
        hindiTitle: "अज्ञात मंदिर पूजा",
        category: "Festival Special",
        type: "Temple",
        temple: "", // Missing temple
        price: 1100,
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await parsePoojaExcelBuffer(buffer, mockActiveTemples, mockCategories);

      expect(result.validCount).toBe(0);
      expect(result.items[0].isValid).toBe(false);
      expect(result.items[0].errors.some((err) => err.includes("Associated Temple is required"))).toBe(true);
    });

    it("rejects rows with invalid price, missing name, or missing category", async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Test");

      sheet.columns = TEMPLATE_COLUMNS.map((c) => ({ header: c.header, key: c.key }));
      sheet.addRow({
        title: "", // Missing English name
        hindiTitle: "", // Missing Hindi name
        category: "", // Missing category
        type: "Home",
        price: -500, // Invalid price
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const result = await parsePoojaExcelBuffer(buffer, mockActiveTemples, mockCategories);

      expect(result.validCount).toBe(0);
      const errors = result.items[0].errors;
      expect(errors.some((e) => e.includes("Puja Name (English)"))).toBe(true);
      expect(errors.some((e) => e.includes("Puja Name (Hindi)"))).toBe(true);
      expect(errors.some((e) => e.includes("Category"))).toBe(true);
      expect(errors.some((e) => e.includes("Starting price"))).toBe(true);
    });
  });

  describe("Failed Records Export & Security", () => {
    it("generates error report workbook containing error diagnostic column", async () => {
      const failedDrafts: ParsedPoojaDraft[] = [
        {
          id: "draft-failed-1",
          rowIndex: 2,
          title: "Incomplete Puja",
          hindiTitle: "अधूरी पूजा",
          category: "Rashifal Pooja",
          type: "temple",
          price: 0,
          duration: "45 mins",
          startDate: "",
          eventTime: "",
          availability: "open",
          capacity: 50,
          description: "",
          galleryImages: [],
          benefits: [],
          packages: [],
          assignedAddonIds: [],
          active: false,
          showInHero: false,
          showInHeroCard: false,
          showInCatalog: true,
          isValid: false,
          errors: [
            "Starting price must be a valid positive number.",
            "Associated Temple is required for Temple Pujas.",
          ],
        },
      ];

      const buffer = await generateFailedPoojaWorkbook(failedDrafts);
      expect(buffer).toBeInstanceOf(Buffer);

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      const sheet = workbook.getWorksheet("Failed Records To Correct");
      expect(sheet).toBeDefined();

      const headerRow = sheet?.getRow(1);
      expect(headerRow?.getCell(1).value).toContain("Validation Errors");

      const dataRow = sheet?.getRow(2);
      expect(dataRow?.getCell(1).value).toContain("Starting price must be a valid positive number");
      expect(dataRow?.getCell(1).value).toContain("Associated Temple is required");
    });

    it("sanitizes potential formula injection characters", () => {
      expect(sanitizeCellValue("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeCellValue("+cmd|' /C calc'!A0")).toBe("'+cmd|' /C calc'!A0");
      expect(sanitizeCellValue("-100")).toBe("'-100");
      expect(sanitizeCellValue("@evil")).toBe("'@evil");
      expect(sanitizeCellValue("Normal Text")).toBe("Normal Text");
    });
  });

  describe("Unique Slug Generation for Batch Items", () => {
    it("prevents collisions by appending incremental suffixes", () => {
      const existing: { slug: string }[] = [
        { slug: "mahamrityunjaya-jaap" },
        { slug: "mahamrityunjaya-jaap-2" },
      ];

      const newSlug = generateUniquePoojaSlug("Mahamrityunjaya Jaap", existing);
      expect(newSlug).toBe("mahamrityunjaya-jaap-3");
    });
  });
});
