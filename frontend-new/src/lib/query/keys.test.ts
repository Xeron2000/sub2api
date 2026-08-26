import { describe, it, expect } from "vitest"
import { queryKeys } from "./keys"

describe("queryKeys", () => {
  it("has stable keys", () => {
    expect(queryKeys.users.list({ page: 1 })).toEqual(["users", "list", { page: 1 }])
    expect(queryKeys.keys.list({})).toEqual(["keys", "list", {}])
    expect(queryKeys.usage.dashboard()).toEqual(["usage", "dashboard"])
  })
})
