import { describe, expect, it } from "vitest";
import { translations, SUPPORTED_LANGUAGES, DEFAULT_LOCALE, type Locale, type TranslationKey } from "@/lib/i18n";
import {
  getLocalizedTempleName,
  isPoojaLiveStreamAvailable,
  type Temple,
  type Pooja,
} from "@/lib/data";

describe("Global i18n & Translation System", () => {
  it("defaults site locale to Hindi ('hi')", () => {
    expect(DEFAULT_LOCALE).toBe("hi");
  });

  it("supports exactly English, Hindi, Telugu, and Tamil with Hindi as default and 3 others switchable", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(["en", "hi", "ta", "te"]);
    expect(codes).toContain(DEFAULT_LOCALE);
    const otherLanguages = codes.filter((c) => c !== DEFAULT_LOCALE);
    expect(otherLanguages).toHaveLength(3);
    expect(otherLanguages).toEqual(expect.arrayContaining(["en", "te", "ta"]));
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(lang.label).toBeTruthy();
      expect(lang.nativeName).toBeTruthy();
    }
  });

  it("contains all required service.* translation keys in English", () => {
    const en = translations.en;
    expect(en["service.liveDarshan"]).toBe("Live Darshan");
    expect(en["service.allPhotos"]).toBe("All Photos (1)");
    expect(en["service.startingDakshina"]).toBe("Starting Dakshina");
    expect(en["service.vedicPurohitVerified"]).toBe("Vedic Purohit Verified");
    expect(en["service.benefitsHeading"]).toBe("Pooja Blessings & Divine Benefits:");
    expect(en["service.assurancesHeading"]).toBe("Vedic Assurances & Inclusions");
    expect(en["service.assurance1"]).toBe("100% Certified Vedic Purohit from Kashi / Ayodhya");
    expect(en["service.assurance2"]).toBe("Personalized Vedic Sankalp with your Name & Gotra");
    expect(en["service.assurance3"]).toBe("Private Live Stream Link & Recorded Video on WhatsApp");
    expect(en["service.assurance4"]).toBe("Prasad & Consecrated Raksha Sutra Delivery");
    expect(en["service.assuranceRecorded"]).toBe("Personalized Video Recording of Sankalp on WhatsApp");
    expect(en["service.assuranceInPerson"]).toBe("Direct In-Person Participation at Temple Sanctuary");
    expect(en["service.verifiedSevaBadge"]).toBe("Verified Seva");
    expect(en["service.scheduleHeading"]).toBe("Scheduled Date, Time & Temple");
    expect(en["service.dateMuhuratLabel"]).toBe("Scheduled Date & Muhurat");
    expect(en["service.templeVenueLabel"]).toBe("Sacred Temple Venue");
    expect(en["service.preScheduledNoticePrefix"]).toBe("Pre-Scheduled Muhurat:");
    expect(en["service.preScheduledNoticeText"]).toContain("You do not need to choose any date or time");
    expect(en["service.groupDakshinaLabel"]).toBe("Standard Group Pooja Dakshina");
    expect(en["service.bookGroupPuja"]).toBe("Book Group Puja");
    expect(en["service.vipBadge"]).toContain("VIP");
    expect(en["service.vipTitle"]).toContain("Exclusive VIP Puja");
  });

  it("ensures 100% key parity between English, Hindi, Telugu, and Tamil", () => {
    const enKeys = Object.keys(translations.en) as TranslationKey[];
    const locales: Locale[] = ["hi", "te", "ta"];

    for (const loc of locales) {
      const locDict = translations[loc] as Record<string, string>;
      const missingKeys = enKeys.filter((k) => !locDict[k] || locDict[k].trim() === "");
      expect(missingKeys, `Missing keys in locale '${loc}'`).toEqual([]);
    }
  });

  it("accurately detects genuine live stream availability via isPoojaLiveStreamAvailable", () => {
    const basePooja: Pooja = {
      slug: "test-pooja",
      title: "Test Pooja",
      hindiTitle: "टेस्ट पूजा",
      price: 501,
      benefits: ["Peace"],
      bestMuhurat: "Morning",
      duration: "1 Hour",
      description: "A sacred ritual",
      emoji: "🪔",
      gradient: "from-amber-400 to-orange-500",
    };

    // 1. Valid live stream configured
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: true,
        liveStreamUrl: "https://youtube.com/live/sample-stream-123",
      })
    ).toBe(true);

    // 2. Valid Zoom link configured
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: true,
        liveStreamUrl: "https://zoom.us/j/987654321",
      })
    ).toBe(true);

    // 3. Online format explicitly disabled (in-person only)
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: false,
        liveStreamUrl: "https://youtube.com/live/sample-stream-123",
      })
    ).toBe(false);

    // 4. Live explicitly turned off
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: true,
        live: false,
        liveStreamUrl: "https://youtube.com/live/sample-stream-123",
      })
    ).toBe(false);

    // 5. Missing live stream URL
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: true,
      })
    ).toBe(false);

    // 6. Empty / whitespace stream URL
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: true,
        liveStreamUrl: "   ",
      })
    ).toBe(false);

    // 7. Invalid stream URL (not a valid HTTP/HTTPS URL)
    expect(
      isPoojaLiveStreamAvailable({
        ...basePooja,
        online: true,
        liveStreamUrl: "not_a_valid_url",
      })
    ).toBe(false);

    // 8. Null / undefined pooja
    expect(isPoojaLiveStreamAvailable(null)).toBe(false);
    expect(isPoojaLiveStreamAvailable(undefined)).toBe(false);
  });

  it("localizes temple name correctly with getLocalizedTempleName", () => {
    const sampleTemple: Temple = {
      slug: "someshwar-mahadev",
      name: "Someshwar Mahadev Temple",
      hindiName: "सोमेश्वर महादेव मंदिर",
      deity: "Lord Shiva",
      description: "Historic sacred shrine.",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      active: true,
    };

    expect(getLocalizedTempleName(sampleTemple, "en")).toBe("Someshwar Mahadev Temple");
    expect(getLocalizedTempleName(sampleTemple, "hi")).toBe("सोमेश्वर महादेव मंदिर");
    expect(getLocalizedTempleName(sampleTemple, "te")).toBe("Someshwar Mahadev Temple");
    expect(getLocalizedTempleName(sampleTemple, "ta")).toBe("Someshwar Mahadev Temple");

    const templeWithoutHindi: Temple = {
      slug: "generic-temple",
      name: "Generic Temple",
      deity: "Devi",
      description: "Sacred shrine.",
      city: "Ujjain",
      state: "MP",
      active: true,
    };
    expect(getLocalizedTempleName(templeWithoutHindi, "hi")).toBe("Generic Temple");
    expect(getLocalizedTempleName(null, "hi")).toBe("");
  });
});
