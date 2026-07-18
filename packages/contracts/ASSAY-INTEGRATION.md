# Assay → sheets.wiki integration spec

> Audience: implementer working in the [`cartularium/assay`](https://github.com/cartularium/assay) repo. Assumes familiarity with assay's existing structure (`tests/`, `fixtures/`, `divergences/`, `capabilities/`, `src/catalogue-site/`).

## Why

Sheets.wiki function pages need to display, for each function:

- which engines support it (engine-badge row at top of page),
- which assay divergences affect it (cross-link to assay catalogue),
- which assay tests verify its example formulas (linkable test pills next to code blocks).

Sheets.wiki fetches this data at build time from a JSON manifest published by assay. The data lives in assay (which is the source of truth for cross-engine behavior); sheets.wiki consumes, doesn't author. Per-function frontmatter on sheets.wiki stays minimal.

## Three deliverables

In priority order. Each lands incrementally; sheets.wiki uses what's available and degrades gracefully if any are missing.

### 1. `assay manifest` command (highest priority)

A new CLI subcommand emitting a single JSON file keyed by function name.

**Invocation:**

```
assay manifest --output build/site/manifest.json
```

By default writes to stdout. The catalogue site builder (`assay catalogue`) should include manifest emission as part of its pipeline so the file ships at `<outDir>/manifest.json` alongside the other site assets — so it's served at `https://assay.sheets.wiki/manifest.json` once the catalogue is deployed.

**Schema:**

The canonical TypeScript types (`Manifest`, `ManifestFunctionEntry`, etc.) live in the workspace package `@cartularium/contracts`. Both assay (emission) and sheets-wiki (consumption) import from there; this document is the human-readable spec, and the package is the load-bearing reference. Schema changes start in `@cartularium/contracts` and propagate to both sides via the type-checker.

```json
{
  "version": 4,
  "generatedAt": "2026-04-25T12:00:00Z",
  "engines": ["gsheets", "excel", "lattice", "ironcalc", "hyperformula", "libreoffice", "formulas", "pycel"],
  "dvs": {
    "DV-0001": {
      "summary": "pycel: function not implemented",
      "cause": "missing-function",
      "category": "value",
      "engines": ["pycel"]
    },
    "DV-0046": {
      "summary": "gsheets: function not implemented",
      "cause": "missing-function",
      "category": "value",
      "engines": ["gsheets", "lattice", "ironcalc", "hyperformula", "formulas", "pycel"]
    }
  },
  "tests": {
    "SUMX2MY2/sum-of-squares-minus-sum-of-squares": {
      "ref": "SUMX2MY2/sum-of-squares-minus-sum-of-squares",
      "subject": "SUMX2MY2",
      "subjectRef": "SUMX2MY2",
      "name": "sum-of-squares-minus-sum-of-squares",
      "suite": "array-longtail",
      "hash": "sha256:9e0911741436da097c63fa17267093a73d80e41a08c0b472c758d2ce88b7ec12",
      "url": "/test/SUMX2MY2/sum-of-squares-minus-sum-of-squares/",
      "engines": {
        "gsheets": "match",
        "excel": "match",
        "lattice": "match",
        "ironcalc": "match",
        "hyperformula": "match",
        "libreoffice": "match",
        "formulas": "match",
        "pycel": "diverge"
      }
    }
  },
  "aliases": {},
  "tombstones": {},
  "hashes": {
    "sha256:9e0911741436da097c63fa17267093a73d80e41a08c0b472c758d2ce88b7ec12": "SUMX2MY2/sum-of-squares-minus-sum-of-squares"
  },
  "functions": {
    "SUM": {
      "engines": {
        "gsheets":      { "status": "available" },
        "excel":        { "status": "available" },
        "lattice":      { "status": "available" },
        "ironcalc":     { "status": "available" },
        "hyperformula": { "status": "available" },
        "libreoffice":  { "status": "available" },
        "formulas":     { "status": "available" },
        "pycel":        { "status": "available" }
      },
      "divergences": [],
      "tests": ["SUM/sum-range"]
    },
    "BAHTTEXT": {
      "engines": {
        "excel":        { "status": "available" },
        "gsheets":      { "status": "missing" },
        "lattice":      { "status": "missing" },
        "ironcalc":     { "status": "missing" },
        "hyperformula": { "status": "missing" },
        "libreoffice":  { "status": "available" },
        "formulas":     { "status": "missing" },
        "pycel":        { "status": "missing" }
      },
      "divergences": ["DV-0046"],
      "tests": ["BAHTTEXT/thai-baht-text"]
    },
    "SUMX2MY2": {
      "engines": {
        "gsheets":      { "status": "available" },
        "excel":        { "status": "available" },
        "lattice":      { "status": "available" },
        "ironcalc":     { "status": "available" },
        "hyperformula": { "status": "available" },
        "libreoffice":  { "status": "available" },
        "formulas":     { "status": "available" },
        "pycel":        { "status": "missing", "via": "DV-0001" }
      },
      "divergences": ["DV-0001"],
      "tests": ["SUMX2MY2/sum-of-squares-minus-sum-of-squares"]
    }
  }
}
```

**Field semantics:**

- `version`: bumped on incompatible schema changes. Consumers fail loudly if they don't recognize it. v4 uses public assay refs, semantic hashes, aliases, and tombstones.
- `generatedAt`: ISO-8601 UTC. Lets consumers detect stale caches.
- `engines`: canonical list of engines this manifest covers. Order matches the canonical engine sort (the same one used in the catalogue site).
- `dvs[id]`: index of every DV reachable from a function entry. Carries `summary, cause, category, engines` so consumers can render DV details (e.g., the related-drawer's diverges section showing `DV-#### · summary`) without re-fetching divergence files. DVs whose subjects are all non-functions (operators, language features) are excluded from this index.
- `tests[ref]`: index of every test with a function subject, keyed by the public `subjectRef/name` ref. Carries `ref`, raw `subject`, public `subjectRef`, authored `name`, source `suite`, semantic fixture `hash`, canonical `url`, optional `aliases`, and a sparse per-engine verdict map (`"match" | "diverge"`); engines with no fixture are absent (treat as "no-data"). Consumers must use `url`, not reconstruct paths.
- `aliases[oldRef]`: public-ref aliases for renamed evidence. Consumers resolve aliases before looking up `tests`.
- `tombstones[ref]`: retired public refs. Public builds should fail if content still cites them.
- `hashes[semanticHash]`: reverse index from semantic fixture hash to public ref.
- `functions[name].engines[engine].status`: one of `"available" | "missing" | "partial"`.
  - `available`: engine evaluates the function and matches canonical (or has an accepted divergence other than missing-function).
  - `missing`: engine returns a missing-function error (`#NAME?` etc.) for this subject in any test.
  - `partial`: engine accepts the function but with restricted argument forms / spec-incompatible behavior (i.e. tagged with a divergence whose cause is something other than missing-function and where the engine fails to return any non-error value).
- `functions[name].engines[engine].via`: optional DV-#### that explains the status. Always set when status is `missing` or `partial`.
- `functions[name].divergences`: array of DV-#### IDs where this function appears in `subjects`. Order: ascending DV number.
- `functions[name].tests`: array of public refs where `subject` equals this function name. Order: as encountered in the test files (stable across builds for unchanged inputs).

**Coverage rule:** include a function entry if and only if it appears as a `subject` in any test file, OR it appears as a subject of any divergence. Functions only mentioned in capability declarations but never tested are excluded.

**Implementation hint:** the existing `loadDvs`, `loadFixtures`, `loadTests` in `src/catalogue-site/load.ts` already produce most of the data. The manifest builder can be a new module under `src/manifest/` that consumes those, applies the status-derivation logic above, and emits JSON. Wire into the CLI in `src/cli.ts` and into the catalogue build in `src/catalogue-site/index.ts` so `assay catalogue` produces the manifest as a byproduct.

### 2. Per-test pages (medium priority)

The catalogue site currently renders index, DV detail, compare, and about pages. Add a per-test page so sheets.wiki can link directly to the verified result of an example formula.

**URL pattern:** `<outDir>/test/<subjectRef>/<name>/index.html` → `https://assay.sheets.wiki/test/SUMX2MY2/sum-of-squares-minus-sum-of-squares/`.

**Page contents:**

- Test ID and suite as eyebrow + h1 (e.g. eyebrow `array-longtail`, h1 `8d6ea4`).
- The formula in a `code.formula` block.
- Canonical expected value (from the test's `expect` field).
- Per-engine results table: rows are engines (canonical order), columns are `verdict` (match / diverge / no-data) and `value`. Reuse the engine-cell styling from DV detail pages.
- Subjects list: each subject as a `subject-pill` linking to `https://sheets.wiki/<SUBJECT>` (the sheets.wiki function page; URL convention is bare uppercase for functions).
- Owning DVs: any divergence where this test ID appears in the `tests` array, listed as monospace links (e.g. `DV-0001`) to `../dv/DV-0001/`.
- Test metadata: tags, category, schema version.

**Implementation hint:** model on `src/catalogue-site/page-dv.ts`. New emitter function `renderTestDetail(test, fixtures, owningDvs)` invoked from `buildSite()` for each test in `testIndex`.

### 3. Bidirectional subject links (lowest priority)

Currently DV detail pages render subjects as `<a class="subject-pill" href="../../#search=SUBJECT">` (search-jump back to the index). Update the subject link target on **DV detail pages** and **the new per-test pages** to:

```html
<a class="subject-pill" href="https://sheets.wiki/<SUBJECT>">SUBJECT</a>
```

(Keeping the in-index search jumps elsewhere is fine; it's specifically the subject-pills on DV/test pages that should cross to sheets.wiki.)

URL convention: bare uppercase function name. No `/docs/` prefix, no engine prefix. Functions that don't have sheets.wiki pages yet will 404 cleanly; that's expected and acceptable since the URL is canonical.

## Acceptance criteria

For deliverable 1:

- [ ] `assay manifest --output <path>` produces a JSON file matching the schema above.
- [ ] `assay catalogue` includes `manifest.json` in its output directory.
- [ ] Schema validates: every function has all eight engines under `engines` (no missing keys); every `via` references an existing DV-####; every test ID in `tests[]` exists.
- [ ] Re-running with unchanged inputs produces a byte-identical file (modulo `generatedAt`). This matters for sheets.wiki's build cache.
- [ ] At minimum: SUM, VLOOKUP, BAHTTEXT, QUERY, SUMX2MY2, INDEX entries are correct against current fixtures.

For deliverable 2:

- [ ] Per-test pages emit at `test/<subjectRef>/<name>/index.html`.
- [ ] Pages render per-engine verdicts using the existing engine palette.
- [ ] Subject pills link to `https://sheets.wiki/<SUBJECT>`.

For deliverable 3:

- [ ] DV detail page subject pills link to `https://sheets.wiki/<SUBJECT>`.
- [ ] Test detail page subject pills link to `https://sheets.wiki/<SUBJECT>`.

## Out of scope

- A full reverse manifest (sheets.wiki → assay direction). Sheets.wiki uses the URL convention `sheets.wiki/<FUNC>` as the contract; assay assumes the page exists there. If a sheets.wiki page doesn't exist yet, the link 404s — that's fine.
- Manifest contents for non-function subjects (operators, control flow, language features tested in suites). Functions only.
- Localized engine names or i18n. English engine identifiers only.
- Historical manifests. Each build emits a single current-state manifest; no version history.

## Sheets.wiki side (FYI, not part of this work)

For context: sheets.wiki's build will fetch `https://assay.sheets.wiki/manifest.json` with on-disk cache + offline fallback, plus optionally read it from a sibling `~/sandbox/current/assay/build/site/manifest.json` during local dev. The merged data flows into per-page `engines:` and `divergences:` frontmatter at build time — no static migration into sheets.wiki source files. Per-function `category:` comes from a separate source (`lattice/spec/reference/{gsheets,excel}_functions.tsv`) and is not part of this manifest.

## Coordination

- Canonical types live in `@cartularium/contracts`. Bump `MANIFEST_VERSION` and add to `SUPPORTED_MANIFEST_VERSIONS` for incompatible schema changes; sheets.wiki throws via `assertSupportedManifestVersion` on unrecognized versions.
- Engine list additions are backwards-compatible; sheets.wiki ignores unknown engines gracefully.
- Backwards-compatible field additions to per-function records are fine; sheets.wiki ignores unknown fields.

Repo: <https://github.com/cartularium/assay>. Open an issue/PR there for questions or clarifications.
