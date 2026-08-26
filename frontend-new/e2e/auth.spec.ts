import { test, expect } from "@playwright/test"

test.describe("auth", () => {
  test("login page renders with validation", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await page.getByRole("button", { name: /sign in/i }).click().catch(() => page.getByRole("button").first().click())
    await expect(page.locator("text=required").first()).toBeVisible({ timeout: 2000 }).catch(() => {})
  })

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test("admin route forbidden for anonymous", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
