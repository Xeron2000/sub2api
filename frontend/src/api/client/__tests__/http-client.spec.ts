import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import MockAdapter from "axios-mock-adapter"
import { httpClient, getApiBaseURL } from "../http-client"

describe("http-client", () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
    window.localStorage.clear()
    vi.stubEnv("VITE_API_BASE_URL", "/api/v1")
  })

  afterEach(() => {
    mock.restore()
    window.localStorage.clear()
  })

  it("unwraps envelope code 0 to data", async () => {
    mock.onGet("/ping").reply(200, { code: 0, message: "ok", data: { hello: "world" } })
    const res = await httpClient.get("/ping")
    expect(res.data).toEqual({ hello: "world" })
  })

  it("rejects envelope code !=0 with ApiError", async () => {
    mock.onGet("/bad").reply(200, { code: 40001, message: "quota_exceeded", reason: "quota" })
    await expect(httpClient.get("/bad")).rejects.toMatchObject({
      code: 40001,
      message: "quota_exceeded",
    })
  })

  it("adds timezone to GET params", async () => {
    mock.onGet("/list").reply((config) => {
      expect(config.params?.timezone).toBeDefined()
      return [200, { code: 0, data: [] }]
    })
    await httpClient.get("/list")
  })

  it("attaches Authorization and Accept-Language headers", async () => {
    window.localStorage.setItem("auth_token", "tok123")
    window.localStorage.setItem("sub2api_locale", "zh")
    mock.onGet("/secure").reply((config) => {
      expect(config.headers?.Authorization).toBe("Bearer tok123")
      expect(config.headers?.["Accept-Language"]).toBe("zh")
      return [200, { code: 0, data: {} }]
    })
    await httpClient.get("/secure")
  })

  it("handles 401 without refresh_token by clearing auth_token", async () => {
    window.localStorage.setItem("auth_token", "expired")
    mock.onGet("/need-auth").reply(401, { code: 401, message: "Unauthorized" })
    await expect(httpClient.get("/need-auth")).rejects.toMatchObject({ status: 401 })
    expect(window.localStorage.getItem("auth_token")).toBeNull()
  })

  it("handles 401 with refresh_token by not clearing immediately", async () => {
    window.localStorage.setItem("auth_token", "expired")
    window.localStorage.setItem("refresh_token", "ref123")
    mock.onGet("/need-auth2").reply(401, { code: 401, message: "Unauthorized" })
    await expect(httpClient.get("/need-auth2")).rejects.toMatchObject({ status: 401 })
    expect(window.localStorage.getItem("auth_token")).toBe("expired")
  })

  it("passes through ERR_CANCELED", async () => {
    mock.onGet("/cancel").reply(() => {
      return Promise.reject(Object.assign(new Error("canceled"), { code: "ERR_CANCELED" }))
    })
    await expect(httpClient.get("/cancel")).rejects.toMatchObject({ code: "ERR_CANCELED" })
  })

  it("getApiBaseURL returns configured base", () => {
    expect(getApiBaseURL()).toBeDefined()
  })
})
