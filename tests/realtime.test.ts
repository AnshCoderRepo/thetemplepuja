import { describe, expect, it, vi } from "vitest";
import {
  broadcastRealtime,
  getActiveRealtimeCount,
  getRealtimeVersion,
  subscribeRealtime,
  type RealtimeEvent,
} from "../lib/realtime";
import { GET } from "../app/api/realtime/route";
import { NextRequest } from "next/server";

describe("realtime event bus (lib/realtime)", () => {
  it("tracks monotonic version and notifies subscribers on broadcast", () => {
    const v1 = getRealtimeVersion();
    expect(typeof v1).toBe("number");
    expect(v1).toBeGreaterThan(0);

    const received: RealtimeEvent[] = [];
    const unsubscribe = subscribeRealtime((event) => {
      received.push(event);
    });

    const broadcasted = broadcastRealtime({
      type: "catalog_updated",
      section: "poojas",
    });

    expect(broadcasted.type).toBe("catalog_updated");
    expect(broadcasted.section).toBe("poojas");
    expect(broadcasted.version).toBeGreaterThanOrEqual(v1);
    expect(received.length).toBe(1);
    expect(received[0].version).toBe(broadcasted.version);

    unsubscribe();

    // After unsubscribe, no further events should be received
    broadcastRealtime({ type: "devotee_updated", target: "9876543210" });
    expect(received.length).toBe(1);
  });

  it("handles failing subscribers gracefully without breaking others", () => {
    const errorSubscriber = vi.fn().mockImplementation(() => {
      throw new Error("subscriber crashed");
    });
    const goodSubscriber = vi.fn();

    const unsubError = subscribeRealtime(errorSubscriber);
    const unsubGood = subscribeRealtime(goodSubscriber);

    expect(() => {
      broadcastRealtime({ type: "catalog_updated", section: "temples" });
    }).not.toThrow();

    expect(errorSubscriber).toHaveBeenCalled();
    expect(goodSubscriber).toHaveBeenCalled();

    unsubError();
    unsubGood();
  });
});

describe("GET /api/realtime route handler", () => {
  it("returns JSON version payload when mode=version is provided", async () => {
    const req = new NextRequest("http://localhost:3000/api/realtime?mode=version");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");

    const data = await res.json();
    expect(typeof data.version).toBe("number");
    expect(typeof data.timestamp).toBe("number");
    expect(typeof data.connections).toBe("number");
  });

  it("establishes SSE stream and emits initial handshake", async () => {
    const req = new NextRequest("http://localhost:3000/api/realtime");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain("data: ");
      expect(text).toContain('"type":"init"');
      reader.cancel();
    }
  });
});
