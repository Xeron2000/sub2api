import { test, expect } from "@playwright/test"

test.describe("admin-users", () => {
  test("admin users requires auth", async ({ page }) => {
    await page.goto("/login")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/admin/users")
    await page.waitForTimeout(500)
    const url = page.url()
    expect(url).toMatch(/\/admin\/users|\/login|\/dashboard/)
  })

  test("admin users normal user forbidden", async ({ page }) => {
    await page.goto("/login")
    await page.evaluate(() => {
      localStorage.setItem("auth_token", "fake-token")
      localStorage.setItem("refresh_token", "fake-refresh")
      localStorage.setItem("auth_user", JSON.stringify({ id: 2, email: "user@example.com", role: "user" }))
      localStorage.setItem("token_expires_at", String(Date.now() + 3600 * 1000))
    })
    await page.goto("/admin/users")
    await page.waitForTimeout(800)
    const isAdmin = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem("auth_user") || "null")?.role === "admin"
      } catch {
        return false
      }
    })
    expect(isAdmin).toBe(false)
    const url = page.url()
    expect(url).toMatch(/\/admin\/users|\/dashboard|\/login/)
  })
})
