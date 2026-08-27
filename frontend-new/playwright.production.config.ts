import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:18080",
    trace: "on-first-retry",
  },
  // No webServer — expects external Go embed server already running.
  // Start it via: pnpm run test:e2e:production
  // which builds frontend -> backend/internal/web/dist and runs Go test server.
})
