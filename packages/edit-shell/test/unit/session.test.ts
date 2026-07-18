import { env } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import {
  createSession,
  loadSession,
  destroySession,
  newSessionId,
} from "../../src/auth/session"

describe("session module", () => {
  it("newSessionId emits 43 url-safe chars (32 bytes base64url)", () => {
    const id = newSessionId()
    expect(id).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it("create + load round-trip", async () => {
    const record = {
      user_login: "alice",
      user_id: 12345,
      user_token: "ghu_token",
      token_expiry: Date.now() + 8 * 3600 * 1000,
      fork_repo: null,
    }
    const id = await createSession(env.SESSIONS, record)
    const loaded = await loadSession(env.SESSIONS, id)
    expect(loaded).toEqual(record)
  })

  it("loadSession returns null for unknown id", async () => {
    const loaded = await loadSession(env.SESSIONS, "not-a-real-id")
    expect(loaded).toBeNull()
  })

  it("destroySession removes the record", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "bob",
      user_id: 99,
      user_token: "ghu_x",
      token_expiry: Date.now() + 1000,
      fork_repo: null,
    })
    await destroySession(env.SESSIONS, id)
    expect(await loadSession(env.SESSIONS, id)).toBeNull()
  })
})
