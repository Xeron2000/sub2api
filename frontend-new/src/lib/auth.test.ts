import { describe, it, expect, beforeEach } from "vitest"
import { getStoredUser, getAuthStatus, isAdmin } from "./auth"

describe("auth helpers", () => {
  beforeEach(() => localStorage.clear())
  it("anonymous when no token", () => {
    expect(getAuthStatus()).toBe("anonymous")
    expect(isAdmin()).toBe(false)
  })
  it("authenticated when token and user present", () => {
    localStorage.setItem("auth_token", "t")
    localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "a@b.com", role: "user" }))
    expect(getAuthStatus()).toBe("authenticated")
    expect(getStoredUser()?.email).toBe("a@b.com")
    expect(isAdmin()).toBe(false)
  })
  it("admin detection", () => {
    localStorage.setItem("auth_token", "t")
    localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "a@b.com", role: "admin" }))
    expect(isAdmin()).toBe(true)
  })
})
