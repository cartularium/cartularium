# PERCENTRANK.EXC — cross-engine deep dive (precision / rounding convention)

**Batch:** stat-core · **Refs:** PERCENTRANK.EXC/percentrank-exc-minimum-value · **Confidence:** medium (pure engines live-confirmed; excel truncate-vs-round hypothesis pending probe stat-core-002)

## Behavior summary

`PERCENTRANK.EXC(array, x)` returns the exclusive percentile rank of `x` within `array`, rounded by default to **3 significant digits**. Two things split the engines here: coverage (three engines don't implement it) and the rounding convention applied to the 3-significant-digit default.

## Divergences

### `=PERCENTRANK.EXC(A1:A5, 1)` with `A={1,2,3,4,5}`

The exclusive rank of the minimum (1) is `1 / (n+1) = 1/6 = 0.16666...`.

| Engine       | Result   | Interpretation                    |
| ------------ | -------- | --------------------------------- |
| excel        | 0.166    | 3 sig-digits by **truncation**    |
| formulas     | 0.166    | truncation (live-confirmed)       |
| gsheets      | 0.167    | 3 sig-digits by **rounding**      |
| lattice      | 0.167    | rounding                          |
| hyperformula | `#NAME?` | not implemented                   |
| ironcalc     | `#NAME?` | not implemented                   |
| pycel        | `#NAME?` | not implemented                   |
| libreoffice  | blank    | stale all-null fixture (artifact) |

**Mechanism (cause: `precision`, plus `missing-function` for the three absent engines):**

- hyperformula, ironcalc and pycel do not implement `PERCENTRANK.EXC` → `#NAME?` (live-confirmed).
- The implementers compute the identical true value 0.16667 but apply the default 3-significant-digit reduction differently: **excel and formulas truncate → 0.166; gsheets and lattice round → 0.167.** The `formulas` engine sitting on the excel side (0.166) was confirmed live, which supports reading this as a genuine truncate-vs-round convention difference rather than a computation difference.

## Edges explored beyond the corpus

- Live probe put `formulas` at exactly 0.166, matching the excel branch — so the 0.166/0.167 split is a stable, reproducible convention difference, not floating-point noise. Both values are "correct" reductions of 1/6; they differ only in rounding rule.

## Wiki-facing notes

- On PERCENTRANK / PERCENTRANK.EXC / PERCENTRANK.INC pages: **HyperFormula, IronCalc and pycel do not implement `PERCENTRANK.EXC`** (`#NAME?`). (The `.INC` and legacy `PERCENTRANK` forms may have different coverage — worth a dedicated check.)
- Portability caveat for implementers: the default 3-significant-digit result can differ in the last digit between engines because **Excel-family engines truncate while Google Sheets rounds** (0.166 vs 0.167 for 1/6). If exact digits matter, pass an explicit `significance` argument large enough to avoid the boundary, or post-process with an explicit ROUND.

## Open questions

- **Needs live excel confirmation (probe stat-core-002):** verify that excel genuinely returns 0.166 (truncation) at the default significance and 0.166667 at significance 6, confirming the truncate-vs-round reading rather than a recording quirk. Confidence stays **medium** until then.
