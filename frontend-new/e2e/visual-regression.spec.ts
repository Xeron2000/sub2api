import { test, expect } from "@playwright/test"
import type { Page } from "@playwright/test"

// Visual regression baseline per §31-32: Desktop Light, Desktop Dark, Mobile Light
const BASELINE_PAGES = [
  "/login",
  "/dashboard",
  "/keys",
  "/usage",
  "/profile",
  "/admin/dashboard",
  "/admin/users",
  "/admin/groups",
  "/admin/accounts",
  "/admin/settings",
  "/model-plaza",
  "/setup",
  "/payment/qrcode?order_id=ord123",
  "/payment/result?order_id=ord123",
] as const

async function mockForVisual(page: Page, theme: "light" | "dark", path: string) {
  await page.route("**/api/**", async (route) => {
    const url = route.request().url()
    if (url.includes("/api/auth/me") || url.includes("/auth/me")) {
      // /login and /setup should see anonymous to avoid redirect; others see admin
      const isPublic = path === "/login" || path === "/setup"
      if (isPublic) return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ code: 1, message: "unauthorized" }) })
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data: { id: 1, email: "admin@example.com", role: "admin" } }) })
      return
    }
    if (url.includes("/api/") && (url.includes("/keys") || url.includes("/usage") || url.includes("/users") || url.includes("/groups") || url.includes("/accounts") || url.includes("/settings") || url.includes("/payment") || url.includes("/orders"))) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 0, data: { items: [], total: 0 } }) })
      return
    }
    if (url.includes("/api/public/settings") || url.includes("/settings/public")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { site_name: "Sub2API", model_plaza_enabled: true, payment_enabled: true } }) })
      return
    }
    await route.continue()
  })
  // set stable theme + auth state before hydration
  await page.addInitScript(
    ({ t, p }: { t: string; p: string }) => {
      try {
        localStorage.setItem("theme", t)
        document.documentElement.setAttribute("data-theme", t)
        // public pages should be anonymous, protected pages authenticated
        const publicPaths = ["/login", "/setup", "/model-plaza"]
        const isPublic = publicPaths.some((x) => p === x || p.startsWith(x + "?"))
        if (isPublic) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_user")
        } else {
          localStorage.setItem("auth_token", "visual-mock-token")
          localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "admin@example.com", role: "admin" }))
        }
        // stable settings cache
        try {
          localStorage.setItem("sub2api_settings", JSON.stringify({ site_name: "Sub2API", model_plaza_enabled: true, payment_enabled: true }))
        } catch {}
      } catch {}
    },
    { t: theme, p: path },
  )
  // disable animations
  await page.addInitScript(() => {
    const style = document.createElement("style")
    style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; }"
    document.head.appendChild(style)
  })
}

test.describe("visual regression — §31 baseline", () => {
  for (const path of BASELINE_PAGES) {
    test(`Desktop Light — ${path}`, async ({ page }) => {
      await mockForVisual(page, "light", path)
      await page.goto(path, { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)
      await page.waitForLoadState("networkidle")
      await expect(page).toHaveScreenshot(`${path.replace(/[/?]/g, "_")}-desktop-light.png`, { maxDiffPixelRatio: 0.05, animations: "disabled" })
    })

    test(`Desktop Dark — ${path}`, async ({ page }) => {
      await mockForVisual(page, "dark", path)
      await page.goto(path, { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)
      await page.waitForLoadState("networkidle")
      await expect(page).toHaveScreenshot(`${path.replace(/[/?]/g, "_")}-desktop-dark.png`, { maxDiffPixelRatio: 0.05, animations: "disabled" })
    })

    test(`Mobile Light — ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await mockForVisual(page, "light", path)
      await page.goto(path, { waitUntil: "networkidle" })
      await page.waitForTimeout(1000)
      await page.waitForLoadState("networkidle")
      await expect(page).toHaveScreenshot(`${path.replace(/[/?]/g, "_")}-mobile-light.png`, { maxDiffPixelRatio: 0.05, animations: "disabled" })
    })
  }

  test("Desktop Light/Dark — /dev/ui", async ({ page }) => {
    await mockForVisual(page, "light", "/dev/ui")
    await page.goto("/dev/ui", { waitUntil: "networkidle" })
    await page.waitForTimeout(1000)
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveScreenshot("dev_ui-desktop-light.png", { maxDiffPixelRatio: 0.05, animations: "disabled" })
    await mockForVisual(page, "dark", "/dev/ui")
    await page.goto("/dev/ui", { waitUntil: "networkidle" })
    await page.waitForTimeout(1000)
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveScreenshot("dev_ui-desktop-dark.png", { maxDiffPixelRatio: 0.05, animations: "disabled" })
  })
})
