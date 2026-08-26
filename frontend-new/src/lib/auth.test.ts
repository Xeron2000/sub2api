import { describe, it, expect, beforeEach } from "vitest"
import { getStoredUser, getAuthStatus, isAdmin } from "./auth"

// jsdom localStorage polyfill for vitest 4 node warning
if (typeof window !== "undefined" && !(window as unknown as { localStorage?: unknown }).localStorage) {
  const store = new Map<string, string>()
  const mock = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size },
  } as unknown as Storage
  Object.defineProperty(window, "localStorage", { value: mock })
  if (!(globalThis as unknown as { localStorage?: unknown }).localStorage) {
    Object.defineProperty(globalThis, "localStorage", { value: mock })
  }
}

describe("auth helpers", () => {
  beforeEach(() => window.localStorage.clear())
  it("anonymous when no token", () => {
    expect(getAuthStatus()).toBe("anonymous")
    expect(isAdmin()).toBe(false)
  })
  it("authenticated when token and user present", () => {
    window.localStorage.setItem("auth_token", "t")
    window.localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "a@b.com", role: "user" }))
    expect(getAuthStatus()).toBe("authenticated")
    expect(getStoredUser()?.email).toBe("a@b.com")
    expect(isAdmin()).toBe(false)
  })
  it("admin detection", () => {
    window.localStorage.setItem("auth_token", "t")
    window.localStorage.setItem("auth_user", JSON.stringify({ id: 1, email: "a@b.com", role: "admin" }))
    expect(isAdmin()).toBe(true)
  })
})
