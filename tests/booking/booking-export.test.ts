import { describe, expect, it } from "vitest";
import {
  BOOKING_EXPORT_HEADERS,
  cleanCustomerName,
  formatBookingDateTime,
  generateBookingsExportCsv,
  getBookingDevoteeDisplay,
  sanitizeCsvCell,
} from "@/lib/booking-export";
import type { BookingRecord, UserProfile } from "@/lib/storage";

describe("Booking Export & Devotee Display", () => {
  const mockUser: UserProfile = {
    id: "user_test_1",
    name: "Ketan Pandey",
    phone: "+91 9876543210",
    email: "ketan.pandey@example.com",
    gotra: "Kashyap",
    city: "Varanasi",
    address: "B-12, Assi Ghat Road, Varanasi, UP - 221005",
    createdAt: "2026-10-10T10:00:00.000Z",
    bookings: [],
  };

  const mockBooking: BookingRecord = {
    bookingId: "TP-20261010-001",
    poojaSlug: "kashi-vishwanath-rudrabhishek",
    poojaTitle: "Kashi Vishwanath Maha Rudrabhishek",
    templeSlug: "kashi-vishwanath-temple",
    templeName: "Shri Kashi Vishwanath Jyotirlinga Temple",
    date: "15 Oct 2026",
    time: "7:00 AM IST",
    panditName: "Acharya Ram Shastri",
    amount: 5100,
    discount: 0,
    couponCode: null,
    addonCount: 0,
    createdAt: "2026-10-10T10:05:00.000Z",
    status: "confirmed",
    currency: "INR",
    quantity: 1,
    gotra: "Kashyap",
    primaryDevoteeName: "Ketan Pandey",
  };

  it("exports exact 14 columns in the precise required order", () => {
    expect(BOOKING_EXPORT_HEADERS).toEqual([
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
    ]);
    expect(BOOKING_EXPORT_HEADERS.length).toBe(14);
  });

  it("formats single devotee without family suffix in table", () => {
    const info = getBookingDevoteeDisplay(mockBooking, mockUser);
    expect(info.primaryName).toBe("Ketan Pandey");
    expect(info.tableDisplayName).toBe("Ketan Pandey");
    expect(info.allDevoteeNames).toBe("Ketan Pandey");
    expect(info.allGotras).toBe("Kashyap");
    expect(info.devoteeCount).toBe(1);
  });

  it("formats multiple family members correctly without double-counting", () => {
    const familyBooking: BookingRecord = {
      ...mockBooking,
      packageTier: "family",
      familyMembers: [
        { name: "Ketan Pandey", gotra: "Kashyap" },
        { name: "Sunita Pandey", gotra: "Kashyap" },
        { name: "Aarav Pandey", gotra: "Kashyap" },
      ],
    };

    const info = getBookingDevoteeDisplay(familyBooking, mockUser);
    expect(info.primaryName).toBe("Ketan Pandey");
    expect(info.devoteeCount).toBe(3);
    expect(info.tableDisplayName).toBe("Ketan Pandey & Family (3 Members)");
    expect(info.allDevoteeNames).toBe("Ketan Pandey, Sunita Pandey, Aarav Pandey");
    expect(info.allGotras).toBe("Kashyap");
  });

  it("handles joint puja devotees with individual gotras", () => {
    const jointBooking: BookingRecord = {
      ...mockBooking,
      primaryDevoteeName: "Rajesh Sharma",
      gotra: "Bharadwaj",
      partnerName: "Pooja Sharma",
      partnerGotra: "Vashishta",
    };

    const info = getBookingDevoteeDisplay(jointBooking, {
      ...mockUser,
      name: "Rajesh Sharma",
      gotra: "Bharadwaj",
    });

    expect(info.primaryName).toBe("Rajesh Sharma");
    expect(info.devoteeCount).toBe(2);
    expect(info.tableDisplayName).toBe("Rajesh Sharma & Family (2 Members)");
    expect(info.allDevoteeNames).toBe("Rajesh Sharma, Pooja Sharma");
    expect(info.allGotras).toContain("Bharadwaj");
    expect(info.allGotras).toContain("Vashishta");
  });

  it("handles legacy composite strings in user.name cleanly", () => {
    const legacyUser: UserProfile = {
      ...mockUser,
      name: "Rohit Verma & Family (4 Members)",
    };
    const legacyBooking: BookingRecord = {
      ...mockBooking,
      primaryDevoteeName: undefined,
      devotees: undefined,
      familyMembers: undefined,
    };

    expect(cleanCustomerName(legacyUser.name)).toBe("Rohit Verma");
    const info = getBookingDevoteeDisplay(legacyBooking, legacyUser);
    expect(info.primaryName).toBe("Rohit Verma");
    expect(info.devoteeCount).toBe(4);
    expect(info.tableDisplayName).toBe("Rohit Verma & Family (4 Members)");
  });

  it("does not fabricate gotra when none was provided", () => {
    const noGotraBooking: BookingRecord = {
      ...mockBooking,
      gotra: undefined,
      primaryDevoteeName: "Priya Singh",
    };
    const noGotraUser: UserProfile = {
      ...mockUser,
      name: "Priya Singh",
      gotra: "",
    };

    const info = getBookingDevoteeDisplay(noGotraBooking, noGotraUser);
    expect(info.allGotras).toBe("");
  });

  it("sanitizes CSV cells and prevents spreadsheet formula injection", () => {
    // Dangerous formulas starting with =, +, -, @
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe('"\'=SUM(A1:A10)"');
    expect(sanitizeCsvCell("+919876543210")).toBe('"\' +919876543210"'.replace(" ", ""));
    expect(sanitizeCsvCell("-500")).toBe('"\' -500"'.replace(" ", ""));
    expect(sanitizeCsvCell("@alert(1)")).toBe('"\'@alert(1)"');

    // Standard string with quotes
    expect(sanitizeCsvCell('Lord "Shiva" Temple')).toBe('"Lord ""Shiva"" Temple"');

    // Null and undefined
    expect(sanitizeCsvCell(null)).toBe('""');
    expect(sanitizeCsvCell(undefined)).toBe('""');
  });

  it("generates complete 14-column CSV with UTF-8 BOM for Excel Hindi support", () => {
    const hindiUser: UserProfile = {
      ...mockUser,
      name: "रमेश कुमार",
      phone: "+91 9811122233",
      gotra: "कश्यप",
    };
    const hindiBooking: BookingRecord = {
      ...mockBooking,
      primaryDevoteeName: "रमेश कुमार",
      poojaTitle: "श्री महामृत्युंजय अनुष्ठान",
      templeName: "महाकालेश्वर ज्योतिर्लिंग",
      gotra: "कश्यप",
      amount: 11000,
      currency: "INR",
      quantity: 1,
    };

    const csv = generateBookingsExportCsv([{ booking: hindiBooking, user: hindiUser }]);

    // Must start with UTF-8 BOM
    expect(csv.startsWith("\uFEFF")).toBe(true);

    // Header line check
    const lines = csv.slice(1).split("\r\n");
    expect(lines.length).toBe(2);

    const headerParts = lines[0].split(",");
    expect(headerParts.length).toBe(14);
    expect(headerParts[0]).toBe('"User Name"');
    expect(headerParts[13]).toBe('"Quantity"');

    // Data line check
    const dataRow = lines[1];
    expect(dataRow).toContain('"रमेश कुमार"');
    expect(dataRow).toContain('"श्री महामृत्युंजय अनुष्ठान"');
    expect(dataRow).toContain('"महाकालेश्वर ज्योतिर्लिंग"');
    expect(dataRow).toContain('"11000"');
    expect(dataRow).toContain('"INR"');
    expect(dataRow).toContain('"1"');
  });

  it("distinguishes between purchased quantity and devotee count", () => {
    const familyBooking: BookingRecord = {
      ...mockBooking,
      quantity: 2, // Purchased 2 puja slots
      familyMembers: [
        { name: "Devotee 1", gotra: "G1" },
        { name: "Devotee 2", gotra: "G1" },
        { name: "Devotee 3", gotra: "G1" },
        { name: "Devotee 4", gotra: "G1" },
      ],
    };

    const csv = generateBookingsExportCsv([{ booking: familyBooking, user: mockUser }]);
    const lines = csv.slice(1).split("\r\n");

    // Standard CSV line parser taking quoted strings into account
    const parseCsvRow = (line: string): string[] => {
      const row: string[] = [];
      let cell = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          row.push(cell);
          cell = "";
        } else {
          cell += c;
        }
      }
      row.push(cell);
      return row;
    };

    const cells = parseCsvRow(lines[1]);
    expect(cells.length).toBe(14);
    // Column 11: Devotee / Family Member Names
    expect(cells[10]).toBe("Devotee 1, Devotee 2, Devotee 3, Devotee 4");
    // Column 14: Quantity must be the purchased quantity 2, NOT family count 4
    expect(cells[13]).toBe("2");
  });

  describe("Admin Export API Endpoint", () => {
    it("rejects unauthorized export requests", async () => {
      const { GET } = await import("@/app/api/admin/bookings/export/route");
      const { NextRequest } = await import("next/server");

      const req = new NextRequest("http://localhost:3000/api/admin/bookings/export");
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("serves 14-column CSV report to authorized admin", async () => {
      const { createSessionToken } = await import("@/lib/server-store");
      const { GET } = await import("@/app/api/admin/bookings/export/route");
      const { NextRequest } = await import("next/server");

      const token = await createSessionToken();
      const req = new NextRequest(`http://localhost:3000/api/admin/bookings/export?token=${token}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      expect(res.headers.get("content-disposition")).toContain("attachment; filename=");

      const buf = new Uint8Array(await res.arrayBuffer());
      // First 3 bytes are UTF-8 BOM (0xEF, 0xBB, 0xBF)
      expect(buf[0]).toBe(0xef);
      expect(buf[1]).toBe(0xbb);
      expect(buf[2]).toBe(0xbf);

      const text = new TextDecoder().decode(buf);
      expect(text).toContain("User Name");
      expect(text).toContain("Quantity");
    });
  });
});

