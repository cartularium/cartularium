# Comparison-output contract — ManifestV5 + the authoring contract (CP2 design)

> **Re-founded 2026-07-18.** This document is design history. Labels such as
> "ratified" or "charter" inside it carry no authority; governing decisions
> live in the internal decisions ledger (see
> `internal/decisions/2026-07-18-assay-refounding.md`). Where this document
> describes the no-verdict frame it remains an accurate description; where it
> conflicts with the re-founding decisions, the decisions win.

**Status: RATIFIED (2026-06-17).** Three adversarial review rounds (round-1 break-it, round-2
break-it, round-3 sanity check → RATIFY-WITH-TRIVIAL-FIXES, all verified coherent + code-faithful);
maintainer decisions P1/Q2/Q4 settled. Final fold-in: a distinct `unsupported` capability value
(preserving the `skipped{capability}` signal the sanity check flagged) + two cite fixes. This is
CP2 closed; CP3 (re-seat outputs, retire the fossil, build it) is the next checkpoint. This is CP2's design
(the initiative doc `comparison-initiative-2026-06-17.md` is the scope; `terminology.md` is the
binding vocabulary). When it ratifies, the §4 quarantine lifts and the `divergence→forked`
rename + matrix rework (CP3) follow.

It designs **two ends of one model**: the **authoring contract** (what an author may declare,
and where each kind lives) and the **published contract** (ManifestV5). The keystone is the
*authoring theory* in §1, from which both ends and every field placement derive. Interleaf's
bridge feed (§8) is **deferred** ("asleep until assay's relation layer is set").

### Provenance (for the reviewer)

- **Round-1** added the authoring theory (§1) + retired `override`; made the class value a SET;
  reused/renamed the `CanonicalCell` projection; deferred interleaf.
- **Round-2 + decisions** (this version): `override.recorded` **survives** as the (O) drift
  anchor (P1); the fork-annotation registry is renamed **`annotations`** (Q2); the R-vs-A line
  is made **structural** — the relation is carried by the partition + a controlled `cause`
  enum, free-text `summary` is **non-normative display** (Q4/P4); the exact-dedup predicate is
  named as **new code** (P2); `cause` becomes **hand-authored** post-`override`, the matrix
  loses auto-seed (P3); the `observed`-as-intended signal **migrates to the lens** (P5);
  benchmark (I)-fields read from the **case**, not the manifest (P6).

## Refinement (2026-06-19, ratified) — the annotation layer moves out-of-band

CP2 placed `cause` **load-bearing in the manifest** as an (R) relational annotation (§4).
A philosophy review of DV-identity (2026-06-19) found this blurs the relation/authored
line. The sharpening: a DV bundles **three** kinds of claim, not two —

- the **fork** (partition + values): *observed*, symmetric, indisputable — pure relation;
- the **cause**: *authored interpretation* — it classifies the *dimension* of difference
  (precision/locale/null-vs-zero), carries no arrow (names no deviant), but is **defeasible**
  and gravity-bearing (like provenance, yet unlike provenance it is a *reading*, not a brute
  fact). Not a verdict — but not observation either;
- the **summary / curation**: editorial attention.

Sitting *inside* the relation output, `cause` reads as fact. Resolution: the **whole
annotation layer** (`cause` + summary + curation) leaves the manifest and sits **out-of-band**,
alongside the oracle sidecar (its own artifact — the `divergences/DV-*.yaml` files, reframed),
joined to forks by case-ref. Concretely:

- **ManifestV5 = observation only.** Drop `annotations` + `ManifestForkAnnotation` from the
  manifest; it carries only the two *observed* axes — per-test `partition` + per-engine
  `capability`. `ManifestV5FunctionEntry.forks` becomes observed forked-case-refs only (no
  annotation ids). A grep for fork-`cause`/`annotation` in the manifest output is now empty —
  the no-verdict invariant made structural at the output boundary.
- **Fork-annotations are the out-of-band authored layer** — sticky-id identity (the `DV-####`,
  which always *was* the identity; the content-fingerprint `clusterKey(cause+engines+values)`
  was an auto-maintenance crutch), referencing forks by case-ref. This is the home the
  DV-identity re-founding lands in (next checkpoint).
- **Keep** the capability axis's `no-data` `cause` (`policy`/`seed-infidelity`/`infra`/
  `driver-error`/…) — that is the *operational* reason there's no data (mechanical, observed),
  NOT an interpretation of engine semantics. Different `cause`; it stays.
