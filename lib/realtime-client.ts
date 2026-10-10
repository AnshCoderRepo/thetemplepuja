"use client";

// Client-side real-time synchronization client.
// Establishes a persistent SSE connection to /api/realtime so any changes made by
// the admin (poojas, prices, dates, festivals, media, refunds) are instantly pushed
// to all open user tabs and devices within milliseconds. Also includes resilient
// polling fallback for uninterrupted sync under any network condition.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  bumpCatalogVersion,
  clearCatalogMemoryCache,
  getCatalogVersion,
} from "./api";

let activeEventSource: EventSource | null = null;
let currentKnownVersion = 0;
let isConnected = false;
let lastSyncTimestamp: number | null = null;
let listenersBound = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const statusSubscribers = new Set<(status: { connected: boolean; version: number }) => void>();

function notifyStatusSubscribers() {
  const payload = { connected: isConnected, version: currentKnownVersion };
  for (const sub of Array.from(statusSubscribers)) {
    try {
      sub(payload);
    } catch {
      // ignore
    }
  }
}

/** Handle an incoming update event from the backend. */
function handleCatalogUpdate(version: number, section?: string) {
  if (version && version > currentKnownVersion) {
    currentKnownVersion = version;
    lastSyncTimestamp = Date.now();
    clearCatalogMemoryCache();
    bumpCatalogVersion(version);
    notifyStatusSubscribers();
  }
}

function handleDevoteeUpdate(target?: string, version?: number) {
  if (version && version > currentKnownVersion) {
    currentKnownVersion = version;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("devotee-updated", {
        detail: { target, version: version || Date.now() },
      })
    );
  }
  notifyStatusSubscribers();
}

/** Check server version via lightweight fetch (smart fallback if SSE interrupted). */
async function checkServerVersionFallback() {
  if (typeof window === "undefined" || document.visibilityState === "hidden") return;
  try {
    const res = await fetch("/api/realtime?mode=version", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;
    const data = (await res.json()) as { version?: number };
    if (data.version && data.version > currentKnownVersion) {
      handleCatalogUpdate(data.version);
    }
  } catch {
    // Offline or server temporarily busy — will retry next tick
  }
}

/** Start the real-time sync service in the browser (idempotent). */
export function startRealtimeSync(): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  currentKnownVersion = Math.max(currentKnownVersion, getCatalogVersion());

  if (!listenersBound) {
    listenersBound = true;

    // Visibility change check: pull latest immediately when user brings tab to front
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void checkServerVersionFallback();
      }
    });

    // Window focus check
    window.addEventListener("focus", () => {
      void checkServerVersionFallback();
    });
  }

  // Connect SSE if not already connected
  if (!activeEventSource) {
    try {
      const es = new EventSource("/api/realtime");
      activeEventSource = es;

      es.onopen = () => {
        isConnected = true;
        notifyStatusSubscribers();
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as {
            type: string;
            version: number;
            section?: string;
            target?: string;
          };

          if (data.type === "init") {
            if (data.version && data.version > currentKnownVersion) {
              handleCatalogUpdate(data.version, "init");
            } else if (data.version) {
              currentKnownVersion = data.version;
            }
            isConnected = true;
            notifyStatusSubscribers();
          } else if (data.type === "catalog_updated") {
            handleCatalogUpdate(data.version, data.section);
          } else if (data.type === "devotee_updated") {
            handleDevoteeUpdate(data.target, data.version);
          }
        } catch {
          // ignore malformed message or comment
        }
      };

      es.onerror = () => {
        isConnected = false;
        notifyStatusSubscribers();
        // EventSource auto-reconnects, but fallback poll guarantees continuity
      };
    } catch {
      isConnected = false;
    }
  }

  // Fallback poll every 6 seconds
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      void checkServerVersionFallback();
    }, 6000);
  }

  return () => {
    // Cleanup if needed
  };
}

/** React hook mounted in providers to keep the entire user frontend live. */
export function useRealtimeSync(): {
  connected: boolean;
  version: number;
} {
  const router = useRouter();
  const [status, setStatus] = useState(() => ({
    connected: isConnected,
    version: currentKnownVersion,
  }));

  useEffect(() => {
    const cleanup = startRealtimeSync();

    const onStatusChange = (newStatus: { connected: boolean; version: number }) => {
      setStatus(newStatus);
    };
    statusSubscribers.add(onStatusChange);

    // Refresh Server Component layout/data in background whenever catalog updates
    const onCatalogUpdated = () => {
      try {
        router.refresh();
      } catch {
        // Safe fallback
      }
    };
    window.addEventListener("catalog-updated", onCatalogUpdated);

    return () => {
      statusSubscribers.delete(onStatusChange);
      window.removeEventListener("catalog-updated", onCatalogUpdated);
      cleanup();
    };
  }, [router]);

  return status;
}

/** Hook to observe live sync connection status (used in Admin status indicators). */
export function useRealtimeStatus(): {
  connected: boolean;
  version: number;
  lastSync: number | null;
} {
  const [status, setStatus] = useState(() => ({
    connected: isConnected,
    version: currentKnownVersion,
    lastSync: lastSyncTimestamp,
  }));

  useEffect(() => {
    startRealtimeSync();
    const onStatusChange = (newStatus: { connected: boolean; version: number }) => {
      setStatus({
        connected: newStatus.connected,
        version: newStatus.version,
        lastSync: lastSyncTimestamp,
      });
    };
    statusSubscribers.add(onStatusChange);
    return () => {
      statusSubscribers.delete(onStatusChange);
    };
  }, []);

  return status;
}
