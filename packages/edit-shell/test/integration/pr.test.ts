import { env, SELF } from "cloudflare:test"
import { describe, expect, it } from "vitest"
import { githubHandlers } from "../fixtures/github-handlers"
import { createSession } from "../../src/auth/session"

// 1-commit compare so the route's squash step no-ops; tests that exercise
// squash register a multi-commit compare instead.
function noopSquashCompare(forkOwner = "alice", forkRepo = "cartularium", branch = "draft/alice/function-query-md") {
  githubHandlers.compareCommits(forkOwner, forkRepo, "main", branch, [], {
    commits: [{ sha: "tip-already-squashed" }],
  })
}

describe("POST /api/edit/pr", () => {
  it("opens a PR from fork to canonical and returns mergeable=true on clean", async () => {
    noopSquashCompare()
    // head must be `<forkOwner>:<branch>` (cross-repo form); 422 otherwise.
    githubHandlers.createPullRequest(42, {
      expectHead: "alice:draft/alice/function-query-md",
    })
    githubHandlers.getPullRequest(42, true)
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "draft/alice/function-query-md",
        title: "edit: QUERY",
        body: "Tweaked the SUMIF example.",
      }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      number: 42,
      url: "https://github.com/cartularium/cartularium/pull/42",
      mergeable: true,
    })
  })

  it("returns 409 with pr_url + pr_number when GitHub reports mergeable=false", async () => {
    noopSquashCompare()
    githubHandlers.createPullRequest(43)
    githubHandlers.getPullRequest(43, false)
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "draft/alice/function-query-md",
        title: "edit: QUERY",
        body: "Tweaked the SUMIF example.",
      }),
    })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      error: "conflict",
      pr_url: "https://github.com/cartularium/cartularium/pull/43",
      pr_number: 43,
      message: expect.stringContaining("conflict"),
    })
  })

  it("returns 200 success when GitHub still reports mergeable=null after the poll", async () => {
    noopSquashCompare()
    githubHandlers.createPullRequest(44)
    githubHandlers.getPullRequest(44, null)
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "draft/alice/function-query-md",
        title: "edit: QUERY",
        body: "Tweaked the SUMIF example.",
      }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      number: 44,
      url: "https://github.com/cartularium/cartularium/pull/44",
      mergeable: null,
    })
  })

  it("squashes the draft branch into a single commit before opening the PR", async () => {
    githubHandlers.compareCommits(
      "alice",
      "cartularium",
      "main",
      "draft/alice/function-query-md",
      [],
      {
        commits: [
          { sha: "auto1" },
          { sha: "auto2" },
          { sha: "auto3-tip" },
        ],
        mergeBaseSha: "main-base-sha",
      },
    )
    githubHandlers.getGitCommit("alice", "cartularium", "auto3-tip", "tree-from-tip")
    githubHandlers.createGitCommit("alice", "cartularium", "squashed-sha")
    githubHandlers.updateGitRef(
      "alice",
      "cartularium",
      "heads/draft/alice/function-query-md",
    )
    githubHandlers.createPullRequest(45, {
      expectHead: "alice:draft/alice/function-query-md",
    })
    githubHandlers.getPullRequest(45, true)
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "draft/alice/function-query-md",
        title: "edit: QUERY",
        body: "Tweaked the SUMIF example.",
      }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { number: number; mergeable: boolean | null }
    expect(body.number).toBe(45)
    // assertNoPendingInterceptors() in afterEach catches skipped sub-calls.
  })

  it("treats re-submit as idempotent when an open PR already exists, updating title/body", async () => {
    noopSquashCompare()
    githubHandlers.createPullRequestAlreadyExists()
    githubHandlers.listPullRequestsByHead("alice", "draft/alice/function-query-md", [
      { number: 99, title: "old title", body: "old body" },
    ])
    githubHandlers.updatePullRequest(99)
    githubHandlers.getPullRequest(99, true)
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "draft/alice/function-query-md",
        title: "edit: QUERY",
        body: "Tweaked the SUMIF example.",
      }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      number: 99,
      url: "https://github.com/cartularium/cartularium/pull/99",
      mergeable: true,
    })
  })

  it("skips pulls.update when typed title/body match the existing PR", async () => {
    noopSquashCompare()
    githubHandlers.createPullRequestAlreadyExists()
    // matching title/body — no updatePullRequest fixture; undici asserts
    // afterEach that no extra PATCH was issued.
    githubHandlers.listPullRequestsByHead("alice", "draft/alice/function-query-md", [
      { number: 100, title: "edit: QUERY", body: "Tweaked the SUMIF example." },
    ])
    githubHandlers.getPullRequest(100, true)
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: "alice/cartularium",
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branch: "draft/alice/function-query-md",
        title: "edit: QUERY",
        body: "Tweaked the SUMIF example.",
      }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      number: 100,
      url: "https://github.com/cartularium/cartularium/pull/100",
      mergeable: true,
    })
  })

  it("rejects when no fork_repo", async () => {
    const id = await createSession(env.SESSIONS, {
      user_login: "alice",
      user_id: 1,
      user_token: "ghu_x",
      token_expiry: Date.now() + 3600_000,
      fork_repo: null,
    })
    const res = await SELF.fetch("https://sheets.wiki/api/edit/pr", {
      method: "POST",
      headers: {
        Cookie: `__cart_sess=${id}`,
        Origin: "https://sheets.wiki",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ branch: "draft/alice/x", title: "t", body: "b" }),
    })
    expect(res.status).toBe(400)
  })
})
