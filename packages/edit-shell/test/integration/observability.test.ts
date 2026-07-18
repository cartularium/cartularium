import { SELF, env } from "cloudflare:test"
import { describe, expect, it, vi } from "vitest"
import { createSession } from "../../src/auth/session"

describe("request-id middleware", () => {
  it("mints an X-Request-Id when none is provided", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health")
    const id = res.headers.get("X-Request-Id")
    expect(id).toMatch(/^[a-f0-9]{12}$/)
  })

  it("honors an inbound X-Request-Id", async () => {
    const res = await SELF.fetch("https://sheets.wiki/api/edit/health", {
      headers: { "X-Request-Id": "client-supplied-abc" },
    })
    expect(res.headers.get("X-Request-Id")).toBe("client-supplied-abc")
  })
})

describe("errorLogger", () => {
  it("turns an uncaught throw into a structured 500 with requestId", async () => {
    // Hit a route that we know will throw — easiest: GET /api/edit/contents/<path>
    // with a session whose user_token doesn't match any GitHub interceptor.
    // The Octokit call will throw (no mock matches → fetchMock errors out).

    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_unmocked",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/some%2Fpath.md",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )

    expect(res.status).toBeGreaterThanOrEqual(500)
    const body = (await res.json()) as { error: string; requestId: string }
    expect(body.error).toBe("internal_error")
    expect(body.requestId).toMatch(/^[a-f0-9]{12}$/)
    expect(res.headers.get("X-Request-Id")).toBe(body.requestId)

    // Verify the log line was structured.
    const errCall = errSpy.mock.calls[0]?.[0]
    expect(typeof errCall).toBe("string")
    const parsed = JSON.parse(errCall as string) as Record<string, unknown>
    expect(parsed.level).toBe("error")
    // URL.pathname preserves percent-encoding — useful in logs since it
    // matches what the client actually sent on the wire.
    expect(parsed.route).toBe("/api/edit/contents/some%2Fpath.md")
    expect(parsed.method).toBe("GET")
    expect(parsed.requestId).toBe(body.requestId)

    errSpy.mockRestore()
  })
})
