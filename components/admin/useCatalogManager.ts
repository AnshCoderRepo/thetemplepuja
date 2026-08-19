"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCatalog,
  resetCatalogSection,
  saveCatalogSection,
  type CatalogSection,
} from "@/lib/api";

interface UseCatalogManagerOptions<T> {
  /** The catalog section this manager controls. */
  section: CatalogSection;
  /** Selector to extract this section's data from the resolved catalog. */
  select: (catalog: Awaited<ReturnType<typeof fetchCatalog>>) => T[];
  /** Authentication token. */
  token: string;
  /** Called when the server returns 401. */
  onAuthError: () => void;
  /** Optional transform applied to a newly created item before saving. */
  onCreate?: (item: T) => T;
}

export interface CatalogManagerState<T> {
  list: T[];
  setList: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  error: string;
  setError: (msg: string) => void;
  save: (next: T[]) => Promise<boolean>;
  remove: (next: T[]) => Promise<boolean>;
  reset: () => Promise<void>;
}

/**
 * Shared CRUD hook for admin catalog managers. Handles:
 * - Fetching the initial list from the server
 * - Saving changes (with 401 detection)
 * - Resetting to defaults
 * - Error state management
 *
 * Each manager still owns its own draft/UI state — this hook only
 * manages the list, persistence and error handling.
 */
export function useCatalogManager<T>({
  section,
  select,
  token,
  onAuthError,
}: UseCatalogManagerOptions<T>): CatalogManagerState<T> {
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    fetchCatalog().then((c) => {
      if (live) {
        setList(select(c));
        setLoading(false);
      }
    });
    return () => {
      live = false;
    };
  }, [select]);

  /** Save the updated list to the server. Returns true on success. */
  const save = useCallback(
    async (next: T[]): Promise<boolean> => {
      const res = await saveCatalogSection(section, next, token);
      if (!res.ok) {
        if (res.status === 401) {
          onAuthError();
          return false;
        }
        setError(res.error ?? "Could not save changes.");
        return false;
      }
      setList(next);
      setError("");
      return true;
    },
    [section, token, onAuthError]
  );

  /** Convenience wrapper: save a filtered list (for delete operations). */
  const remove = useCallback(
    async (next: T[]): Promise<boolean> => save(next),
    [save]
  );

  /** Reset the section to the server defaults. */
  const reset = useCallback(async () => {
    if (
      !window.confirm(
        `Reset ${section} to the default list? Any admin changes will be lost.`
      )
    ) {
      return;
    }
    const res = await resetCatalogSection(section, token);
    if (!res.ok) {
      if (res.status === 401) {
        onAuthError();
        return;
      }
      setError(res.error ?? "Could not reset.");
      return;
    }
    const c = await fetchCatalog();
    setList(select(c));
    setError("");
  }, [section, token, onAuthError, select]);

  return { list, setList, loading, error, setError, save, remove, reset };
}
