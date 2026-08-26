import { describe, it, expect } from "vitest"
import { safeRedirect, normalizeOAuthError } from "./oauth"

// Re-export sanitize fallback for test reuse — not ideal but verifies routing
describe("safe redirect", () => {
  it("allows same-origin internal routes", () => {
    expect(safeRedirect("/dashboard")).toBe("/dashboard")
    expect(safeRedirect("/keys?foo=bar")).toBe("/keys?foo=bar")
    expect(safeRedirect("/login?redirect=/keys")).toBe("/login?redirect=/keys")
  })
  it("blocks open redirect", () => {
    expect(safeRedirect("https://evil.com")).toBe("/dashboard")
    expect(safeRedirect("//evil.com")).toBe("/dashboard")
    expect(safeRedirect("javascript:alert(1)")).toBe("/dashboard")
    expect(safeRedirect("http://localhost:3000/evil")).toBe("/dashboard")
    expect(safeRedirect(null)).toBe("/dashboard")
    expect(safeRedirect("")).toBe("/dashboard")
  })
  it("blocks encoded bypass", () => {
    expect(safeRedirect(decodeURIComponent("%2F%2Fevil.com"))).toBe("/dashboard")
  })
})

describe("OAuth state handling", () => {
  it("normalizes user denied", () => {
    const r = normalizeOAuthError({ code: "access_denied" })
    expect(r.code).toBe("user_denied")
    expect(r.message).toMatch(/denied/i)
  })
  it("normalizes state invalid", () => {
    const r = normalizeOAuthError({ code: "oauth_state_mismatch" })
    expect(r.code).toBe("state_invalid")
  })
  it("normalizes expired flow", () => {
    const r = normalizeOAuthError({ message: "expired token" })
    expect(r.code).toBe("expired_flow")
  })
  it("maps account conflict", () => {
    const r = normalizeOAuthError({ code: "account_conflict" })
    expect(r.code).toBe("account_conflict")
  })
})

describe("sensitive URL audit - clearSensitiveParams", () => {
  it("safeRedirect prevents token leakage via open redirect", () => {
    expect(safeRedirect("/dashboard?token=abc")).toBe("/dashboard?token=abc") // internal allowed but cleanup should remove token after — tested via oauth handler
    expect(safeRedirect("https://evil.com?token=abc")).not.toContain("evil")
  })
})
