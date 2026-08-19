"use client";

import { useEffect, useState } from "react";
import {
  coupons as staticCoupons,
  defaultPoojaDates,
  poojas as staticPoojas,
  type Coupon,
  type Pooja,
  type PoojaDate,
  type UpcomingEventSpec,
} from "@/lib/data";
import { fetchCatalog, getCatalogVersion, type ResolvedCatalog } from "@/lib/api";

export interface CatalogState {
  /** Poojas from the backend (static defaults until loaded). */
  poojas: Pooja[];
  /** Event specs from the backend (empty until loaded — callers show a skeleton). */
  events: UpcomingEventSpec[];
  /** Coupons from the backend (static defaults until loaded). */
  coupons: Record<string, Coupon>;
  /** Admin-managed recurring pooja dates (empty by default). */
  poojaDates: PoojaDate[];
  /** True once the backend catalog has been fetched. */
  loaded: boolean;
}

/**
 * Shared catalog hook. Returns the static defaults synchronously (so SSR and
 * the first paint match), then swaps in the server catalog once fetched.
 * The underlying fetch is cached, so every consumer shares one request.
 */
export function useCatalog(): CatalogState {
  const [catalog, setCatalog] = useState<ResolvedCatalog | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(() => getCatalogVersion());

  // Re-fetch whenever the catalog changes. Three triggers:
  // 1. Same-tab admin saves bump getCatalogVersion() via resetCatalogCache().
  // 2. Other-tab writes fire the "storage" event.
  // 3. Tab refocus fires the "visibilitychange" event.
  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setCatalog(c);
    });
    return () => {
      live = false;
    };
  }, [catalogVersion]);

  // Listen for cross-tab catalog changes (localStorage "storage" event).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ttp_catalog_version_v1") {
        setCatalogVersion(Number(e.newValue) || 0);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Re-check when the tab becomes visible (catches same-tab changes the user
  // navigated away from).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        const v = getCatalogVersion();
        setCatalogVersion(v);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Same-tab catalog updates (admin saves) fire a custom event — instant.
  useEffect(() => {
    const onCatalogUpdated = () => setCatalogVersion(getCatalogVersion());
    window.addEventListener("catalog-updated", onCatalogUpdated);
    return () => window.removeEventListener("catalog-updated", onCatalogUpdated);
  }, []);

  return {
    poojas: catalog?.poojas ?? staticPoojas,
    events: catalog?.events ?? [],
    coupons: catalog?.coupons ?? staticCoupons,
    poojaDates: catalog?.poojaDates ?? defaultPoojaDates,
    loaded: catalog !== null,
  };
}
