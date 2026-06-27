import { env, SELF } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { createSession } from "../../src/auth/session"

// mirrors migrations/0007_assay_fork_annotations.sql (tests apply schema manually)
const SCHEMA = `
CREATE TABLE IF NOT EXISTS assay_fork_annotations (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  cause TEXT,
  scope_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'published', 'rejected')
  ),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`

const BASE = "https://sheets.wiki/api/edit/assay/fork-annotations"

// "alice" is the configured ASSAY_MAINTAINERS entry (vitest.config.ts); "bob"/"carol" are not.
async function makeSession(user: string): Promise<string> {
  return createSession(env.SESSIONS, {
    user_login: user,
    user_id: 1,
    user_token: "ghu_x",
    token_expiry: Date.now() + 3600_000,
    fork_repo: null,
  })
}

function authed(sessionId: string, method: string, body?: unknown): RequestInit {
  return {
    method,
    headers: {
      Cookie: `__cart_sess=${sessionId}`,
      Origin: "https://sheets.wiki",
      "Content-Type": "application/json",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }
}

const VALID = {
  content: "excel and gsheets fork on error attribution here",
  cause: "error-attribution",
  scope: [{ kind: "ref-set", refs: ["IFERROR/nested"] }],
}

async function create(sessionId: string, body: unknown = VALID) {
  return SELF.fetch(BASE, authed(sessionId, "POST", body))
}

describe("assay fork-annotation store", () => {
  beforeEach(async () => {
    await env.ASSAY_PREVIEW_DB.prepare(SCHEMA).run()
    await env.ASSAY_PREVIEW_DB.exec("DELETE FROM assay_fork_annotations")
  })

  it("requires a session", async () => {
    const res = await SELF.fetch(BASE, {
      method: "POST",
      headers: { Origin: "https://sheets.wiki", "Content-Type": "application/json" },
      body: JSON.stringify(VALID),
    })
    expect(res.status).toBe(401)
  })

  it("creates a pending, attributed annotation", async () => {
    const bob = await makeSession("bob")
    const res = await create(bob)
    expect(res.status).toBe(201)
    const { annotation } = (await res.json()) as any
    expect(annotation.id).toBeTruthy()
    expect(annotation.author_id).toBe("bob")
    expect(annotation.status).toBe("pending")
    expect(annotation.cause).toBe("error-attribution")
    expect(annotation.scope).toEqual(VALID.scope)
  })

  it("rejects an empty scope, empty content, and an unknown cause", async () => {
    const bob = await makeSession("bob")
    expect((await create(bob, { content: "x", scope: [] })).status).toBe(400)
    expect((await create(bob, { content: "   ", scope: VALID.scope })).status).toBe(400)
    expect((await create(bob, { content: "x", cause: "not-a-cause", scope: VALID.scope })).status).toBe(400)
  })

  it("accepts a predicate scope clause", async () => {
    const bob = await makeSession("bob")
    const res = await create(bob, {
      content: "all the volatile-tagged forks",
      scope: [{ kind: "predicate", query: { tags: ["volatile"], valueKind: "number" } }],
    })
    expect(res.status).toBe(201)
  })

  it("hides others' pending rows from non-maintainers but shows published ones", async () => {
    const bob = await makeSession("bob")
    const carol = await makeSession("carol")
    const created = (await (await create(bob)).json()) as any
    const id = created.annotation.id

    // carol (non-maintainer, non-author) does not see bob's pending row
    const carolList = (await (await SELF.fetch(BASE, authed(carol, "GET"))).json()) as any
    expect(carolList.annotations).toHaveLength(0)
    expect((await SELF.fetch(`${BASE}/${id}`, authed(carol, "GET"))).status).toBe(404)

    // bob sees his own pending row
    const bobList = (await (await SELF.fetch(BASE, authed(bob, "GET"))).json()) as any
    expect(bobList.annotations.map((a: any) => a.id)).toContain(id)

    // a maintainer publishes it; now carol sees it
    const alice = await makeSession("alice")
    const review = await SELF.fetch(`${BASE}/${id}/review`, authed(alice, "POST", { decision: "publish" }))
    expect(review.status).toBe(200)
    expect(((await review.json()) as any).annotation.status).toBe("published")

    const carolList2 = (await (await SELF.fetch(BASE, authed(carol, "GET"))).json()) as any
    expect(carolList2.annotations.map((a: any) => a.id)).toContain(id)
  })

  it("gates the review action behind maintainer", async () => {
    const bob = await makeSession("bob")
    const id = ((await (await create(bob)).json()) as any).annotation.id
    const res = await SELF.fetch(`${BASE}/${id}/review`, authed(bob, "POST", { decision: "publish" }))
    expect(res.status).toBe(403)
  })

  it("lets the author edit, and re-enters review when a published row is edited", async () => {
    const bob = await makeSession("bob")
    const alice = await makeSession("alice")
    const id = ((await (await create(bob)).json()) as any).annotation.id
    await SELF.fetch(`${BASE}/${id}/review`, authed(alice, "POST", { decision: "publish" }))

    // a non-owner non-maintainer cannot edit
    const carol = await makeSession("carol")
    expect((await SELF.fetch(`${BASE}/${id}`, authed(carol, "PATCH", { content: "hijack" }))).status).toBe(403)

    // the author edits their published row -> back to pending
    const patched = await SELF.fetch(`${BASE}/${id}`, authed(bob, "PATCH", { content: "revised reading" }))
    expect(patched.status).toBe(200)
    const body = (await patched.json()) as any
    expect(body.annotation.content).toBe("revised reading")
    expect(body.annotation.status).toBe("pending")

    // an empty patch is rejected
    expect((await SELF.fetch(`${BASE}/${id}`, authed(bob, "PATCH", {}))).status).toBe(400)
  })

  it("a maintainer edit preserves status", async () => {
    const bob = await makeSession("bob")
    const alice = await makeSession("alice")
    const id = ((await (await create(bob)).json()) as any).annotation.id
    await SELF.fetch(`${BASE}/${id}/review`, authed(alice, "POST", { decision: "publish" }))

    const patched = await SELF.fetch(`${BASE}/${id}`, authed(alice, "PATCH", { content: "maintainer tidy-up" }))
    expect(((await patched.json()) as any).annotation.status).toBe("published")
  })

  it("re-enters review when a rejected row is edited by its author", async () => {
    const bob = await makeSession("bob")
    const alice = await makeSession("alice")
    const id = ((await (await create(bob)).json()) as any).annotation.id
    await SELF.fetch(`${BASE}/${id}/review`, authed(alice, "POST", { decision: "reject" }))

    const patched = await SELF.fetch(`${BASE}/${id}`, authed(bob, "PATCH", { content: "addressed the feedback" }))
    expect(patched.status).toBe(200)
    expect(((await patched.json()) as any).annotation.status).toBe("pending")
  })

  it("clears cause with an explicit null", async () => {
    const bob = await makeSession("bob")
    const id = ((await (await create(bob)).json()) as any).annotation.id // created with cause: error-attribution
    const patched = await SELF.fetch(`${BASE}/${id}`, authed(bob, "PATCH", { cause: null }))
    expect(patched.status).toBe(200)
    expect(((await patched.json()) as any).annotation.cause).toBeUndefined()
  })

  it("rejects whitespace-only scope tokens", async () => {
    const bob = await makeSession("bob")
    expect((await create(bob, { content: "x", scope: [{ kind: "ref-set", refs: ["   "] }] })).status).toBe(400)
  })

  it("hides a pending row from a stranger's delete (404), but 403s a visible one", async () => {
    const bob = await makeSession("bob")
    const carol = await makeSession("carol")
    const alice = await makeSession("alice")
    const id = ((await (await create(bob)).json()) as any).annotation.id

    // pending row: carol can't see it -> 404 (existence hidden, consistent with GET)
    expect((await SELF.fetch(`${BASE}/${id}`, authed(carol, "DELETE"))).status).toBe(404)

    // once published, carol can see it -> 403 (visible, but not hers)
    await SELF.fetch(`${BASE}/${id}/review`, authed(alice, "POST", { decision: "publish" }))
    expect((await SELF.fetch(`${BASE}/${id}`, authed(carol, "DELETE"))).status).toBe(403)

    // the author can delete
    expect((await SELF.fetch(`${BASE}/${id}`, authed(bob, "DELETE"))).status).toBe(204)
    expect((await SELF.fetch(`${BASE}/${id}`, authed(bob, "GET"))).status).toBe(404)
  })
})
