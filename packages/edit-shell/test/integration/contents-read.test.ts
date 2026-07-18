import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { createSession } from "../../src/auth/session"

describe("GET /api/edit/contents/:path", () => {
  it("returns file content for a known path", async () => {
    githubHandlers.getContent(
      "cartularium",
      "cartularium",
      "packages/sheets-wiki/content/function/QUERY.md",
      "# QUERY\n\nDocs...",
    )
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/packages%2Fsheets-wiki%2Fcontent%2Ffunction%2FQUERY.md",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { content: string; sha: string }
    expect(body.content).toBe("# QUERY\n\nDocs...")
    expect(body.sha).toBe("abc123")
  })

  it("returns 404 for missing file", async () => {
    githubHandlers.getContentMissing("cartularium", "cartularium", "no/such/file.md")
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/no%2Fsuch%2Ffile.md",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(404)
  })

  it("requires authentication", async () => {
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/anything.md",
    )
    expect(res.status).toBe(401)
  })

  it("rejects '..' segments in the path with 400 bad_path", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/..%2Fetc%2Fpasswd",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "bad_path" })
  })

  it("rejects PUT with '..' segments in the path with 400 bad_path", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/..%2Fetc%2Fpasswd",
      {
        method: "PUT",
        headers: {
          Cookie: `__cart_sess=${id}`,
          Origin: "https://sheets.wiki",
          "content-type": "application/json",
        },
        body: JSON.stringify({ content: "x" }),
      },
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "bad_path" })
  })

  it("rejects absolute paths with 400 bad_path", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/%2Fabsolute%2Fpath",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "bad_path" })
  })

  it("fork=true reads from the session's fork_repo at the requested ref", async () => {
    githubHandlers.getContent(
      "alice",
      "cartularium",
      "packages/sheets-wiki/content/function/QUERY.md",
      "# QUERY (draft)\n\nWIP edit.",
      "abc123",
      "draft/alice/packages-sheets-wiki-content-function-QUERY.md",
    )
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/packages%2Fsheets-wiki%2Fcontent%2Ffunction%2FQUERY.md?fork=true&ref=draft%2Falice%2Fpackages-sheets-wiki-content-function-QUERY.md",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { content: string; sha: string }
    expect(body.content).toBe("# QUERY (draft)\n\nWIP edit.")
  })

  it("fork=true returns 404 no_fork when the session has no fork_repo", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/packages%2Fsheets-wiki%2Fcontent%2Ffunction%2FQUERY.md?fork=true",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "no_fork" })
  })

  it("fork=true returns 404 not_found when the file/branch isn't in the fork", async () => {
    githubHandlers.getContentMissing(
      "alice",
      "cartularium",
      "packages/sheets-wiki/content/function/QUERY.md",
      "draft/alice/missing",
    )
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/packages%2Fsheets-wiki%2Fcontent%2Ffunction%2FQUERY.md?fork=true&ref=draft%2Falice%2Fmissing",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(404)
  })

  it("round-trips non-ASCII content as UTF-8", async () => {
    const payload = "# QUERY — example with em‑dash and CJK 日本語\n"
    githubHandlers.getContent(
      "cartularium",
      "cartularium",
      "packages/sheets-wiki/content/function/QUERY.md",
      payload,
    )
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/packages%2Fsheets-wiki%2Fcontent%2Ffunction%2FQUERY.md",
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { content: string; sha: string }
    expect(body.content).toBe(payload)
  })
})
