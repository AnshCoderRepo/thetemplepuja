import { NextRequest, NextResponse } from "next/server";
import {
  broadcastRealtime,
  getActiveRealtimeCount,
  getRealtimeVersion,
  subscribeRealtime,
  type RealtimeEvent,
} from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Quick JSON version query (for smart fallback polling & diagnostic checks)
  if (
    url.searchParams.get("mode") === "version" ||
    req.headers.get("accept")?.includes("application/json")
  ) {
    return NextResponse.json(
      {
        version: getRealtimeVersion(),
        timestamp: Date.now(),
        connections: getActiveRealtimeCount(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  // Server-Sent Events (SSE) Stream
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const push = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed by client
        }
      };

      const sendEvent = (event: RealtimeEvent) => {
        push(`data: ${JSON.stringify(event)}\n\n`);
      };

      // 1. Initial Handshake on connection
      sendEvent({
        type: "init",
        version: getRealtimeVersion(),
        timestamp: Date.now(),
      });

      // 2. Subscribe to server broadcasts
      unsubscribe = subscribeRealtime((event) => {
        sendEvent(event);
      });

      // 3. Keepalive ping every 20s to prevent gateway / proxy / browser timeouts
      heartbeatTimer = setInterval(() => {
        push(`: ping ${Date.now()}\n\n`);
      }, 20000);
    },
    cancel() {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (unsubscribe) unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
