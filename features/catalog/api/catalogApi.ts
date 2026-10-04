import {
  getCatalogCoupons,
  getCatalogEventSpecs,
  getCatalogFestivals,
  getCatalogPoojaDates,
  getCatalogPoojas,
  getCatalogTemples,
} from "@/lib/catalog";
import { withEventBookedSeats } from "@/lib/data";
import { getUsers } from "@/lib/storage";
import type { CatalogSection, ResolvedCatalog } from "../types/catalog.types";

let catalogCache: Promise<ResolvedCatalog> | null = null;
let catalogVersion = 0;

const CATALOG_VERSION_KEY = "ttp_catalog_version_v1";

export function getCatalogVersion(): number {
  return catalogVersion;
}

export function bumpCatalogVersion(): void {
  catalogVersion++;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CATALOG_VERSION_KEY, String(catalogVersion));
    } catch {
      // storage unavailable — ignore
    }
    if (typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent("catalog-updated"));
    }
  }
}

export function resetCatalogCache(): void {
  catalogCache = null;
  bumpCatalogVersion();
}

export function fetchCatalog(): Promise<ResolvedCatalog> {
  if (!catalogCache) {
    catalogCache = (async () => {
      try {
        const res = await fetch("/api/catalog", { cache: "no-store" });
        if (!res.ok) throw new Error("catalog request failed");
        const body = (await res.json()) as Partial<ResolvedCatalog>;
        if (
          body &&
          Array.isArray(body.poojas) &&
          Array.isArray(body.events) &&
          body.coupons
        ) {
          return {
            poojas: body.poojas,
            events: body.events,
            festivals: body.festivals ?? getCatalogFestivals(),
            coupons: body.coupons,
            poojaDates: body.poojaDates ?? [],
            temples: body.temples ?? getCatalogTemples(),
          };
        }
        throw new Error("unexpected catalog payload");
      } catch {
        return {
          poojas: getCatalogPoojas(),
          events: withEventBookedSeats(
            getCatalogEventSpecs(),
            getUsers().flatMap((u) => u.bookings)
          ),
          festivals: getCatalogFestivals(),
          coupons: getCatalogCoupons(),
          poojaDates: getCatalogPoojaDates(),
          temples: getCatalogTemples(),
        };
      }
    })();
  }
  return catalogCache;
}

export async function refreshCatalog(): Promise<ResolvedCatalog> {
  resetCatalogCache();
  return fetchCatalog();
}

async function post(path: string, body: unknown, token?: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok, status: res.status, error: data.error };
}

export async function saveCatalogSection(
  section: CatalogSection,
  value: unknown,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const res = await post(`/api/catalog`, { [section]: value }, token);
  if (!res.ok) return res;
  await refreshCatalog();
  return { ok: true };
}

export async function resetCatalogSection(
  section: CatalogSection,
  token: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const res = await post(`/api/catalog`, { reset: [section] }, token);
  if (!res.ok) return res;
  await refreshCatalog();
  return { ok: true };
}
