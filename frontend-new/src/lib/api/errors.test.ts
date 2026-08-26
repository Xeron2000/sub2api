import { describe, it, expect } from "vitest"
import { AppError, toAppError } from "./errors"

describe("AppError", () => {
  it("maps status to type", () => {
    expect(toAppError({ status: 401, message: "unauthorized" }).type).toBe("unauthorized")
    expect(toAppError({ status: 403, message: "forbidden" }).type).toBe("forbidden")
    expect(toAppError({ status: 404, message: "not found" }).type).toBe("not_found")
    expect(toAppError({ status: 422, message: "validation" }).type).toBe("validation")
    expect(toAppError({ status: 409, message: "conflict" }).type).toBe("conflict")
    expect(toAppError({ status: 429, message: "rate limit" }).type).toBe("rate_limit")
    expect(toAppError({ status: 500, message: "server" }).type).toBe("server")
    expect(toAppError({ status: 0, message: "network" }).type).toBe("network")
    expect(toAppError({ status: 418, message: "unknown" }).type).toBe("unknown")
  })
  it("preserves AppError", () => {
    const e = new AppError({ type: "validation", status: 422, message: "bad" })
    expect(toAppError(e)).toBe(e)
  })
  it("preserves code/reason/metadata", () => {
    const err = toAppError({ status: 422, message: "bad", code: "VALIDATION_ERROR", reason: "field", metadata: { field: "email" } })
    expect(err.code).toBe("VALIDATION_ERROR")
    expect(err.reason).toBe("field")
    expect(err.metadata).toEqual({ field: "email" })
  })
})
