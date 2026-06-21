# The fork-annotation store (design, 3a)

**Status: PROPOSED — 2026-06-20.** The build design for CP3 increment #3: an attributed store
for fork annotations, living in edit-shell and joined to assay's observations out of band. It
turns the annotation-layer principle (`annotation-layer-design-2026-06-19.md`) into a concrete
schema (in `@cartularium/contracts`), a D1 table + API in `packages/edit-shell`, and a one-time
migration of the 255 `DV-*.yaml` files.

Read first: `annotation-layer-design-2026-06-19.md` (the principle), `comparison-output-
contract-2026-06-17.md` (the manifest is observation-only — shipped), `terminology.md`
(vocabulary). Settled steers: the schema lives in contracts; the build (3b+) starts after this
doc.

**Review state.** §1–§7 are agreed in principle; §8 (contracts dependency) and §9 (review
gate) are open. An adversarial pass (2026-06-20) raised four items to settle on this read —
marked `[R#]` in the text:

- **R1 (§4)** — publishing test `tags` to the manifest would expose outcome-claim tags that
  *already exist* in the corpus (`excel-only`, `divergence`, `coercion-divergence`). The §1 rule
  is only a norm, and the corpus shows it already leaks, so the publish step needs a hygiene
  gate, not just a norm.
- **R2 (§6/§7)** — "the DV-lifecycle retires fully" is overstated. The "did this engine change?"
  reconstruction has a key mismatch (scope refs are `SUBJECT/name`; the results history is keyed
  differently) and can't tell a rename from a convergence. Retirement is coupled to a
  results-history substrate that isn't designed yet.
- **R3 (§5/§6)** — a ref-set scope whose ref no longer resolves (renamed/deleted case) looks
  identical to a converged fork. The coverage view needs a distinct "dangling ref" signal.
- **R4 (§9)** — publish-on-sign puts a contributor's annotation on the public render with only
  rate-limit + delete behind it, and the tiered render that would soften that doesn't exist yet.

What held up under the adversary: the join key is genuinely synced, `category` already lives on
the manifest test entry, contracts is Worker-safe, and most DVs are real value-forks (so the
migration is healthy).

---

## 1. The principle

> assay records the observed WHAT — which engines forked, and each engine's capability — never
> the WHY. Cause, naming, and explanation are contributed and attributed, never vouched by assay.

Three layers: **assay** observes (the manifest: partition + capability, observation-only),
**edit-shell** holds the attributed explanations, **sheets-wiki** renders the join. This doc
builds the middle layer.

An annotation is an attributed claim — `(author, content, scope)` — kept out of the manifest and
joined to forks by case-ref. Its identity is a sticky id (the `DV-####`); the old
content-fingerprint (`clusterKey`) retires. A shared explanation *is* a cluster: the grouping is
interpretation, so one annotation holds it while the forks stay atomic in the manifest.

**Case-properties vs outcome-claims.** "The relation layer holds no interpretation" does not mean
"no metadata reaches the manifest." The catalogue may carry author-declared properties of the
*case* — its shape or intent (`subject`, `category`, `features`, `tags`; e.g. `complex-number`,
`volatile`, `locale-sensitive`). It must not carry an author claim about the cross-engine
*outcome* (`excel-only`, `forks-on-precision`) — that is the meaning, and it belongs in the
annotation. This rule lets a test tag serve as a predicate surface (§4); it's also why a direct
`links.divergence: DV-id` on a test is not adopted — naming an annotation in the repo puts
cluster-membership interpretation back into the corpus, which the principle moved out.

## 2. What already exists

**assay (`packages/assay`):**

- `divergences/DV-*.yaml` — 255 files. Fields: `id`, `summary` (auto-derived; 4 are bare `TODO`),
  `cause`, `category`, `engines[]`, `behavior.signature`, `tests[]` (case-refs as `SUBJECT/name`),
  `subjects[]`, `seeded`, `last-confirmed`. 10 carry `status: vanished`.
- `DvEntry` + `loadDvs` — `src/catalogue-site/load.ts`.
- `links.divergence` (`src/format/catalogue.ts`) is unwired — no test references a DV, so the
  migration breaks no back-refs.
- Machinery that will retire: `src/history/*`, `src/divergences/cluster.ts`,
  `src/divergence-matrix.ts` (`seedCatalogue`), `src/commands/{history,matrix}.ts`.

**edit-shell (`packages/edit-shell`):**

- D1, raw SQL, numbered migrations. Mirror `migrations/0003_assay_submitted_cases.sql` (id,
  owner_id, status, canonical_case_id, hash, R2 key, timestamps).
