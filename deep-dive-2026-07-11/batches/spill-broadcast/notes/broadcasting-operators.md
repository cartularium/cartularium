# Broadcasting arithmetic (ADD / MINUS / MULTIPLY / DIVIDE / POW) — cross-engine deep dive

**Batch:** spill-broadcast · **Refs:** the 18 operator-broadcast forks + 3 mismatched-shape forks + 4 scalar-function-over-array forks · **Confidence:** high

## Behavior summary

Applying an arithmetic operator (`+ - * / ^`) between array literals broadcasts elementwise, following NumPy-style rules: a scalar broadcasts against any array; a row `{1,2,3}` and a column `{10;20;30}` broadcast to a 3x3 outer product; equal shapes combine cell-by-cell. Five engines implement this fully and agree on every value: **Excel, Google Sheets, HyperFormula, Lattice, and the `formulas` Python library** (HyperFormula and `formulas` reproduced live across all 18 operator refs). The divergence is entirely on the three engines that do not implement array/broadcast arithmetic.

## Divergences

The three laggards fail identically across every operator fork:

| engine      | result     | mechanism                                                                                          |
| ----------- | ---------- | -------------------------------------------------------------------------------------------------- |
| ironcalc    | `#N/IMPL!` | array/broadcast arithmetic is explicitly not implemented                                           |
| pycel       | `#NAME?`   | cannot parse a `{...}` array literal inside an arithmetic expression; treats it as an unknown name |
| libreoffice | blank      | recording-harness gap (see below), not a computed value                                            |

Live probe (HyperFormula, representative):

| formula                       | result                               |
| ----------------------------- | ------------------------------------ |
| `=1+{10,20,30}`               | `[11, 21, 31]`                       |
| `={1;2;3}+{10,20,30}` (outer) | `[[11,21,31],[12,22,32],[13,23,33]]` |
| `=60/{1,2,3}`                 | `[60, 30, 20]`                       |
| `=2^{0,1,2,3}`                | `[1, 2, 4, 8]`                       |

### Mismatched dimensions (add-2d-incompatible-shape, add-column/row-vectors-mismatched-length)

When the operands have incompatible non-scalar shapes (length-3 vs length-2 column; 2x2 vs 2x3), the capable engines split from the `formulas` library:

| formula                    | excel/gsheets/hyperformula/lattice          | formulas                                                      |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `={1,2,3}+{10,20}`         | `[11, 22, #N/A]` (pad overflow with `#N/A`) | **raises `BroadcastError`** ("Broadcast is not implemented!") |
| `={1;2;3}+{10;20}`         | `[11; 22; #N/A]`                            | raises `BroadcastError`                                       |
| `={1,2;3,4}+{1,2,3;4,5,6}` | `[[2,4,#N/A],[7,9,#N/A]]`                   | raises `BroadcastError`                                       |

The `formulas` library's `BroadcastError` is recorded by the assay harness as an **execution failure (non-value outcome)**, which is why `formulas` is _absent_ from the agreement classes for these three refs rather than appearing with a result. Everything else (HyperFormula `#N/A` padding) live-confirmed.

### Scalar function mapped over an array literal (ABS, SQRT, UPPER, ISNUMBER)

Same capable set maps elementwise, but the laggards vary by function — pycel is internally inconsistent:

| formula                     | capable engines           | ironcalc         | pycel                       |
| --------------------------- | ------------------------- | ---------------- | --------------------------- |
| `=ABS({-1,2,-3})`           | `[1,2,3]`                 | `#N/IMPL!`       | `#NAME?`                    |
| `=SQRT({1,4,9,16})`         | `[1,2,3,4]`               | `#N/IMPL!`       | `1` (first element only)    |
| `=UPPER({"a";"bc";"def"})`  | `["A";"BC";"DEF"]`        | `#N/IMPL!`       | `"A"` (first element only)  |
| `=ISNUMBER({1,"a",TRUE,3})` | `[TRUE,FALSE,FALSE,TRUE]` | `FALSE` (scalar) | `TRUE` (first element only) |

## Edges explored beyond the corpus

Isolating pycel's inconsistency on the pure engine:

- `=SQRT({4,9})` -> `2` (collapses to first element, returns scalar)
- `=ABS({-5,-6})` -> `#NAME?` (the `{...}` fails to tokenize for ABS)
- `=UPPER({"x","y"})` -> `"X"` (first element)
- `={1,2,3}` (bare literal) -> `1` (pycel returns the first element of a bare array literal)
- `=SUM({1,2,3})` -> `6` (pycel DOES parse `{...}` when it is the sole argument to an aggregate)

So pycel has no array engine: a `{...}` literal is either collapsed to its top-left element (for functions wired to accept a scalar) or fails to parse (`#NAME?`), and it never survives an arithmetic operator. IronCalc parses the literal but reports element-wise evaluation as `#N/IMPL!`; the one exception is ISNUMBER, which returns a scalar `FALSE`.

## Wiki-facing notes

- The operator pages (and the "Array" / "Array-enabled functions" concept pages) should state: **element-wise array broadcasting works in Excel, Google Sheets, HyperFormula, Lattice, and `formulas`; it is unsupported in IronCalc (`#N/IMPL!`) and pycel (`#NAME?` / silent first-element collapse).**
- Portability caveat: mismatched-dimension broadcasting silently pads with `#N/A` in Excel/Sheets/HyperFormula/Lattice, but the `formulas` library treats it as a hard error. Do not rely on `#N/A` padding as a portable signal.
- pycel is a trap for array formulas: `SQRT`/`UPPER`/`ISNUMBER` over an array **silently return only the first element** rather than erroring — a correctness hazard, not just a missing feature.

## Open questions

- Excel/Sheets `#N/A`-padding on mismatched shapes needs a live re-confirm (probe `spill-broadcast-004`).
- The LibreOffice blank across all these refs is a recording gap; a live LibreOffice re-record is needed to replace the blank with true values.
