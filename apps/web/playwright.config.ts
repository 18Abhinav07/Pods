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
        env: {
          PODS_OPS_ACCESS_TOKEN: "pods-playwright-reviewer",
          PODS_OPS_SESSION_SECRET: "pods-playwright-session-secret",
          PODS_OPS_REVIEWER_ID: "pods-playwright-reviewer"
        },
        url: "http://127.0.0.1:3410",
        reuseExistingServer: false,
        timeout: 120_000
      }
});
