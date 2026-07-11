# Dynamic-array / spill functions (HSTACK, VSTACK, MAP, SORT, UNIQUE, FILTER) — support matrix

**Batch:** spill-broadcast · **Refs:** HSTACK/hstack-arrays, HSTACK/hstack-scalars, VSTACK/vstack-arrays, VSTACK/vstack-scalars, MAP/map-spill, SORT/sort-spill, UNIQUE/unique-spill, FILTER/filter-spill, SORT/sort-of-filter, UNIQUE/unique-of-repeated-column, UNIQUE/unique-on-single-value · **Confidence:** high

## Behavior summary

These are the modern spill functions that return a variable-size array. Excel, Google Sheets, Lattice, and the `formulas` Python library implement all of them and agree on the results. HyperFormula, IronCalc, and pycel largely do not — with one important exception (FILTER).

## Support matrix (live-confirmed on the four pure engines)

| function | excel | gsheets | lattice | formulas     | hyperformula | ironcalc | pycel    |
| -------- | ----- | ------- | ------- | ------------ | ------------ | -------- | -------- |
| FILTER   | yes   | yes     | yes     | yes          | **yes**      | `#NAME?` | `#NAME?` |
| HSTACK   | yes   | yes     | yes     | yes          | `#NAME?`     | `#NAME?` | `#NAME?` |
| VSTACK   | yes   | yes     | yes     | yes          | `#NAME?`     | `#NAME?` | `#NAME?` |
| MAP      | yes   | yes     | yes     | yes          | `#NAME?`     | `#NAME?` | `#NAME?` |
| SORT     | yes   | yes     | yes     | yes          | `#NAME?`     | `#NAME?` | `#NAME?` |
| UNIQUE   | yes   | yes     | yes     | yes          | `#NAME?`     | `#NAME?` | `#NAME?` |
| SEQUENCE | yes   | yes     | yes     | **`#NAME?`** | `#NAME?`     | `#NAME?` | `#NAME?` |

(LibreOffice records blank for all of these — a systematic recording-harness gap, not a computed absence; even `=SUM(1,2,3)` records blank in this corpus.)

Live-confirmed examples: `FILTER({1;2;3;4;5},{1;0;1;0;1})` -> `[1;3;5]` on HyperFormula AND `formulas`; `HSTACK(1,2,3)` / `VSTACK(1,2,3)` / `MAP({1;2;3},LAMBDA(x,x*2))` / `SORT({3;1;2})` / `UNIQUE({1;2;1;3;2})` all -> `#NAME?` on HyperFormula, IronCalc, and pycel but compute correctly on `formulas`.

## Two findings worth highlighting

1. **FILTER is the odd one out for HyperFormula.** HyperFormula implements FILTER but none of HSTACK/VSTACK/MAP/SORT/UNIQUE/SEQUENCE. So HyperFormula's spill-function support is narrower than `formulas`' but not empty.
2. **`formulas` supports the reshaping functions but not SEQUENCE.** It computes FILTER/HSTACK/VSTACK/MAP/SORT/UNIQUE but returns `#NAME?` for SEQUENCE — the inverse gap from HyperFormula. This is why SEQUENCE-composed formulas fail on `formulas` (see SEQUENCE note) while pure-array-literal SORT/UNIQUE succeed.

## Wiki-facing notes

- Each of these function pages should carry the compatibility row above. The headline: **HSTACK/VSTACK/MAP/SORT/UNIQUE are Excel/Sheets/Lattice/`formulas` only; HyperFormula, IronCalc, and pycel return `#NAME?`.** FILTER is additionally supported by HyperFormula.
- For engine-portable code targeting HyperFormula or the `formulas` library, prefer FILTER (widely supported) and avoid SEQUENCE-sourced spills; build array sources from ranges or literals instead.

## Open questions

- None on the pure engines (all live-confirmed). Excel/gsheets/lattice are from recorded fixtures and are consistent with the well-known Excel-365 dynamic-array function set.
