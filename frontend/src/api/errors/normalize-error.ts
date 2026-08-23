import type { ApiError } from "../client/http-client"

export function normalizeError(error: unknown): ApiError {
  if (error instanceof Error) {
    return { message: error.message }
  }
  if (error && typeof error === "object" && "message" in error) {
    return error as ApiError
  }
  return { message: "Unknown error" }
}