- A submit → review → accept → PR pipeline under `/api/edit/assay` (`src/routes/assay-preview.ts`):
  owner attribution, `isAssayMaintainer()`, accept/reject, PR materialization. Runner:
  `src/routes/assay-runner.ts`.
- The join key is already in sync: edit-shell's `submittedSemanticHash()` matches assay's
  `format/semantic-hash.ts`, and `canonical_case_id` is the `SUBJECT/name` ref that `DV.tests`
  holds.
- No annotation concept yet — greenfield on working rails.
- edit-shell does not import `@cartularium/contracts` yet (§8 changes that).

## 3. The annotation

One annotation is one authored, attributed, scoped claim. The DTO lives in contracts; the D1
table mirrors it.

```
AssayForkAnnotation (v1)        # stores only what is authored
  id          string           # sticky id; migrated DVs keep "DV-####"
  author_id   string           # "auto-seeded (provisional)" for migrated rows
  content     string           # the human explanation (the DV summary, migrated)
  cause?      Cause            # optional coarse facet; not the identity
  scope       AnnotationScope  # which forks this covers — §4
  created_at / updated_at
```

It stores nothing observed and nothing temporal:

- **`engines` and `category` are derived, not stored.** Both are observed facts the manifest
  already publishes per fork. Storing them would freeze a fact that drifts when the scoped forks
  change, so they're computed from the manifest join at read time (`engines` = the union over the
  scoped forks' classes; `category` from the joined cases). The migration does not copy them.
- **No lifecycle/status field.** "Did this change?" is a question about the results over time, not
  about the annotation (§6).

Invariants: out of band (never a manifest field); attributed, not authority (signed — "@alice's
reading," not assay's verdict); sticky id; and the unit is the annotation, not the `cause` (two
forks can share `cause: precision` and stay two annotations).

## 4. Scope — which forks an annotation covers

`scope` is a **list of clauses**, unioned: an annotation covers a fork if any clause matches. A
clause is either an explicit ref-set or a predicate, so an author can combine a predicate
(auto-covers matching forks) with cherry-picked refs (the stragglers it misses).

```ts
// @cartularium/contracts — assay-fork-annotation.ts
export type AnnotationScope = ScopeClause[] // covers a fork iff ANY clause matches

export type ScopeClause =
  | { kind: "ref-set"; refs: string[] } // explicit case-refs (SUBJECT/name)
  | { kind: "predicate"; query: ForkPredicate }

export interface ForkPredicate {
  tags?: string[] // author-declared case properties — matcher-free, v1-shippable
  enginesAlone?: Platform[] // observed — needs the deferred matcher
  valueKind?: "error" | "number" | "text" | "blank"
  sentinel?: string
  subjectIn?: string[]
}
```

In D1, `scope_json` holds the clause array. (No `scope_kind` column — a list can mix kinds;
filtering by "has a predicate" is derived if ever needed.) Exclusion clauses ("cherry-pick out")
are a possible later addition; v1 is union-only.

A predicate has two kinds of dimension:

- **`tags`** — author-declared case properties (§1). Matcher-free: the tag is already on the test,
  so the predicate just reads it. This is the cheap way to auto-cover new same-shaped cases, and
  the home for connecting a case at authoring time — the author tags the *concept*, not a DV id.
- **observed properties** (`enginesAlone`, `valueKind`, …) — need the fork-property matcher, which
  is deferred.

Discipline: a predicate must not become a disguised auto-cluster (the `clusterKey` we retired).
Tags are author-declared intent, never machine-inferred from outcomes.

**Decisions:**

1. `scope` is a clause list. New clause kinds land with no schema migration.
2. Migrate every DV as one ref-set clause (`[{kind:"ref-set", refs: tests}]`) — the faithful
   snapshot. This is provisional (see §4 reclassification).
3. Tag-predicates ship in v1; observed-predicates wait for the matcher. Tag-predicates need the
   manifest to publish test `tags` (below). **[R1: that publish needs a hygiene gate.]**
4. `links.divergence` stays retired; authoring-time connection goes through case-tags.
5. The case-tag vocabulary is open (free-form), not an enum. The §1 rule is a norm for *authoring*.
   **[R1: but publishing tags into the manifest is a relation-layer boundary that does need a
   gate — the corpus already carries outcome-claim tags.]**

**Manifest tags.** `ManifestV5TestEntry` has no `tags` today. Tag-predicates need it, so the
manifest must publish test `tags` — additive, alongside the `category` it already carries.
**[R1: gated on tag hygiene, not a clean drop-in.]**

