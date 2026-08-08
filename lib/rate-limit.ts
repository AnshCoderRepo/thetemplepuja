// In-memory rate limiter for admin login — counts failed attempts per key
// (client IP) over a sliding window and blocks further attempts once the limit
// is hit. Server-only. A factory keeps it unit-testable with a fake clock.
export interface RateLimiter {
  /** True when the key may try again (not currently blocked). */
  allowed(key: string): boolean;
  /** Record a failed attempt; returns remaining attempts before lockout. */
  hit(key: string): number;
  /** Clear the failed-attempt count (call on a successful login). */
  clear(key: string): void;
  /** Seconds until the current block expires, if blocked, else 0. */
  retryAfterSec(key: string): number;
}

export interface RateLimiterOptions {
  limit?: number;
  windowMs?: number;
  now?: () => number;
}

export function createRateLimiter({
  limit = 5,
  windowMs = 15 * 60 * 1000, // 15 minutes
  now = Date.now,
}: RateLimiterOptions = {}): RateLimiter {
  const buckets = new Map<string, { count: number; windowStart: number }>();

  function prune(key: string): { count: number; windowStart: number } {
    const t = now();
    const entry = buckets.get(key);
    if (!entry || t - entry.windowStart >= windowMs) {
      const fresh = { count: 0, windowStart: t };
      buckets.set(key, fresh);
      return fresh;
    }
    return entry;
  }

  return {
    allowed(key) {
      return prune(key).count < limit;
    },
    hit(key) {
      const entry = prune(key);
      entry.count += 1;
      return Math.max(0, limit - entry.count);
    },
    clear(key) {
      buckets.delete(key);
    },
    retryAfterSec(key) {
      const entry = buckets.get(key);
      if (!entry || entry.count < limit) return 0;
      const t = now();
      const remaining = windowMs - (t - entry.windowStart);
      return Math.max(1, Math.ceil(remaining / 1000));
    },
  };
}

// Shared limiter used by the login route (5 failed attempts / 15 min per IP).
export const loginRateLimiter = createRateLimiter();
