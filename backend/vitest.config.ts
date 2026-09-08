import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// SECTION: Test-runner configuration
// `tsconfig.json` resolves the `@/*` alias for the type checker. Vitest
// uses its own resolver and needs the same alias or any import
// `@/lib/http` from a route file fails at runtime. Mirrors the second
// reference backend's `vitest.config.ts` pattern.
const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(here, "src")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
// End of section: alias mirrors tsconfig.json's paths mapping; both
// tsc and Vitest now agree on the meaning of `@/...`.