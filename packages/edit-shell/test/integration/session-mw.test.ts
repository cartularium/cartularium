import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { createSession, loadSession } from "../../src/auth/session"

describe("session middleware", () => {
  it("populates session var when cookie is valid", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/_debug/session", {
      headers: { Cookie: `__cart_sess=${id}` },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ user_login: "alice" })
  })

  it("returns 401 when /_debug/session is hit without a cookie", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/_debug/session")
    expect(res.status).toBe(401)
  })

  it("returns 401 when cookie is invalid", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/_debug/session", {
      headers: { Cookie: "__cart_sess=garbage" },
    })
    expect(res.status).toBe(401)
  })

  it("returns 401 token_expired and destroys session when token is past expiry", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() - 1000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/_debug/session", {
      headers: { Cookie: `__cart_sess=${id}` },
    })
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "token_expired" })
    expect(await loadSession(env.SESSIONS, id)).toBeNull()
  })

  it("does not leak user_token in the debug response", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_secret",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/_debug/session", {
      headers: { Cookie: `__cart_sess=${id}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Record<string, unknown>
    expect(body).not.toHaveProperty("user_token")
    expect(body.user_login).toBe("alice")
  })
})
