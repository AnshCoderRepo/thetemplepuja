import { describe, expect, it } from "vitest";
import { shouldRenderPublicHeader } from "../lib/public-header";
import { translations, SUPPORTED_LANGUAGES, type Locale } from "../lib/i18n";

describe("Public Navbar & Route Scoping", () => {
  it("verifies all 5 navigation links and translations exist across all supported languages", () => {
    const locales: Locale[] = ["en", "hi", "te", "ta"];

    for (const loc of locales) {
      const dict = translations[loc];
      expect(dict["nav.home"], `Missing nav.home in ${loc}`).toBeTruthy();
      expect(dict["nav.bookPooja"], `Missing nav.bookPooja in ${loc}`).toBeTruthy();
      expect(dict["nav.temples"], `Missing nav.temples in ${loc}`).toBeTruthy();
      expect(dict["nav.blog"], `Missing nav.blog in ${loc}`).toBeTruthy();
      expect(dict["nav.contact"], `Missing nav.contact in ${loc}`).toBeTruthy();
      expect(dict["nav.login"], `Missing nav.login in ${loc}`).toBeTruthy();
    }
  });

  describe("shouldRenderPublicHeader Route Exclusion for Admin", () => {
    it("returns true for home page (/)", () => {
      expect(shouldRenderPublicHeader("/")).toBe(true);
      expect(shouldRenderPublicHeader("")).toBe(true);
      expect(shouldRenderPublicHeader(null)).toBe(true);
    });

    it("returns true for /temples", () => {
      expect(shouldRenderPublicHeader("/temples")).toBe(true);
    });

    it("returns true for /book and puja detail pages", () => {
      expect(shouldRenderPublicHeader("/book")).toBe(true);
      expect(shouldRenderPublicHeader("/book/satyanarayan-katha")).toBe(true);
      expect(shouldRenderPublicHeader("/book/rudrabhishek")).toBe(true);
      expect(shouldRenderPublicHeader("/book/demo-pooja")).toBe(true);
    });

    it("returns true for /blog and article detail pages", () => {
      expect(shouldRenderPublicHeader("/blog")).toBe(true);
      expect(shouldRenderPublicHeader("/blog/rudrabhishek-benefits")).toBe(true);
    });

    it("returns true for /login, /signup, /profile, /activate, /forgot-password", () => {
      expect(shouldRenderPublicHeader("/login")).toBe(true);
      expect(shouldRenderPublicHeader("/signup")).toBe(true);
      expect(shouldRenderPublicHeader("/profile")).toBe(true);
      expect(shouldRenderPublicHeader("/activate")).toBe(true);
      expect(shouldRenderPublicHeader("/forgot-password")).toBe(true);
    });

    it("returns true for booking confirmation and receipt pages", () => {
      expect(shouldRenderPublicHeader("/booking/BK-123456")).toBe(true);
    });

    it("COMPLETELY EXCLUDES /admin route (returns false)", () => {
      expect(shouldRenderPublicHeader("/admin")).toBe(false);
    });

    it("COMPLETELY EXCLUDES all /admin/* sub-routes (returns false)", () => {
      const adminSubRoutes = [
        "/admin/analytics",
        "/admin/bookings",
        "/admin/catalog",
        "/admin/temples",
        "/admin/users",
        "/admin/blogs",
        "/admin/chatbot",
        "/admin/settings",
        "/admin/refunds",
        "/admin/devotees",
        "/admin/orders",
      ];

      for (const route of adminSubRoutes) {
        expect(
          shouldRenderPublicHeader(route),
          `Route ${route} must be completely excluded from PublicHeader`
        ).toBe(false);
      }
    });
  });
});
