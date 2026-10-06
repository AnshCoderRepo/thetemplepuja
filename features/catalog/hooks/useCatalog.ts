"use client";

import { useEffect, useState } from "react";
import {
  coupons as staticCoupons,
  defaultFestivals as staticFestivals,
  defaultPoojaDates,
  defaultTemples as staticTemples,
  poojas as staticPoojas,
  type Coupon,
  type FestivalEvent,
  type Pooja,
  type PoojaDate,
  type Temple,
  type UpcomingEventSpec,
} from "@/lib/data";
import {
  fetchCatalog,
  getCatalogVersion,
  resetCatalogCache,
} from "../api/catalogApi";
import type { ResolvedCatalog } from "../types/catalog.types";

export interface CatalogState {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
  loaded: boolean;
}

export function useCatalog(): CatalogState {
  const [catalog, setCatalog] = useState<ResolvedCatalog | null>(null);
  const [catalogVersion, setCatalogVersion] = useState(() => getCatalogVersion());

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) setCatalog(c);
    });
    return () => {
      live = false;
    };
  }, [catalogVersion]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "ttp_catalog_version_v1") {
        resetCatalogCache();
        setCatalogVersion(Number(e.newValue) || Date.now());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        resetCatalogCache();
        setCatalogVersion(Date.now());
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const onCatalogUpdated = () => {
      resetCatalogCache();
      setCatalogVersion(getCatalogVersion() || Date.now());
    };
    window.addEventListener("catalog-updated", onCatalogUpdated);
    return () => window.removeEventListener("catalog-updated", onCatalogUpdated);
  }, []);

  return {
    poojas: catalog?.poojas ?? staticPoojas,
    events: catalog?.events ?? [],
    festivals: catalog?.festivals ?? staticFestivals,
    coupons: catalog?.coupons ?? staticCoupons,
    poojaDates: catalog?.poojaDates ?? defaultPoojaDates,
    temples: catalog?.temples ?? staticTemples,
    loaded: catalog !== null,
  };
}
