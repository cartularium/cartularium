import type { MiddlewareHandler } from "hono"
import type { Env } from "../env"
import { parseCookie, SESSION_COOKIE } from "../auth/cookie"
import { destroySession, loadSession, type SessionRecord } from "../auth/session"

declare module "hono" {
  interface ContextVariableMap {
    session: SessionRecord
    sessionId: string
  }
}

export const requireSession: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const id = parseCookie(c.req.header("Cookie") ?? null, SESSION_COOKIE)
  if (!id) return c.json({ error: "no_session" }, 401)
  const record = await loadSession(c.env.SESSIONS, id)
  if (!record) return c.json({ error: "session_expired" }, 401)
  if (record.token_expiry < Date.now()) {
    await destroySession(c.env.SESSIONS, id)
    return c.json({ error: "token_expired" }, 401)
  }
  c.set("session", record)
  c.set("sessionId", id)
  return next()
}
