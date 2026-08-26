import { describe, it, expect } from "vitest"
import { AppError, toAppError } from "./errors"

describe("AppError", () => {
  it("maps status to type", () => {
    const err = toAppError({ status: 401, message: "unauthorized" })
    expect(err.type).toBe("unauthorized")
    expect(err.status).toBe(401)
  })
  it("preserves AppError", () => {
    const e = new AppError({ type: "validation", status: 422, message: "bad" })
    expect(toAppError(e)).toBe(e)
  })
})