- **Touches already-built code:** `buildManifestV5` (CP3 step 4) stops emitting `annotations`
  and reading `dv.cause`; its annotation tests move to the sidecar's tests.

The three-way distinction generalizes: **observed** (relation) / **authored-descriptive-with-
gravity** (`cause`, kept honest like provenance — but exiled out-of-band for the extra wall) /
**authored-normative** (oracle, already exiled CP2). The catalogue *lives*; it just stops
impersonating the relation layer (a *reading*, not the territory).

## 0. Binding constraints (settled — not under review)

- **No-verdict.** The relation layer (catalogue + manifest) holds relationships, never verdicts.
- **Two-layer cut.** Manifest = relation layer. Normativity lives only in named lenses.
- **Multiplicity, not conformance.** A formula is **uniform** (one class) or **forked** (>1, each
  a legitimate branch). No center, no baseline.
- **Oracle out-of-band.** An authored assertion is not a field in V5 — it lives in a separate
  lens artifact joined by case ref.
- **`expect:` = lens sugar, not canon.** Inline `expect:` compiles out at parse time into the
  author's own out-of-band self-check lens.

## 1. The authoring contract (THE KEYSTONE)

**The litmus (the bright line):**

> **Strip away every notion of "correct." What remains true is the relation layer. What
> evaporates was an assertion — and assertions live out-of-band in a named lens.**

Operationally: *a declaration is relation-layer iff every consumer would accept it as true
regardless of which engine or semantics they treat as correct.*

**The five kinds — every authored declaration sorts into exactly one:**

| kind | what it is | layer |
|---|---|---|
| **(S) Stimulus** | the probe: formula, grid, platform variants, suite definitions/fixtures | relation |
| **(I) Identity & classification** | names + descriptive probe facets: id/subject/category/features/tags/supportLevel/links | relation |
| **(O) Observation** | a recorded result, live or historical (fixtures, `recorded`) | relation |
| **(R) Relational annotation** | a note on how observations relate (the `cause`, the partition) | relation |
| **(A) Assertion** | a claim a result is correct / should-be-X (`expect`, `override.expect`) | **lens (out-of-band)** |

**The R-vs-A line is structural, not prose discipline.** Earlier framing leaned on a "keep the
narrative symmetric" convention — but a philosophical property (symmetry / no-blame) cannot be
enforced over free text (a word-lint is a sieve; a narrative-rewrite gate regresses on the next
author). So the relation an (R) annotation carries is **structural**: the **partition** (which
engines in which class — symmetric by construction, cannot name a deviant) plus a **controlled
`cause` enum** (a bounded vocabulary, audited once — §4). Free-text `summary` is **non-normative
display** — a human caption that nothing reads as the relationship, so its prose framing cannot
smuggle into the contract. The gravity discipline is therefore a *review convention for display
text*, not a structural guarantee — the guarantee comes from the typed fields.

**The theory retires `override` as a concept** (it presupposed a canonical expectation to
override — the baseline multiplicity dissolves):

```
override.expect    → (A) per-engine assertion          → lens sidecar (per-engine entry)
override.cause     → (R) controlled-enum cause          → fork annotation (hand-authored — see below)
override.recorded  → (O) the per-engine drift anchor     → SURVIVES (retires into fixture-history
                                                            when the input-fidelity relation lands)
override.note      → display gloss                       → non-normative
```

- **`recorded` survives (P1).** It is *not* the current fixture — it's the *authoring-time*
  observation, the left-hand side `resolutions.ts` diffs against the live fixture to compute
  drift (the input-fidelity relation, blessed in terminology §0). Dropping it would leave the
  diff no anchor until a second regen exists. It stays as the (O) per-engine anchor; it retires
  into fixture-history only once the input-fidelity relation is built (deferred, §10).
- **`cause` becomes hand-authored, and the matrix loses auto-seed (P3).** Today fork `cause`
  is auto-seeded from `override.cause`; once `override` retires, a fork's `cause` is a
  **hand-authored controlled-enum field on the annotation**. The matrix can no longer
  auto-cluster from overrides — it re-seats on the partition (structure) + the authored `cause`.
  This is a **CP3 cost, not a free unblock** — name it as such.

## 2. The un-smushing

`TestVerdict = match|diverge` (`contracts/src/index.ts:49`, used at `:93`, scored against a
`canonicalGrid` from `expect`) glued three separated things:

| smushed into `TestVerdict` | becomes (V5) | layer |
|---|---|---|
| **relation** — which engines agree | the agreement **partition** | relation |
| **capability** — did the engine produce a result | per-engine **capability** | relation |
| **oracle** — satisfies an authored assertion | the **self-check lens** | lens (out-of-band) |

