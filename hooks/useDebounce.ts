"use client";

import { useEffect, useState } from "react";

/**
 * Debounces a value by `delay` ms. The returned value only updates after
 * the input has been stable for the specified duration.
 *
 * ```tsx
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 * // debouncedQuery updates 300ms after the user stops typing
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
