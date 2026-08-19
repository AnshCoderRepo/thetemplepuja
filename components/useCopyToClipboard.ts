"use client";

import { useCallback, useState } from "react";

/**
 * Copy text to the clipboard and track a "copied" feedback state.
 *
 * ```tsx
 * const { copied, copy } = useCopyToClipboard(2000);
 * <button onClick={() => copy("text")}>
 *   {copied ? "Copied!" : "Copy"}
 * </button>
 * ```
 */
export function useCopyToClipboard(feedbackMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), feedbackMs);
      } catch {
        // Clipboard API unavailable (e.g. insecure context) — silent fail
      }
    },
    [feedbackMs]
  );

  return { copied, copy };
}
