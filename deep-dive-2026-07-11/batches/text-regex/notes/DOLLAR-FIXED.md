# DOLLAR / FIXED — number-to-text formatting — cross-engine deep dive

**Batch:** text-regex · **Refs:** DOLLAR/dollar-negative, FIXED/fixed-negative-decimals · **Confidence:** high

## Behavior summary

`DOLLAR(number, decimals)` and `FIXED(number, decimals)` format a number as a **text string** with thousands separators. Both are locale/format-rendering functions: the rounded numeric value agrees across implementers, but the _string rendering_ diverges. Both functions are absent from hyperformula, ironcalc, and pycel (`#NAME?`, confirmed live); DOLLAR is also absent from formulas.

## Divergences

### DOLLAR — negative-value sign convention

`=DOLLAR(-1234.5, 2)`:

| Engine                                  | result          | negative style              |
| --------------------------------------- | --------------- | --------------------------- |
| excel                                   | `"($1,234.50)"` | accounting parentheses      |
| gsheets                                 | `"-$1,234.50"`  | leading minus               |
| lattice                                 | `"$-1,234.50"`  | minus after currency symbol |
| formulas, hyperformula, ironcalc, pycel | `#NAME?`        | not implemented             |
| libreoffice                             | blank           | recording artifact          |

Live-confirmed: formulas/hyperformula/ironcalc/pycel all `#NAME?`. **Mechanism (format-rendering):** the magnitude `1,234.50` and the `$` symbol are identical across the three implementers; only the negative-sign convention differs. Excel follows the accounting `($…)` convention for DOLLAR; Google uses a plain leading minus; lattice puts the minus between the `$` and the digits.

### FIXED — negative decimals and the trailing `.0`

`=FIXED(1234.567, -1)` (negative decimals rounds left of the decimal point → nearest 10 = 1230):

| Engine                        | result                     |
| ----------------------------- | -------------------------- |
| excel, formulas, gsheets      | `"1,230"`                  |
| lattice                       | `"1,230.0"`                |
| hyperformula, ironcalc, pycel | `#NAME?` (not implemented) |
| libreoffice                   | blank (recording artifact) |

Live-confirmed: formulas `"1,230"`; hyperformula/ironcalc/pycel `#NAME?`. **Mechanism (format-rendering):** all implementers round to 1230; excel/formulas/gsheets emit no fractional part (correct for negative decimals), while **lattice appends a spurious `.0`** even though `decimals` is negative.

## Edges explored beyond the corpus

Live probe confirmed: `formulas` implements `FIXED` (`"1,230"`) but **not** `DOLLAR` (`#NAME?`) — a partial-coverage split within the same library. hyperformula, ironcalc, and pycel implement neither.

## Wiki-facing notes

- **DOLLAR is not portable across the negative-sign convention:** Excel renders negatives as `($1,234.50)`, Google as `-$1,234.50`, lattice as `$-1,234.50`. A workbook that string-matches or parses DOLLAR output will break when moved between Excel and Google Sheets. For portable negative currency, format with an explicit `TEXT(...)` custom format string instead.
- **DOLLAR** is absent from formulas, hyperformula, ironcalc, and pycel; **FIXED** is absent from hyperformula, ironcalc, and pycel. Both are Excel/Google/lattice-oriented.
- **lattice `FIXED` with negative decimals** emits a trailing `.0` that Excel/Google omit — a minor rendering bug to flag if lattice output feeds downstream string comparisons.

## Open questions

- **text-regex-006:** Confirm on live Excel and gsheets the DOLLAR negative rendering (`"($1,234.50)"` vs `"-$1,234.50"`) and whether it is locale-sensitive (accounting parentheses may itself be a locale/currency-format setting rather than a hard DOLLAR rule).
