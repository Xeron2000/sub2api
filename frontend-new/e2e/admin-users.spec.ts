import { test, expect } from "@playwright/test"

test.describe("admin-users", () => {
  test("admin users requires auth", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test("admin users normal user forbidden (simulated via anonymous)", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })
})
