// Real-time broadcast and synchronization bus between admin backend and user frontend.
// Enables changes made in admin (poojas, pricing, dates, festivals, temples, coupons,
// bookings, media) to be instantly pushed to all connected user browsers via SSE.

export interface RealtimeEvent {
  type: "catalog_updated" | "devotee_updated" | "init" | "ping";
  version: number;
  section?: string;
  target?: string;
  timestamp: number;
}

type RealtimeSubscriber = (event: RealtimeEvent) => void;

interface RealtimeStore {
  version: number;
  subscribers: Set<RealtimeSubscriber>;
}

// Preserve subscribers and version across Next.js dev re-evaluations (HMR)
const globalStore = (globalThis as unknown as { __ttp_realtime__?: RealtimeStore });
if (!globalStore.__ttp_realtime__) {
  globalStore.__ttp_realtime__ = {
    version: Date.now(),
    subscribers: new Set(),
  };
}

const store: RealtimeStore = globalStore.__ttp_realtime__;

/** Get the latest monotonic server state version. */
export function getRealtimeVersion(): number {
  return store.version;
}

/** Subscribe to live server events (used by SSE stream controller). */
export function subscribeRealtime(fn: RealtimeSubscriber): () => void {
  store.subscribers.add(fn);
  return () => {
    store.subscribers.delete(fn);
  };
}

/** Broadcast an event to all connected clients and bump server version. */
export function broadcastRealtime(
  event: Omit<RealtimeEvent, "version" | "timestamp">
): RealtimeEvent {
  store.version = Date.now();
  const fullEvent: RealtimeEvent = {
    ...event,
    version: store.version,
    timestamp: Date.now(),
  };

  for (const subscriber of Array.from(store.subscribers)) {
    try {
      subscriber(fullEvent);
    } catch {
      // subscriber disconnected or faulted
    }
  }

  return fullEvent;
}

/** Count of active live subscribers (for diagnostics). */
export function getActiveRealtimeCount(): number {
  return store.subscribers.size;
}
