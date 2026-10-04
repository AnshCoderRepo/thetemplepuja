"use client";

import { useEffect, useState } from "react";
import {
  coupons as staticCoupons,
  defaultFestivals as staticFestivals,
  defaultPoojaDates,
  poojas as staticPoojas,
  type Coupon,
  type FestivalEvent,
  type Pooja,
  type PoojaDate,
  type UpcomingEventSpec,
} from "@/lib/data";
import {
  fetchCatalog,
  getCatalogVersion,
} from "../api/catalogApi";
import type { ResolvedCatalog } from "../types/catalog.types";

export interface CatalogState {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
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
        setCatalogVersion(Number(e.newValue) || 0);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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

  useEffect(() => {
    const onCatalogUpdated = () => setCatalogVersion(getCatalogVersion());
    window.addEventListener("catalog-updated", onCatalogUpdated);
    return () => window.removeEventListener("catalog-updated", onCatalogUpdated);
  }, []);

  return {
    poojas: catalog?.poojas ?? staticPoojas,
    events: catalog?.events ?? [],
    festivals: catalog?.festivals ?? staticFestivals,
    coupons: catalog?.coupons ?? staticCoupons,
    poojaDates: catalog?.poojaDates ?? defaultPoojaDates,
    loaded: catalog !== null,
  };
}
