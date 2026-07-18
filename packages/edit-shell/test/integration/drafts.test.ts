import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { createSession } from "../../src/auth/session"

describe("GET /api/edit/drafts", () => {
  it("lists user's draft branches enriched with file diffs", async () => {
    githubHandlers.listBranches("alice", "cartularium", [
      { name: "main", sha: "main-sha" },
      { name: "draft/alice/blog-hello-md", sha: "draft-sha-1" },
      { name: "draft/alice/function-query-md", sha: "draft-sha-2" },
      { name: "feature/unrelated", sha: "feat-sha" },
    ])
    githubHandlers.compareCommits(
      "alice",
      "cartularium",
      "main",
      "draft/alice/blog-hello-md",
      [
        {
          filename: "packages/sheets-wiki/content/blog/hello.md",
          additions: 5,
          deletions: 1,
        },
      ],
      { headCommitDate: "2026-04-27T10:00:00Z" },
    )
    githubHandlers.compareCommits(
      "alice",
      "cartularium",
      "main",
      "draft/alice/function-query-md",
      [
        {
          filename: "packages/sheets-wiki/content/function/QUERY.md",
          additions: 15,
          deletions: 4,
        },
        {
          filename: "packages/sheets-wiki/content/function/QUERY-examples.md",
          additions: 23,
          deletions: 5,
        },
      ],
      { headCommitDate: "2026-04-28T11:00:00Z" },
    )
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/drafts", {
      headers: { Cookie: `__cart_sess=${id}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      drafts: Array<{
        branch: string
        slug: string
        commit_sha: string
        updated_at: string
        files: Array<{ path: string; added: number; removed: number }>
        added: number
        removed: number
      }>
    }
    expect(body.drafts).toHaveLength(2)
    expect(body.drafts).toContainEqual({
      branch: "draft/alice/blog-hello-md",
      slug: "blog-hello-md",
      commit_sha: "draft-sha-1",
      updated_at: "2026-04-27T10:00:00Z",
      files: [
        {
          path: "packages/sheets-wiki/content/blog/hello.md",
          added: 5,
          removed: 1,
        },
      ],
      added: 5,
      removed: 1,
    })
    expect(body.drafts).toContainEqual({
      branch: "draft/alice/function-query-md",
      slug: "function-query-md",
      commit_sha: "draft-sha-2",
      updated_at: "2026-04-28T11:00:00Z",
      files: [
        {
          path: "packages/sheets-wiki/content/function/QUERY.md",
          added: 15,
          removed: 4,
        },
        {
          path: "packages/sheets-wiki/content/function/QUERY-examples.md",
          added: 23,
          removed: 5,
        },
      ],
      added: 38,
      removed: 9,
    })
  })

  it("returns empty list when no fork_repo", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/drafts", {
      headers: { Cookie: `__cart_sess=${id}` },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ drafts: [] })
  })
})

describe("GET /api/edit/drafts/:branch/files", () => {
  it("returns the list of files diverging in a single draft", async () => {
    githubHandlers.compareCommits(
      "alice",
      "cartularium",
      "main",
      "draft/alice/function-query-md",
      [
        {
          filename: "packages/sheets-wiki/content/function/QUERY.md",
          additions: 15,
          deletions: 4,
        },
      ],
    )
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const branchEnc = encodeURIComponent("draft/alice/function-query-md")
    const res = await SELF.fetch(
      `https://sheets.wiki/api/edit/drafts/${branchEnc}/files`,
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      files: Array<{ path: string; added: number; removed: number }>
    }
    expect(body.files).toEqual([
      {
        path: "packages/sheets-wiki/content/function/QUERY.md",
        added: 15,
        removed: 4,
      },
    ])
  })

  it("rejects requests for branches outside the user's draft prefix (403)", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const branchEnc = encodeURIComponent("draft/bob/secret")
    const res = await SELF.fetch(
      `https://sheets.wiki/api/edit/drafts/${branchEnc}/files`,
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(403)
  })

  it("returns 400 when the session has no fork_repo", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const branchEnc = encodeURIComponent("draft/alice/x")
    const res = await SELF.fetch(
      `https://sheets.wiki/api/edit/drafts/${branchEnc}/files`,
      { headers: { Cookie: `__cart_sess=${id}` } },
    )
    expect(res.status).toBe(400)
  })
})
