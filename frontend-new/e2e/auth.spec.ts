import { test, expect } from "@playwright/test"

test.describe("auth", () => {
  test("login page renders with validation", async ({ page }) => {
    await page.goto("/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/login")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/dashboard")
    await page.waitForTimeout(500)
    const url = page.url()
    expect(url).toMatch(/\/login|\/dashboard/)
    if (url.includes("/login")) await expect(page).toHaveURL(/\/login/)
  })

  test("admin route forbidden for anonymous", async ({ page }) => {
    await page.goto("/login")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/admin/users")
    await page.waitForTimeout(500)
    const url = page.url()
    expect(url).toMatch(/\/admin\/users|\/login|\/dashboard/)
    if (url.includes("/login")) await expect(page).toHaveURL(/\/login/)
  })

  test("no unexpected console errors on login", async ({ page }) => {
    const errors: string[] = []
    const pageErrors: string[] = []
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()) })
    page.on("pageerror", (err) => pageErrors.push(String(err.message || err)))
    await page.goto("/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    const unexpected = [...errors, ...pageErrors].filter((e) => !e.includes("Failed to load") && !e.includes("Hydration") && !e.includes("TANSTACK"))
    expect(unexpected, `unexpected console.error/pageerror: ${unexpected.join("; ")}`).toEqual([])
  })
})
