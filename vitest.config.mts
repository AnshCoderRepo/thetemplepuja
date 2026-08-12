import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    // Importing the server-store chain (mongodb driver + bcryptjs) takes 3–5s
    // on a cold/loaded machine; the default 10s hook budget is flaky in CI.
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
