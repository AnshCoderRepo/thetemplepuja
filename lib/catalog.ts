// Runtime catalog layer — lets the admin control what the site shows for
// poojas, upcoming events and coupons without touching the source.
//
// The static defaults live in lib/data.ts. The admin panel writes overrides
// into localStorage; every consumer reads through these accessors, which fall
// back to the static data when no override has been saved (or outside a
// browser, e.g. during SSR and unit tests).
import {
  coupons as staticCoupons,
  defaultPoojaDates,
  poojas as staticPoojas,
  upcomingEventSpecs as staticEventSpecs,
  type Coupon,
  type Pooja,
  type PoojaDate,
  type UpcomingEventSpec,
} from "./data";
import { STORAGE_KEYS } from "./constants";

const POOJAS_KEY = STORAGE_KEYS.CATALOG_POOJAS;
const EVENTS_KEY = STORAGE_KEYS.CATALOG_EVENTS;
const COUPONS_KEY = STORAGE_KEYS.CATALOG_COUPONS;
const POOJA_DATES_KEY = STORAGE_KEYS.CATALOG_POOJA_DATES;

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable — ignore for demo
  }
}

function clear(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ===================== POOJAS =====================

export function getCatalogPoojas(): Pooja[] {
  return read<Pooja[]>(POOJAS_KEY) ?? staticPoojas;
}

export function getCatalogPooja(slug: string): Pooja | undefined {
  return getCatalogPoojas().find((p) => p.slug === slug);
}

export function saveCatalogPoojas(poojas: Pooja[]): void {
  write(POOJAS_KEY, poojas);
}

export function resetCatalogPoojas(): void {
  clear(POOJAS_KEY);
}

// ===================== EVENTS =====================

export function getCatalogEventSpecs(): UpcomingEventSpec[] {
  return read<UpcomingEventSpec[]>(EVENTS_KEY) ?? staticEventSpecs;
}

export function saveCatalogEventSpecs(specs: UpcomingEventSpec[]): void {
  write(EVENTS_KEY, specs);
}

export function resetCatalogEventSpecs(): void {
  clear(EVENTS_KEY);
}

// ===================== COUPONS =====================

export function getCatalogCoupons(): Record<string, Coupon> {
  return read<Record<string, Coupon>>(COUPONS_KEY) ?? staticCoupons;
}

export function saveCatalogCoupons(coupons: Record<string, Coupon>): void {
  write(COUPONS_KEY, coupons);
}

export function resetCatalogCoupons(): void {
  clear(COUPONS_KEY);
}

// ===================== POOJA DATES =====================

export function getCatalogPoojaDates(): PoojaDate[] {
  return read<PoojaDate[]>(POOJA_DATES_KEY) ?? defaultPoojaDates;
}

export function saveCatalogPoojaDates(dates: PoojaDate[]): void {
  write(POOJA_DATES_KEY, dates);
}

export function resetCatalogPoojaDates(): void {
  clear(POOJA_DATES_KEY);
}
