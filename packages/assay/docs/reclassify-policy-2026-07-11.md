# 3f — the reclassification policy (PROPOSED 2026-07-11)

**Status: PROPOSED — built and executed on these terms this session; maintainer ratification
pending.** Everything below is local and reversible (pre-alpha; push maintainer-gated). This doc
is the *policy* that annotation-store-design-2026-06-20.md §4 deferred ("the policy itself is
future work"): the pass converting the provisional ref-set DV scopes into tag/predicate scopes,
labelling tests, and writing annotation content.

**Maintainer decision 2026-07-18 (provenance sign-off item 6): this policy is left PROVISIONAL.**
It gets its real review alongside Assay's member charter and annotation model. The 124 annotations
(DV-0258..0381) and 17 scope conversions authored under it stay marked provisional until then;
nothing else blocks meanwhile.

Read first: `annotation-store-design-2026-06-20.md` (the 3a design document; §4 scope model, §5
migration), `handoff-provenance-reclassify-2026-06-27.md` (the re-prioritization + the three
provenance axes), `terminology.md` (binding vocabulary). Yardstick: the 3a design end-state —
no-verdict / multiplicity / two-layer cut / 5 authoring kinds / territory > anatomy > corpus.

---

## 0. Ground data (measured this session, worktree @ `64eaaf8d`)

Reproducible: seed local D1 from `assay seed-fork-annotations`, export, run
`assay annotation-coverage --annotations <export> --json`.

- **Coverage baseline:** 1822 forks · 945 covered (51.9%) · **877 uncovered** (contribution
  prompts) · 255 annotations · **22 covering no live fork** (17 dangling-only, 5 converged-only).
- **Subject alignment of the 255 ref-set scopes:** 19 are *exact* (their live refs = all forked
  refs of their subjects — clean `subjectIn` candidates) · 214 are *strict subsets*. Of the 214
  residuals: 90 are fully covered by *other* annotations (multi-mechanism subjects — `subjectIn`
  would mis-cover), 41 fully uncovered, 83 mixed.
- **Cause histogram:** precision 80 · arg-semantics 46 · error-code 45 · missing-function 41 ·
  format-rendering 29 · shape 13 · array-handling 1.
- **Tags:** 57 distinct across 1651 tagged tests. **Found a hygiene-gate leak:**
  `engine-divergence` (10 tests) is an outcome-claim tag not on the 3e denylist — published into
  the manifest. Exactly the denylist-rot the R1 gate discussion predicted.
- **The 877 uncovered forks span 344 subjects** (top: ADD 14, SUM 13, REGEXEXTRACT 10, UNIQUE 10)
  — a long tail; authorship must group by mechanism, not enumerate refs by hand.

## 1. D-3f-1 — edits land in the YAML (the seed source), additively

**Decision:** the DV YAML stays the single authoring path until #4. 3f extends the YAML schema
with an optional `scope:` field; the seed exporter prefers it; everything else is untouched.

- The exporter's UPSERT refreshes `content`/`cause`/`scope_json` from the YAML on every re-seed —
  so a scope edited *only in the store* is clobbered by the next re-seed. Editing the store
  directly would either fork the truth or force freezing the exporter.
- Every `DvEntry` consumer was audited: the V4 site (`page-dv.ts`, `catalogue-site/index.ts`)
  reads `tests`/`engines` (untouched); `buildManifestV5` reads only `subjects` (untouched); the
  exporter reads `tests` → now `scope ?? [{ref-set, tests}]`. Adding `scope:` breaks nothing.

**Rejected — edit the store directly (PATCH) and freeze the exporter.** Splits authoring across
two surfaces pre-#4, loses the idempotent re-seed safety net, and the V4 site (still the only
public render) would drift from the store silently.

**Rejected — block 3f on #4 (store-as-read-source first).** Inverts the ratified sequencing
(handoff 2026-06-27): the reclassify is what turns the agent-seeded scaffolding into the asset
that makes the store worth being the read-source; #4 is also blocked on an undesigned delivery
path, and 3f has no reason to wait behind it.

## 2. D-3f-2 — YAML scope syntax (light sugar over the contract)

```yaml
scope:
  - refs: [SUBJECT/name, OTHER/name]   # → { kind: "ref-set", refs }
  - tags: [complex-number]             # → { kind: "predicate", query: { tags, subjectIn } }
    subjectIn: [IMSUM, IMSUB]          #   fields conjoined, per the contract
```

Loader (`load.ts`) parses + validates: a clause is `refs` XOR predicate keys; YAML-authorable
predicate dimensions are **`tags` / `subjectIn` only** (the author-declared ones — observed
dimensions ride the deferred fork-property matcher; the store schema already admits them, the
YAML sugar just doesn't author them yet). Malformed scope → load error (fail fast, not silent
ref-set fallback). `tests:` stays — it is the V4 render substrate and, for predicate-scoped DVs,
the materialized snapshot at reclassify time (documented as such, not kept in sync).

## 3. D-3f-3 — the conversion policy (per-mechanism, conservative)

The 3a §4 discipline is binding: **a predicate is authored intent, never a disguised
auto-cluster.** Operational test: *the clause must be writable by reading the cases' stimuli
(formula/grid/subject), without consulting outcomes.* Choosing which cases share one explanation
may consult evidence (that is authoring an annotation); the *predicate's terms* may not encode
outcomes.

Per shape:

