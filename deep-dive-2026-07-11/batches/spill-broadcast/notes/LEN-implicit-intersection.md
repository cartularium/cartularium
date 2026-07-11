# LEN over a range/array — Excel auto-spill vs Google Sheets implicit intersection

**Batch:** spill-broadcast · **Refs:** LEN/range-no-intersection-errors-column-at-off-row, LEN/virtual-array-top-left-via-implicit-intersection · **Confidence:** high

## Behavior summary

This pair captures the single most important Excel-vs-Google-Sheets portability difference for array formulas: **how a non-array-native scalar function behaves when handed a multi-cell range or array literal in a bare cell.**

- **Excel (dynamic arrays)** made every function array-native: `LEN` applied to a 3-cell range or a 3-element literal auto-spills a 3-cell result.
- **Google Sheets** did NOT make scalar functions array-native. Without wrapping in `ARRAYFORMULA`, `LEN` applied to a range/array is **implicitly intersected** down to a single cell, returning one scalar.

## Divergences

`=LEN(B1:B3)*1` with `B1:B3 = {100;200;300}`:

| engine                                 | result      | mechanism                                                  |
| -------------------------------------- | ----------- | ---------------------------------------------------------- |
| excel, formulas, hyperformula, lattice | `[3; 3; 3]` | auto-spill over the range                                  |
| gsheets                                | `3`         | implicit intersection to the formula row (no ARRAYFORMULA) |
| ironcalc                               | `#N/IMPL!`  | array evaluation unimplemented                             |
| pycel                                  | `#NAME?`    | cannot resolve the range in this form                      |
| libreoffice                            | blank       | recording gap                                              |

`=LEN({"a","bb","ccc"})` (array literal):

| engine                                 | result      | mechanism                                                                             |
| -------------------------------------- | ----------- | ------------------------------------------------------------------------------------- |
| excel, formulas, hyperformula, lattice | `[1, 2, 3]` | map over the literal                                                                  |
| gsheets, pycel                         | `1`         | first element only (Sheets: implicit intersection to top-left; pycel: array collapse) |
| ironcalc                               | `#N/IMPL!`  |                                                                                       |
| libreoffice                            | blank       | recording gap                                                                         |

HyperFormula (`[3;3;3]`, `[1,2,3]`) and `formulas` (`[3;3;3]`, `[1,2,3]`) both live-confirmed to auto-spill.

## The subtlety worth getting right

Google Sheets is not uniformly "no auto-spill". It **does** auto-broadcast arithmetic operators over array literals (`={10,20,30}/10` spills to `[1,2,3]` in Sheets — it is in the capable class for all the operator-broadcast forks). The implicit-intersection collapse is specific to **non-array-native functions** like `LEN`. The rule of thumb for Sheets:

- operator on array literals -> spills;
- a scalar function (`LEN`, `UPPER`, `LEFT`, etc.) over a range/array -> implicit intersection to one cell **unless** wrapped in `ARRAYFORMULA`.

Excel has no such split: dynamic arrays spill both.

## Wiki-facing notes

- The LEN page (and the "Array-enabled functions" / "Array" concept pages) should carry: **`=LEN(A1:A10)` spills 10 results in Excel but returns a single value in Google Sheets — wrap it as `=ARRAYFORMULA(LEN(A1:A10))` in Sheets to spill.** This generalizes to all scalar text/math functions.
- Portability advice: a formula written for Excel that relies on a scalar function auto-spilling over a range will silently return only the first value in Google Sheets (no error), which is a data-loss hazard.
- pycel and IronCalc do not support either behavior.

## Open questions

- Excel spill vs Sheets single-scalar needs a live re-confirm (probe `spill-broadcast-003`); both branches are otherwise strongly grounded (pure engines live, gsheets from fixtures).
