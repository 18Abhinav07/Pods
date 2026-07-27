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
        command: "corepack pnpm start --hostname 127.0.0.1 --port 3410",
        env: {
          APP_ENV: "local",
          NIMIQ_NETWORK: "testnet",
          PODS_TREASURY_ADDRESS:
            process.env.PODS_TREASURY_ADDRESS ??
            "NQ38 PLXF NXKJ LFGA TRDP VRA8 F810 2BKN N4X6",
          PODS_MODERATION_ENABLED: "true",
          PODS_PUBLIC_VISITOR_ROOMS_ENABLED: "true"
        },
        url: "http://127.0.0.1:3410",
        reuseExistingServer: false,
        timeout: 120_000
      }
});
