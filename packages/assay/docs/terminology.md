# assay terminology — the intentional lexicon

**Status: PROPOSED (2026-06-17) — for term-by-term ratification.** A living
reference (not a dated design session). It exists to make the **no-verdict
principle** (ratified 2026-06-16; see the comparison-principles memory +
`value-equality-and-fingerprint-2026-06-15.md`) *enforceable* as vocabulary, and
to give the compliance sweep a precise blessed/banned list. When a term here is
ratified, it is binding on code, types, comments, and docs.

---

## 0. The governing principle (the root every term derives from)

> **assay holds no verdicts. It records relationships only.** Normativity is
> real, but it lives at the **point of use**, never in the catalogue.

The relationships assay records:
1. **cross-engine** agreement/divergence,
2. **stability** — invariance across conditions declared irrelevant,
3. **input-fidelity** — declared input vs read-back,

plus **flat provenance**. The single irreducible normative act — *a bridge must
choose a target* (interleaf / formulary) — is exiled downstream as a **lens**.

**Ratified 2026-06-17 (a):** the two-layer cut (§1) is the load-bearing move and
is blessed. The relation-vs-lens distinction is binding; term placement disputes
are resolved by asking which layer a symbol lives in.

**Ratified 2026-06-17 (b) — the comparison frame is MULTIPLICITY, not
conformance.** Comparison in the relation layer does not measure *how far each
engine sits from a reference* (conformance — the fossil frame). It **discovers
where the spreadsheet-formula language is plural**: a formula is **uniform** (the
engines do one thing) or **forked** (the engines do several legitimate things,
each a branch, none a deviation). No center, no baseline. This is the worldview
the no-verdict principle implies for cross-engine work, and it is what the word
and the matrix were both waiting on. The vocabulary below (`fork` / `uniform` /
`plural`) follows from it. *Remaining open:* not the frame, but the concrete
multiplicity model — what the aggregation computes under it — which the
comparison step-back designs (§4 quarantine narrows accordingly).

## 1. The central tool: two layers

Every term, every type, every comment belongs to exactly one layer. Most
vocabulary drift is a term leaking from the lens layer into the relation layer.

- **Relation layer (descriptive, verdict-free).** The catalogue, the partitions,
  the manifest's *raw* per-engine data, provenance. Holds **no** canon, no
  reference engine, no "correct," no verdict. If a symbol here names an
  authority/correctness, it is a bug.
- **Lens layer (owned normativity).** A *named consumer* — the benchmark, a
  bridge's target-conformance, an authored `expect` assertion — that chooses a
  reference and renders a judgment. Normativity is allowed here **because it is
  explicitly owned**: the lens names its authority; the arrow lives in the lens,
  never in the data it reads.

The sweep is therefore **not** "delete all judgments." It is: *purge normativity
from the relation layer; relocate it into clearly-owned lenses.*

---

## 2. Blessed vocabulary

### The relation layer

- **relation** — a recorded relationship between observations. The catalogue
  holds relations, not verdicts.
- **agreement-partition** (`AgreementPartition`) — the symmetric partition of
  engines into agreement-classes at a chosen rung; the cross-engine relation.
  *(renames `Divergence`)* No engine is the reference; permutation-invariant.
- **agreement-class** (`AgreementClass`) — one class of engines whose results
  agree at the rung. Unordered set; carries no authority.
- **representative** — a grid drawn from a class **for display only**. Not a
  canonical/correct value; carries no reference authority.
- **uniform / forked** — the two states of an agreement-partition, and the blessed
  replacement for "divergence" (frame ratified 2026-06-17). **Uniform** = one class
  (the engines do one thing). **Forked** (a.k.a. **plural**) = more than one class,
  each a legitimate **branch**, none a deviation. A **derived predicate** read at
  the point of use (`isForked` / `forkCount`), never a stored object-of-concern.
  Use *"the formula forks"* / *"the partition is plural,"* not *"engine X
  diverges"* (which presumes the baseline the no-verdict frame dissolves).
- **divergence** ⛔ **RETIRED (2026-06-17).** A fossil of the pre-lattice frame
  where Excel + gsheets agreeing was the de-facto reference, so an off-line result
  "diverged" — *deviated from a baseline* (conformance). Same fossil as the matrix's
  `agrees-with-canonical`. Replaced by **forked / plural** (above). The *word* is
  retired now that the multiplicity frame is ratified; the **rename execution**
  (`Divergence`→`AgreementPartition`, `isDivergent`→`isForked`, the catalogue/CLI
  surface) rides with the §4 cluster rework, not before. (Project-level name
  "divergence catalogue" is a separate, later call.)
- **stability** — invariance of one engine's result across conditions declared
  irrelevant (isolated vs batched, host, tile-placement, re-run). Same partition
  machinery over *conditions*; `> 1` class ⇒ contamination/non-determinism.
- **input-fidelity** — declared input vs read-back round-trip. A relation.
- **provenance** — flat, descriptive metadata (e.g. which engine *originated* a
  function). Carries **no** authority arrow. Discipline: the data model stays
  structurally symmetric — provenance has gravity, so it must never be wired as a
  built-in reference; any arrow lives only inside a named lens.

### The value & equality model

- **rung** — how far down the comparison chain a comparison reaches:
  **capability → circulating → terminal**.
- **capability** — the prior gate: got-a-result vs not-implemented.
  *(retires "Coverage")*
- **circulating** — the facets a downstream eval depends on (survives the deref
  slice `=A1`); the value's semantic content. The **default** equality scope.
  *(retires "Behavior")*
