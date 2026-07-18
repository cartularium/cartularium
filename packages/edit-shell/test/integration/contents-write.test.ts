import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { createSession, loadSession } from "../../src/auth/session"

describe("PUT /api/edit/contents/:path", () => {
  it("commits to draft branch in user fork (existing fork, branch needs creation)", async () => {
    githubHandlers.getRefMissing("alice", "cartularium", "heads/draft%2Falice%2Fpackages-sheets-wiki-content-function-query-md")
    githubHandlers.getDefaultBranchSha("alice", "cartularium")
    githubHandlers.createRef("alice", "cartularium")
    // post-createRef propagation poll
    githubHandlers.getRefExists(
      "alice",
      "cartularium",
      "heads/draft%2Falice%2Fpackages-sheets-wiki-content-function-query-md",
    )
    // getContent reads from baseBranch (main) when branch is fresh — stable
    // across propagation. file truly doesn't exist on either ref here.
    githubHandlers.getContentMissing(
      "alice",
      "cartularium",
      "packages/sheets-wiki/content/function/QUERY.md",
      "main",
    )
    // Body matchers: assert the request to GitHub carries a base64-encoded
    // content payload and a non-empty commit message. A regression that
    // forwarded raw content or dropped the message would silently 422 in
    // production but pass tests without these checks.
    githubHandlers.putContent(
      "alice",
      "cartularium",
      "packages/sheets-wiki/content/function/QUERY.md",
      "newsha456",
      { expectBase64Content: true, expectNonEmptyMessage: true },
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
      {
        method: "PUT",
        headers: {
          Cookie: `__cart_sess=${id}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "# QUERY (edited)\n", message: "edit query" }),
      },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { branch: string; commit_sha: string }
    expect(body.branch).toBe("draft/alice/packages-sheets-wiki-content-function-query-md")
    expect(body.commit_sha).toBe("commit-sha-789")
  })

  describe("malformed PUT body", () => {
    async function makeSession() {
      return await createSession(env.SESSIONS, {
        user_login: "alice",
        user_id: 1,
        user_token: "ghu_x",
        token_expiry: Date.now() + 3600_000,
        fork_repo: "alice/cartularium",
      })
    }

    async function put(id: string, body: unknown) {
      return SELF.fetch(
        "https://sheets.wiki/api/edit/contents/blog%2Fhello.md",
        {
          method: "PUT",
          headers: {
            Cookie: `__cart_sess=${id}`,
            Origin: "https://sheets.wiki",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      )
    }

    it("rejects content as a number with 400 bad_body", async () => {
      const id = await makeSession()
      const res = await put(id, { content: 12345 })
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: "bad_body" })
    })

    it("rejects branch failing the regex with 400 bad_body", async () => {
      const id = await makeSession()
      // Branch regex is ^[A-Za-z0-9._\-/]+$ — '@' is outside the allowlist.
      const res = await put(id, { content: "x", branch: "evil@branch" })
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: "bad_body" })
    })

    it("rejects missing content with 400 bad_body", async () => {
      const id = await makeSession()
      const res = await put(id, {})
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: "bad_body" })
    })
  })

  it("retries the branch-ref poll until propagation completes (first save race)", async () => {
    const branchEnc = "heads/draft%2Falice%2Fblog-hello-md"
    githubHandlers.getRefMissing("alice", "cartularium", branchEnc)
    githubHandlers.getDefaultBranchSha("alice", "cartularium")
    githubHandlers.createRef("alice", "cartularium")
    // first poll after createRef: branch ref hasn't propagated yet (404).
    githubHandlers.getRefMissing("alice", "cartularium", branchEnc)
    // second poll: now live.
    githubHandlers.getRefExists("alice", "cartularium", branchEnc)
    githubHandlers.getContentMissing("alice", "cartularium", "blog/hello.md", "main")
    githubHandlers.putContent("alice", "cartularium", "blog/hello.md")
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/blog%2Fhello.md",
      {
        method: "PUT",
        headers: {
          Cookie: `__cart_sess=${id}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "x", message: "edit" }),
      },
    )
    expect(res.status).toBe(200)
  })

  it("retries the write itself when the contents API still 404s on a fresh branch", async () => {
    const branchEnc = "heads/draft%2Falice%2Fblog-hello-md"
    githubHandlers.getRefMissing("alice", "cartularium", branchEnc)
    githubHandlers.getDefaultBranchSha("alice", "cartularium")
    githubHandlers.createRef("alice", "cartularium")
    githubHandlers.getRefExists("alice", "cartularium", branchEnc)
    githubHandlers.getContentMissing("alice", "cartularium", "blog/hello.md", "main")
    // ref API caught up but contents API hasn't — first PUT 404s.
    githubHandlers.putContentNotFound("alice", "cartularium", "blog/hello.md")
    // retry succeeds.
    githubHandlers.putContent("alice", "cartularium", "blog/hello.md")
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/blog%2Fhello.md",
      {
        method: "PUT",
        headers: {
          Cookie: `__cart_sess=${id}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "x", message: "edit" }),
      },
    )
    expect(res.status).toBe(200)
  })

  it("maps createRef 422 (branch-creation race) to a clean 409 branch_conflict", async () => {
    githubHandlers.getRefMissing(
      "alice",
      "cartularium",
      "heads/draft%2Falice%2Fblog-hello-md",
    )
    githubHandlers.getDefaultBranchSha("alice", "cartularium")
    githubHandlers.createRefConflict("alice", "cartularium")
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/blog%2Fhello.md",
      {
        method: "PUT",
        headers: {
          Cookie: `__cart_sess=${id}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "x", message: "edit" }),
      },
    )
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "branch_conflict" })
  })

  it("auto-forks when fork_repo is null on session", async () => {
    githubHandlers.getRepoNotFound("alice")
    githubHandlers.createFork("alice")
    githubHandlers.getRefMissing("alice", "cartularium", "heads/draft%2Falice%2Fblog-hello-md")
    githubHandlers.getDefaultBranchSha("alice", "cartularium")
    githubHandlers.createRef("alice", "cartularium")
    githubHandlers.getRefExists(
      "alice",
      "cartularium",
      "heads/draft%2Falice%2Fblog-hello-md",
    )
    githubHandlers.getContentMissing("alice", "cartularium", "blog/hello.md", "main")
    githubHandlers.putContent("alice", "cartularium", "blog/hello.md")
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch(
      "https://sheets.wiki/api/edit/contents/blog%2Fhello.md",
      {
        method: "PUT",
        headers: {
          Cookie: `__cart_sess=${id}`,
          Origin: "https://sheets.wiki",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: "hello\n", message: "new post" }),
      },
    )
    expect(res.status).toBe(200)
    // Session should now record the fork.
    const updated = await loadSession(env.SESSIONS, id)
    expect(updated?.fork_repo).toBe("alice/cartularium")
  })
})
