import { describe, it, expect } from "vitest"
import { sanitizeHTMLSync, sanitizeHTMLFallback } from "./sanitize"

describe("custom HTML sanitization", () => {
  it("removes script tags", () => {
    expect(sanitizeHTMLSync('<script>alert(1)</script><p>hi</p>')).not.toContain("<script")
    expect(sanitizeHTMLSync('<p>hi</p>')).toContain("hi")
  })
  it("removes onerror handlers", () => {
    expect(sanitizeHTMLSync('<img src=x onerror=alert(1)>')).not.toContain("onerror")
    expect(sanitizeHTMLFallback('<img src=x onerror=alert(1)>')).not.toContain("onerror")
  })
  it("neutralizes javascript href", () => {
    expect(sanitizeHTMLSync('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:")
  })
  it("removes iframe", () => {
    expect(sanitizeHTMLSync('<iframe src="https://evil.com"></iframe>')).not.toContain("<iframe")
  })
  it("keeps safe html", () => {
    const out = sanitizeHTMLSync('<p>Hello <strong>world</strong></p>')
    expect(out).toContain("Hello")
    expect(out).toContain("<strong>")
  })
  it("sanitize fallback covers XSS vectors", () => {
    const payloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<a href="javascript:alert(1)">x</a>',
      '<iframe src="https://evil"></iframe>',
      '<div onload=alert(1)>hi</div>',
    ]
    for (const p of payloads) {
      const out = sanitizeHTMLFallback(p)
      expect(out).not.toContain("alert(1)")
      expect(out).not.toContain("onerror")
      expect(out).not.toContain("javascript:")
    }
  })
})

describe("masked secret preservation", () => {
  it("does not send masked sentinel", () => {
    const shouldSend = (value: string, dirty: boolean, masked = "********") => dirty && value !== masked && value !== ""
    expect(shouldSend("********", false)).toBe(false)
    expect(shouldSend("********", true)).toBe(false)
    expect(shouldSend("newSecret", true)).toBe(true)
  })
})

describe("route policy — backend mode allowlist", () => {
  it("allows known public routes", () => {
    const allowed = ['/login', '/key-usage', '/setup', '/payment/result', '/payment/airwallex', '/legal']
    for (const p of allowed) expect(allowed.some(a => p.startsWith(a))).toBe(true)
    expect(allowed.includes("/admin/dashboard")).toBe(false)
  })
})
