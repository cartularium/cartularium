import type { MiddlewareHandler } from "hono"
import type { Env } from "../env"

const LIMIT = 60
const WINDOW_SECONDS = 60

// Per-session sliding window with two-bucket weighting. Tracks mutating
// requests (anything other than GET/HEAD) in 60-second buckets keyed by
// `rl:<sessionId>:<minute>`. To approximate a true sliding window without
// per-request scans, we read the current and previous minute buckets and
// weight the previous bucket by the fraction of the previous minute that
// falls inside the trailing 60-second window. This is the standard
// sliding-window-counter algorithm — a contributor cannot fire 60 requests
// at second 59 and another 60 at second 61 to slip through. KV entries
// expire at 2x the window so the previous bucket survives long enough to
// be weighted into the next minute.
//
// Mounted *after* `requireSession` at the route-group level so `c.var.sessionId`
// is populated by the time this runs. If sessionId is missing for any reason
// (e.g. an unauthenticated path slipped through), we no-op rather than 429.
export const rateLimit: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "HEAD") return next()
  const sid = c.var.sessionId
  if (!sid) return next()

  const now = Date.now()
  const currentMinute = Math.floor(now / 60000)
  const previousMinute = currentMinute - 1
  const secondsIntoMinute = (now % 60000) / 1000
  const previousWeight = (60 - secondsIntoMinute) / 60

  const currentKey = `rl:${sid}:${currentMinute}`
  const previousKey = `rl:${sid}:${previousMinute}`
  const [currentRaw, previousRaw] = await Promise.all([
    c.env.RATE_LIMIT.get(currentKey),
    c.env.RATE_LIMIT.get(previousKey),
  ])
  const current = parseInt(currentRaw ?? "0", 10)
  const previous = parseInt(previousRaw ?? "0", 10)
  const weighted = current + previous * previousWeight

  if (weighted >= LIMIT) {
    return c.json({ error: "rate_limited" }, 429)
  }
  await c.env.RATE_LIMIT.put(currentKey, String(current + 1), {
    expirationTtl: WINDOW_SECONDS * 2,
  })
  return next()
}
