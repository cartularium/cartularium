# TYPE — cross-engine deep dive

**Batch:** info · **Refs:** TYPE/type-of-number, TYPE/type-of-text, TYPE/type-of-boolean, TYPE/type-of-error, TYPE/type-of-array, TYPE/type-of-blank-cell · **Confidence:** high

## Behavior summary

`TYPE(value)` returns a numeric code classifying its argument: **1** = number, **2** = text, **4** = logical/boolean, **16** = error, **64** = array. Five engines — excel, formulas, gsheets, ironcalc, lattice — agree on these codes for scalar arguments. The divergences are entirely faithful-implementation gaps in the remaining engines, not disagreements about what the codes mean.

## Divergences

Per-case recorded + live-probed results:

| formula                  | excel | formulas | gsheets | ironcalc     | lattice  | hyperformula | pycel                    |
| ------------------------ | ----- | -------- | ------- | ------------ | -------- | ------------ | ------------------------ |
| `=TYPE(42)`              | 1     | 1        | 1       | 1            | 1        | **#NAME?**   | **`<class 'int'>`**      |
| `=TYPE("hello")`         | 2     | 2        | 2       | 2            | 2        | **#NAME?**   | **`<class 'str'>`**      |
| `=TYPE(TRUE)`            | 4     | 4        | 4       | 4            | 4        | **#NAME?**   | **`<class 'bool'>`**     |
| `=TYPE(1/0)`             | 16    | 16       | 16      | 16           | 16       | **#NAME?**   | **#NAME?**               |
| `=TYPE({1,2,3})`         | 64    | 64       | 64      | **#N/IMPL!** | 64       | **#NAME?**   | **`<class 'tuple'>`**    |
| `=TYPE(A1)` (empty cell) | 1     | 1        | 1       | 1            | **#N/A** | **#NAME?**   | **`<class 'NoneType'>`** |

(LibreOffice records `blank` for all six — the suite-wide recording artifact; see IS-predicates-portability.md.)

Mechanisms:

- **HyperFormula → #NAME? (missing-function).** HyperFormula does not implement TYPE at all; every form errors. Live-probe confirmed for all six argument shapes.
- **pycel → Python `type()` repr (mis-implementation).** pycel does not implement the spreadsheet TYPE. It leaks Python's `type()` and returns the class-repr _string_ (`<class 'int'>`, `<class 'str'>`, `<class 'bool'>`, `<class 'tuple'>`, `<class 'NoneType'>`) instead of a numeric code. Live-probe confirmed. For `=TYPE(1/0)` pycel returns #NAME? instead, because it cannot evaluate the inner `1/0` at all (see the pycel error-subexpression story in IS-predicates-portability.md).
- **IronCalc → #N/IMPL! on arrays.** IronCalc returns the correct scalar codes but has no array support for TYPE, so `=TYPE({1,2,3})` is #N/IMPL!.
- **lattice → #N/A on an empty cell.** lattice agrees on all scalar codes but returns #N/A for `=TYPE(A1)` over a truly empty cell, where excel/formulas/gsheets/ironcalc return 1.

## Edges explored beyond the corpus

- `=TYPE(A1)` with `A1=5` (seeded number) → ironcalc/formulas/pycel behave as for a literal number (ironcalc 1, formulas 1, pycel `<class 'int'>`). So pycel's class-repr behavior is consistent whether the argument is a literal or a cell reference.
- `=TYPE(1/0)`: ironcalc and formulas correctly classify the propagated error as 16, confirming they evaluate the argument to an error value first and then classify it.

## Wiki-facing notes

- TYPE's numeric codes (1/2/4/16/64) are portable across Excel, Google Sheets, LibreOffice-family, IronCalc, and lattice.
- **HyperFormula does not support TYPE** — expect #NAME?. **pycel does not support the spreadsheet TYPE** and returns Python class strings; do not rely on TYPE under pycel.
- Array typing (code 64) is unavailable in IronCalc (#N/IMPL!).
- TYPE of an empty cell is 1 (treated as a number/zero) in Excel/Sheets/IronCalc, but lattice reports #N/A — a portability edge worth calling out for anyone testing empty inputs.

## Open questions

- Confirm excel returns 1 for `=TYPE(A1)` on a truly empty cell (probe info-005) — corpus says excel=1; this pins the excel baseline against lattice's #N/A.
