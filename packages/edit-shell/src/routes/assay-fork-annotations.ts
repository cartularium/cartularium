// The fork-annotation store API (CP3 increment #3, 3b — ratified 2026-06-26).
//
// CRUD over attributed, scoped fork annotations, plus the §9 review gate (OPTION B, "light
// review"): a contribution lands `pending` and a maintainer publishes or rejects it. The store
// holds the contributed WHY, joined to assay's manifest out of band by case-ref; assay itself
// stays observation-only. The shared shape is `@cartularium/contracts` (edit-shell's first
// contracts edge — see annotation-store-design-2026-06-20.md §8).
//
// Mounted at /api/edit/assay/fork-annotations; requireSession + rateLimit are applied upstream by
// the /api/edit/assay/* group in src/index.ts. Public (unauthenticated) read for the renderer is
// deferred to the website rework (#4); for now reads are session-gated like the rest of the lane.

import { Hono } from "hono"
import * as v from "valibot"
import { ALL_CAUSES, ALL_PLATFORMS } from "@cartularium/contracts"
import type { AnnotationScope, AssayForkAnnotationStatus, AssayForkAnnotationV1, Cause } from "@cartularium/contracts"
import type { Env } from "../env"
import { isAssayMaintainer } from "./assay-preview"

const app = new Hono<{ Bindings: Env }>()

const MAX_CONTENT_LENGTH = 8000
const STATUSES: AssayForkAnnotationStatus[] = ["pending", "published", "rejected"]

// === request validation (valibot) ===

const Token = v.pipe(v.string(), v.trim(), v.nonEmpty()) // no blank/whitespace-only refs, tags, subjects

const RefSetClause = v.object({
  kind: v.literal("ref-set"),
  refs: v.pipe(v.array(Token), v.minLength(1)),
})

const ForkPredicateSchema = v.object({
  tags: v.optional(v.array(Token)),
  enginesAlone: v.optional(v.array(v.picklist(ALL_PLATFORMS))),
  valueKind: v.optional(v.picklist(["error", "number", "text", "blank"])),
  sentinel: v.optional(v.pipe(v.string(), v.nonEmpty())),
  subjectIn: v.optional(v.array(Token)),
})

const PredicateClause = v.object({
  kind: v.literal("predicate"),
  query: ForkPredicateSchema,
})

// covers a fork iff ANY clause matches; at least one clause required (an empty scope covers nothing)
const ScopeSchema = v.pipe(v.array(v.variant("kind", [RefSetClause, PredicateClause])), v.minLength(1))

const ContentSchema = v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(MAX_CONTENT_LENGTH))

const CreateBody = v.object({
  content: ContentSchema,
  cause: v.optional(v.picklist(ALL_CAUSES)),
  scope: ScopeSchema,
})

// at least one field present is enforced in the handler (valibot allows an all-omitted object).
// `cause` is nullable so an author can CLEAR it (null) vs leave it (omitted) — `cause?` is optional.
const PatchBody = v.object({
  content: v.optional(ContentSchema),
  cause: v.optional(v.nullable(v.picklist(ALL_CAUSES))),
  scope: v.optional(ScopeSchema),
})

const ReviewBody = v.object({
  decision: v.picklist(["publish", "reject"]),
})

// === row <-> DTO ===

interface ForkAnnotationRow {
  id: string
  author_id: string
  content: string
  cause: string | null
  scope_json: string
  status: AssayForkAnnotationStatus
  created_at: string
  updated_at: string
}

function rowToAnnotation(row: ForkAnnotationRow): AssayForkAnnotationV1 {
  const annotation: AssayForkAnnotationV1 = {
    id: row.id,
    author_id: row.author_id,
    content: row.content,
    scope: JSON.parse(row.scope_json) as AnnotationScope,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
  if (row.cause) annotation.cause = row.cause as Cause
  return annotation
}

async function loadRow(env: Env, id: string): Promise<ForkAnnotationRow | null> {
  return env.ASSAY_PREVIEW_DB.prepare(`SELECT * FROM assay_fork_annotations WHERE id = ?`)
    .bind(id)
    .first<ForkAnnotationRow>()
}

// Same visibility rule the list GET applies: published rows are public; a pending/rejected row is
// visible only to its author or a maintainer. A caller who can't see a row gets 404 everywhere
// (read AND write), so existence is never leaked via a 403/404 difference.
function canSee(row: ForkAnnotationRow, login: string, maintainer: boolean): boolean {
  return row.status === "published" || row.author_id === login || maintainer
}

function canWrite(row: ForkAnnotationRow, login: string, maintainer: boolean): boolean {
  return row.author_id === login || maintainer
}

// === routes ===

// GET / — list. Visibility: maintainers see everything; others see published rows plus their own
// (any status). Optional ?status= narrows within what the caller may see. This is the coverage /
// renderer feed; the ref/predicate join into the manifest is the coverage view (3d).
app.get("/", async (c) => {
  const login = c.var.session.user_login
  const maintainer = isAssayMaintainer(c.env, login)

  const statusParam = c.req.query("status")
  if (statusParam !== undefined && !STATUSES.includes(statusParam as AssayForkAnnotationStatus)) {
    return c.json({ error: "bad_status" }, 400)
  }

  const where: string[] = []
  const binds: string[] = []
  if (!maintainer) {
    where.push(`(status = 'published' OR author_id = ?)`)
    binds.push(login)
  }
  if (statusParam !== undefined) {
    where.push(`status = ?`)
    binds.push(statusParam)
  }

  const sql =
    `SELECT * FROM assay_fork_annotations` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : ``) +
    ` ORDER BY updated_at DESC`

  const { results } = await c.env.ASSAY_PREVIEW_DB.prepare(sql)
    .bind(...binds)
    .all<ForkAnnotationRow>()
  return c.json({ annotations: (results ?? []).map(rowToAnnotation) })
})

