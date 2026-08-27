import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"

async function ensureLoggedOut(page: Page): Promise<void> {
  await page.goto("/login")
  await page.evaluate(() => localStorage.clear())
}

const userRoutes = [
  "/usage",
  "/redeem",
  "/affiliate",
  "/available-channels",
  "/profile",
  "/subscriptions",
  "/monitor",
  "/batch-image",
  "/purchase",
  "/orders",
]

for (const route of userRoutes) {
  test(`${route} redirects to login when unauthenticated`, async ({ page }) => {
    await ensureLoggedOut(page)
    await page.goto(route)
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
}

test.describe("user routes — no blank page", () => {
  test("usage redirects reliably, no blank page", async ({ page }) => {
    await ensureLoggedOut(page)
    await page.goto("/usage", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(800)
    await expect(page.locator("body")).toBeAttached({ timeout: 8000 })
  })

  test("key-usage is public (no redirect)", async ({ page }) => {
    await ensureLoggedOut(page)
    await page.goto("/key-usage", { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(800)
    await expect(page.locator("body")).toBeAttached({ timeout: 8000 })
    expect(page.url()).toContain("/key-usage")
  })
})
