# pycel arithmetic-operator artifact — cross-engine deep dive

**Batch:** math-core · **Refs:** ABS/abs-negative, CEILING/ceiling-negative-both, CEILING/ceiling-negative-num-positive-sig, EVEN/even-negative, FLOOR/floor-negative, POWER/power-negative-exponent, ROUND/round-negative-decimals, SIGN/sign-negative (plus the whole `arithmetic` suite) · **Confidence:** high

## Behavior summary

This is not a per-function story — it is a systematic property of assay's **pycel** integration. Whenever a formula's source text contains an arithmetic operator — binary `+ - * / ^` or a unary minus — pycel returns `#NAME?`. Formulas that are pure function calls over non-negative literals or over cell references (including references whose _values_ are negative) evaluate correctly. Every negative-literal case in the math work-list trips this because `-3.4`, `-2.5`, `-1`, `-3`, `-10`, and the `-2` in `ROUND(1234,-2)` are unary-minus expressions.

Because a negative value delivered through a cell reference computes fine, this is a **formula-compilation / tokenization artifact in the pycel integration**, not a numeric-semantics limitation of ABS/CEILING/etc. The underlying pycel library evaluates arithmetic normally; something in how assay feeds operator-bearing formula text to pycel produces the name-resolution failure.

## Divergences

Live probe (`createDriver("pycel")`, `scratch/math-core-probe1.mts` / `probe2.mts`):

| formula              | pycel result | note                                      |
| -------------------- | ------------ | ----------------------------------------- |
| `=ABS(3)`            | `3`          | pure call, no operator — OK               |
| `=ABS(A1)` (A1=-3.4) | `3.4`        | negative **value** via reference — OK     |
| `=ABS(-3.4)`         | `#NAME?`     | unary minus in source                     |
| `=-3.4`              | `#NAME?`     | bare unary minus                          |
| `=0-3.4`             | `#NAME?`     | binary minus                              |
| `=10-3`              | `#NAME?`     | binary minus, no literal-adjacency needed |
| `=10+3`              | `#NAME?`     | binary plus                               |
| `=10*3`              | `#NAME?`     | binary times                              |
| `=2+3*4`             | `#NAME?`     | (matches recorded arithmetic fixture)     |
| `=ABS(A1-A2)` (3,10) | `#NAME?`     | operator nested inside a function arg     |
| `=SUM(1,2,3)`        | `6`          | argument commas are fine; no operator     |

Corroboration from the **recorded** corpus (`fixtures/arithmetic/pycel.json`): all 6 bare-arithmetic formulas — `=1+1`, `=10/3`, `=1/0`, `=2^-3`, `=2+3*4` — recorded `#NAME?`. So the live probe reproduces a real, already-recorded behavior; it is not an environment fluke.

For the work-list math cases, every other engine (excel, formulas, gsheets, hyperformula, ironcalc, lattice) agrees on the correct numeric result; pycel's `#NAME?` and libreoffice's blank are the only two divergent branches.

## Edges explored beyond the corpus

- The trigger is the **operator token in the source**, not the sign of any value and not adjacency to a literal: `=10+3` and `=10*3` fail just as `=0-3.4` does.
- Cell references carrying arithmetic _results_ are unaffected: `=ABS(A1)` with a negative A1 returns the right magnitude.
- Function-call syntax (commas, ranges, nested calls without operators) is unaffected.

## Wiki-facing notes

- This is an **assay/pycel engine-integration caveat**, not a spreadsheet-portability fact. It should NOT be surfaced on function pages as "ABS behaves differently in pycel." If assay's compatibility feed exposes pycel, this class of `#NAME?` should be filtered or flagged as a known integration artifact so it does not pollute per-function compatibility rows for ABS, CEILING, EVEN, FLOOR, POWER, ROUND, SIGN (and the entire arithmetic-operator surface).
- Cause bucket used in `annotations.json`: `unimplemented-edge` (closest available; the honest label is "integration compile artifact").

## Open questions

- Root-cause in the pycel driver (does assay wrap formulas in a way that pycel's compiler mis-tokenizes leading/again operators?). Needs a look at `packages/drivers` pycel formula-compilation path — a code fix, not a live probe. No Excel/gsheets probe needed; the finding is fully grounded on pure-engine evidence.
