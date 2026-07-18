import type { MiddlewareHandler } from "hono"
import type { Env } from "../env"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export const originCheck: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (SAFE_METHODS.has(c.req.method)) return next()
  if (c.req.path.startsWith("/api/edit/assay-runner/") && c.req.header("Authorization")) {
    return next()
  }

  const origin = c.req.header("Origin")
  if (!origin) return c.json({ error: "missing_origin" }, 403)

  const allowed = c.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  if (!allowed.includes(origin)) return c.json({ error: "bad_origin" }, 403)

  return next()
}
