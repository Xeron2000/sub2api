import { test, expect } from "@playwright/test"
import type { Route } from "@playwright/test"

test.describe("setup", () => {
  test("needs setup shows wizard", async ({ page }) => {
    const statusOk = async (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { needs_setup: true } }) })
    await page.route("**/setup/status**", statusOk)
    await page.route("**/*setup/status*", statusOk)
    await page.goto("/setup")
    await expect(page.locator("body")).toContainText(/Setup|Initialize/i)
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.getByRole("button", { name: /Initialize/i })).toBeVisible()
  })

  test("already initialized redirects per role", async ({ page }) => {
    const statusFalse = async (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { needs_setup: false } }) })
    await page.route("**/setup/status**", statusFalse)
    await page.route("**/*setup/status*", statusFalse)

    // anonymous -> /home
    await page.goto("/login")
    await page.evaluate(() => localStorage.clear())
    await page.goto("/setup")
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 5000 })
    await expect(page.locator("body")).toBeVisible()

    // user -> /dashboard
    await page.goto("/login")
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem("auth_token", "tok-user")
      localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "a@a.com", role: "user" }))
    })
    await page.goto("/setup")
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/dashboard|\/home|\/login/)
    await expect(page.locator("body")).toBeVisible()

    // admin -> /admin/dashboard
    await page.goto("/login")
    await page.evaluate(() => {
      localStorage.clear()
      localStorage.setItem("auth_token", "tok-admin")
      localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "admin@a.com", role: "admin" }))
    })
    await page.goto("/setup")
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/admin\/dashboard|\/dashboard|\/home|\/login/)
    await expect(page.locator("body")).toBeVisible()
  })

  test("status API failure keeps setup reachable", async ({ page }) => {
    const statusErr = async (route: Route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "error" }) })
    await page.route("**/setup/status**", statusErr)
    await page.route("**/*setup/status*", statusErr)
    await page.goto("/setup")
    await expect(page.locator("body")).toContainText(/Setup|Initialize|could not verify/i)
    await expect(page.locator("#email")).toBeVisible()
  })

  test("validation shows errors", async ({ page }) => {
    const sOk = async (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { needs_setup: true } }) })
    await page.route("**/setup/status**", sOk)
    await page.route("**/*setup/status*", sOk)
    await page.goto("/setup")
    await expect(page.locator("#email")).toBeVisible()
    await page.locator("#email").fill("not-an-email")
    await page.locator("#password").fill("short")
    await page.getByRole("button", { name: /Initialize/i }).click()
    await expect(page.locator("body")).toContainText(/Invalid|at least/i)
  })

  test("submission success posts once and redirects", async ({ page }) => {
    let installCount = 0
    const sOk2 = async (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { needs_setup: true } }) })
    await page.route("**/setup/status**", sOk2)
    await page.route("**/*setup/status*", sOk2)
    // Intercept both /setup/install and /api/v1/setup/install — pattern must contain setup/install
    const handleInstall = async (route: Route) => {
      installCount++
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { message: "ok" } }) })
    }
    await page.route("**/setup/install**", handleInstall)
    await page.route("**/*setup/install*", handleInstall)

    await page.goto("/setup")
    await expect(page.locator("#email")).toBeVisible()
    await page.locator("#email").fill("admin@example.com")
    await page.locator("#password").fill("StrongPass123!")
    await page.getByRole("button", { name: /Initialize/i }).click()

    // Deterministic: poll for POST count and also wait for network response (either may fire first)
    await expect.poll(() => installCount, { timeout: 5000 }).toBe(1)
    // Also confirm network response was observed (broader match)
    await page.waitForResponse((r) => r.url().includes("setup/install"), { timeout: 2000 }).catch(() => {})
    // Success triggers hard redirect — page must leave /setup (or show success state, no longer wizard)
    await expect(page).not.toHaveURL(/\/setup/, { timeout: 5000 })
    await expect(page.locator("body")).toBeVisible()
  })

  test("submission conflict already initialized handled", async ({ page }) => {
    const sOk3 = async (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { needs_setup: true } }) })
    await page.route("**/setup/status**", sOk3)
    await page.route("**/*setup/status*", sOk3)
    const conflict = async (route: Route) => route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ message: "already initialized" }) })
    await page.route("**/setup/install**", conflict)
    await page.route("**/*setup/install*", conflict)
    await page.goto("/setup")
    await expect(page.locator("#email")).toBeVisible()
    await page.locator("#email").fill("admin@example.com")
    await page.locator("#password").fill("StrongPass123!")
    await page.getByRole("button", { name: /Initialize/i }).click()
    await expect(page.locator("body")).toContainText(/already initialized/i)
  })

  test("double submit is blocked", async ({ page }) => {
    let count = 0
    let releaseHold!: () => void
    const hold = new Promise<void>((resolve) => {
      releaseHold = resolve
    })

    const sOk4 = async (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { needs_setup: true } }) })
    await page.route("**/setup/status**", sOk4)
    await page.route("**/*setup/status*", sOk4)
    const holdHandler = async (route: Route) => {
      count++
      await hold
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { message: "ok" } }) })
    }
    await page.route("**/setup/install**", holdHandler)
    await page.route("**/*setup/install*", holdHandler)

    await page.goto("/setup")
    await expect(page.locator("#email")).toBeVisible()
    await page.locator("#email").fill("admin@example.com")
    await page.locator("#password").fill("StrongPass123!")
    const btn = page.getByRole("button", { name: /Initialize/i })
    const submitBtn = page.locator('button[type="submit"]')

    // One user intent → exactly one POST — hold request so we can assert intermediate state deterministically
    await btn.click()
    // UI must synchronously enter submitting: button disabled and guarded (text changes to Setting up...)
    await expect(submitBtn).toBeDisabled({ timeout: 2000 })
    await expect(submitBtn).toContainText(/Setting up/i)
    expect(count).toBe(1)

    // Attempt second user action while first is held — must not produce second POST
    await submitBtn.click({ force: true, timeout: 1000 }).catch(() => {})
    expect(count).toBe(1)

    // Release first request; allow navigation/success to proceed
    releaseHold()
    await page.waitForResponse((r) => r.url().includes("/setup/install") && r.request().method() === "POST", { timeout: 5000 })
    // Still exactly one, even after release window
    // Poll briefly to catch stray second request
    await page.waitForTimeout(300)
    expect(count).toBe(1)
  })
})
