import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  projects: [
    {
      name: "mobile-safari",
      use: devices["iPhone 13"]
    },
    {
      name: "android-chromium",
      use: devices["Galaxy S9+"]
    }
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3410",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "corepack pnpm dev --hostname 127.0.0.1 --port 3410",
    url: "http://127.0.0.1:3410",
    reuseExistingServer: false,
    timeout: 120_000
  }
});
