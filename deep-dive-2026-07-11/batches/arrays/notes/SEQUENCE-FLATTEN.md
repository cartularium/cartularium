# SEQUENCE & FLATTEN — cross-engine deep dive

**Batch:** arrays · **Refs:** SEQUENCE/{sequence-2d, sequence-column, sequence-scalar}, FLATTEN/{flatten-2x2-order, flatten-col, flatten-row} · **Confidence:** high

These two subjects are grouped because both are availability splits, but each has a wider "absent"
set than the general reshape family (dynamic-array-reshape.md) — and for different reasons.

## SEQUENCE — `formulas` lacks it too

SEQUENCE(rows, [cols], [start], [step]) spills a grid of sequential numbers. It is implemented by
Excel, Google Sheets, and Lattice. Unlike HSTACK/VSTACK/SORT/TOCOL/..., the **`formulas` npm
library does NOT implement SEQUENCE** — it joins HyperFormula, IronCalc, and pycel in the `#NAME?`
branch.

`=SEQUENCE(2, 3)`:

| Engine                                  | Result                       |
| --------------------------------------- | ---------------------------- |
| Excel, Google Sheets, Lattice           | `[[1,2,3],[4,5,6]]`          |
| formulas, HyperFormula, IronCalc, pycel | `#NAME?`                     |
| LibreOffice                             | `blank` (recording artifact) |

Live-confirmed: `formulas` returns `#NAME?` for `SEQUENCE(2,3)`, `SEQUENCE(3)`, and `SEQUENCE(1)`.
This is the one case in the arrays suite where `formulas` sits on the unsupported side, so a naive
"formulas supports the dynamic-array family" statement is wrong — SEQUENCE is the exception. Cause:
**missing-function**.

## FLATTEN — Google Sheets proprietary

FLATTEN(range1, [range2, …]) collapses one or more ranges into a single column in row-major order
(argument, then row, then column). It is a **Google-Sheets-only** function; Microsoft Excel has
never added it. So the supported branch is only **Google Sheets and Lattice**:

`=FLATTEN({1,2;3,4})`:

| Engine                                         | Result                         |
| ---------------------------------------------- | ------------------------------ |
| Google Sheets, Lattice                         | `[1;2;3;4]` (row-major column) |
| Excel, formulas, HyperFormula, IronCalc, pycel | `#NAME?`                       |
| LibreOffice                                    | `blank` (recording artifact)   |

Live-confirmed: `formulas`, HyperFormula, IronCalc, and pycel all return `#NAME?` for
`FLATTEN({1,2;3,4})`. Excel's `#NAME?` is in the recorded fixture and is expected because Excel
lacks the name entirely (probe arrays-001 re-confirms). The row-major ordering is visible in the
`flatten-2x2-order` case: `{1,2;3,4}` flattens to `1;2;3;4` (first row before second row), matching
the Google Sheets documentation ("row-major order").

Cause: **missing-function**, but with a portability sharper edge than the rest of the family —
because Excel itself does not have FLATTEN, a Google Sheets workbook using it is not portable to
Excel at all (not merely to the open-source engines).

## Wiki-facing notes

- **SEQUENCE:** available in Excel, Google Sheets, Lattice. NOT in HyperFormula, IronCalc, pycel, or
  the `formulas` JS library — all four return `#NAME?`.
- **FLATTEN:** Google-Sheets-specific. Not available in Excel or any of the other tracked engines
  except Lattice. Values are ordered by argument, then row, then column (row-major). To port a
  FLATTEN formula to Excel, rewrite with TOCOL (Excel 365) — but note TOCOL is itself unavailable
  in the open-source engines.

## Open questions

- Excel SEQUENCE start/step semantics beyond step=1 (probe arrays-005): confirm `SEQUENCE(2,3,10,5)`
  fills 10,15,20 / 25,30,35 row-major on Excel and Google Sheets.
- LibreOffice `blank` branches are capture artifacts (see INDEX-libreoffice-artifact.md).
