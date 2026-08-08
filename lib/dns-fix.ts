// DNS-over-HTTPS fallback for Node's built-in resolver.
//
// The mongodb driver resolves SRV/TXT records through Node's c-ares resolver
// (dns.promises.resolveSrv / resolveTxt). On some networks — corporate or
// ISP DNS that only answers the OS stub resolver — c-ares gets ECONNREFUSED
// while `nslookup` and OS-level lookups (dns.lookup) work fine. That kills
// mongodb+srv:// connections even though the network path is healthy.
//
// This module patches those lookup functions to try the native resolver first
// and, only when it fails with a resolver-unreachable error, re-query through
// DNS-over-HTTPS (Google, falling back to Cloudflare). OS-level lookups
// (dns.lookup) are untouched — they already work and are used for the actual
// TCP/TLS connections.
//
// Server-only. Importing this has no effect unless MONGODB_URI is set. The
// internals are exported so the fallback logic can be unit-tested without
// mutating the global dns module.

const FALLBACK_ERRORS = new Set([
  "ECONNREFUSED",
  "ETIMEOUT",
  "EAI_AGAIN",
  "ENETUNREACH",
  "EHOSTUNREACH",
]);

export type DoHType = "SRV" | "TXT" | "A" | "AAAA";

export interface DoHAnswer {
  name: string;
  type: number;
  data: string;
}

interface DoHResponse {
  Status: number; // 0 = success, 3 = NXDOMAIN
  Answer?: DoHAnswer[];
}

const DOH_ENDPOINTS = [
  "https://dns.google/resolve",
  "https://cloudflare-dns.com/dns-query",
];

// Tiny TTL cache so a healthy session doesn't hammer DoH on every connect.
const cache = new Map<string, { at: number; answers: DoHAnswer[] }>();
const CACHE_TTL_MS = 60_000;

/** Translate raw DoH answers into the shape `dns.resolve(name, rrtype)`
 * returns for SRV / TXT / A / AAAA. Other record types yield []. */
export function translateAnswers(
  type: DoHType,
  answers: DoHAnswer[]
): unknown {
  switch (type) {
    case "SRV":
      return answers
        .filter((a) => a.type === 33)
        .map((a) => {
          const [priority, weight, port, host] = a.data.split(/\s+/);
          return {
            priority: Number(priority) || 0,
            weight: Number(weight) || 0,
            port: Number(port) || 27017,
            name: host.replace(/\.$/, ""),
          };
        });
    case "TXT":
      return answers.filter((a) => a.type === 16).map((a) => [a.data]);
    case "A":
      return answers.filter((a) => a.type === 1).map((a) => a.data);
    case "AAAA":
      return answers.filter((a) => a.type === 28).map((a) => a.data);
    default:
      return [];
  }
}

/** Query a DoH endpoint (Google first, Cloudflare second) for one record type.
 * NXDOMAIN or a total failure yields []. A fetcher can be injected for tests. */
export async function dohQuery(
  name: string,
  type: DoHType,
  fetcher: typeof fetch = fetch
): Promise<DoHAnswer[]> {
  const key = `${type}:${name}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.answers;

  let answers: DoHAnswer[] | null = null;
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const params = new URLSearchParams({ name, type });
      const res = await fetcher(`${endpoint}?${params}`, {
        headers: { accept: "application/dns-json" },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) continue;
      const body = (await res.json()) as DoHResponse;
      if (body.Status === 0 && Array.isArray(body.Answer)) {
        answers = body.Answer;
        break;
      }
      if (body.Status !== 0) break; // NXDOMAIN etc. — no point asking the next
    } catch {
      // try the next endpoint
    }
  }
  if (!answers) answers = [];
  cache.set(key, { at: Date.now(), answers });
  return answers;
}

/** True when the error means "resolver unreachable" (fallback eligible) rather
 * than a legitimate answer like NXDOMAIN. */
export function isFallbackError(err: unknown): boolean {
  const code = (err as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" && FALLBACK_ERRORS.has(code);
}

/** Return the native function wrapped with a DoH fallback. */
function withDohFallback<T>(
  native: (...args: any[]) => Promise<T>,
  type: DoHType,
  translate: (answers: DoHAnswer[]) => T
): (...args: any[]) => Promise<T> {
  return async (...args: unknown[]) => {
    try {
      return await native(...args);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      return translate(await dohQuery(String(args[0]), type));
    }
  };
}

let patched = false;

/** Apply the DoH fallback to dns.promises resolution. Idempotent, and a no-op
 * unless MONGODB_URI is set (the only case where Mongo needs it). */
export function ensureDnsPatch(): void {
  if (patched) return;
  if (!process.env.MONGODB_URI) return; // only matters when Mongo is in play
  patched = true;

  const dns = require("dns") as typeof import("dns");
  const promises = dns.promises;

  // Specific resolvers (used by some drivers / code paths).
  const resolveSrv = promises.resolveSrv;
  promises.resolveSrv = withDohFallback(
    resolveSrv,
    "SRV",
    (answers) => translateAnswers("SRV", answers) as any
  ) as typeof resolveSrv;

  const resolveTxt = promises.resolveTxt;
  promises.resolveTxt = withDohFallback(
    resolveTxt,
    "TXT",
    (answers) => translateAnswers("TXT", answers) as any
  ) as typeof resolveTxt;

  for (const type of ["resolve4", "resolve6"] as const) {
    const native = promises[type];
    promises[type] = withDohFallback(
      native,
      type === "resolve4" ? "A" : "AAAA",
      (answers) => translateAnswers(type === "resolve4" ? "A" : "AAAA", answers) as any
    ) as typeof native;
  }

  // THE critical one: the mongodb driver calls the generic
  // `dns.promises.resolve(host, 'SRV')` / `('TXT')`, and Node's internal
  // `resolve` dispatches to module-internal closures — so patching the
  // specific resolvers above never intercepts it. Patch `resolve` itself.
  const resolveGeneric = promises.resolve;
  promises.resolve = (async (
    name: string,
    rrtype: string = "A"
  ): Promise<unknown> => {
    try {
      return await resolveGeneric(name, rrtype);
    } catch (err) {
      if (!isFallbackError(err)) throw err;
      const type = rrtype.toUpperCase() as DoHType;
      if (!["SRV", "TXT", "A", "AAAA"].includes(type)) throw err; // can't answer
      return translateAnswers(type, await dohQuery(name, type));
    }
  }) as typeof resolveGeneric;

  // Callback-style variants delegate to the patched promise versions, so any
  // consumer using dns.resolveSrv(cb) gets the same fallback.
  const wrapCallback =
    (fn: (...args: any[]) => Promise<any>) =>
    (...args: any[]) => {
      const cb = args.pop();
      fn(...args).then(
        (r) => cb(null, r),
        (e) => cb(e)
      );
    };
  dns.resolveSrv = wrapCallback(promises.resolveSrv) as typeof dns.resolveSrv;
  dns.resolveTxt = wrapCallback(promises.resolveTxt) as typeof dns.resolveTxt;
  dns.resolve4 = wrapCallback(promises.resolve4) as typeof dns.resolve4;
  dns.resolve6 = wrapCallback(promises.resolve6) as typeof dns.resolve6;
  dns.resolve = wrapCallback(promises.resolve) as typeof dns.resolve;
}
