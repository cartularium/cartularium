import { Hono } from "hono"
import type { Env } from "./env"
import { errorLogger } from "./middleware/error-logger"
import { originCheck } from "./middleware/origin"
import { rateLimit } from "./middleware/rate-limit"
import { requestId } from "./middleware/request-id"
import { requireSession } from "./middleware/session"
import assetsRoutes from "./routes/assets"
import assayForkAnnotationRoutes from "./routes/assay-fork-annotations"
import assayPublicRoutes from "./routes/assay-public"
import assayPreviewRoutes from "./routes/assay-preview"
import assayRunnerRoutes from "./routes/assay-runner"
import authRoutes from "./routes/auth"
import contentsRoutes from "./routes/contents"
import draftsRoutes from "./routes/drafts"
import prRoutes from "./routes/pr"

const app = new Hono<{ Bindings: Env }>()

// Tag every request (any path, not just /api/edit/*) with an X-Request-Id so
// uncaught errors and client-reported issues can be correlated through logs.
app.use("*", requestId)
app.onError(errorLogger)

app.use("/api/edit/*", originCheck)

// The public read lane — sessionless, published-only, CORS-open (store-delivery D-A1).
// Deliberately OUTSIDE /api/edit/* so none of the authoring-shell middleware applies.
app.route("/api/assay", assayPublicRoutes)

app.get("/api/edit/health", (c) => c.json({ ok: true }))
app.route("/api/edit/auth", authRoutes)

// Authenticated route groups: requireSession runs *before* rateLimit so that
// the rate-limit middleware can read `c.var.sessionId` from the context.
// drafts is GET-only — no rate limit needed (rateLimit short-circuits on GET
// anyway, but explicit not-mounting matches the spec).
app.use("/api/edit/contents/*", requireSession, rateLimit)
app.route("/api/edit/contents", contentsRoutes)

app.use("/api/edit/drafts/*", requireSession)
app.route("/api/edit/drafts", draftsRoutes)

app.use("/api/edit/pr/*", requireSession, rateLimit)
app.route("/api/edit/pr", prRoutes)

app.use("/api/edit/assets/*", requireSession, rateLimit)
app.route("/api/edit/assets", assetsRoutes)

app.use("/api/edit/assay/*", requireSession, rateLimit)
// More specific mount first: fork-annotations is a distinct sub-lane of the assay group.
app.route("/api/edit/assay/fork-annotations", assayForkAnnotationRoutes)
app.route("/api/edit/assay", assayPreviewRoutes)

app.route("/api/edit/assay-runner", assayRunnerRoutes)

app.get("/api/edit/_debug/session", requireSession, (c) => {
  // Redact user_token: this endpoint is for verifying the session round-trip,
  // not for exposing the bearer token. Public-safe equivalent is /auth/me (Task 10).
  const { user_token: _, ...safe } = c.var.session
  return c.json(safe)
})

export default app