## 3. End A — the authoring schema (`catalogue.ts`)

| field | kind | fate |
|---|---|---|
| `id`/`subject`/`subjectRef`/`name`/`aliases`/`semanticHash` | (I) | **stay** |
| `formula`/`PlatformFormula`, `grid`, suite `definitions`/`fixtures` | (S) | **stay** |
| `category`, `features`, `tags`, `links`, `supportLevel` | (I) | **stay** — `category` becomes **required** (drop the `expect`-fallback in `deriveCategory`) |
| `expect: Matcher` | (A) | **leaves the stored case** → parse-time **sugar** lifted to the lens sidecar |
| `overrides` | container | **retires** — decomposed per §1 (note: `override.recorded` **survives** as a per-engine (O) anchor) |
| `status: verified\|volatile\|observed` | mixed | **collapses** — `verified`/`observed` only ever gated `expect`; `volatile` → `category: "volatile"` (I). **But the `observed` signal migrates, it doesn't vanish (P5):** `benchmark.isIntended()` reads `status==="observed"` to mean "no canonical answer / intended divergence." That judgment is normative → it moves to the **lens layer**: *absence of a self-check assertion for a case = observation-only / intended; presence = a correct answer is claimed.* The matrix's `status!=="observed"` guard re-points the same way. |

The `MatcherObject` language relocates wholesale to the lens. The authored (R) home for fork
mechanism is the existing `divergences/DV-*.yaml` files (reframed as fork annotations).

**Net:** the stored case shrinks to (S)+(I)+(O) — stimulus, identity, observation.

## 4. End B — the published schema (ManifestV5, `contracts/src/index.ts`)

```ts
interface ManifestV5 {
  version: 5
  generatedAt: string
  engines: readonly Platform[]
  rung: "circulating"                 // manifest-level constant; per-entry rungs are a future extension
  tests: Record<string, ManifestV5TestEntry>
  functions: Record<string, ManifestV5FunctionEntry>
  annotations: Record<string, ManifestForkAnnotation>   // was `dvs` / `forks` registry (Q2 — renamed to avoid colliding with the function entry's `forks` field)
  aliases: Record<string, ManifestV5AliasEntry>
  tombstones: Record<string, ManifestV5TombstoneEntry>
  hashes: Record<`sha256:${string}`, string>
}

interface ManifestV5TestEntry {
  ref; subject; subjectRef; name; suite; hash; url; aliases?
  category: Category
  engines: Partial<Record<Platform, EngineObservation>>   // AXIS 1 — capability + class join
  partition: ManifestClass[]                               // AXIS 2 — uniform (len 1) | forked (>1)
}

type EngineObservation =
  | { capability: "value"; class: number }                       // → partition[class]
  | { capability: "rejected"; reason?: string; code?: string }   // engine tried, refused — partial/absent signal
  | { capability: "crashed"; channel: CrashChannel }             // engine tried, died — mirrors the Outcome
  | { capability: "unsupported" }                                // KNOWN not to support (skipped{cause:"capability"}) — a capability FACT, the absent/partial signal
  | { capability: "no-data"; cause: "policy" | "seed-infidelity" | "environment-incompatible" | "infra" | "driver-error" | "unclassified" }  // genuinely unknown — NOT a capability claim

interface ManifestClass {
  engines: Platform[]              // unordered; no privileged member
  values: CirculatingGrid[]        // SET-valued (§5): len 1 = exact agreement; >1 = tolerance spread
}

interface ManifestV5FunctionEntry {
  engines: Record<Platform, ManifestEngineEntry>   // capability rollup (descriptive) — unchanged
  forks: string[]                                  // was `divergences` — refs of forked cases + annotation ids
  tests: string[]
}

interface ManifestForkAnnotation {                 // was ManifestDvEntry; lives in `annotations`
  cause: Cause                     // (R) LOAD-BEARING — a controlled, symmetry-audited enum
  engines: Platform[]              // symmetric set — not "the deviant"
  classes?: number[]               // which branches, if case-scoped
  category: Category
  summary: string                  // NON-NORMATIVE DISPLAY ONLY — a human caption; nothing reads it as relation data
}
```

