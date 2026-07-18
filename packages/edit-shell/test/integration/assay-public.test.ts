import { env, SELF } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { MANIFEST_R2_KEY } from "../../src/routes/assay-public"

// mirrors migrations/0007 + 0008 (tests apply schema manually)
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
  verified_by TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);`

const BASE = "https://sheets.wiki/api/assay"

async function insert(id: string, status: string, scope: unknown = [{ kind: "ref-set", refs: ["SUM/add"] }]) {
  await env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_fork_annotations
       (id, author_id, content, cause, scope_json, status, created_at, updated_at)
     VALUES (?, 'auto-seeded (provisional)', 'c', 'precision', ?, ?, '2026-01-01', '2026-01-01')`,
  )
    .bind(id, JSON.stringify(scope), status)
    .run()
}

// a minimal ManifestV5 with one forked and one uniform test
const MANIFEST = {
  version: 5,
  generatedAt: "2026-07-11T00:00:00.000Z",
  engines: ["excel", "gsheets"],
  rung: "circulating",
  tests: {
    "SUM/add": {
      ref: "SUM/add", subject: "SUM", subjectRef: "SUM", name: "add", suite: "math",
      hash: "sha256:a", url: "/test/SUM/add/", category: "value",
      engines: { excel: { capability: "value", class: 0 }, gsheets: { capability: "value", class: 1 } },
      partition: [
        { engines: ["excel"], values: [[[{ c: "number", v: 1 }]]] },
        { engines: ["gsheets"], values: [[[{ c: "number", v: 2 }]]] },
      ],
    },
    "ABS/one": {
      ref: "ABS/one", subject: "ABS", subjectRef: "ABS", name: "one", suite: "math",
      hash: "sha256:b", url: "/test/ABS/one/", category: "value",
      engines: { excel: { capability: "value", class: 0 }, gsheets: { capability: "value", class: 0 } },
      partition: [{ engines: ["excel", "gsheets"], values: [[[{ c: "number", v: 1 }]]] }],
    },
  },
  functions: {},
  aliases: {},
  tombstones: {},
  hashes: {},
}

describe("public assay read lane (/api/assay)", () => {
  beforeEach(async () => {
    await env.ASSAY_PREVIEW_DB.prepare(SCHEMA).run()
    await env.ASSAY_PREVIEW_DB.exec("DELETE FROM assay_fork_annotations")
    await env.ASSAY_PREVIEW.delete(MANIFEST_R2_KEY)
  })

  it("serves published annotations with no session, CORS-open", async () => {
    await insert("DV-0001", "published")
    const res = await SELF.fetch(`${BASE}/fork-annotations`)
    expect(res.status).toBe(200)
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*")
    expect(res.headers.get("X-Assay-Api-Stability")).toBe("experimental")
    const body = (await res.json()) as { version: number; annotations: Array<{ id: string; scope: unknown[] }> }
    expect(body.version).toBe(1)
    expect(body.annotations.map((a) => a.id)).toEqual(["DV-0001"])
    expect(body.annotations[0]?.scope).toEqual([{ kind: "ref-set", refs: ["SUM/add"] }])
  })

  it("never leaks pending or rejected rows", async () => {
    await insert("DV-0001", "published")
    await insert("DV-0002", "pending")
    await insert("DV-0003", "rejected")
    const res = await SELF.fetch(`${BASE}/fork-annotations`)
    const body = (await res.json()) as { annotations: Array<{ id: string }> }
    expect(body.annotations.map((a) => a.id)).toEqual(["DV-0001"])
  })

  it("fork-coverage 503s with a delivery hint while no manifest is published", async () => {
    const res = await SELF.fetch(`${BASE}/fork-coverage`)
    expect(res.status).toBe(503)
    const body = (await res.json()) as { hint: string }
    expect(body.hint).toContain(MANIFEST_R2_KEY)
  })

  it("fork-coverage joins the R2 manifest with published annotations", async () => {
    await env.ASSAY_PREVIEW.put(MANIFEST_R2_KEY, JSON.stringify(MANIFEST))
    await insert("DV-0001", "published") // covers the forked SUM/add
    await insert("DV-0002", "pending", [{ kind: "ref-set", refs: ["SUM/add"] }]) // must not count
    const res = await SELF.fetch(`${BASE}/fork-coverage`)
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      manifestGeneratedAt: string
      totals: { forks: number; coveredForks: number; annotations: number }
      uncoveredForks: string[]
    }
    expect(body.manifestGeneratedAt).toBe("2026-07-11T00:00:00.000Z")
    expect(body.totals).toMatchObject({ forks: 1, coveredForks: 1, annotations: 1 })
    expect(body.uncoveredForks).toEqual([])
  })
})
