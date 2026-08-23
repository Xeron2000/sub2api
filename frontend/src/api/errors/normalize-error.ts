import type { ApiError } from "../client/http-client"

export function normalizeError(error: unknown): ApiError {
  if (error && typeof error === "object" && "message" in error) {
    return error as ApiError
  }
  return { message: error instanceof Error ? error.message : "Unknown error" }
}
