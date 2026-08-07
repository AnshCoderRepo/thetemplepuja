// Node has no `window`, but lib/storage.ts reads window.localStorage /
// sessionStorage (guarding on `typeof window === "undefined"` for SSR).
// Provide minimal in-memory stand-ins so the storage layer can be unit-tested
// in vitest's node environment without pulling in jsdom or a real browser.
const memory = new Map<string, string>();
const session = new Map<string, string>();

function makeStorage(map: Map<string, string>): Storage {
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

(globalThis as { window?: unknown }).window = {
  localStorage: makeStorage(memory),
  sessionStorage: makeStorage(session),
};
