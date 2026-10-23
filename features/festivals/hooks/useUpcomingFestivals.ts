"use client";

import { useEffect, useState } from "react";
import {
  getUpcomingFestivals,
  type FestivalEvent,
  type FestivalStatus,
} from "@/lib/data";
import { useCatalog } from "@/features/catalog";

export interface UpcomingFestivalItem extends FestivalEvent {
  status: FestivalStatus;
}

export function useUpcomingFestivals(): {
  festivals: UpcomingFestivalItem[];
  activeFestival: UpcomingFestivalItem | null;
  loaded: boolean;
  hasFestivals: boolean;
} {
  const { festivals: catalogFestivals, loaded } = useCatalog();
  const [today] = useState<Date>(() => new Date());

  const upcoming = getUpcomingFestivals(today, catalogFestivals);

  return {
    festivals: upcoming,
    activeFestival: upcoming[0] || null,
    loaded,
    hasFestivals: upcoming.length > 0,
  };
}
