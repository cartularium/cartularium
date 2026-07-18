import { Hono } from "hono"
import * as v from "valibot"
import type { Env } from "../env"
import { createSession, destroySession } from "../auth/session"
import { exchangeCodeForUserToken, fetchAuthenticatedUser } from "../auth/oauth"
import { serializeSessionCookie } from "../auth/cookie"
import { requireSession } from "../middleware/session"
import { requestOrigin } from "../util/origin"

const app = new Hono<{ Bindings: Env }>()

const RedirectSchema = v.pipe(
  v.string(),
  v.regex(/^\/(?!\/)[A-Za-z0-9._\-/?=&%]*$/, "redirect must be relative path"),
  v.check((s) => !s.includes("//"), "redirect must not contain protocol-relative segments"),
)

app.get("/login", async (c) => {
  const redirect = c.req.query("redirect") ?? "/"
  const parsed = v.safeParse(RedirectSchema, redirect)
  if (!parsed.success) return c.json({ error: "bad_redirect" }, 400)

  const state = newStateNonce()
  await c.env.SESSIONS.put(`state:${state}`, parsed.output, { expirationTtl: 600 })

  const url = new URL("https://github.com/login/oauth/authorize")
  url.searchParams.set("client_id", c.env.GITHUB_APP_CLIENT_ID)
  url.searchParams.set("state", state)
  url.searchParams.set("redirect_uri", `${requestOrigin(c)}/api/edit/auth/callback`)
  return c.redirect(url.toString(), 302)
})

app.get("/callback", async (c) => {
  const code = c.req.query("code")
  const state = c.req.query("state")
  if (!code || !state) return c.json({ error: "missing_params" }, 400)

  const redirectTo = await c.env.SESSIONS.get(`state:${state}`)
  if (!redirectTo) return c.json({ error: "bad_state" }, 400)
  await c.env.SESSIONS.delete(`state:${state}`)

  const tok = await exchangeCodeForUserToken({
    clientId: c.env.GITHUB_APP_CLIENT_ID,
    clientSecret: c.env.GITHUB_APP_CLIENT_SECRET,
    code,
  })
  const user = await fetchAuthenticatedUser(tok.access_token)

  const sessionId = await createSession(c.env.SESSIONS, {
    user_login: user.login,
    user_id: user.id,
    user_token: tok.access_token,
    // GitHub user-to-server tokens default to 8h; fall back if missing for any reason.
    token_expiry: Date.now() + (tok.expires_in || 28800) * 1000,
    fork_repo: null,
  })
  const isSecureRequest = new URL(c.req.url).protocol === "https:"
  const cookie = serializeSessionCookie(sessionId, {
    domain: c.env.COOKIE_DOMAIN,
    secure: isSecureRequest,
  })
  return new Response(null, {
    status: 302,
    headers: { Location: redirectTo, "Set-Cookie": cookie },
  })
})

function newStateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let s = ""
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

app.get("/me", requireSession, (c) => {
  const s = c.var.session
  return c.json({ login: s.user_login, id: s.user_id, fork_repo: s.fork_repo })
})

app.post("/logout", requireSession, async (c) => {
  await destroySession(c.env.SESSIONS, c.var.sessionId)
  const isSecureRequest = new URL(c.req.url).protocol === "https:"
  const cleared = serializeSessionCookie("", {
    domain: c.env.COOKIE_DOMAIN,
    secure: isSecureRequest,
    clear: true,
  })
  return new Response(null, { status: 204, headers: { "Set-Cookie": cleared } })
})

export default app
