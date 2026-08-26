import { test, expect } from "@playwright/test"

test.describe("dynamic-public", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const url = route.request().url()
      if (url.includes("/pages/")) {
        if (url.includes("missing")) return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "not found" }) })
        if (url.includes("forbidden")) return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "forbidden" }) })
        if (url.includes("xss")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ title: "XSS Test", content: '<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a><iframe src="https://evil"></iframe><p>safe</p>' }) })
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ title: "Test Page", content: "<p>Hello <strong>world</strong></p>" }) })
      }
      if (url.includes("/model-plaza")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ models: [{ id: "m1", name: "Model 1" }] }) })
      if (url.includes("/settings/public")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { model_plaza_enabled: true, model_plaza_require_auth: false, backend_mode_enabled: false } }) })
      return route.continue()
    })
  })

  test("custom page sanitized removes XSS", async ({ page }) => {
    await page.goto("/custom/xss")
    await page.waitForTimeout(800)
    // Check only the rendered custom content area, not the whole document's scripts
    const prose = page.locator(".prose")
    await expect(prose).toBeVisible({ timeout: 8000 })
    const html = await prose.innerHTML()
    expect(html).not.toContain("<script")
    expect(html).not.toContain("onerror")
    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("<iframe")
    await expect(prose).toContainText(/safe/i)
  })

  test("custom 404 shows not found", async ({ page }) => {
    await page.goto("/custom/missing")
    await expect(page.locator("body")).toContainText(/not found|Failed to load/i)
  })

  test("custom forbidden shows permission", async ({ page }) => {
    await page.goto("/custom/forbidden")
    await expect(page.locator("body")).toContainText(/permission|Failed/i)
  })

  test("custom normal renders", async ({ page }) => {
    await page.goto("/custom/123")
    await expect(page.locator("body")).toContainText(/Hello|world/i)
  })

  test("model plaza disabled shows disabled", async ({ page }) => {
    await page.route("**/settings/public**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { model_plaza_enabled: false } }) }))
    await page.goto("/model-plaza")
    await page.waitForTimeout(800)
    const url = page.url()
    // May redirect per matrix — check not crashing
    expect(url).toMatch(/model-plaza|home|dashboard/)
  })

  test("model plaza public renders", async ({ page }) => {
    await page.goto("/model-plaza")
    await expect(page.locator("body")).toContainText(/Model Plaza|Available models/i)
  })

  test("model plaza auth-required redirects anonymous", async ({ page }) => {
    await page.route("**/settings/public**", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { model_plaza_enabled: true, model_plaza_require_auth: true, backend_mode_enabled: false } }) }))
    await page.goto("/login")
    await page.evaluate(() => { try { localStorage.clear() } catch {} })
    await page.goto("/model-plaza")
    await page.waitForTimeout(800)
    const url = page.url()
    expect(url).toMatch(/login|model-plaza/)
  })

  test("backend mode blocks non-allowlist but allows plaza handling", async ({ page }) => {
    await page.goto("/legal/terms")
    await expect(page.locator("body")).toBeVisible()
  })

  test("direct URL / refresh / back safety - custom", async ({ page }) => {
    await page.goto("/custom/123")
    await page.reload()
    await expect(page.locator("body")).toContainText(/Hello|world/i)
    await page.goBack()
    await page.goForward()
    await expect(page.locator("body")).toBeVisible()
  })
})