- **`isForked`/`forkCount` derived at read** (`partition.length > 1`) — never stored.
- **The `cause` enum audit (the durable, bounded R-vs-A enforcement).** Of the 18 `Cause` values
  (`contracts/src/index.ts:10`), only three are directional —
  `missing-function`/`missing-arg-form`/`unimplemented-edge` — and they aren't fork *causes* at
  all: they mean *the engine produced no value*, which is **AXIS 1 capability**
  (`rejected`/`no-data`), carried symmetrically there. They reframe-or-drop into the capability
  axis. The remaining ~15 (`precision`/`locale`/`array-orientation`/`null-vs-zero`/
  `arg-semantics`/…) describe *dimensions of difference among produced values* — symmetric by
  construction. So `cause`, scoped to forks-among-values, is symmetric once those three move out.
- **Structural no-verdict invariant:** no field names a correct value, a reference engine, or a
  verdict; no privileged `partition` index; no `match|diverge`. Grep-able.
- **A class is a connected component under cohort tolerance,** not a pairwise-equal set
  (`partitionByAgreement` is union-find over non-transitive relative tolerance, `relations.ts:42-51`).
  The set-valued `values` makes that visible rather than hiding it.
- **(I) fields read from the case, not the manifest (P6):** the manifest carries only relation
  output; lenses (the benchmark's `nonValueLane` derivation reads `supportLevel`/`features`/
  `category`) read those (I) fields from the **catalogue case**, which retains them. The manifest
  does not duplicate them.
- **Removed:** `TestVerdict`, the `canonicalGrid`-from-`expect` path, `classify.ts`'s `Verdict`.
  `MANIFEST_VERSION → 5`. `buildManifest` re-seats on `partitionByAgreement`.

## 5. The value seam — `CirculatingGrid` is the existing projection

- **The type already exists:** `CanonicalCell` (`equality.ts:30`) *is* the circulating projection.
- **The relationship to `RichCellValue`:** one existing many-to-one projection,
  `canonicalizeCell: RichCellValue|null → CanonicalCell` (`equality.ts:66`) — lossy by design
  (drops engine extras + terminal facets). That lossiness *is* the circulating/terminal cut.
- **One source of truth, structural:** the partition compares over `canonicalizeCell`'s output
  (`relations.ts` `agreesByValue` → `match.ts:380` `gridsEqual` → `richGridsEqual`), and the
  manifest serializes the same value — it cannot publish a value the engines weren't grouped on.
- **The move:** `CanonicalCell` + `canonicalizePrimitive`/`canonicalizeCell` are pure over
  `PrimitiveValue` → move **down into contracts' value spine** (`cell-value.ts`); assay's
  `equality.ts` re-imports the type and keeps the tolerance *predicates*. Dependency direction
  holds (assay → contracts).
- **The rename:** `CanonicalCell` → **`CirculatingCell`** (grid `CirculatingGrid`) — on the
  published surface "`Canonical`" reads as "correct" (the smuggle); "circulating" aligns with the
  ratified lexicon. The verb `canonicalize` stays (the normalization act).
- **Set semantics + the dedup predicate (P2 — new code).** `values: CirculatingGrid[]` is deduped
  by **exact** structural equality, not tolerance — so size 1 for exact agreement, and a
  tolerance-merged class keeps its distinct values *visible*. `canonicalEquals` always applies
  tolerance and so cannot do this; the exact predicate is **new**: `circulatingKey(cell) =
  JSON.stringify(cell)` (a structural key over the flat, serializable `CirculatingCell`), deduping
  grids by their keyed form.

## 6. The self-check lens (out-of-band — the (A) home)

```ts
interface SelfCheckLens {          // a sidecar beside the catalogue; compiled from expect: sugar
  version; generatedAt
  assertions: Record</*ref*/ string, {
    expect?: Matcher                                   // whole-case (from top-level expect:)
    perEngine?: Partial<Record<Platform, Matcher>>     // from override.expect's legit use
  }>
}
```

Author-side, consumed by the harness self-check + the benchmark (each names its own authority).
**The manifest never references it** — no back-edge; assertions are joined to cases by `ref`
externally. Its *presence/absence per case* is also what the migrated `isIntended` signal reads
(§3): a case with no assertion is observation-only / intended; a case with one claims a correct
answer.

## 7. The capability axis maps faithfully onto the `Outcome` union

`isEngineAttributable` (`values.ts:108`) is the hinge:

| `Outcome.kind` | `EngineObservation` | in partition? |
|---|---|---|
| `value` | `{capability:"value", class}` | **yes** |
| `rejected` | `{capability:"rejected", reason, code}` | no |
| `crashed` | `{capability:"crashed", channel}` | no |
| `pending` | *omitted* (a published manifest is a completed run; no driver ever emits `pending`) | no |
| `skipped{cause:"capability"}` | `{capability:"unsupported"}` — "engine lacks this," a capability fact | no |
| `skipped{other}`/`infra`/`driver-error`/`unclassified` | `{capability:"no-data", cause}` — genuinely unknown | no |

