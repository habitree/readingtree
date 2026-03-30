import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 3,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "https://readingtree-tan.vercel.app",
    trace: "off",
    screenshot: "off", // 수동으로 캡처
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
  ],
  reporter: [
    ["list"],
    ["json", { outputFile: "../results/playwright-results.json" }],
  ],
});
