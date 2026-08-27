import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  use: {
    baseURL: "http://localhost:18788",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:18788",
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
