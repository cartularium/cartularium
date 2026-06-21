# The fork-annotation store — schema, migration, coverage (design, 3a)

**Status: PROPOSED (2026-06-20) — ratifying section-by-section; §1–§4 RATIFIED 2026-06-20,
§5–§11 pending.** This is the
build design for **CP3 increment #3**: the attributed fork-annotation store that the
ratified annotation-layer principle (`annotation-layer-design-2026-06-19.md`) routes to
**edit-shell**. It turns that principle into a concrete schema (landing in
`@cartularium/contracts`), a D1 table + API in `packages/edit-shell`, and a one-time
migration of the 255 in-repo `DV-*.yaml` files.

Read first, in order: `annotation-layer-design-2026-06-19.md` (the principle — binding),
`comparison-output-contract-2026-06-17.md` §"Refinement 2026-06-19" (the manifest went
observation-only — built, increment #1), `terminology.md` (vocabulary). This doc does **not**
re-litigate the principle; it designs the build under it.

**Maintainer steers already set (2026-06-20):** schema/DTO lands in `@cartularium/contracts`;
the scope-grain question is **open design work** (§4, not pre-decided); write this doc before
any edit-shell code. The worktree/branch for the *build* (3b+) is decided when 3b starts.

---

## 1. The principle (inherited, not re-opened)

> assay holds the observed **WHAT** (forks + capability), never the **WHY**. Everything
> interpretive — *cause, naming, explanation* — is **contributed and attributed**, never
> vouched by assay.

Three layers (annotation-layer-design §2): **assay** observes (ManifestV5: partition +
capability — now observation-only), **edit-shell** collects attributed scoped explanations,
**sheets-wiki** renders the join. This doc builds the middle layer. An annotation is
`(author, content/cause, scope)` — an attributed claim, out-of-band, joined to forks by
case-ref. Identity is a **sticky id** (the `DV-####`); the content-fingerprint `clusterKey`
**retires**. A shared explanation **is** a cluster (the grouping is interpretation, so it
lives here, authored once; the observed forks stay atomic in the manifest).

**Sharpening (2026-06-20) — case-properties vs outcome-claims.** The line "the relation
layer holds no interpretation" is not "no metadata reaches the manifest." It is: the
catalogue may hold author-declared **properties of the case** (its intrinsic shape/intent —
`subject`, `category`, `features`, `tags`; e.g. `complex-number`, `volatile`,
`locale-sensitive`), but never an author **claim about the cross-engine outcome** (`pycel-
missing`, `excel-only`, `forks-on-precision`). A case-property describes the formula and
asserts nothing cross-engine; an outcome-claim is the *meaning*, which belongs in the
attributed annotation. This is the rule that keeps test tags (§4) honest as a predicate
surface — and it is why a direct `links.divergence: DV-id` on a test is **not** adopted (§4):
naming a specific annotation in the repo re-homes cluster-membership interpretation into the
git corpus, the very thing annotation-layer §5 exiled.

## 2. Current-state map (the rails that exist — anchors for the build)

**Migration source — assay (`packages/assay`):**
- `divergences/DV-*.yaml` — **255 files**, ids `DV-0001..DV-0255`. Fields: `id`, `summary`
  (auto-derived; only **4/255** are bare `TODO`), `cause`, `category`, `engines[]`,
  `behavior.signature`, `tests[]` (case-refs in `SUBJECT/name` form), `subjects[]`, `seeded`,
  `last-confirmed`; **10** carry `status: vanished` + `vanished-at`.
- `DvEntry` type + `loadDvs` — `src/catalogue-site/load.ts:11-69`.
- `links.divergence` (`src/format/catalogue.ts:112-116`) is **unwired** — zero corpus tests
  reference a DV, so the migration breaks no back-refs.
- The machinery that retires (all quarantined or seed-only): `src/history/{record,dv-lifecycle,
  hash}.ts`, `src/divergences/cluster.ts` (`clusterKey`), `src/divergence-matrix.ts`
  (`seedCatalogue` ~404-461, writes the YAML), `src/commands/{history,matrix}.ts`
  (`matrix --seed-catalogue`).

**Target home — edit-shell (`packages/edit-shell`):**
- **D1, raw SQL, numbered migrations** (`migrations/000N_*.sql`). Template to mirror:
  `0003_assay_submitted_cases.sql` (`id`, `owner_id`, `status` draft→submitted→accepted/
  rejected, `canonical_case_id`, `case_hash`, R2 key, timestamps, `error_*`).
- **Submit→review→accept→PR** under `/api/edit/assay` — `src/routes/assay-preview.ts`
  (owner attribution at POST; `isAssayMaintainer()` ~122-133; accept/reject ~1093-1217;
  PR materialization ~1285-1443). Runner rails — `src/routes/assay-runner.ts`.
- **Join key already synced:** `submittedSemanticHash()` (~763-769; `sha256:` over
  subject/formula/grid/expect/overrides/features/…) mirrors assay's `format/semantic-hash.ts`;
  `canonical_case_id` is the `SUBJECT/name` ref — **the same key `DV.tests` holds**.
- **No annotation/cause/cluster concept yet** — greenfield on proven rails.
- **edit-shell does not import `@cartularium/contracts`** today (DTOs hand-duplicated in
  `src/assay-preview/config.ts`). The schema decision (§8) changes that.

## 3. The annotation model (the data shape)

One annotation = one authored, attributed, scoped claim. The **DTO lives in contracts**
(versioned, §8); the **D1 table** in edit-shell mirrors it.

```
AssayForkAnnotation (v1)        # STORES only what is authored
  id            string          # sticky identity; migrated DVs keep "DV-####"
  author_id     string          # provenance; "auto-seeded (provisional)" for migrated rows
  content       string          # the human explanation (the DV summary, for migrated rows)
  cause?        Cause           # optional controlled facet (coarse; not identity, no arrow)
  scope         AnnotationScope  # WHICH forks this covers — see §4 (the open fork)
  status?       …               # lifecycle, see §7 (neutral vocab; deferred shape)
  created_at / updated_at
```

**`engines` + `category` are DERIVED, not stored (ratified 2026-06-20).** Both are *observed*
facts — the manifest already publishes, per fork, the partition (which engines class up) and
the test category. Storing them on the annotation would freeze an observed fact that **drifts**
when the scoped forks change. So they are computed at read-time from the manifest join
(`engines` = the union over the scoped forks' classes; `category` from the joined cases) —
the same derived-reads discipline as coverage (§6), and the join is already happening. The
migration does **not** copy a DV's `engines`/`category`; they reconstruct from the forks its
`tests[]` point at. Cost: list/filter queries can't index a stored `engines` column — negligible
at this table size; a materialized view is the fix if it ever bites, never a drifting column.

Invariants (from the principle):
- **Out-of-band.** Never a field in ManifestV5 — joined to forks by case-ref (the oracle
  precedent). Increment #1 already made the manifest observation-only; this is its other half.
- **Attributed, not authority.** Signed by `author_id`; assay vouches for nothing
  interpretive. The cause is "@alice's reading," never assay's verdict.
- **Sticky id.** The `id` is the identity; `clusterKey` retires. Migrated rows keep `DV-####`
  so any future external reference stays stable.
- **The unit is the authored annotation, not the `cause` value.** Two excel/gsheets forks can
  both be `cause: precision` and remain two distinct annotations with two distinct scopes.

## 4. The scope grain — the open fork (ratify this)

`scope` answers *which forks does this explanation cover?* The principle (annotation-layer
§3) ratified **"allow both ref-set and predicate; author picks."** The build question is the
**shape now** and **what the migration uses** — this is the section flagged as open design.

**Option R — ref-set.** `scope = { kind: "ref-set", refs: case-ref[] }`. An explicit list.
- *Migration:* trivial and **faithful** — `DV.tests` **is** a ref-set; the lift preserves
  exactly the forks that were grouped on the seed date, not a reconstructed rule.
- *Ongoing:* static. A new same-shaped case added later does **not** auto-join; it surfaces as
  an un-annotated fork (a contribution prompt, §6) until a human extends the scope. For
  DV-0001 (pycel missing-function, 78 subjects) every new pycel-missing function is a manual
  scope edit. The design accepts this ("new same-shaped cases don't auto-join").

**Option P — predicate.** `scope = { kind: "predicate", query: ForkPredicate }`, evaluated
lazily against the live partition. It auto-covers future matching forks — one annotation
tracks a class as the corpus grows (the principle's "doubles as the coverage-growth fix").
A predicate has **two kinds of dimension, with very different cost**:
- **author-declared case-tags** (`tags`) — *matcher-free*. The author writes a case-property
  tag at authoring time (§1: a property of the case, never an outcome-claim); the predicate
  reads it. No partition computation; the tag is already there. This is the cheap coverage-
  growth path, and it is the home for the *connect-at-authoring-time* ergonomic (the author
  tags the **concept**, not a DV id — so no `links.divergence`, no git↔DB back-edge).
- **observed fork-properties** (`enginesAlone`, `valueKind`, `sentinel`, partition shape) —
  needs the **fork-property matcher** (annotation-layer §7; charter §7), which is deferred.

Discipline (both kinds): a predicate must **not** become a disguised content-key auto-cluster
(§3, retired). Case-tags must be **author-declared intent**, never machine-inferred from
outcomes — an inferred tag is the `clusterKey` crutch sneaking back. A predicate composes the
two honestly: `tags` narrows by author-declared case-property; the observed dimensions do the
cross-engine part (assay's job).

**`scope` is a LIST of clauses, unioned (ratified 2026-06-20).** Not one ref-set *or* one
predicate — a list, so an author can compose a **predicate clause** (auto-covers matching
forks) **with cherry-picked ref-set clauses** (the explicit stragglers the predicate misses).
An annotation covers a fork iff **any** clause matches (union). Exclusion ("cherry-pick out")
is a possible future clause attribute — deferred; v1 is additive-union only.

```ts
// @cartularium/contracts — assay-fork-annotation.ts
export type AnnotationScope = ScopeClause[]          // unioned; covers a fork iff ANY clause does

export type ScopeClause =
  | { kind: "ref-set";   refs: string[] }            // explicit case-refs (SUBJECT/name)
  | { kind: "predicate"; query: ForkPredicate }

export interface ForkPredicate {
  tags?: string[]            // author-declared CASE properties — MATCHER-FREE (v1-shippable)
  enginesAlone?: Platform[]  // observed — needs the deferred matcher
  valueKind?: "error" | "number" | "text" | "blank"
  sentinel?: string
  subjectIn?: string[]
}
```
D1: `scope_json TEXT` holds the clause array (the source of truth). No `scope_kind` column —
a list can mix kinds; if "has a predicate clause" filtering is ever needed (e.g. re-evaluate
when the matcher changes), it's derived, not a stored column.

**Resolution (ratified 2026-06-20):**
1. **`scope` is a clause LIST** (the union-of-clauses above), so predicate + cherry-picked
   refs compose. The clause kinds are open-ended (predicate lands with **no schema migration** —
   just a new clause kind/dimension in `scope_json`).
2. **Migrate every DV as a single ref-set clause** — `scope: [{kind:"ref-set", refs: tests}]`.
   The honest snapshot. **This is a *provisional* state**, not the final scoping (3 below).
3. **Tag-predicates are v1-shippable**, observed-predicates wait on the matcher. The
   `tags`-only predicate needs no matcher — only that the manifest publishes test tags so the
   edit-shell join can read them (the flag below). The observed dimensions defer with the
   matcher (the same one the charter defers).
4. **`links.divergence` stays retired** — the connect-at-authoring ergonomic routes through
   case-tags (§1), not a DV-id in the test YAML.
5. **The case-tag vocabulary is OPEN** (free-form strings), not a controlled enum. The §1
   case-property-vs-outcome-claim rule is a **documented norm**, not a gate — closing the vocab
   is a governance burden we decline. A smuggled outcome-claim tag is caught by review culture
   (and is self-limiting: it just makes a worse predicate), not by schema.

**Manifest flag (new dep of tag-predicates):** `ManifestV5TestEntry` carries no `tags` today.
For an edit-shell predicate to join by tag at read-time, the manifest must **publish test
`tags`** — observation-only (a case descriptor, like the `category` already there). A small,
clean additive change to the contracts schema + `build-v5.ts`, sequenced with the tag-
predicate (§10).

**Reclassification is a later, automatable phase (deferred until the infra exists).** The
ref-set migration (2) is provisional; once the store + manifest-tags + API are in place, a
**policy-driven reclassification pass** converts provisional ref-sets into better tag/predicate
scopes, labels tests with case-tags, and authors annotation content. The maintainer expects
much of this to be **workflow-automated** (the same automation wave that writes new tests) —
but it is explicitly **gated on all the infra landing first**. The *policy* it encodes (how to
classify/label) is itself future work, out of 3a. The observed-property matcher surface is the
other deferred sub-question.

## 5. The migration (255 DVs → annotation rows)

A **one-time import**, additive and non-breaking:
- Each `DV-####.yaml` → one `assay_fork_annotations` row: `id = DV-####`,
  `author_id = "auto-seeded (provisional)"`, `content = summary`, `cause = cause`,
  `scope = [{ kind: "ref-set", refs: tests }]`. The DV's `engines`/`category` are **not**
  copied — they derive from the joined forks (§3).
- The **10 vanished** DVs import cleanly — their scope simply matches no current fork, so they
  read as "stale/matching-nothing" in the derived coverage view (§6). No special-casing.
- **What it does NOT touch:** the `DV-*.yaml` files, `divergences/`, `seedCatalogue`, and the
  `history`/`dv-lifecycle` machinery **stay** — the V4 catalogue-site still renders them.
  Their retirement is **coupled to #4** (the website rework); deleting the corpus before the
  V4 site is gone would break the live catalogue. So #3 lands the store *alongside* the YAML,
  not in place of it.
- Import mechanism: a maintainer-run script/endpoint reading `loadDvs()` output (or a checked
  payload), idempotent on `id` (re-running upserts, never duplicates).

## 6. Coverage & staleness — derived reads, never write-cascades

Computed on demand from **(live forks from the published manifest) × (annotations)**:
- **un-annotated forks** → contribution prompts (the `matrix --view forks` shape, joined).
- **annotations whose forks have converged / match nothing** → flagged *when you look*.

This is what dissolves the per-change reconciliation burden ("check staleness on every corpus
change" becomes "compute the coverage view when you want it"). It also means the store needs
**no fork-observation of its own** — it joins to assay's published ManifestV5
(`build-v5.ts`); the runner already observes forks for contributed cases. Annotations are
pure authored claims.

## 7. Lifecycle = the stability relation (framed, mostly deferred)

The DV "lifecycle" (seeded/confirmed/grown/shrunk/vanished, today in `dv-lifecycle.ts`) is, in
the no-verdict frame, the **stability relation** over an annotation's referenced forks
(terminology §0): does the fork persist across re-runs/conditions? Neutral vocabulary — no
"resolved"/"vanished-as-defect" (a fork converging is not a defect being fixed). For 3a:
import the 10 vanished DVs as-is; the `status` column shape + the stability computation are a
**later increment**, not this build. Flagged so the column isn't designed into a corner.

## 8. Where the schema lives — contracts (the first edit-shell→contracts edge)

Per the steer, the DTO lands in **`@cartularium/contracts`** (`assay-fork-annotation.ts`,
versioned like the manifest). Consequences to ratify:
- **edit-shell imports contracts for the first time.** Adds `@cartularium/contracts` as a dep
  + the build-before-consume rule (contracts must build before edit-shell's runtime import).
  This is a deliberate architectural step (the monorepo is trying to *reduce* the transitional
  DTO duplication, not add to it) — worth the edge.
- sheets-wiki (the renderer, #4) reads the same contracts DTO → one shared shape across all
  three layers, no re-duplication.
- The D1 table mirrors the DTO; `scope` serializes as `scope_kind` + `scope_json`.
- Versioned: `AssayForkAnnotationV1`. Breaking changes bump, per the contracts versioning rule.

## 9. The API surface (reuse, don't reinvent)

Mount under `/api/edit/assay` alongside the submitted-case routes; reuse `requireSession` +
`rateLimit` + `isAssayMaintainer()`:
- `GET /fork-annotations` — list (filter by fork-ref / engine / cause); the join feeds the
  coverage view + the renderer.
- `POST /fork-annotations` — create (author = session user; the attributed-contribution rail).
- `PATCH /fork-annotations/:id` — edit own (or maintainer); `updated_at` bumps.
- `DELETE /fork-annotations/:id` — retire (own/maintainer).
- Review/accept: an authored annotation likely needs **no** accept gate (it is attributed, not
  vouched — the whole point), unlike a submitted *case*. **Open:** does a contributed
  annotation publish immediately (signed, anyone can post) or pass a light maintainer review?
  (Ratify in §11.)

## 10. Sequencing & deferred

1. **3a (this doc)** — schema + migration + coverage design, ratified section-by-section.
2. **3b** — contracts DTO (`AssayForkAnnotationV1`, scope clause-list) + D1 migration + CRUD API.
   (Worktree/branch decided here.)
3. **3c** — the one-time 255-DV import (ref-set, provisional author).
4. **3d** — coverage/staleness derived-read views (annotations ⋈ manifest).
5. **3e (tag-predicates)** — publish test `tags` on `ManifestV5TestEntry` (observation-only) +
   resolve `tags`-only predicates. Matcher-free; can land any time after 3b.
6. **3f (reclassification) — deferred until 3b–3e land.** A policy-driven, largely
   **workflow-automated** pass (§4) that converts the provisional ref-set migrations into
   tag/predicate scopes, labels tests with case-tags, and authors annotation content. Gated on
   all the infra existing first; the classification *policy* is its own future design.
7. **Deferred:** the *observed*-property matcher (§4) for the non-tag predicate dimensions; the
   stability/lifecycle column shape (§7); retiring the in-repo `history`/`seedCatalogue`/YAML —
   **with #4** (the website rework), never before. The sheets-wiki render is #4.

## 11. Open decisions (the ratification forks)

- **§1–§4 RATIFIED 2026-06-20** — the principle + case-property/outcome-claim rule; the
  current-state map; the annotation model (engines/category derived); the scope grain (clause
  list; ref-set migration provisional; open case-tag vocab; tag-predicates v1-shippable;
  reclassification deferred to 3f). Remaining forks below.
- **§8 contracts edge** — confirm edit-shell taking a contracts dependency is acceptable here
  (it is the first such edge).
- **§9 review gate** — do contributed annotations publish immediately (attributed, no gate) or
  pass a light maintainer review before they join the rendered view?
- **§7 lifecycle** — confirm the stability-relation framing + that the `status` shape is
  deferred (import vanished DVs as-is for now).
- **§5 import mechanism** — script vs endpoint; confirm idempotent-on-`id`.
