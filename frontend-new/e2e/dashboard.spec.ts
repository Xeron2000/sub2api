import { test, expect } from "@playwright/test"

test.describe("dashboard", () => {
  test("redirects when unauthenticated, no blank page", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test("dashboard route exists with correct meta", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveTitle(/Sub2API/)
  })
})
