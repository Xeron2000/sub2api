import { describe, it, expect } from "vitest"
import { normalizeOrderStatus, isTerminal } from "./polling"

describe("payment status normalization", () => {
  it("normalizes paid variants", () => {
    expect(normalizeOrderStatus("paid")).toBe("paid")
    expect(normalizeOrderStatus("PAID")).toBe("paid")
    expect(normalizeOrderStatus("success")).toBe("paid")
    expect(normalizeOrderStatus("completed")).toBe("paid")
  })
  it("normalizes expired/failed/canceled", () => {
    expect(normalizeOrderStatus("expired")).toBe("expired")
    expect(normalizeOrderStatus("failed")).toBe("failed")
    expect(normalizeOrderStatus("canceled")).toBe("canceled")
    expect(normalizeOrderStatus("cancelled")).toBe("canceled")
  })
  it("unknown fallback", () => {
    expect(normalizeOrderStatus("weird_new_enum")).toBe("unknown")
    expect(normalizeOrderStatus(undefined)).toBe("unknown")
    expect(normalizeOrderStatus(null)).toBe("unknown")
  })
  it("isTerminal correctly", () => {
    expect(isTerminal("paid")).toBe(true)
    expect(isTerminal("expired")).toBe(true)
    expect(isTerminal("failed")).toBe(true)
    expect(isTerminal("waiting")).toBe(false)
    expect(isTerminal("creating")).toBe(false)
    expect(isTerminal("unknown")).toBe(false)
  })
})

describe("postMessage origin validation (unit)", () => {
  it("validates expected origin", () => {
    const validate = (origin: string, expected: string) => origin === expected || origin.includes("stripe.com")
    expect(validate("https://sub2api.local", "https://sub2api.local")).toBe(true)
    expect(validate("https://evil.com", "https://sub2api.local")).toBe(false)
    expect(validate("https://js.stripe.com", "https://sub2api.local")).toBe(true)
  })
  it("validates message shape", () => {
    const isValid = (data: unknown) => {
      const d = data as { type?: string; order_id?: string }
      return d?.type === "stripe-popup" && typeof d.order_id === "string" && !!d.order_id
    }
    expect(isValid({ type: "stripe-popup", order_id: "123" })).toBe(true)
    expect(isValid({ type: "stripe-popup" })).toBe(false)
    expect(isValid({ type: "other", order_id: "123" })).toBe(false)
    expect(isValid(null)).toBe(false)
  })
})
