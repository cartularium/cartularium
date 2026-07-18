import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { createSession } from "../../src/auth/session"

describe("auth flow", () => {
  it("GET /auth/login redirects to github with state", async () => {
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/auth/login?redirect=/edit/QUERY",
      { redirect: "manual" },
    )
    expect(res.status).toBe(302)
    const loc = res.headers.get("Location")!
    expect(loc.startsWith("https://github.com/login/oauth/authorize")).toBe(true)
    const url = new URL(loc)
    expect(url.searchParams.get("client_id")).toBeTruthy()
    expect(url.searchParams.get("state")).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("GET /auth/login rejects open redirects", async () => {
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/auth/login?redirect=https://evil.example",
      { redirect: "manual" },
    )
    expect(res.status).toBe(400)
  })

  it("callback exchanges code, sets cookie, redirects", async () => {
    // Body matcher: assert the worker sends the same code we received from
    // GitHub (i.e. the redirect query param is forwarded into the token
    // exchange request, not silently dropped or mangled).
    githubHandlers.exchangeCodeOk({ expectCode: "test-code" })
    githubHandlers.getAuthenticatedUser("alice", 1)

    // First, hit /auth/login to establish state in KV.
    const loginRes = await SELF.fetch(
      "https://sheets.wiki/api/edit/auth/login?redirect=/edit/QUERY",
      { redirect: "manual" },
    )
    const state = new URL(loginRes.headers.get("Location")!).searchParams.get("state")!

    const cbRes = await SELF.fetch(
      `https://sheets.wiki/api/edit/auth/callback?code=test-code&state=${state}`,
      { redirect: "manual" },
    )
    expect(cbRes.status).toBe(302)
    expect(cbRes.headers.get("Location")).toBe("/edit/QUERY")
    const setCookie = cbRes.headers.get("Set-Cookie")!
    expect(setCookie).toContain("__cart_sess=")
    expect(setCookie).toContain("Domain=.sheets.wiki")
  })

  it("callback rejects state replay (second use of same state -> bad_state)", async () => {
    githubHandlers.exchangeCodeOk()
    githubHandlers.getAuthenticatedUser("alice", 1)

    const loginRes = await SELF.fetch(
      "https://sheets.wiki/api/edit/auth/login?redirect=/edit/QUERY",
      { redirect: "manual" },
    )
    const state = new URL(loginRes.headers.get("Location")!).searchParams.get("state")!

    const first = await SELF.fetch(
      `https://sheets.wiki/api/edit/auth/callback?code=test-code&state=${state}`,
      { redirect: "manual" },
    )
    expect(first.status).toBe(302)

    // Replay attempt — state was deleted on first use, second must reject.
    const second = await SELF.fetch(
      `https://sheets.wiki/api/edit/auth/callback?code=test-code&state=${state}`,
      { redirect: "manual" },
    )
    expect(second.status).toBe(400)
    expect(await second.json()).toEqual({ error: "bad_state" })
  })

  it("callback rejects unknown state", async () => {
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/auth/callback?code=x&state=bogus",
      { redirect: "manual" },
    )
    expect(res.status).toBe(400)
  })

  it("login rejects protocol-relative paths embedded as query", async () => {
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/auth/login?redirect=/safe?next=//evil.example",
      { redirect: "manual" },
    )
    expect(res.status).toBe(400)
  })
})

describe("auth /me /logout", () => {
  it("GET /auth/me returns the current user", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/auth/me", {
      headers: { Cookie: `__cart_sess=${id}` },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ login: "alice", id: 1, fork_repo: null })
  })

  it("GET /auth/me returns 401 unauthenticated", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/auth/me")
    expect(res.status).toBe(401)
  })

  it("POST /auth/logout clears cookie + session", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "bob",
      user_id: 2,
      user_token: "ghu_y",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/auth/logout", {
      method: "POST",
      headers: { Cookie: `__cart_sess=${id}`, Origin: "https://sheets.wiki" },
    })
    expect(res.status).toBe(204)
    const setCookie = res.headers.get("Set-Cookie")!
    expect(setCookie).toContain("Max-Age=0")
    expect(await env.SESSIONS.get(id)).toBeNull()
  })
})