- **Errors-as-values stay in the partition** — `#DIV/0!` is a `value` outcome; `#DIV/0!` vs
  `#ERROR!` is a fork.
- **The capability axis preserves the one capability-relevant skip (sanity check P3).** A
  `skipped{cause:"capability"}` ("engine doesn't support this") becomes `unsupported` — a
  capability *fact* that feeds the future absent/partial rollup — while the other `SkipCause`s
  (`policy`/`seed-infidelity`/`environment-incompatible`) and `infra`/`driver-error`/`unclassified`
  stay `no-data` (genuinely unknown, not a capability claim). The `SkipCause` is otherwise not
  surfaced: the relation layer records *that* there's no data and *whether it's a capability
  statement*, not the operational reason.
- **"Missing" is capability, not cause** — the directional `Cause` values (§4) surface as
  `rejected` or `unsupported`, not as a fork cause.
- **`rejected.code` kept** (the partial/absent rollup signal); **`infra.detail`/`retryable`
  intentionally manifest-omitted** (retry is a fixture-layer concern, `fixtures.ts isRetryable`).

## 8. Interleaf bridge feed — DEFERRED

"Asleep until assay's relation layer is set." When it wakes, the open fork: the
`external-service` vs `context-required` distinction interleaf's `analyze/compatibility.ts:26-31`
branches on is **not currently recorded** (the corpus carries one undifferentiated
`features: [external-io]` across all 21 external cases — verified). Resolution then: (A) feed
projects `native/partial/absent` + evidence + tags, refinement as interleaf's lens overlay; or
(B) enrich assay's feature taxonomy so it projects from evidence. Not decided now; assay's
contract is **not** shaped around interleaf's current hardcoded table.

## 9. Contracts surface, migration & blast radius

- **New types:** `ManifestV5`(+entries/alias/tombstone), `EngineObservation`, `ManifestClass`,
  `ManifestForkAnnotation`; in the value spine `CirculatingCell`/`CirculatingGrid` (renamed from
  `CanonicalCell`, moved from assay) + the `circulatingKey` predicate.
- **Removed:** `TestVerdict`, `classify.ts` `Verdict`/`classifyEngineResult`, the
  `canonicalGrid`-from-`expect` reads. `MANIFEST_VERSION → 5`; `SUPPORTED_MANIFEST_VERSIONS = [5]`.
  **No V4→V5 back-compat** — sheets-wiki is reworked on the settled contract, not a gate.
- **Blast radius (named, accepted):** `quartz/plugins/transformers/assayRefs.ts`
  (`assertSupportedManifestVersion` throws on v5) and `Related.tsx:78` (`verdict === "diverge"`)
  hard-break on a v5 manifest. Accepted per the rework decision; named so it's not a surprise.

## 10. Open questions (for the final sanity check)

**Resolved this round (recorded, not open):** the dedup predicate (P2 — `circulatingKey`, new
code); the fork `cause` producer (P3 — hand-authored; matrix auto-seed dies, a CP3 cost); the
R-vs-A enforcement (Q4/P4 — structural, not prose); the `observed` signal (P5 — migrates to the
lens); `override.recorded` (P1 — survives as the (O) anchor); the registry name (Q2 —
`annotations`).

**Genuinely open:**
1. **Per-cell `values` compaction (§5)** — grid-set is simple and size-1 in the common case;
   per-cell sets would compact a one-cell fork. Premature, or worth it? (Lean: premature.)
2. **Tolerance-merged display honesty (§5)** — for an `A≈B≈C` chain with `A≉C`, `values` holds all
   three distinct grids with no indication *which* engines pair. Honest, but a reader sees a
   3-element set on a 3-engine class without knowing it's a near-tolerance chain. Note it, or
   surface the chain structure?
3. **Self-check lens physical home (§6)** — per-suite sidecar (lean) vs single registry file.
4. **input-fidelity relation timing** — `override.recorded` survives as the anchor *now*; when
   does the input-fidelity relation that consumes it (and lets `recorded` retire into
   fixture-history) get designed — CP3, or later?
5. **Stability / input-fidelity relations scope** — V5 designs the cross-engine axis only; confirm
   the other two relations (terminology §0) land as their own later additions, out of CP2.
