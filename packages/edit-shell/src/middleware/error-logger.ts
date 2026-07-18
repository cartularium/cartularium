import type { Context, ErrorHandler } from "hono"
import type { Env } from "../env"

const STACK_MAX_LEN = 2000

export const errorLogger: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  const requestId = c.var.requestId ?? "unknown"
  const status = (err as { status?: unknown })?.status
  const safeStatus =
    typeof status === "number" && status >= 400 && status < 600 ? status : 500

  console.error(
    JSON.stringify({
      level: "error",
      requestId,
      route: new URL(c.req.url).pathname,
      method: c.req.method,
      status: safeStatus,
      name: err.name,
      message: err.message,
      stack: err.stack ? err.stack.slice(0, STACK_MAX_LEN) : undefined,
    }),
  )

  return c.json(
    { error: "internal_error", requestId },
    safeStatus as Parameters<Context["json"]>[1],
  )
}
