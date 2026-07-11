# LINEST / LOGEST / TREND / GROWTH — cross-engine deep dive

**Batch:** array-longtail · **Refs:** LINEST/{linest-simple-line, linest-with-stats, linest-y-only}, LOGEST/{logest-exponential, logest-with-stats, logest-y-only}, TREND/{trend-inferred-x, trend-new-x, trend-simple}, GROWTH/{growth-exponential, growth-inferred-x, growth-new-x} · **Confidence:** high (medium on the perfect-fit stats cells)

## Behavior summary

The four regression functions: LINEST (linear least-squares coefficients / stats), LOGEST
(exponential-model coefficients / stats), TREND (linear fitted/projected values), GROWTH
(exponential fitted/projected values). Excel, Google Sheets, and Lattice implement all four and
agree up to floating-point precision. The interesting divergences are entirely among the _other_
engines — this family is where the pure engines behave most unevenly, so it is the richest material
in the batch. Four distinct mechanisms are in play, and different functions trip different ones.

## Divergences

### 1. HyperFormula & IronCalc — absent everywhere (missing-function)

Neither implements LINEST, LOGEST, TREND, or GROWTH. Every case returns `#NAME?`. Live-confirmed
across all 12 formulas.

### 2. pycel — implements LINEST & TREND, but collapses the spill to a scalar (array-handling)

pycel implements LINEST and TREND but returns only the **first element** of the coefficient/fitted
array as a single scalar, dropping the rest:

| Formula                         | Excel/gsheets/Lattice         | pycel                                   |
| ------------------------------- | ----------------------------- | --------------------------------------- |
| `=LINEST({1,2,3},{1,2,3})`      | `[[1, 0]]` (slope, intercept) | `1.0000000000000002` (slope only)       |
| `=LINEST({2,4,6,8})`            | `[[2, 0]]`                    | `1.9999999999999993` (slope only)       |
| `=TREND({2,4,6,8})`             | `[2,4,6,8]`                   | `1.9999999999999998` (first value only) |
| `=TREND({1,2,3},{1,2,3},{4,5})` | `[4,5]`                       | `4` (first value only)                  |

pycel does **not** implement LOGEST or GROWTH — those return `#NAME?` (live-confirmed). So pycel's
"partial" behavior is LINEST/TREND-only.

### 3. `formulas` library — orientation transpose and #REF! on separate new_x (array-orientation)

The `formulas` npm library implements all four but returns the inferred/projected vectors in a
**transposed orientation**, and errors when new_x is a separately-shaped array:

| Formula                               | Excel/gsheets (orientation) | formulas                     |
| ------------------------------------- | --------------------------- | ---------------------------- |
| `=TREND({2,4,6,8})`                   | `[2,4,6,8]` — 1×4 row       | `[2;4;6;8]` — 4×1 **column** |
| `=TREND({1,2,3},{1,2,3},{4,5})`       | `[4,5]` — 1×2 row           | `[4;5]` — 2×1 column         |
| `=GROWTH({2,4,8,16})`                 | `[2,4,8,16]` — 1×4 row      | `[2;4;8;16]` — 4×1 column    |
| `=TREND({1,2,3,4},{1,2,3,4},{5;6;7})` | `[5;6;7]`                   | `#REF!`                      |
| `=GROWTH({2,4,8,16},{1,2,3,4},{5;6})` | `[32;64]`                   | `#REF!`                      |

Live-confirmed. The `#REF!` arises specifically when new_x is passed as its own array whose
orientation differs from x — `formulas` cannot reconcile the shapes. (For LINEST/LOGEST coefficient
output `formulas` matches Excel's 1×2 row, so the transpose issue is specific to the
fitted/projected value functions.)

### 4. Lattice — no stats form for LINEST/LOGEST (missing-arg-form)

Lattice implements plain LINEST/LOGEST (coefficient output) but not the 4th-argument stats block:

| Formula                                   | Excel           | Lattice |
| ----------------------------------------- | --------------- | ------- |
| `=LINEST({1,2,3,4},{1,2,3,4},TRUE,TRUE)`  | 5×2 stats block | `#N/A`  |
| `=LOGEST({2,4,8,16},{1,2,3,4},TRUE,TRUE)` | 5×2 stats block | `#N/A`  |