// GET /:id — one annotation (subject to the same visibility rule as the list).
app.get("/:id", async (c) => {
  const row = await loadRow(c.env, c.req.param("id"))
  if (!row) return c.json({ error: "not_found" }, 404)
  const login = c.var.session.user_login
  if (!canSee(row, login, isAssayMaintainer(c.env, login))) return c.json({ error: "not_found" }, 404)
  return c.json({ annotation: rowToAnnotation(row) })
})

// POST / — create. Author = session user; lands `pending` for the review gate (§9).
app.post("/", async (c) => {
  const json = await c.req.json().catch(() => null)
  const parsed = v.safeParse(CreateBody, json)
  if (!parsed.success) return c.json({ error: "bad_body" }, 400)

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const login = c.var.session.user_login
  const scopeJson = JSON.stringify(parsed.output.scope)

  await c.env.ASSAY_PREVIEW_DB.prepare(
    `INSERT INTO assay_fork_annotations
      (id, author_id, content, cause, scope_json, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
  )
    .bind(id, login, parsed.output.content, parsed.output.cause ?? null, scopeJson, now, now)
    .run()

  const row = await loadRow(c.env, id)
  return c.json({ annotation: rowToAnnotation(row!) }, 201)
})

// PATCH /:id — edit own (or maintainer). A non-maintainer edit of a published annotation re-enters
// review (status -> pending), so the gate can't be bypassed by editing after publish. A maintainer
// edit preserves status. Status is never set directly here — that is the review gate (below).
app.patch("/:id", async (c) => {
  const id = c.req.param("id")
  const row = await loadRow(c.env, id)
  if (!row) return c.json({ error: "not_found" }, 404)

  const login = c.var.session.user_login
  const maintainer = isAssayMaintainer(c.env, login)
  if (!canSee(row, login, maintainer)) return c.json({ error: "not_found" }, 404)
  if (!canWrite(row, login, maintainer)) return c.json({ error: "forbidden" }, 403)

  const json = await c.req.json().catch(() => null)
  const parsed = v.safeParse(PatchBody, json)
  if (!parsed.success) return c.json({ error: "bad_body" }, 400)
  const { content, cause, scope } = parsed.output
  if (content === undefined && cause === undefined && scope === undefined) {
    return c.json({ error: "empty_patch" }, 400)
  }

  const now = new Date().toISOString()
  const sets: string[] = []
  const binds: (string | null)[] = []
  if (content !== undefined) {
    sets.push(`content = ?`)
    binds.push(content)
  }
  if (cause !== undefined) {
    sets.push(`cause = ?`)
    binds.push(cause)
  }
  if (scope !== undefined) {
    sets.push(`scope_json = ?`)
    binds.push(JSON.stringify(scope))
  }
  // re-moderate any already-decided row edited by its (non-maintainer) author: an edited published
  // row OR an edited rejected row goes back to pending for review (a rejected row isn't stuck —
  // the author addresses feedback and re-submits). A pending row stays pending.
  if (!maintainer && row.status !== "pending") sets.push(`status = 'pending'`)
  sets.push(`updated_at = ?`)
  binds.push(now)

  await c.env.ASSAY_PREVIEW_DB.prepare(`UPDATE assay_fork_annotations SET ${sets.join(", ")} WHERE id = ?`)
    .bind(...binds, id)
    .run()

  const updated = await loadRow(c.env, id)
  return c.json({ annotation: rowToAnnotation(updated!) })
})

// DELETE /:id — retire own (or maintainer).
app.delete("/:id", async (c) => {
  const id = c.req.param("id")
  const row = await loadRow(c.env, id)
  if (!row) return c.json({ error: "not_found" }, 404)

  const login = c.var.session.user_login
  const maintainer = isAssayMaintainer(c.env, login)
  if (!canSee(row, login, maintainer)) return c.json({ error: "not_found" }, 404)
  if (!canWrite(row, login, maintainer)) return c.json({ error: "forbidden" }, 403)

  await c.env.ASSAY_PREVIEW_DB.prepare(`DELETE FROM assay_fork_annotations WHERE id = ?`).bind(id).run()
  return c.body(null, 204)
})

// POST /:id/review — the §9 gate (OPTION B). Maintainer-only; publish or reject. Moderation only
// (hygiene), never a correctness verdict — the annotation stays attributed, not vouched.
app.post("/:id/review", async (c) => {
  const login = c.var.session.user_login
  if (!isAssayMaintainer(c.env, login)) return c.json({ error: "forbidden" }, 403)

  const id = c.req.param("id")
  const row = await loadRow(c.env, id)
  if (!row) return c.json({ error: "not_found" }, 404)

  const json = await c.req.json().catch(() => null)
  const parsed = v.safeParse(ReviewBody, json)
  if (!parsed.success) return c.json({ error: "bad_body" }, 400)

  const status: AssayForkAnnotationStatus = parsed.output.decision === "publish" ? "published" : "rejected"
  const now = new Date().toISOString()
  await c.env.ASSAY_PREVIEW_DB.prepare(`UPDATE assay_fork_annotations SET status = ?, updated_at = ? WHERE id = ?`)
    .bind(status, now, id)
    .run()

  const updated = await loadRow(c.env, id)
  return c.json({ annotation: rowToAnnotation(updated!) })
})

export default app
