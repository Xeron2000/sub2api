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
    await page.goto("/usage")
    await expect(page).toHaveURL(/\/login/)
    const bodyText = await page.locator("body").innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
  })

  test("key-usage is public (no redirect)", async ({ page }) => {
    await ensureLoggedOut(page)
    await page.goto("/key-usage")
    // key-usage is public — should NOT redirect to login
    await expect(page.locator("body")).toBeVisible()
    const bodyText = await page.locator("body").innerText()
    expect(bodyText.trim().length).toBeGreaterThan(0)
    expect(page.url()).toContain("/key-usage")
  })
})
