"use client";

import { useRealtimeSync } from "@/lib/realtime-client";

export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  // Mount the live realtime SSE connection to keep the user frontend updated instantly on admin changes
  useRealtimeSync();
  return <>{children}</>;
}
