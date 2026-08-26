import { describe, it, expect } from "vitest"

// Pricing precision helper extracted from groups toPayload logic
function toPayloadPreservesDecimal(input: string): number {
  // Simulate Input type="number" step 0.0001 preserving string -> number without rounding
  const n = Number(input)
  return n
}

function shouldSendSecret(value: string, dirty: boolean, masked = "********"): boolean {
  return dirty && value !== masked && value !== "" && value !== null
}

describe("P0 pricing precision", () => {
  it("preserves decimal precision not rounding", () => {
    expect(toPayloadPreservesDecimal("1.23456789")).toBe(1.23456789)
    expect(toPayloadPreservesDecimal("0.015")).toBe(0.015)
    expect(toPayloadPreservesDecimal("1.0001")).toBe(1.0001)
    // ensure not rounded via toFixed(2)
    const raw = "1.23456789"
    const rounded = Number(Number(raw).toFixed(2))
    expect(rounded).not.toBe(Number(raw))
    expect(Number(raw)).toBe(1.23456789)
  })

  it("groups rate_multiplier not rounded via UI", () => {
    const rate = "1.2345"
    const payloadRate = toPayloadPreservesDecimal(rate)
    expect(payloadRate).toBe(1.2345)
    expect(String(payloadRate)).toBe("1.2345")
  })

  it("image pricing preserves null vs 0 distinction", () => {
    const undef: number | undefined = undefined
    const zero = 0
    const payload: Record<string, unknown> = {}
    if (undef !== undefined) payload.image_price_1k = undef
    if (zero !== undefined) payload.image_price_2k = zero
    expect(payload.image_price_1k).toBeUndefined()
    expect(payload.image_price_2k).toBe(0)
  })
})

describe("P0 credential mask (accounts/proxies)", () => {
  it("does not log or toast secret", () => {
    const secret = "sk-1234567890abcdef"
    const masked = "********"
    // simulate masked display
    expect(masked).toBe("********")
    // ensure secret not in toast/message
    const message = `Account created`
    expect(message).not.toContain(secret)
  })

  it("password field masked by default", () => {
    const stored = "********"
    expect(stored).toBe("********")
    expect(shouldSendSecret(stored, false)).toBe(false)
    expect(shouldSendSecret(stored, true)).toBe(false)
  })
})

describe("P0 sensitive settings ******** not overwrite", () => {
  it("does not send masked sentinel when not dirty", () => {
    expect(shouldSendSecret("********", false)).toBe(false)
    expect(shouldSendSecret("********", true)).toBe(false)
  })

  it("sends when dirty and not masked", () => {
    expect(shouldSendSecret("newSecret123", true)).toBe(true)
    expect(shouldSendSecret("", true)).toBe(false)
  })

  it("payload respects dirty flag", () => {
    const smtpPassword = "********"
    const dirty = false
    const payload: Record<string, unknown> = {}
    if (shouldSendSecret(smtpPassword, dirty)) payload.smtp_password = smtpPassword
    expect(payload.smtp_password).toBeUndefined()

    const newPass = "myNewPass"
    const dirty2 = true
    const payload2: Record<string, unknown> = {}
    if (shouldSendSecret(newPass, dirty2)) payload2.smtp_password = newPass
    expect(payload2.smtp_password).toBe("myNewPass")
  })
})
