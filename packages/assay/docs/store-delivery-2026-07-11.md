# Store→build delivery path (PROPOSED 2026-07-11)

> **Split 2026-07-18** per `internal/decisions/2026-07-18-assay-tail-decisions.md`:
> D-A1 (public read lane) is ratified, still experimental-marked; D-A2 and
> D-B1 are deferred to the re-founded catalogue design (their consumer, the
> sheets.wiki V4 render, is being pulled).

**Status: PROPOSED — reference implementation this session; maintainer ratification pending.**

**Public `/api/assay` lane is EXPERIMENTAL** (maintainer decision 2026-07-18, provenance sign-off
item 3): it ships, but the response shapes may change without notice — every response carries
`X-Assay-Api-Stability: experimental`.
The deferred blocker behind **#4** (store-as-read-source; retiring the in-repo DV YAML /
`history` / `seedCatalogue`) and behind the **live coverage endpoint / human verification
surface** ("manifest-into-Worker delivery", 3d handoff). Two data flows cross the
repo↔Worker boundary in opposite directions; each gets the cheapest mechanism that preserves
the properties the design already ratified.

## The two flows

**A. Store → build (annotations out).** The site/manifest builds (and any consumer) need the
`published` annotations. Today the store has **no public read at all** — everything under
`/api/edit/assay/*` is session-gated, and 3d's coverage CLI reads a hand-made export file.

**B. Build → Worker (manifest in).** The Worker needs the published ManifestV5 to serve the
live coverage view (`computeForkCoverage` is already in contracts and Worker-safe — it was
placed there for exactly this). Today the Worker has no fork/manifest data.

## Decisions

### D-A1 — a public read lane: `GET /api/assay/*` (no session)

A new mount `/api/assay` (distinct from the authoring shell `/api/edit/assay`) serving
**published-only** data, sessionless, CORS-open (`*` — it is a public dataset), cache-friendly:

- `GET /api/assay/fork-annotations` → `{ version, generatedAt, annotations }` — published rows
  only, the exact shape `assay annotation-coverage --annotations` already consumes. This *is*
  the export the 3d CLI asked users to hand-make.
- `GET /api/assay/fork-coverage` → the derived coverage report (flow B joins here): R2 manifest
  × published annotations via `computeForkCoverage`. `503` with a delivery hint while no
  manifest has been published to R2.

**Why a separate lane, not softening `/api/edit/assay`:** the authoring shell's middleware
order (session → rate-limit → visibility) is load-bearing for contributor privacy
(pending/rejected rows leak nothing, 404-vs-403 model); a public GET carved out inside it would
have to fight that stack. A read-only lane whose *only* capability is "published data out" is
structurally incapable of leaking moderation state.

### D-A2 — builds consume a COMMITTED SNAPSHOT, refreshed via the public export

For #4, the build-time read source is a **committed snapshot file** (e.g.
`packages/assay/annotations/fork-annotations.json`), refreshed by a maintainer/cron command
that GETs `/api/assay/fork-annotations` and rewrites the file. The build itself never fetches.

- **Why not live-fetch at build:** builds become nondeterministic and couple CI to Worker
  uptime; a rebuild of an old commit silently picks up new annotations — the "certified as of
  <versions>, monitored" guarantee wants reproducible builds. The sheets-wiki precedent is
  build-time *monorepo* invocation (`assay run build:manifest`), never a network fetch.
- **Why not keep the YAML:** that's the fossil #4 retires; the snapshot is one generated file
  with store provenance (author/status/verified axes intact), not 255+ hand-shaped YAML files
  pretending to be authored in-repo.
- The snapshot is `.json`, generated, reviewed like a lockfile diff. The DV YAML keeps
  authoring until #4 flips the direction; after #4, authoring happens in the store (API/UI)
  and the snapshot is the only repo artifact.

### D-B1 — manifest reaches the Worker as an R2 OBJECT, published alongside the manifest build

`assay manifest` output is uploaded to the existing `ASSAY_PREVIEW` R2 bucket at
`assay/manifest-v5.json` (maintainer/CI step):

```
node build/cli.js manifest > build/manifest-v5.json
pnpm --filter @cartularium/edit-shell exec wrangler r2 object put \
  cartularium-assay-preview/assay/manifest-v5.json --file=../assay/build/manifest-v5.json [--local]
```

- **Why R2, not D1:** the manifest is a single ~MB immutable-per-publish document read whole —
  an object, not rows. The binding already exists; no migration.
- **Why not bundle into the Worker:** redeploying edit-shell to refresh data couples the
  store's availability to assay's publish cadence; an R2 put is atomic and independent.
- The Worker treats the object as **advisory read model** — if absent/stale, only the coverage
  view degrades (503/stale), never the store itself.

## Rejected alternatives (recorded)

- **API-feed import for annotations** — already rejected at 3c (the CRUD API forces
  id/author/status semantics the bulk paths must override).
- **Worker-side manifest BUILD** (moving `buildManifestV5` into the Worker) — drags fixtures +
  the tests corpus into the Worker; the relation layer builds from the repo, the Worker only
  *joins*.
- **Public lane on a separate Worker** — operational surface for no isolation gain; the lane
  shares the D1 binding either way.

## Sequencing

1. **This session:** the public lane (both endpoints) + tests — reference implementation.
2. R2 manifest publish becomes a step of the maintainer's manifest flow (doc note in
   `runner-ops.md` when ratified).
3. The snapshot command (`assay fetch-annotations`) + re-pointing the ~4 `loadDvs()` sites ride
   #4 with the sheets-wiki V4→V5 rework — NOT this session (the V4 site still renders the YAML).
