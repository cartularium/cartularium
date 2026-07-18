# M3 first slice — the cross-engine divergence *relation* (spec)

**Status: RATIFIED + BUILT (2026-06-16).** §8 resolved on the leans (below); slice
implemented in `format/relations.ts` + the `Divergence` extension + the
consolidated `runner.ts` detection path; acceptance green (§7). First concrete
slice of M3 ("compare fixtures"), redrawn through the **no-verdict principle**
(ratified 2026-06-16; see `value-equality-and-fingerprint-2026-06-15.md` + the
comparison-principles memory). Sibling design: `comparison-model-design-2026-05-30.md`.

> **The principle this slice serves:** assay holds no verdicts. It records
> relationships only. The cross-engine relation is a **symmetric partition of the
> engines into agreement-classes** at a chosen rung — *no engine is the reference,
> none is "correct."* "Divergence" is just "more than one class."

---

## 0. Scope

**In:** replace the current boolean, pivot-based divergence *detection* with a
symmetric **agreement partition** computed at the **circulating** rung; carry the
partition as verdict-free data; install the symmetry guard (and its test);
consolidate the two duplicated detection sites.

**Out (later slices, seams left in §6):** the stability relation; the
input-fidelity relation; flat provenance; consumer lenses; the capability/terminal
rung projections; the fingerprint; any catalogue-site/report UI beyond what already
consumes `Divergence`.

---

## 1. Constraints (what this slice must honor)

- **No verdict.** Output is a partition into agreement-classes; no class flagged
  correct/reference. The *number* of classes (>1 ⇒ divergence) is the only judgment.
- **Symmetric.** Detection must not depend on a pivot engine. The current
  `first`-as-reference comparison goes.
- **Circulating rung.** Compare over `CanonicalCell` (already built in
  `equality.ts`). Capability and terminal are *future projections of the same
  partition machinery*, not separate code paths.
- **Capture ≠ circulation.** A no-data cell (skipped / unreadable / non-`value`
  outcome) is never folded into a value-agreement class as if it agreed. It is a
  separate capability fact.

---

## 2. Current state (grounded)

- **`Divergence`** (`format/catalogue.ts`):
  ```ts
  interface Divergence { test: TestCase; results: Record<string, RichGridValue>; }
  ```
  The stored `results` map is **already symmetric** (no privileged engine) — good.
- **Detection** (`runner.ts`, two near-duplicate sites — the `evaluateTasks` path
  ~L217–229 and the live `runSuite` path ~L290–296):
  ```ts
  const first = available[0];
  if (available.some(p => !gridsEqual(results[p], results[first], toleranceFor(p, first))))
    divergences.push({ test, results });
  ```
  This is a **boolean** ("is there *any* divergence?") **pivoted on `first`**. It
  produces no who-agrees/who-splits structure, and the pivot is an implicit
  reference (with relative tolerance, non-transitivity means the choice of `first`
  can change the boolean at the margins).
- **The comparison primitive** is `gridsEqual` (`format/match.ts`), which for two
  rich grids resolves to the circulating-rung spine `richGridsEqual` →
  `richCellsEqual` → `canonicalEquals` over `CanonicalCell` (the B1 fix; blank≠null,
  number_format/extras excluded).
- **Grouping** today lives *downstream* in `divergence-matrix.ts`
  (`DivergenceCluster` / `PairwiseRow`, `computeMatrix`) — an aggregation over the
  stored divergences, not a per-test partition.

---

## 3. The change

### 3.1 The relation: an agreement partition

New function — proposed home **`format/relations.ts`** (the M3 relation layer that
stability + fidelity will also live in; alternatively extend `equality.ts`):

```ts
export interface AgreementClass {
  engines: Platform[];          // the engines whose results agree at this rung
  // representative grid for display ONLY — carries no authority
  representative: RichGridValue;
}

export function partitionByAgreement(
  results: Record<Platform, RichGridValue>,
  tol: number = DEFAULT_NUM_TOL,
): AgreementClass[];
```

- **Algorithm: union-find over pairwise `richGridsEqual`.** Chosen because relative
  tolerance is **non-transitive** (`a≈b ∧ b≈c ⇏ a≈c`); union-find is the honest
  grouping under a fuzzy equality. Accept that a near-tolerance chain can merge into
  one class — that *is* cohort equality (document it).
  - *Alternative considered:* canonical-key bucketing (group by the JSON of the
    `CanonicalCell` grid) — O(n) and transitive, but cannot honor numeric tolerance
    (1e-10 jitter splits a class). **Rejected as default**; keep as the "exact" mode
    a lens could request later.
- **Divergence ⟺ `classes.length > 1`.**
- **No-data stays out.** Only `outcome.kind === "value"` enters `results` today
  (preserve this). Skipped/error/unreadable engines are absent from the partition —
  a capability fact, surfaced separately, never a silent member of a value class.

### 3.2 Carry it as data

Extend `Divergence` (`format/catalogue.ts`):

