import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./__tests__/setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/.claude/worktrees/**",
      "**/dist/**",
      "**/doc/qa-inspection/**", // Playwright e2e (test.beforeEach with page param)
    ],
    coverage: {
      provider: "v8",
    },
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
