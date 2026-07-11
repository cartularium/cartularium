# MINVERSE (singular matrix) — cross-engine deep dive

**Batch:** array-longtail · **Refs:** MINVERSE/minverse-singular-error · **Confidence:** high

## Behavior summary

`=MINVERSE({1,2;2,4})` asks for the inverse of a **singular** matrix — the second row (2,4) is
exactly twice the first (1,2), so the determinant is 0 and no inverse exists. The correct behavior is
to refuse with a numeric error.

## Divergence

| Engine                                  | Result   | Why                                                                      |
| --------------------------------------- | -------- | ------------------------------------------------------------------------ |
| Excel, Google Sheets, Lattice, formulas | `#NUM!`  | implements MINVERSE, detects the singular matrix, refuses                |
| HyperFormula, IronCalc, pycel           | `#NAME?` | does not implement MINVERSE at all — never reaches the singularity check |
| LibreOffice                             | `blank`  | recording artifact (see INDEX-libreoffice-artifact.md)                   |

Live-confirmed: `formulas` returns `#NUM!`; HyperFormula, IronCalc, and pycel return `#NAME?`.

The two error branches look superficially similar (both are errors) but have **unrelated causes**:

- `#NUM!` is a genuine numeric-domain refusal from engines that _do_ implement MINVERSE — the right
  answer for a singular matrix.
- `#NAME?` is an unimplemented-name error — these engines don't have MINVERSE, so the matrix is never
  even examined.

Cause bucket: **missing-function** (the driver of the fork is the missing implementation in
HF/IronCalc/pycel). This is worth distinguishing from a naive `error-code` divergence: the engines
are not disagreeing about _which_ error a singular matrix deserves — three of them simply lack the
function.

Note: MINVERSE's _non-singular_ cases for HyperFormula/IronCalc/pycel are already catalogued in
DV-0003 (the big missing-function record). This singular-matrix case is the uncovered fork.

## Wiki-facing notes

- MINVERSE is **not implemented in HyperFormula, IronCalc, or pycel** (`#NAME?`).
- Where MINVERSE _is_ implemented (Excel, Google Sheets, Lattice, formulas), a singular matrix
  correctly yields `#NUM!`. If you see `#NAME?` instead, the engine lacks the function rather than
  the matrix being invalid.

## Open questions

- None outstanding; the fork is fully grounded in recorded fixtures + live probe. LibreOffice branch
  is the batch-wide capture artifact.
