import { test, expect } from "@playwright/test"

test.describe("keys", () => {
  test("keys page redirects when unauthenticated", async ({ page }) => {
    await page.goto("/keys")
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
  })

  test("login page has no console errors", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })
    await page.goto("/login")
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
    expect(errors.length).toBe(0)
  })
})
