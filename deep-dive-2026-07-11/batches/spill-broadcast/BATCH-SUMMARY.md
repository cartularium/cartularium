# Batch spill-broadcast — summary

**Suites:** broadcasting (32) + spill (13) + spill-edge (12) = **57 uncovered forks.**
**Result:** all 57 refs annotated (11 clusters), 0 skipped. Every branch on the four pure engines (hyperformula, ironcalc, formulas, pycel) was reproduced live; excel/gsheets/lattice/libreoffice branches from recorded fixtures.

## Headline findings

1. **HyperFormula's "IF-broadcasting" failures are actually a bare-boolean-literal parse gap.** HyperFormula does not recognize the keywords `TRUE`/`FALSE` — they return `#NAME?` (also breaks `=TRUE`, `AND(TRUE,..)`, `NOT(FALSE)`). Live-isolated: `=IF(1>0,{1,2,3},{10,20,30})` and `=IF(TRUE(),...)` both work and broadcast correctly; only the bare literal fails. So the three IF forks are a boolean-literal issue, not array/IF semantics. (notes/IF.md)

2. **Excel auto-spill vs Google Sheets implicit intersection.** A scalar function over a range/array (`LEN(B1:B3)`, `LEN({...})`) spills in Excel/HyperFormula/Lattice/`formulas` but collapses to one cell in Google Sheets (needs `ARRAYFORMULA`). Sheets _does_ auto-broadcast operators over array literals — the collapse is specific to non-array-native functions. (notes/LEN-implicit-intersection.md)

3. **SORT `sort_order = -1` sorts descending in Excel/Lattice/`formulas` but ASCENDING in Google Sheets** — Sheets reads the third arg as a boolean `is_ascending` and treats the truthy `-1` as ascending. Proven by the flag=`1` control, where all agree. Silent wrong-order hazard. (notes/SORT-direction.md)

4. **`INDEX(array)` with omitted indices is a Google-Sheets-only array-wrapper idiom** — Sheets returns the whole array; every other engine rejects it (excel/libreoffice blank, hyperformula/lattice `#N/A`, formulas `#VALUE!`, ironcalc `#ERROR!`, pycel `#NAME?`). (notes/INDEX-array-wrapper.md)

5. **`formulas` (Python lib) raises `BroadcastError` on incompatible-shape broadcasting** where Excel/Sheets/HyperFormula/Lattice pad the overflow with `#N/A`. The harness records this as an execution failure, which is why `formulas` is _absent_ from those three partitions. (notes/broadcasting-operators.md)

6. **pycel has no array engine** — a `{...}` literal is either collapsed to its first element (SQRT/UPPER/ISNUMBER/bare-literal silently return the top-left value — a correctness hazard) or fails to tokenize (`#NAME?` for ABS and all arithmetic operators). IronCalc parses array literals but reports element-wise evaluation as `#N/IMPL!`.

7. **Spill-function support tiers** (live-confirmed): FILTER is supported by HyperFormula (uniquely among its spill siblings); `formulas` supports FILTER/HSTACK/VSTACK/MAP/SORT/UNIQUE but NOT SEQUENCE; HyperFormula/IronCalc/pycel lack the reshaping set. (notes/spill-functions-support-matrix.md, notes/SEQUENCE.md)

8. **LibreOffice records blank for every case in this corpus**, including trivial non-array formulas (`=SUM(1,2,3)`, `=INDEX(A1:A3,2)`). Systematic recording-harness gap; two forks (SUM/single-cell-result-no-spill, INDEX/index-from-spilled-source) are _entirely_ this artifact and are flagged (cause `TODO`) for re-record rather than explanation.

## Counts

- **Annotations written:** 11 clusters covering **57 / 57** work-list refs (verified programmatically: no duplicates, no strays, no missing).
- **Work-list refs covered:** 57 · **skipped:** 0 (`skipped.json` = `[]`).
- **Notes files:** 7 — broadcasting-operators, IF, LEN-implicit-intersection, INDEX-array-wrapper, SORT-direction, SEQUENCE, spill-functions-support-matrix.
- **Probe requests emitted:** 8 (`spill-broadcast-001..008`) — all excel/gsheets, high-value uncertain claims (INDEX-wrap Excel behavior ×2, LEN spill, mismatched-shape `#N/A` padding, SORT `-1` direction ×2, SEQUENCE/SUM re-confirm).

## What needs Excel / Google Sheets confirmation

- `INDEX(A1:A3*10)` and `INDEX({1,2,3}+{10;20;30})` on Excel — the recorded Excel blank is suspect; may spill the whole array or return `#VALUE!` (probes 001/002).
- `LEN(B1:B3)*1` on Excel + Sheets — confirm Excel spill `[3;3;3]` vs Sheets single `3` (probe 003).
- `={1,2,3}+{10,20}` on Excel + Sheets — confirm `#N/A` padding on mismatched shapes (probe 004).
- `SORT(SEQUENCE(5),1,-1)` and `SORT({3;1;2},1,-1)` on Excel + Sheets — confirm descending vs ascending direction split (probes 006/008).

## Other open items for a human / reconciler

- Lattice's real support for the plain `SEQUENCE(3,2)` / `SEQUENCE(1,3)` forms — absent from recorded partitions but clearly computed in composed cases; likely a Lattice recording gap (not probe-able here).
- LibreOffice's corpus-wide blank recording gap should be re-recorded.

## Scratch (live probe artifacts, under packages/assay/scratch/)

`spill-broadcast-probe1.mts` (all 57 formulas + edges × 4 pure engines), `spill-broadcast-probe2.mts` / `probe3.mts` (HyperFormula bare-TRUE/FALSE isolation), `spill-broadcast-out*.txt`.