- **CONVERT → `subjectIn`** when the annotation's claim is function-level ("engine E does not
  implement F", "F's optional-arg default differs") **and** every currently-forked case of those
  subjects is explained by it (the 19 exact-alignment DVs; case-by-case where the residual is
  filled by this pass's new annotations). Accepted risk: a *future* fork of that subject with a
  different mechanism gets auto-covered — coverage is a descriptive join, mis-coverage is a
  content-quality issue surfaced by human verification, and the alternative (ref-set forever)
  forfeits the auto-cover that is the predicate's point.
- **CONVERT → `tags` (± `subjectIn`)** when the mechanism rides a case-shape property a tag
  legitimately names (`complex-number`, `locale`, `coercion`, …). Where the tag doesn't exist
  yet, this pass authors it on the tests — allowed: tags are case properties readable off the
  stimulus. **Anti-auto-cluster guard:** never mint a tag whose extension is defined as "the
  cases DV-X covers"; the tag names a concept, membership is decided per-test from the formula.
- **KEEP ref-set** for: single-ref DVs (a predicate adds nothing), multi-mechanism subjects
  (the 90 covered-elsewhere + 83 mixed residuals — `subjectIn` would claim forks other
  annotations explain), and genuine cherry-picks.

## 4. D-3f-4 — the danglings were CLIPPED, not renamed: widen the manifest test universe

**The 3d handoff's reading ("authored against an older naming scheme, genuinely don't resolve")
turned out wrong on investigation.** Every dangling ref except one still exists in the tests
corpus, with live fixture observations — `op:divide/division` (`=10/3`), `op:add/true-plus-zero`
(`=TRUE+0`), `feature:spill-blocking/*`, `lit:array/*`. They "dangled" because
`buildManifestV5` inherited a V4-era `isFunctionName(t.subject)` gate that silently dropped
**every non-function-subject case — 88 tests, 86 with live observations, many fork-bearing —
from the published relation layer.** No ratified doc decided that exclusion; no test asserted
it; the charter's own discipline (thresholds route cost, never truth; operators are formulas
too) forbids it.

**Decision: widen `ManifestV5.tests` to every corpus case.** The `functions` record stays
function-scoped (it iterates `fnSet`; structurally unaffected). Additive for both consumers
(the manifest CLI + annotation-coverage). Measured effect: manifest tests 1867 → 1955; forks
1822 → **1908**; dangling annotations 17 → **0**; no-live-fork 22 → **9** (all genuinely
converged, kept per D-3f-5). Uncovered prompts rise 877 → **946** — the newly visible forks are
honestly uncovered, and join the D-3f-6 authorship queue.

**Rejected — re-point the refs to "renamed" function-subject cases.** There are no stimulus
twins (`=TRUE+0` has no function-subject equivalent); re-pointing would have silently narrowed
the corpus to the clipped universe instead of fixing the clipping.

## 5. D-3f-5 — converged-only annotations (5 DVs)

**Keep, unchanged, unverified.** They are honest records whose forks have converged; the coverage
view already flags them on read. Retiring them is a stability-lifecycle judgment that belongs to
the deferred results-history substrate (R2), not to this pass.

## 6. D-3f-6 — authorship for the 877 uncovered forks

New annotations are authored as **new DV YAML files (`DV-0256+`) through the same exporter** —
one authoring path until #4, the V4 site renders them, and they retire together at #4.

- Grouped by *(mechanism × concept)*, grounded per-group in fixture evidence (the actual
  partitions and values — authoring reads evidence; that is what an annotation is).
- `content` follows the gravity discipline: describe the fork symmetrically ("X and Y disagree on
  …"), name no deviant, no correctness claim. `cause` from the controlled enum, hand-authored.
- Scope: ref-set by default; predicate only where §3's conditions hold at authoring time.
- Legacy YAML fields (`engines`, `category`, `behavior.signature`, `test-count`) are populated
  for V4-render fidelity; the exporter ignores them (derived at read per 3a §3).
- **All content authored this pass is agent-authored, `auto-seeded (provisional)`, unverified**
  (`verified_* = NULL`) — it lands in the maintainer's `?verified=false` queue. That is the
  philosophy working as designed: provisional scaffolding at scale, verification stays human.

**Rejected — author new annotations via the CRUD API into the store.** Forces
pending-status/random-id per row (the API is shaped for contributors, not bulk authoring), splits
the corpus across two surfaces pre-#4, and the V4 site wouldn't render them.

## 7. D-3f-7 — the hygiene denylist grows

`engine-divergence` joins `divergence`/`coercion-divergence`/`excel-only` on the 3e publish-gate
denylist (it claims a cross-engine outcome). The remaining 56 tags were audited: engine-name tags
(`google`, `lattice`, `gsheets-idiom`) name the case's *intent/idiom* (case-property — keep);
`skip-reason:network` is operational provenance (keep, not an outcome claim); `cross-check`,
`coercion`, `error-type` describe stimulus shape (keep).

## 8. Validation gates (all must hold before the pass is "done")

1. Full suites green (contracts / assay / edit-shell), including new loader/exporter tests.
2. Re-seed → coverage: uncovered forks **substantially down** from 877; every authored predicate
   resolves (unresolved-predicate count 0 on YAML-authored scopes); dangling count down to only
   genuinely-gone cases; converged-only count unchanged (5).
3. Zero denylist leaks in the published manifest tags.
4. V4 site still builds (`assay build` of the catalogue site).
5. Idempotency: re-running seed twice is byte-stable; the preservation contract
   (author/status/verified) verified against a mutated row, as in 3c.

## 9. Execution sequencing

3f.1 tooling (loader `scope:` + validator + exporter precedence + tests) → 3f.2 dangling repair →
3f.3 scope conversions (19 exact + audited subset cases) → 3f.4 tag authoring where §3 calls for
it → 3f.5 the new-annotation fan-out over the 877 (workflow-automated, evidence-grounded) →
3f.6 validation + re-seed + before/after coverage report in the session handoff.
