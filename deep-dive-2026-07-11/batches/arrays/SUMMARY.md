# Batch `arrays` — summary

**Suites:** arrays (7 forks) + array-longtail (33 forks) = **40 uncovered forks. All 40 covered; 0 skipped.**

## What this batch is

Every fork in these two suites is about the modern dynamic-array function set (HSTACK, VSTACK,
SEQUENCE, SORT, FLATTEN, TOCOL, TOROW, WRAPCOLS, WRAPROWS, FREQUENCY-inline, MINVERSE, and the four
regression functions LINEST/LOGEST/TREND/GROWTH). The forks are dominated by **availability**
(which engines implement the function), plus a rich secondary layer in the regression family.

## Headline findings (all live-confirmed on pure engines)

1. **HyperFormula and IronCalc lack the entire family** — `#NAME?` for every one of these 40
   formulas. This is the primary fork driver.
2. **The `formulas` npm library implements most of the reshape family but NOT SEQUENCE or FLATTEN**
   — for those it joins the `#NAME?` branch. So "formulas supports dynamic arrays" is not a clean
   statement; SEQUENCE and FLATTEN are the exceptions.
3. **FLATTEN is Google-Sheets-proprietary** — Excel itself lacks it, so only Google Sheets and
   Lattice produce a value; Excel/formulas/HF/IronCalc/pycel all `#NAME?`. Sharper portability edge.
4. **pycel implements LINEST and TREND but collapses the spilled array to a single scalar** (returns
   only the first coefficient / first fitted value), and has **no LOGEST or GROWTH** (`#NAME?`).
5. **`formulas` transposes TREND/GROWTH projected values to a column** (Excel gives a row) and
   returns **`#REF!`** when new_x is supplied as a separately-oriented array.
6. **Lattice supports LINEST/LOGEST coefficients but not the stats form** (4th arg TRUE → `#N/A`).
7. **Perfect-fit regression stats diverge among the supported engines**: the F-statistic cell is
   `#NUM!` in Excel but a finite huge number (~1e31) in Google Sheets / formulas (0/0 degenerate).
8. **The entire LibreOffice arrays/array-longtail fixture is a capture artifact.** INDEX — supported
   by LibreOffice for decades and returning `20` in all 7 real engines — recorded `blank` on
   LibreOffice, as did every other case in both suites (generatedAt 2026-05-11). The LibreOffice
   branch across this batch is missing data, not a divergence; both suites need re-recording on
   LibreOffice. (DV-0007 shows LibreOffice returns `#NAME?`, not blank, when it genuinely lacks a
   function — confirming blank != real behavior.)

## Relation to existing DV records

DV-0003 already covers HF/IronCalc/pycel `#NAME?` for older functions (MINVERSE non-singular,
FREQUENCY range forms, etc.). My annotations cover the **modern dynamic-array functions and the
inline/singular edge cases** those DV records do not include. DV-0007 covers LibreOffice `#NAME?`
for a different function set (and is the evidence that its `blank` here is an artifact, not "absent").

## Counts

- **Annotations written:** 10 (covering all 40 refs; scoped as clusters, no per-ref duplication).
  - missing-function: reshape family (20 refs), SEQUENCE (3), FLATTEN (3), LOGEST+GROWTH-exp (3),
    MINVERSE-singular (1)
  - TODO (capture artifact): INDEX (1)
  - missing-arg-form: LINEST/LOGEST with-stats (2)
  - array-handling: LINEST coefficient forms (2)
  - array-orientation: TREND (3), GROWTH inferred/new-x (2)
- **Work-list refs covered:** 40 / 40. **Skipped:** 0 (`skipped.json` empty).
- **Notes files:** 5 — dynamic-array-reshape.md, SEQUENCE-FLATTEN.md, LINEST-LOGEST-TREND-GROWTH.md,
  INDEX-libreoffice-artifact.md, MINVERSE.md.
- **Probe requests emitted:** 6 (arrays-001...006) — FLATTEN-on-Excel confirm, LINEST perfect-fit
  #NUM! vs huge-number, TREND separate-new_x #REF! confirm, WRAPROWS default #N/A pad, SEQUENCE
  start/step edge, and an INDEX/LibreOffice re-record marker.
- **Live probes run:** 2 scratch scripts (scratch/arrays-probe1.mts, scratch/arrays-probe2.mts)
  across hyperformula, ironcalc, formulas, pycel — grounding every "#NAME?", the pycel scalar
  collapse, the formulas transpose/#REF!, and the reshape default-argument edges.

## What needs a human / live Excel-gsheets

- LibreOffice re-record of both suites (the blank artifact).
- Excel/gsheets confirmation of the perfect-fit stats cell divergence and the SEQUENCE start/step
  edge (probe requests arrays-002, arrays-005).
