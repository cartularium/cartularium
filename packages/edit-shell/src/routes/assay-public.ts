// The PUBLIC read lane — /api/assay/* (store-delivery-2026-07-11.md, D-A1).
//
// EXPERIMENTAL surface (maintainer decision 2026-07-18, provenance sign-off item 3): this lane
// ships but is explicitly declared unstable — the response shapes below may change without notice.
// Every response carries `X-Assay-Api-Stability: experimental` (set in the shared middleware) so
// consumers can detect the posture. No /v0/ path prefix yet; the header is the marker.
//
// Sessionless, published-only, CORS-open: a public dataset out, nothing in. Deliberately a
// separate mount from the authoring shell (/api/edit/assay/*), whose session → rate-limit →
// visibility middleware stack is load-bearing for contributor privacy — this lane's only
// capability is "published data out", so it is structurally incapable of leaking moderation
// state (pending/rejected rows never leave the SQL).
//
//   GET /fork-annotations — { version, generatedAt, annotations } — the export shape the
//     `assay annotation-coverage --annotations` CLI consumes (what 3d asked users to hand-make).
//   GET /fork-coverage — the derived coverage report: published ManifestV5 (an R2 object the
//     maintainer publishes alongside the manifest build — D-B1) × published annotations,
//     joined by the contracts-owned computeForkCoverage. 503 with a delivery hint until a
//     manifest has been published.

import { Hono } from "hono"
import {
  ASSAY_FORK_ANNOTATION_VERSION,
  computeForkCoverage,
  type ManifestV5,
} from "@cartularium/contracts"
import type { Env } from "../env"
import { rowToAnnotation, type ForkAnnotationRow } from "./assay-fork-annotations"

// R2 key the manifest publish step writes (store-delivery-2026-07-11.md D-B1):
//   pnpm --filter @cartularium/edit-shell exec wrangler r2 object put \
//     cartularium-assay-preview/assay/manifest-v5.json --file=<assay>/build/manifest-v5.json
export const MANIFEST_R2_KEY = "assay/manifest-v5.json"

const app = new Hono<{ Bindings: Env }>()

// public dataset: any origin may read; results are cacheable for five minutes.
// The stability marker declares this an experimental surface whose shape may change without notice.
app.use("*", async (c, next) => {
  await next()
  c.header("Access-Control-Allow-Origin", "*")
  c.header("Cache-Control", "public, max-age=300")
  c.header("X-Assay-Api-Stability", "experimental")
})

async function publishedAnnotations(env: Env): Promise<ForkAnnotationRow[]> {
  const { results } = await env.ASSAY_PREVIEW_DB.prepare(
    `SELECT * FROM assay_fork_annotations WHERE status = 'published' ORDER BY id`,
  ).all<ForkAnnotationRow>()
  return results ?? []
}

app.get("/fork-annotations", async (c) => {
  const rows = await publishedAnnotations(c.env)
  return c.json({
    version: ASSAY_FORK_ANNOTATION_VERSION,
    generatedAt: new Date().toISOString(),
    annotations: rows.map(rowToAnnotation),
  })
})

app.get("/fork-coverage", async (c) => {
  const object = await c.env.ASSAY_PREVIEW.get(MANIFEST_R2_KEY)
  if (!object) {
    return c.json(
      {
        error: "no published manifest",
        hint: `publish one: wrangler r2 object put cartularium-assay-preview/${MANIFEST_R2_KEY} --file=<assay>/build/manifest-v5.json`,
      },
      503,
    )
  }
  const manifest = (await object.json()) as ManifestV5
  const rows = await publishedAnnotations(c.env)
  const report = computeForkCoverage(manifest, rows.map(rowToAnnotation))
  return c.json({
    generatedAt: new Date().toISOString(),
    manifestGeneratedAt: manifest.generatedAt,
    ...report,
  })
})

export default app