- **terminal** — representation nothing depends on (number_format, rendering).
  *(retires "Evidence")*
- **capture ≠ circulation** — "can't read it" (capture ceiling → **no-data**) is
  held strictly apart from "doesn't circulate." No-data is never folded into a
  value-agreement class as if it agreed.
- **agreement / equality** (descriptive) — cohort-relative, **relative**
  tolerance, **blank ≠ null**. The descriptive equality of the relation layer.

### The lens layer

- **lens** — a consumer-applied, consumer-**owned** interpretation that may
  introduce a "correct." The home of all normativity.
- **authority** — *within a named lens*, the engine(s) chosen as the reference to
  score against. Legitimate **only** inside a declared lens (e.g. the benchmark);
  never a property of the relation layer.
- **oracle / matcher / `expect`** — an **opt-in, authored assertion** (a harness
  self-check, or a per-test strict check). A structural-subset assertion
  evaluated on a materialized result. **Not** engine-correctness canon.
- **conformance** — a lens read over a stored partition: "conformance to ⟨engine⟩"
  = *which class contains ⟨engine⟩, and what falls outside it.* The arrow lives
  only in the lens.

---

## 3. Banned → replacement (in the relation layer)

| Banned (as a relation-layer term) | Why it smuggles | Replacement |
|---|---|---|
| **canon / canonical value / `canonicalGrid`** (= the correct answer) | designates a correct value the catalogue must not hold | the lens's **authority**; or **representative** (display-only); the authored grid is the **expected/authored** grid |
| **verdict / classify (engine result)** | renders a per-engine judgment as catalogue data | **agreement-class** membership (descriptive); a *lens* may render a judgment, named as such |
| **correct / reference engine** | a built-in reference arrow | no engine is correct/reference; correctness is a **lens** |
| **agrees-with-canonical** | a baseline-anchored comparison | "in the same agreement-class as ⟨lens authority⟩" (inside a lens), or just describe the partition |
| **oracle-as-verdict** | promotes an opt-in assertion to truth | **oracle = opt-in assertion** only |
| **expect-as-correctness** | treats authored `expect` as the right answer | `expect` is an **authored assertion** (lens); don't label its grid `canonical` |

**Homonyms to KEEP (not banned — these are value-normalization or naming, not
normativity):** `canonicalize` / `canonicalJson` / `CanonicalCell` (deterministic
value normalization for equality), the `canonical` **ref kind** (`public-ref.ts`,
a URL form), `subject` / `ref` (case identity). The smuggle is *"canonical = the
correct value,"* not the act of canonicalizing.

---

## 4. Sweep scope (grounded — what ratifying this commits us to)

> ⚠️ **QUARANTINE (2026-06-17, narrowed).** The cross-engine *comparison* cluster —
> `divergence-matrix.ts`, `format/classify.ts` (`Verdict`), the benchmark's
> scoring — stays **sealed**, but the premise narrowed: the comparison **frame** is
> now decided (multiplicity, ratified above), so the *word* is resolved
> (divergence → forked). What is still open is the concrete **multiplicity model** —
> *what the aggregation computes once there's no baseline* (per-formula class count,
> which engines in which branch, how a "matrix" even reads without a reference).
> The matrix today *computes* conformance-to-the-majors; you can't rewrite it until
> you've designed what it computes instead. So: the **rename execution** rides with
> that design (the step-back), not before. Discipline while sealed is
> **containment**: don't build new work on these forms, don't let their vocabulary
> leak into the relation layer — but don't rework them either.

**Relation layer — purge (cluster QUARANTINED — renames ride the multiplicity-model design):**
- `format/relations.ts`, `format/catalogue.ts` — `Divergence` → `AgreementPartition`;
  keep `AgreementClass`; fix the `isDivergent` open-coding in `runner.ts`; drop
  the "detect" verb (compute the relation, let `isDivergent` decide persistence).
- `divergence-matrix.ts` — purge *"agrees with canonical,"* `divergentTests` /
  `agreementTests`, `testsAgree` / `testsDiffer`; re-express as descriptive
  aggregation over `AgreementClass`. (This is the deepest one — it's a whole
  layer still computing against a baseline.)
- `format/classify.ts` (`classifyEngineResult` / `Verdict`) — the central verdict
  machine, consumed by `manifest/build.ts` + `catalogue-site/format.ts`. Either
  re-seat on the partition (descriptive), or relocate behind a declared lens.
- `manifest/build.ts`, `catalogue-site/{format,page-test}.ts` — `canonicalGrid`
  from `test.expect`, `canonical:` display → **expected/authored** framing.

**Lens layer — KEEP but make ownership explicit:**
- `benchmark.ts` — `authority: Platform[]` and the `authority-*` reasons are
  **legitimate**: the benchmark is a conformance *lens*. Action is framing, not
  deletion — ensure the names read as "the benchmark's chosen reference," not a
  global truth.

**Docs — revise for compliance (≈10 files):** `comparison-model-design` §3 canon,
`value-equality-and-fingerprint` retained-matcher language, `test-space-charter`
§3 expect-oracle duty, plus roadmap / arch-map / vision / bridge-translation /
README where the old framing survives.

## 5. Standing invariant (post-sweep)

After the sweep, a grep for the banned relation-layer terms (`canon`-as-correct,
`verdict`, `reference engine`, `agrees with canonical`, `correct` as a result
label) outside a declared lens is a regression. Candidate for a lint rule once the
sweep is clean.
