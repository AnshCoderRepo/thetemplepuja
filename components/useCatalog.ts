"use client";

import { useEffect, useState } from "react";
import {
  coupons as staticCoupons,
  poojas as staticPoojas,
  type Coupon,
  type Pooja,
  type UpcomingEventSpec,
} from "@/lib/data";
import { fetchCatalog, type ResolvedCatalog } from "@/lib/api";

export interface CatalogState {
  /** Poojas from the backend (static defaults until loaded). */
  poojas: Pooja[];
  /** Event specs from the backend (empty until loaded — callers show a skeleton). */
  events: UpcomingEventSpec[];
  /** Coupons from the backend (static defaults until loaded). */
  coupons: Record<string, Coupon>;
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

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setCatalog(c);
    });
    return () => {
      live = false;
    };
  }, []);

  return {
    poojas: catalog?.poojas ?? staticPoojas,
    events: catalog?.events ?? [],
    coupons: catalog?.coupons ?? staticCoupons,
    loaded: catalog !== null,
  };
}
