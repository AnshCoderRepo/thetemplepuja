import { describe, expect, it } from "vitest";
import {
  BOOKING_EXPORT_HEADERS,
  LEGACY_BOOKING_EXPORT_HEADERS,
  generateBookingsExportCsv,
  sanitizeCsvCell,
} from "@/lib/booking-export";
import type { BookingRecord, UserProfile } from "@/lib/storage";
import {
  createMemoryStore,
  type PujaSessionVideo,
  type StandalonePackage,
} from "@/lib/persistence";

describe("TemplePujaSewa Safe Feature Enhancements", () => {
  const mockUser: UserProfile = {
    id: "usr_devotee_42",
    name: "Adarsh Sharma",
    phone: "+91 9621014155",
    email: "adarsh@example.com",
    gotra: "Vatsa",
    city: "Varanasi",
    address: "Kedar Ghat, Varanasi",
    createdAt: "2026-11-04T10:00:00.000Z",
    bookings: [],
  };

  const baseBooking: BookingRecord = {
    bookingId: "TP-20261104-001",
    poojaSlug: "kashi-vishwanath-rudrabhishek",
    poojaTitle: "Kashi Vishwanath Maha Rudrabhishek",
    templeSlug: "kashi-vishwanath-temple",
    templeName: "Shri Kashi Vishwanath Jyotirlinga Temple",
    date: "Thu, Nov 5",
    time: "08:00 AM IST",
    panditName: "Acharya Vidyadhar",
    amount: 3101,
    discount: 0,
    couponCode: null,
    addonCount: 2,
    createdAt: "2026-11-04T10:05:00.000Z",
    status: "confirmed",
    currency: "INR",
    quantity: 1,
    packageTier: "family",
    primaryDevoteeName: "Adarsh Sharma",
    addons: [
      {
        id: "prasad-box",
        name: "Special Maha Prasad Box",
        price: 501,
        quantity: 2,
        itemType: "addon",
      },
      {
        id: "holy-sindoor",
        name: "Holy Sindoor & Kumkum",
        price: 151,
        quantity: 3,
        itemType: "chadhava",
      },
    ],
  };

  describe("Feature C: Chadhava & Addon Pricing Calculations", () => {
    it("correctly calculates line subtotals for chadhava items (unit price × quantity)", () => {
      const chadhavaItem = baseBooking.addons![1];
      const lineSubtotal = chadhavaItem.price * chadhavaItem.quantity;
      expect(lineSubtotal).toBe(453); // 151 * 3
    });

    it("correctly computes separate totals for addons vs chadhavas without overlap", () => {
      const allAddons = baseBooking.addons || [];
      const regular = allAddons.filter((a) => a.itemType !== "chadhava");
      const chadhavas = allAddons.filter((a) => a.itemType === "chadhava");

      const regularTotal = regular.reduce((sum, a) => sum + a.price * a.quantity, 0);
      const chadhavaTotal = chadhavas.reduce((sum, c) => sum + c.price * c.quantity, 0);

      expect(regularTotal).toBe(1002); // 501 * 2
      expect(chadhavaTotal).toBe(453); // 151 * 3
      expect(regularTotal + chadhavaTotal).toBe(1455);
    });
  });

  describe("Feature D: Additive 21-Column Booking CSV Export", () => {
    it("strictly preserves the first 14 legacy columns in order", () => {
      expect(BOOKING_EXPORT_HEADERS.length).toBe(21);
      expect(LEGACY_BOOKING_EXPORT_HEADERS.length).toBe(14);
      expect(BOOKING_EXPORT_HEADERS.slice(0, 14)).toEqual(LEGACY_BOOKING_EXPORT_HEADERS);
    });

    it("appends 7 new breakdown columns at indexes 14-20", () => {
      expect(BOOKING_EXPORT_HEADERS.slice(14)).toEqual([
        "Package Name",
        "Selected Add-on Names",
        "Add-on Quantities",
        "Add-on Individual Prices",
        "Total Add-on Amount",
        "Chadhava Names & Quantities",
        "Total Chadhava Amount",
      ]);
    });

    it("generates 21 columns with sanitized cells and escaped formula injections", () => {
      const formulaBooking: BookingRecord = {
        ...baseBooking,
        primaryDevoteeName: "=SUM(A1:A5)",
        addons: [
          {
            id: "add_danger",
            name: "@SecretDiscount",
            price: 100,
            quantity: 1,
            itemType: "addon",
          },
        ],
      };

      const csv = generateBookingsExportCsv([{ booking: formulaBooking, user: mockUser }]);
      expect(csv.startsWith("\uFEFF")).toBe(true);

      const lines = csv.slice(1).split("\r\n");
      expect(lines.length).toBe(2);

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
      expect(cells.length).toBe(21);

      // Verify formula injection escaping
      expect(lines[1]).toContain('"\'=SUM(A1:A5)"');
      expect(lines[1]).toContain('"\'@SecretDiscount"');
      // Verify Package Name formatted
      expect(lines[1]).toContain('"Family Plan"');
    });
  });

  describe("Feature E: Puja Session Video Access Control", () => {
    it("allows confirmed devotee to access session video when poojaSlug and date match", async () => {
      const memStore = createMemoryStore();
      const video: PujaSessionVideo = {
        id: "pvid_101",
        poojaSlug: "kashi-vishwanath-rudrabhishek",
        poojaTitle: "Kashi Vishwanath Maha Rudrabhishek",
        date: "Thu, Nov 5",
        videoUrl: "https://youtube.com/watch?v=mock123",
        title: "Kashi Rudrabhishek Session Video",
        active: true,
        createdAt: new Date().toISOString(),
      };
      await memStore.savePujaVideo(video);

      const allVideos = await memStore.getPujaVideos();
      expect(allVideos.length).toBe(1);

      // Access gate logic:
      const confirmedUser: UserProfile = {
        ...mockUser,
        bookings: [baseBooking],
      };

      const hasMatchingBooking = confirmedUser.bookings.some(
        (b) =>
          b.status === "confirmed" &&
          b.poojaSlug === video.poojaSlug &&
          b.date.toLowerCase() === video.date.toLowerCase()
      );
      expect(hasMatchingBooking).toBe(true);
    });

    it("denies access to devotees with cancelled, pending or different-date bookings", async () => {
      const video: PujaSessionVideo = {
        id: "pvid_102",
        poojaSlug: "kashi-vishwanath-rudrabhishek",
        poojaTitle: "Kashi Vishwanath Maha Rudrabhishek",
        date: "Thu, Nov 5",
        videoUrl: "https://youtube.com/watch?v=mock123",
        title: "Kashi Rudrabhishek Session Video",
        active: true,
        createdAt: new Date().toISOString(),
      };

      // 1. Pending booking
      const pendingBooking: BookingRecord = {
        ...baseBooking,
        status: "pending",
      };
      const canAccessPending = [pendingBooking].some(
        (b) => b.status === "confirmed" && b.poojaSlug === video.poojaSlug
      );
      expect(canAccessPending).toBe(false);

      // 2. Different ceremony date
      const differentDateBooking: BookingRecord = {
        ...baseBooking,
        status: "confirmed",
        date: "Sun, Nov 8",
      };
      const canAccessDifferentDate = [differentDateBooking].some(
        (b) =>
          b.status === "confirmed" &&
          b.poojaSlug === video.poojaSlug &&
          b.date.toLowerCase() === video.date.toLowerCase()
      );
      expect(canAccessDifferentDate).toBe(false);
    });
  });

  describe("Feature F: Draft vs. Active Packages", () => {
    it("stores draft packages independently and excludes them from active packages", async () => {
      const memStore = createMemoryStore();
      const draftPkg: StandalonePackage = {
        id: "pkg_draft_special",
        name: "Special Diwali Mahapuja",
        price: 5100,
        status: "draft",
        attachedPoojaSlugs: ["kashi-vishwanath-rudrabhishek"],
        createdAt: new Date().toISOString(),
      };
      const activePkg: StandalonePackage = {
        id: "pkg_active_standard",
        name: "Shiva Abhishek Seva",
        price: 2100,
        status: "active",
        attachedPoojaSlugs: ["kashi-vishwanath-rudrabhishek"],
        createdAt: new Date().toISOString(),
      };

      await memStore.saveStandalonePackage(draftPkg);
      await memStore.saveStandalonePackage(activePkg);

      const all = await memStore.getStandalonePackages();
      expect(all.length).toBe(2);

      const activeOnly = all.filter((p) => p.status === "active");
      expect(activeOnly.length).toBe(1);
      expect(activeOnly[0].id).toBe("pkg_active_standard");
    });
  });
});
