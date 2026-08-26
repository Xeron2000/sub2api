export type AppErrorType =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "rate_limit"
  | "network"
  | "timeout"
  | "server"
  | "unknown"

export class AppError extends Error {
  type: AppErrorType
  status: number
  code?: string | number
  metadata?: Record<string, unknown>

  constructor(opts: { type: AppErrorType; status: number; message: string; code?: string | number; metadata?: Record<string, unknown> }) {
    super(opts.message)
    this.type = opts.type
    this.status = opts.status
    this.code = opts.code
    this.metadata = opts.metadata
  }
}

function mapStatusToType(status: number): AppErrorType {
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 404) return "not_found"
  if (status === 409) return "conflict"
  if (status === 422) return "validation"
  if (status === 429) return "rate_limit"
  if (status >= 500) return "server"
  if (status === 0) return "network"
  return "unknown"
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err
  const e = err as Record<string, unknown>
  const status = (e.status as number) ?? 0
  const message = (e.message as string) ?? "Unknown error"
  const code = e.code as string | number | undefined
  const metadata = e.metadata as Record<string, unknown> | undefined
  return new AppError({ type: mapStatusToType(status), status, message, code, metadata })
}
