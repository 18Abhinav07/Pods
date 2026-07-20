import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
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
    baseURL: externalBaseUrl ?? "http://127.0.0.1:3410",
    trace: "retain-on-failure"
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "corepack pnpm dev --hostname 127.0.0.1 --port 3410",
        url: "http://127.0.0.1:3410",
        reuseExistingServer: false,
        timeout: 120_000
      }
});
