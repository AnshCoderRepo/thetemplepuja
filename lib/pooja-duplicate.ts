/**
 * Pooja Catalog Duplication Service
 * Provides safe cloning of existing pooja ceremonies with unique slug generation,
 * safe draft/hidden status by default, deep copying of reusable attributes, and
 * exclusion of historical transaction, booking, or seat-allocation data.
 */

import type { Pooja, PoojaPackage } from "./data";

/**
 * Normalizes text to a clean URL-friendly slug.
 */
export function slugifyPooja(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates an assured unique slug guaranteed not to collide with existing catalog items.
 * If candidate 'rudrabhishek-copy' exists, returns 'rudrabhishek-copy-2', 'rudrabhishek-copy-3', etc.
 */
export function generateUniquePoojaSlug(
  baseText: string,
  existingList: { slug: string }[],
  currentSlugToIgnore?: string | null
): string {
  const cleanBase = slugifyPooja(baseText) || "pooja";
  let candidate = cleanBase;
  let counter = 2;

  const isTaken = (s: string) =>
    existingList.some(
      (p) =>
        p.slug.toLowerCase().trim() === s.toLowerCase().trim() &&
        p.slug.toLowerCase().trim() !== currentSlugToIgnore?.toLowerCase().trim()
    );

  while (isTaken(candidate)) {
    candidate = `${cleanBase}-${counter}`;
    counter++;
  }

  return candidate;
}

export interface DuplicatePoojaOptions {
  customTitle?: string;
  customSlug?: string;
  activeDefault?: boolean; // Defaults to false (Hidden / Draft)
}

/**
 * Creates a duplicate of an existing Pooja ceremony:
 * - Generates a unique, non-conflicting slug
 * - Sets default status to Hidden/Draft (active: false)
 * - Deep copies reusable metadata (packages, deities, benefits, chadhava)
 * - Reuses image reference safely without creating duplicate assets
 * - Strips original booking counts, seat allocation, and historical data
 */
export function duplicatePooja(
  source: Pooja,
  existingList: Pooja[],
  options: DuplicatePoojaOptions = {}
): Pooja {
  const baseTitle = options.customTitle?.trim() || `${source.title} (Copy)`;
  const rawBaseSlug = options.customSlug?.trim() || `${source.slug}-copy`;
  const uniqueSlug = generateUniquePoojaSlug(rawBaseSlug, existingList);

  const copyHindiTitle = source.hindiTitle
    ? `${source.hindiTitle} (प्रतिलिपि)`
    : `${baseTitle}`;
  const copyTeluguTitle = source.teluguTitle
    ? `${source.teluguTitle} (కాపీ)`
    : undefined;
  const copyTamilTitle = source.tamilTitle
    ? `${source.tamilTitle} (நகல்)`
    : undefined;

  const duplicated: Pooja = {
    slug: uniqueSlug,
    title: baseTitle,
    hindiTitle: copyHindiTitle,
    teluguTitle: copyTeluguTitle,
    tamilTitle: copyTamilTitle,
    category: source.category ?? "Rashifal Pooja",
    type: source.type ?? "temple",
    online: source.online ?? true,
    liveStreamUrl: source.liveStreamUrl,
    price: Number(source.price) || 1101,
    duration: source.duration ?? "1.5 hours",
    bestMuhurat: source.bestMuhurat ?? "Auspicious Muhurat",
    startDate: source.startDate ?? "2026-10-04",
    description: source.description ?? "",
    hindiDescription: source.hindiDescription,
    teluguDescription: source.teluguDescription,
    tamilDescription: source.tamilDescription,
    benefits: source.benefits ? [...source.benefits] : [],
    hindiBenefits: source.hindiBenefits ? [...source.hindiBenefits] : undefined,
    teluguBenefits: source.teluguBenefits ? [...source.teluguBenefits] : undefined,
    tamilBenefits: source.tamilBenefits ? [...source.tamilBenefits] : undefined,
    emoji: source.emoji ?? "🪔",
    gradient: source.gradient ?? "from-saffron-500 to-saffron-700",
    imageUrl: source.imageUrl, // Safely reuse image URL reference
    deities: source.deities ? [...source.deities] : ["Lord Shiva"],
    templeSlugs: source.templeSlugs ? [...source.templeSlugs] : [],
    chadhavaOptions: source.chadhavaOptions ? [...source.chadhavaOptions] : [],
    packages: source.packages
      ? source.packages.map((pkg: PoojaPackage) => ({ ...pkg }))
      : undefined,
    // SAFE DEFAULT: Hidden / Draft by default (active: false)
    active: options.activeDefault ?? false,
    daysFromToday: source.daysFromToday,
    eventTime: source.eventTime,
    seats: source.seats,
    capacity: source.capacity,
    live: source.live ?? false,
    // EXCLUDE historical booking counts & seat allocation
    bookedSeats: undefined,
    // Creation metadata: marked as new with current timestamp
    createdAt: new Date().toISOString(),
    isNew: true,
  };

  return duplicated;
}
