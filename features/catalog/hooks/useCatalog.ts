"use client";

import { useEffect, useState } from "react";
import {
  coupons as staticCoupons,
  defaultFestivals as staticFestivals,
  defaultPoojaDates,
  defaultTemples as staticTemples,
  poojas as staticPoojas,
  testimonials as staticTestimonials,
  type Coupon,
  type FestivalEvent,
  type Pooja,
  type PoojaDate,
  type Temple,
  type UpcomingEventSpec,
  type Testimonial,
} from "@/lib/data";
import {
  clearCatalogMemoryCache,
  fetchCatalog,
  getCatalogVersion,
  resetCatalogCache,
} from "../api/catalogApi";
import type { ResolvedCatalog } from "../types/catalog.types";

import type { PlatformSettings } from "@/lib/chatbot-types";

export interface CatalogState {
  poojas: Pooja[];
  events: UpcomingEventSpec[];
  festivals: FestivalEvent[];
  coupons: Record<string, Coupon>;
  poojaDates: PoojaDate[];
  temples: Temple[];
  platformSettings?: PlatformSettings;
  testimonials: Testimonial[];
  loaded: boolean;
}

// Module-level shared singleton state to eliminate duplicate network requests and re-render cascading
let globalCatalog: ResolvedCatalog | null = null;
let globalVersion = 0;
let isFetching = false;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((fn) => fn());
}

function loadCatalog() {
  if (isFetching) return;
  isFetching = true;
  fetchCatalog()
    .then((c) => {
      globalCatalog = c;
      notifySubscribers();
    })
    .finally(() => {
      isFetching = false;
    });
}

// Global listeners attached only once per browser session
if (typeof window !== "undefined") {
  globalVersion = getCatalogVersion();

  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key === "ttp_catalog_version_v1") {
      clearCatalogMemoryCache();
      globalCatalog = null;
      globalVersion = Number(e.newValue) || Date.now();
      loadCatalog();
    }
  });

  window.addEventListener("catalog-updated", (e: Event) => {
    const customVer = (e as CustomEvent<{ version?: number }>).detail?.version;
    clearCatalogMemoryCache();
    globalCatalog = null;
    globalVersion = customVer || getCatalogVersion() || Date.now();
    loadCatalog();
  });
}

export function useCatalog(): CatalogState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const onStoreUpdate = () => {
      setTick((t) => t + 1);
    };
    subscribers.add(onStoreUpdate);

    if (!globalCatalog) {
      loadCatalog();
    }

    return () => {
      subscribers.delete(onStoreUpdate);
    };
  }, []);

  const catalog = globalCatalog;

  return {
    poojas: catalog?.poojas ?? staticPoojas,
    events: catalog?.events ?? [],
    festivals: catalog?.festivals ?? staticFestivals,
    coupons: catalog?.coupons ?? staticCoupons,
    poojaDates: catalog?.poojaDates ?? defaultPoojaDates,
    temples: catalog?.temples ?? staticTemples,
    platformSettings: catalog?.platformSettings,
    testimonials: catalog?.testimonials ?? staticTestimonials,
    loaded: catalog !== null,
  };
}
