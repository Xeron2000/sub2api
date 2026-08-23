import { describe, it, expect } from "vitest"
import { normalizeError } from "../normalize-error"

describe("normalizeError", () => {
  it("passes through ApiError", () => {
    const err = { message: "bad", status: 400, code: 123 }
    expect(normalizeError(err)).toEqual(err)
  })
  it("wraps Error", () => {
    expect(normalizeError(new Error("oops"))).toEqual({ message: "oops" })
  })
  it("wraps unknown", () => {
    expect(normalizeError("boom")).toEqual({ message: "Unknown error" })
  })
})
