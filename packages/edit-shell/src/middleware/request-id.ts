import type { MiddlewareHandler } from "hono"
import type { Env } from "../env"

declare module "hono" {
  interface ContextVariableMap {
    requestId: string
  }
}

// 12 random hex chars — short enough to copy-paste from a UI, long enough
// to make collisions unlikely across a few hundred requests/sec.
function newRequestId(): string {
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

export const requestId: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const id = c.req.header("X-Request-Id") ?? newRequestId()
  c.set("requestId", id)
  c.header("X-Request-Id", id)
  await next()
}