**Reclassification (deferred).** The ref-set migration is provisional. Once the store,
manifest-tags, and API exist, a policy-driven pass — likely workflow-automated, alongside
new-test-writing — converts the provisional ref-sets into tag/predicate scopes, labels tests, and
writes annotation content. Gated on all the infra landing first; the policy itself is future work.

## 5. The migration

A one-time, additive import:

- Each `DV-####.yaml` → one row: `id = DV-####`, `author_id = "auto-seeded (provisional)"`,
  `content = summary`, `cause = cause`, `scope = [{kind:"ref-set", refs: tests}]`.
  `engines`/`category` are not copied (derived, §3).
- The 10 vanished DVs import as plain rows; they simply match no current fork. **[R3: that should
  read as a distinct "dangling ref," not as a convergence.]**
- It touches nothing in-repo: the YAML, `seedCatalogue`, and `history` stay (the V4 site still
  renders them). They retire with #4, not here.
- Mechanism: a maintainer-run script reading `loadDvs()`, idempotent on `id`
  (`INSERT … ON CONFLICT(id) DO UPDATE`).

## 6. Coverage and history

Coverage is a derived read, computed on demand from the current manifest × the annotations:

- forks with no annotation → contribution prompts.
- annotations whose forks have converged or match nothing → flagged when you look.

So the store keeps no observation of its own and no stored reconciliation — it joins to the
published manifest.

**"Did this engine change?" is a separate question, and the annotation stays out of it.** It's
about the results over time, not about the annotation, and is answered by composing:

> annotation.scope → case-refs × the test-results history at two points → diff.

The annotation only says which cases to look at; the time data lives in an independent,
observation-side record (a series of published manifests, with the committed fixtures as the raw
substrate). **[R2: this needs a results-history keyed by the same case-ref the scope uses and able
to tell a rename from a convergence. That substrate isn't designed yet, so the DV-lifecycle does
not "retire fully" until it is.]**

## 7. Stability is observation-side, not an annotation property

The old DV lifecycle (seeded / grown / vanished) is, plainly, the stability relation: did a case's
cross-engine result change across runs? Per §6 that's computed from the results history, optionally
scoped by an annotation — never stored on the annotation. Vocabulary stays neutral: *changed* /
*stable*, not *resolved* / *vanished-as-defect*.

For 3a: no status field on the annotation; the 10 vanished DVs are plain rows; the stability
computation and its substrate are deferred (R2).

## 8. The schema lives in contracts

The DTO lands in `@cartularium/contracts` (`assay-fork-annotation.ts`, versioned). This means
**edit-shell imports contracts for the first time** — a new dependency and the build-before-consume
rule. It's the right edge: edit-shell and sheets-wiki then share one `AssayForkAnnotationV1` shape
instead of duplicating it, and the adversary confirmed contracts is Worker-safe, so the bundling
risk is low. **Open: confirm the dependency.**

## 9. API and the review gate

Mount under `/api/edit/assay`, reusing `requireSession`, `rateLimit`, `isAssayMaintainer()`:

- `GET /fork-annotations` — list/filter; feeds the coverage view and the renderer.
- `POST /fork-annotations` — create (author = session user).
- `PATCH /fork-annotations/:id` — edit own (or maintainer).
- `DELETE /fork-annotations/:id` — retire own (or maintainer).

**Open — the review gate.** An annotation is attributed, not vouched, so in principle it needs no
accept gate (a creation gate would put the maintainer back in charge of meaning). Two options:

- **A — publish on sign:** authenticated + rate-limited + maintainer-can-delete.
- **B — light review:** a maintainer pass before it joins the public render.

**[R4: publish-on-sign exposes contributor annotations on the public render with only rate-limit
behind them, and the tiered render that would mark them as unreviewed doesn't exist yet.]**

## 10. Sequencing

1. **3a** — this doc.
2. **3b** — contracts DTO + D1 migration + CRUD API.
3. **3c** — the one-time DV import.
4. **3d** — coverage views (including the R3 dangling-ref signal).
5. **3e** — publish manifest `tags` (with the R1 hygiene gate) + resolve tag-predicates.
6. **3f** — reclassification (deferred until 3b–3e; likely workflow-automated).
7. **Deferred** — the observed-property matcher; the stability computation + results-history
   substrate (R2); retiring the in-repo `history`/`seedCatalogue`/YAML with #4. The sheets-wiki
   render is #4.

## 11. Open decisions

- **§8** — confirm the edit-shell → contracts dependency.
- **§9** — the review gate (publish-on-sign vs light review), informed by R4.
- **R1–R4** (top) — fold into §4/§6/§7/§9 as each is decided.
