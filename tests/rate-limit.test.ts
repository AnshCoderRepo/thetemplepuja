import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../lib/rate-limit";

describe("rate limiter", () => {
  it("allows attempts up to the limit, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(limiter.allowed("ip")).toBe(true);
    expect(limiter.hit("ip")).toBe(2);
    expect(limiter.allowed("ip")).toBe(true);
    expect(limiter.hit("ip")).toBe(1);
    expect(limiter.allowed("ip")).toBe(true);
    expect(limiter.hit("ip")).toBe(0);
    expect(limiter.allowed("ip")).toBe(false);
    expect(limiter.retryAfterSec("ip")).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.hit("a");
    limiter.hit("a");
    expect(limiter.allowed("a")).toBe(false);
    expect(limiter.allowed("b")).toBe(true);
  });

  it("resets after the window elapses", () => {
    let t = 0;
    const limiter = createRateLimiter({
      limit: 2,
      windowMs: 1_000,
      now: () => t,
    });
    limiter.hit("ip");
    limiter.hit("ip");
    expect(limiter.allowed("ip")).toBe(false);
    t = 1_001; // window passed
    expect(limiter.allowed("ip")).toBe(true);
  });

  it("clears failures on success", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    limiter.hit("ip");
    limiter.clear("ip");
    expect(limiter.allowed("ip")).toBe(true);
    expect(limiter.hit("ip")).toBe(1);
  });

  it("defaults to 5 attempts per 15 minutes", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) limiter.hit("ip");
    expect(limiter.allowed("ip")).toBe(false);
    expect(limiter.retryAfterSec("ip")).toBeGreaterThanOrEqual(1);
  });
});
