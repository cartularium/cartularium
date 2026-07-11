# ISREF — cross-engine deep dive

**Batch:** info · **Refs:** ISREF/isref-of-single-cell, ISREF/isref-of-range, ISREF/isref-of-indirect-valid · **Confidence:** high

## Behavior summary

`ISREF(value)` returns TRUE when its argument is a reference (a cell or range) and FALSE otherwise. Five engines — excel, formulas, gsheets, ironcalc, lattice — return TRUE for all three reference forms tested. HyperFormula is the outlier: it returns FALSE for every reference form.

## Divergences

| formula                  | excel | formulas | gsheets | ironcalc | lattice | hyperformula | pycel      |
| ------------------------ | ----- | -------- | ------- | -------- | ------- | ------------ | ---------- |
| `=ISREF(A1)`             | TRUE  | TRUE     | TRUE    | TRUE     | TRUE    | **FALSE**    | **#NAME?** |
| `=ISREF(A1:A3)`          | TRUE  | TRUE     | TRUE    | TRUE     | TRUE    | **FALSE**    | **#NAME?** |
| `=ISREF(INDIRECT("A1"))` | TRUE  | TRUE     | TRUE    | TRUE     | TRUE    | **FALSE**    | **#NAME?** |

(LibreOffice records `blank` — suite-wide recording artifact.)

Mechanisms:

- **HyperFormula → FALSE (arg-semantics).** Live-probe confirmed FALSE for all three forms. HyperFormula evaluates each argument to its scalar value before ISREF inspects it, so ISREF never actually sees a reference — it sees the dereferenced value and reports FALSE. This is effectively a "ISREF is always false" behavior in HyperFormula, including for a literal range and for `INDIRECT(...)` which the other engines treat as a live reference.
- **pycel → #NAME? (missing-function).** pycel does not implement ISREF (consistent with DV-0001, which lists pycel missing ISREF for other tests). Live-probe confirmed #NAME? for all three forms.

## Edges explored beyond the corpus

- HyperFormula returns FALSE even for `=ISREF(INDIRECT("A1"))`, where INDIRECT produces a genuine reference in Excel/Sheets — so the FALSE is not about INDIRECT specifically; HyperFormula collapses all reference arguments to values before ISREF runs.

## Wiki-facing notes

- ISREF returning TRUE for cell references, ranges, and `INDIRECT(...)` is portable across Excel, Google Sheets, LibreOffice-family, IronCalc, and lattice.
- **HyperFormula's ISREF always returns FALSE** — do not use ISREF as a reference/value discriminator when targeting HyperFormula.
- **pycel does not implement ISREF** (#NAME?).

## Open questions

- None load-bearing. The excel/gsheets TRUE branch is already recorded; HyperFormula FALSE and pycel #NAME? are live-confirmed.