### 5. Perfect-fit stats cells — Excel #NUM! vs finite huge number (precision / degenerate case)

Even among Excel/gsheets/formulas that all produce the 5-row stats block, the block **disagrees**
for a perfect-fit line. With zero residual degrees of freedom the F-statistic cell is 0/0:

| Cell (row 4, col 1 of LINEST stats) | Excel   | Google Sheets           | formulas                 |
| ----------------------------------- | ------- | ----------------------- | ------------------------ |
| F-statistic                         | `#NUM!` | `2.253601067072408e+31` | `2.7975737384347114e+30` |

Excel refuses (`#NUM!`); Google Sheets and formulas return an enormous finite float instead (the
value is dominated by floating-point noise in the residual sum of squares, hence the per-engine
scatter). The standard-error cells that are mathematically 0 also come out as different tiny floats
(~1e-15 to 1e-16) per engine. This is a genuine degenerate-case / precision divergence _within_ the
implementing engines, worth a wiki caveat.

## Which mechanism hits which ref

| Ref                       | HF/IronCalc | pycel        | formulas                  | Lattice  |
| ------------------------- | ----------- | ------------ | ------------------------- | -------- |
| LINEST/linest-simple-line | #NAME?      | scalar slope | 1×2 row (agrees)          | agrees   |
| LINEST/linest-y-only      | #NAME?      | scalar slope | agrees                    | agrees   |
| LINEST/linest-with-stats  | #NAME?      | scalar       | full block (F #NUM! diff) | **#N/A** |
| LOGEST/logest-exponential | #NAME?      | **#NAME?**   | agrees                    | agrees   |
| LOGEST/logest-y-only      | #NAME?      | **#NAME?**   | agrees                    | agrees   |
| LOGEST/logest-with-stats  | #NAME?      | **#NAME?**   | full block                | **#N/A** |
| TREND/trend-inferred-x    | #NAME?      | scalar       | **column**                | agrees   |
| TREND/trend-simple        | #NAME?      | scalar       | **column**                | agrees   |
| TREND/trend-new-x         | #NAME?      | scalar       | **#REF!**                 | agrees   |
| GROWTH/growth-exponential | #NAME?      | **#NAME?**   | agrees                    | agrees   |
| GROWTH/growth-inferred-x  | #NAME?      | **#NAME?**   | **column**                | agrees   |
| GROWTH/growth-new-x       | #NAME?      | **#NAME?**   | **#REF!**                 | agrees   |

(All also have the LibreOffice `blank` capture artifact.)

## Wiki-facing notes

- LINEST / LOGEST / TREND / GROWTH are **absent in HyperFormula and IronCalc** (`#NAME?`).
- pycel implements **LINEST and TREND only**, and returns just the first coefficient/value as a
  scalar — treat pycel's regression output as unusable for the full coefficient array. pycel has
  **no LOGEST or GROWTH**.
- The `formulas` JS library returns TREND/GROWTH projected values in **column orientation** (Excel
  gives a row) and errors `#REF!` when new_x is supplied as a separately-oriented array.
- Lattice supports the coefficient forms but **not the stats form** (LINEST/LOGEST with the 4th
  argument TRUE) — returns `#N/A`.
- For a **perfect-fit** regression the stats block is degenerate: Excel returns `#NUM!` in the
  F-statistic cell, while Google Sheets returns a meaningless finite huge number (~1e31). Do not
  rely on the F/df cells cross-engine when the fit is exact.
- The coefficient values themselves agree only to ~15 significant digits across engines (last-ULP
  scatter); compare with tolerance.

## Open questions

- Probe arrays-002: confirm the exact Excel `#NUM!` vs Google Sheets huge-number values in the
  perfect-fit F-statistic cell.
- Probe arrays-003: confirm Excel and Google Sheets accept the separately-oriented new_x that
  `formulas` rejects with `#REF!`.
- LibreOffice `blank` branches are capture artifacts (see INDEX-libreoffice-artifact.md).
