import { describe, expect, it } from "vitest";
import {
  DEVOTEE_EXPORT_COLUMNS,
  buildDevoteeExportRows,
  generateDevoteesExcelWorkbook,
  normalizePhoneNumber,
  sanitizeExcelValue,
} from "../lib/devotee-export";
import type { BookingRecord, UserProfile } from "../lib/storage";

describe("Devotee Profiles Excel Export Service", () => {
  const devoteeA: UserProfile = {
    id: "user_a",
    name: "Vikram Malhotra",
    phone: "+91 98765 37158",
    email: "vikram@example.com",
    gotra: "Kashyap",
    city: "New Delhi",
    address: "Connaught Place, New Delhi",
    createdAt: "2026-09-01T10:00:00.000Z",
    bookings: [
      {
        bookingId: "BK-CHANDI-001",
        poojaSlug: "chandi-path",
        poojaTitle: "Chandi Path Mahayagya",
        templeSlug: "kamakhya-temple",
        templeName: "Maa Kamakhya Temple",
        date: "20 Oct 2026",
        time: "8:00 AM IST",
        panditName: "Acharya Somnath",
        amount: 3100,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: "2026-10-01T10:00:00.000Z",
        status: "confirmed",
        currency: "INR",
        quantity: 1,
        gotra: "Kashyap",
        primaryDevoteeName: "Vikram Malhotra",
      },
      {
        bookingId: "BK-RUDRA-002",
        poojaSlug: "rudrabhishek",
        poojaTitle: "Maha Rudrabhishek Seva",
        templeSlug: "kashi-vishwanath",
        templeName: "Kashi Vishwanath Temple",
        date: "25 Oct 2026",
        time: "6:00 AM IST",
        panditName: "Pandit Ram",
        amount: 2100,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: "2026-10-05T12:00:00.000Z",
        status: "confirmed",
        currency: "INR",
        quantity: 1,
        gotra: "Kashyap",
        primaryDevoteeName: "Vikram Malhotra",
      },
    ],
  };

  const devoteeB: UserProfile = {
    id: "user_b",
    name: "राजेश शर्मा", // Hindi Unicode name
    phone: "9876547128",
    email: "rajesh@example.com",
    gotra: "Kaushik",
    city: "वाराणसी",
    address: "दशाश्वमेध घाट, वाराणसी",
    createdAt: "2026-09-15T11:00:00.000Z",
    bookings: [
      {
        bookingId: "BK-RUDRA-003",
        poojaSlug: "rudrabhishek",
        poojaTitle: "Maha Rudrabhishek Seva",
        templeSlug: "kashi-vishwanath",
        templeName: "Kashi Vishwanath Temple",
        date: "22 Oct 2026",
        time: "7:00 AM IST",
        panditName: "Pandit Shiv",
        amount: 1500,
        discount: 0,
        couponCode: null,
        addonCount: 0,
        createdAt: "2026-10-02T08:00:00.000Z",
        status: "pending",
        currency: "INR",
        quantity: 1,
        gotra: "Kaushik",
        primaryDevoteeName: "राजेश शर्मा",
      },
    ],
  };

  const devoteeC: UserProfile = {
    id: "user_c",
    name: "=cmd|' /C calc'!A0", // Formula injection attempt in name
    phone: "+91-9988776655",
    email: "@danger@example.com", // Formula injection attempt with @
    gotra: "+GotraFormula",
    city: "-MaliciousCity",
    address: "Hacking Street",
    createdAt: "2026-10-01T09:00:00.000Z",
    bookings: [],
  };

  const sampleDevotees = [devoteeA, devoteeB, devoteeC];

  describe("Column Structure & Specifications", () => {
    it("defines the exact required columns in the correct order", () => {
      const headers = DEVOTEE_EXPORT_COLUMNS.map((col) => col.header);
      expect(headers).toEqual([
        "User Name",
        "Phone Number",
        "Location / City",
        "Puja Name",
        "Booking ID",
        "Booking Date",
        "Scheduled Puja Date",
        "Email ID",
        "All Booking References",
      ]);
    });
  });

  describe("Phone Normalization & Formula Injection Protection", () => {
    it("normalizes phone numbers removing spaces and dashes while preserving +", () => {
      expect(normalizePhoneNumber("+91 98765 37158")).toBe("+919876537158");
      expect(normalizePhoneNumber("+91-9988776655")).toBe("+919988776655");
      expect(normalizePhoneNumber("9876547128")).toBe("9876547128");
      expect(normalizePhoneNumber(undefined)).toBe("");
    });

    it("neutralizes dangerous spreadsheet formula injection characters", () => {
      expect(sanitizeExcelValue("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)");
      expect(sanitizeExcelValue("+cmd|' /C calc'")).toBe("'+cmd|' /C calc'");
      expect(sanitizeExcelValue("-250")).toBe("'-250");
      expect(sanitizeExcelValue("@special")).toBe("'@special");
      expect(sanitizeExcelValue("Normal Devotee")).toBe("Normal Devotee");
      expect(sanitizeExcelValue("")).toBe("");
      expect(sanitizeExcelValue(null)).toBe("");
    });
  });

  describe("Distinct Customer Counting & Deduplication", () => {
    it("deduplicates multi-booking customers into a single row with distinct counting", () => {
      // Devotee A has 2 bookings. Overall there are 3 sample devotees.
      const { rows, distinctCount } = buildDevoteeExportRows(sampleDevotees, {
        pujaFilter: "all",
      });

      expect(distinctCount).toBe(3);
      expect(rows.length).toBe(3);

      const vikramRow = rows.find((r) => r.userName.includes("Vikram Malhotra"));
      expect(vikramRow).toBeDefined();
      // Should summarize all bookings without silently dropping history
      expect(vikramRow?.allBookings).toContain("BK-CHANDI-001");
      expect(vikramRow?.allBookings).toContain("BK-RUDRA-002");
      expect(vikramRow?.allBookings).toContain("2 total bookings");
    });

    it("accurately filters devotees by specific puja selection", () => {
      // Filter for 'chandi-path': Only Devotee A booked Chandi Path
      const { rows, distinctCount } = buildDevoteeExportRows(sampleDevotees, {
        pujaFilter: "chandi-path",
      });

      expect(distinctCount).toBe(1);
      expect(rows.length).toBe(1);
      expect(rows[0].userName).toBe("Vikram Malhotra");
      expect(rows[0].pujaName).toBe("Chandi Path Mahayagya");
      expect(rows[0].bookingId).toBe("BK-CHANDI-001");
    });

    it("prioritizes the matching puja booking when a customer booked multiple pujas", () => {
      // When filtering for 'rudrabhishek', Devotee A's primary booking columns should show rudrabhishek
      const { rows, distinctCount } = buildDevoteeExportRows(sampleDevotees, {
        pujaFilter: "rudrabhishek",
      });

      // Both Vikram and Rajesh booked rudrabhishek
      expect(distinctCount).toBe(2);
      expect(rows.length).toBe(2);

      const vikramRow = rows.find((r) => r.userName.includes("Vikram"));
      expect(vikramRow?.pujaName).toBe("Maha Rudrabhishek Seva");
      expect(vikramRow?.bookingId).toBe("BK-RUDRA-002");
    });

    it("supports search queries across name, phone, city, or booking ID", () => {
      const { rows: searchByCity, distinctCount: cityCount } = buildDevoteeExportRows(
        sampleDevotees,
        { searchQuery: "वाराणसी" }
      );
      expect(cityCount).toBe(1);
      expect(searchByCity[0].location).toBe("वाराणसी");

      const { rows: searchByPhone, distinctCount: phoneCount } = buildDevoteeExportRows(
        sampleDevotees,
        { searchQuery: "9876537158" }
      );
      expect(phoneCount).toBe(1);
      expect(searchByPhone[0].userName).toBe("Vikram Malhotra");
    });

    it("supports status filtering", () => {
      const { rows: pendingOnly, distinctCount: pendingCount } = buildDevoteeExportRows(
        sampleDevotees,
        { statusFilter: "pending" }
      );
      expect(pendingCount).toBe(1);
      expect(pendingOnly[0].userName).toBe("राजेश शर्मा");
    });

    it("handles devotees with no bookings gracefully", () => {
      const { rows } = buildDevoteeExportRows([devoteeC]);
      expect(rows.length).toBe(1);
      expect(rows[0].pujaName).toBe("-");
      expect(rows[0].bookingId).toBe("-");
      expect(rows[0].allBookings).toBe("No bookings registered yet");
      // Dangerous characters in profile were sanitized
      expect(rows[0].userName.startsWith("'=")).toBe(true);
      expect(rows[0].location.startsWith("'-")).toBe(true);
    });
  });

  describe("Excel Workbook Generation", () => {
    it("generates a valid .xlsx binary workbook with styled headers and dynamic filename", async () => {
      const { buffer, filename, distinctCount } = await generateDevoteesExcelWorkbook(
        sampleDevotees,
        {
          pujaFilter: "chandi-path",
          pujaTitle: "Chandi Path",
        }
      );

      expect(distinctCount).toBe(1);
      expect(filename).toMatch(/^chandi-path-devotees-\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(buffer).toBeInstanceOf(Uint8Array);
      expect(buffer.length).toBeGreaterThan(1000);

      // Verify ZIP / XLSX magic bytes (PK\x03\x04)
      expect(buffer[0]).toBe(0x50);
      expect(buffer[1]).toBe(0x4b);
      expect(buffer[2]).toBe(0x03);
      expect(buffer[3]).toBe(0x04);
    });
  });

  describe("Server-Side Export API Authorization & Security", () => {
    it("rejects unauthorized requests with HTTP 401", async () => {
      const { GET } = await import("../app/api/admin/devotees/export/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/admin/devotees/export");
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("allows authorized admin export and returns Excel stream with headers", async () => {
      const { createSessionToken } = await import("../lib/server-store");
      const { GET } = await import("../app/api/admin/devotees/export/route");
      const { NextRequest } = await import("next/server");

      const token = await createSessionToken();
      const req = new NextRequest(
        `http://localhost:3000/api/admin/devotees/export?token=${token}&puja=all`
      );
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(res.headers.get("content-disposition")).toContain("attachment; filename=");
      expect(res.headers.get("x-distinct-count")).toBeDefined();

      const arrayBuf = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      // Verify XLSX magic bytes PK\x03\x04
      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(bytes[2]).toBe(0x03);
      expect(bytes[3]).toBe(0x04);
    });
  });
});
