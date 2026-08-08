import { describe, expect, it, vi } from "vitest";
import {
  dohQuery,
  ensureDnsPatch,
  isFallbackError,
  translateAnswers,
  type DoHAnswer,
} from "../lib/dns-fix";

const srvAnswer: DoHAnswer = {
  name: "_mongodb._tcp.mandatory.xubkptl.mongodb.net.",
  type: 33,
  data: "0 0 27017 ac-xiryd7z-shard-00-00.xubkptl.mongodb.net.",
};

describe("translateAnswers", () => {
  it("maps SRV answers to dns.resolveSrv records", () => {
    const out = translateAnswers("SRV", [srvAnswer]) as {
      priority: number;
      weight: number;
      port: number;
      name: string;
    }[];
    expect(out).toEqual([
      {
        priority: 0,
        weight: 0,
        port: 27017,
        name: "ac-xiryd7z-shard-00-00.xubkptl.mongodb.net",
      },
    ]);
  });

  it("maps TXT answers to string arrays (dns.resolveTxt shape)", () => {
    const out = translateAnswers("TXT", [
      { name: "x.mongodb.net", type: 16, data: "authSource=admin" },
    ]) as string[][];
    expect(out).toEqual([["authSource=admin"]]);
  });

  it("maps A and AAAA answers to IP strings", () => {
    expect(translateAnswers("A", [{ name: "h", type: 1, data: "1.2.3.4" }])).toEqual([
      "1.2.3.4",
    ]);
    expect(
      translateAnswers("AAAA", [{ name: "h", type: 28, data: "::1" }])
    ).toEqual(["::1"]);
  });

  it("ignores unrelated record types in the same response", () => {
    const out = translateAnswers("SRV", [
      { name: "x", type: 1, data: "9.9.9.9" },
      srvAnswer,
    ]) as unknown[];
    expect(out).toHaveLength(1);
  });
});

describe("dohQuery", () => {
  it("returns answers from the first endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ Status: 0, Answer: [srvAnswer] }),
        { status: 200 }
      )
    );
    const out = await dohQuery(
      "_mongodb._tcp.mandatory.xubkptl.mongodb.net",
      "SRV",
      fetcher as typeof fetch
    );
    expect(out).toEqual([srvAnswer]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0][0])).toContain("dns.google");
  });

  it("falls back to the second endpoint when the first fails", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ Status: 0, Answer: [srvAnswer] }), {
          status: 200,
        })
      );
    const out = await dohQuery("h", "SRV", fetcher as typeof fetch);
    expect(out).toEqual([srvAnswer]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(String(fetcher.mock.calls[1][0])).toContain("cloudflare-dns.com");
  });

  it("returns [] on NXDOMAIN and network failure", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ Status: 3 }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ Status: 3 }), { status: 200 })
      );
    expect(await dohQuery("nope.example", "A", fetcher as typeof fetch)).toEqual([]);

    const offline = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await dohQuery("nope.example", "A", offline as typeof fetch)).toEqual([]);
  });
});

describe("isFallbackError", () => {
  it("treats resolver-unreachable codes as fallback-eligible", () => {
    expect(isFallbackError(Object.assign(new Error("x"), { code: "ECONNREFUSED" }))).toBe(
      true
    );
    expect(isFallbackError(Object.assign(new Error("x"), { code: "ETIMEOUT" }))).toBe(
      true
    );
  });

  it("does not fall back on NXDOMAIN or unknown errors", () => {
    expect(isFallbackError(Object.assign(new Error("x"), { code: "ENOTFOUND" }))).toBe(
      false
    );
    expect(isFallbackError(new Error("boom"))).toBe(false);
    expect(isFallbackError(null)).toBe(false);
  });
});

describe("ensureDnsPatch", () => {
  it("is a no-op without MONGODB_URI", () => {
    const before = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    expect(() => ensureDnsPatch()).not.toThrow();
    if (before !== undefined) process.env.MONGODB_URI = before;
  });
});