```ts
interface Divergence {
  test: TestCase;
  results: Record<string, RichGridValue>; // unchanged — symmetric evidence
  rung: "circulating";                    // NEW — the rung this partition was computed at
  classes: AgreementClass[];              // NEW — the partition; length > 1 ⇒ divergence
}
```

### 3.3 Consolidate detection

Replace **both** `runner.ts` sites with one call to `partitionByAgreement`, pushing
a `Divergence` (with `classes`) when `classes.length > 1`. This deletes the `first`
pivot and collapses two near-duplicate detection blocks into one shared path.

---

## 4. Symmetry guard (invariant E, made executable)

The principle's open edge is "keep the data model structurally symmetric (no
built-in reference arrow)." Enforce it two ways:

1. **Schema:** no field on `Divergence` / `AgreementClass` may encode
   correctness/reference. `AgreementClass.engines` is an unordered set; class order
   is not significant; `representative` is display-only (assert in a comment).
2. **Property test:** `partitionByAgreement` is **invariant under permutation of the
   engine keys** — same classes, set-equal, regardless of input order. This is the
   executable proof that no engine is the pivot. (Catches any accidental
   reintroduction of `first`-style asymmetry.)

---

## 5. The one real subtlety — tolerance & transitivity

Relative tolerance (`DEFAULT_NUM_TOL = 1e-10`) is non-transitive, so union-find can
chain two "barely-equal" engines into a class neither would join pairwise with the
third. This matches today's fuzzy behavior and is acceptable for **cohort** equality
(descriptive, not a verdict). Do **not** solve it now; the exact-key partition is the
seam for a future per-test "exact" lens (§3.1 alternative).

---

## 6. Seams for later slices (leave room, build nothing)

- **Rung as a parameter.** `partitionByAgreement(results, { rung })` where `rung`
  selects the cell canonicalizer: `circulating` (now, `canonicalizeCell`),
  `capability` (partition on `outcome.kind` got-a-result vs not), `terminal`
  (include number_format / representation). The partition machinery is shared; only
  the canonicalizer swaps.
- **Stability relation.** Same partition idea, but over *conditions* of one engine
  (isolated vs batched vs re-run) rather than across engines. >1 class ⇒
  contamination/non-determinism.
- **Fidelity relation.** Declared-input vs read-back round-trip — a 2-element
  partition per seeded cell.
- **Provenance + lenses.** Read-time over the stored partition; "conformance to
  ⟨engine⟩" = *which class contains ⟨engine⟩, and what falls outside it.* No change
  to stored data; the arrow lives only in the lens.

---

## 7. Acceptance — RESULT (2026-06-16)

- **Regression: EXACT reproduction, zero deltas.** Over **1886** corpus tests with
  ≥2 value engines, the old `first`-pivot and the new partition flag the **same
  1726 divergences**. The anticipated non-transitive-chain deltas (§5) do **not**
  occur at the live tolerances (1e-10; ironcalc 1e-9) — a barely-equal A–B–C chain
  with A≉C is a numerical coincidence the corpus never hits. (Verified with a
  throwaway script that computed both flags over the same reconstructed
  `testResults`; not committed.)
- **Permutation-invariance** property test green (`relations.test.ts` — partition
  invariant over all key orderings; the executable no-pivot proof).
- **No** reference/correct field anywhere in the divergence types — executable
  guard asserts `AgreementClass` exposes exactly `{ engines, representative }`.

---

## 8. Resolved (ratified 2026-06-16, all on the leans)

1. **Default partition basis: union-find** over the full pairwise agreement graph
   (honors non-transitive tolerance; reproduces today — see §7). Exact canonical-key
   partition deferred as a future per-test "exact" lens.
2. **`divergence-matrix.ts`: untouched.** This slice produces only the per-test
   `classes`; the downstream clustering later becomes an aggregation over them.
3. **Home: new `format/relations.ts`** — the relation layer (stability + fidelity
   join here). `partitionByAgreement` + `isDivergent` + `AgreementClass` live there;
   `catalogue.ts`'s `Divergence` type-imports `AgreementClass` (type-only, so the
   catalogue→relations→match→catalogue cycle is erased — no runtime cycle).
4. **`rung: "circulating"` literal shipped now** on `Divergence`.

**Implementation notes (minor refinements over §3):**

- `partitionByAgreement(results, equal?)` takes an **injectable** equality predicate
  (default = value agreement via `gridsEqual` at per-pair `toleranceFor`) rather than
  a bare `tol` number — keeps the union-find pure and lets the property test inject a
  trivial relation. Tolerance is pairwise (only ironcalc relaxes to 1e-9), so a
  single `tol` arg would have been wrong anyway.
- Output is **canonical**: engines sorted within a class, classes sorted by first
  engine. Sorting is presentation only (no authority) and makes permutation-
  invariance directly deep-equal-checkable.
- The two `runner.ts` sites collapse into one `detectDivergence(test, results)`
  helper (the shared path §3.3 asked for); the dead `gridsEqual` import is dropped.
