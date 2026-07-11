---
tags:
  - datatype
---

> [!WARNING]
> This article uses [[Unofficial terminology]].

A dynamic array is a formula result whose size is determined at evaluation time rather than fixed by the author. A single formula produces a whole [[Array|array]], which then spills into the neighboring cells. The family includes generators like [[SEQUENCE]], the reshape functions [[HSTACK]] / [[VSTACK]] / [[TOCOL]] / [[TOROW]] / [[WRAPCOLS]] / [[WRAPROWS]], the ordering and selection functions [[SORT]] / [[UNIQUE]] / [[FILTER]], the mapper [[MAP]], and [[FLATTEN]].

Google Sheets and Excel implement essentially the whole family; the divide across other engines is an **availability** split, not a semantics split. Where these functions exist they agree on shape and values; where they are missing they return `#NAME?` uniformly. This is the single largest cross-engine gap for array formulas.

### Support matrix

| Engine        | Dynamic-array family support                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Google Sheets | Full family, including the proprietary [[FLATTEN]].                                                                                     |
| Excel         | Full family **except** [[FLATTEN]], which Excel has never added (`#NAME?`).                                                              |
| Lattice       | Full family, including [[FLATTEN]] (recorded fixtures).                                                                                  |
| formulas      | Reshape and selection functions (HSTACK, VSTACK, SORT, UNIQUE, MAP, FILTER, TOCOL, TOROW, WRAPCOLS, WRAPROWS) yes; SEQUENCE and FLATTEN `#NAME?`. |
| HyperFormula  | [[FILTER]] only; every other name returns `#NAME?`.                                                                                     |
| IronCalc      | None — `#NAME?` (broadcast arithmetic additionally reports `#N/IMPL!`).                                                                  |
| pycel         | None — `#NAME?`. Array literals collapse to their first element rather than spilling.                                                   |

Live-confirmed on the four pure engines: `HSTACK(1,2,3)`, `VSTACK(1,2,3)`, `MAP({1;2;3},LAMBDA(x,x*2))`, `SORT({3;1;2})`, `UNIQUE({1;2;1;3;2})`, `SEQUENCE(2,3)`, and `FLATTEN({1,2;3,4})` all return `#NAME?` on HyperFormula, IronCalc, and pycel; `formulas` computes the reshape family but returns `#NAME?` for `SEQUENCE` and `FLATTEN`; `FILTER({1;2;3;4;5},{1;0;1;0;1})` returns `{1;3;5}` on both HyperFormula and `formulas` (live probe, 2026-07-11).

### Three functions worth singling out

**[[FLATTEN]] is Google-Sheets-proprietary.** Excel has never implemented it, so a Sheets workbook that uses `FLATTEN` is not portable to Excel at all — not merely to the open-source engines (assay: FLATTEN/flatten-2x2-order). Rewrite with [[TOCOL]] to move to Excel 365, keeping in mind that `TOCOL` is itself absent from the open-source engines.

**[[SEQUENCE]] is missing from the `formulas` library.** Unlike the reshape functions, `SEQUENCE` is unsupported by `formulas` as well as by HyperFormula, IronCalc, and pycel (live probe, 2026-07-11). Any formula built on `SEQUENCE` inherits this gap: a `SEQUENCE`-sourced [[FILTER]] or [[SORT]] fails on `formulas` even though the same function over a range or literal succeeds (assay: FILTER/filter-of-sequence).

**[[FILTER]] is the one spill function HyperFormula implements.** HyperFormula supports `FILTER` but none of `HSTACK` / `VSTACK` / `MAP` / `SORT` / `UNIQUE` / `SEQUENCE`. So `FILTER(A1:A5, …)` over a range works there while `FILTER(SEQUENCE(5), …)` does not — the failure comes from the missing `SEQUENCE`, not from `FILTER`.

### Array-output functions beyond the reshape family

The same availability split reaches other functions that produce arrays. HyperFormula and IronCalc implement none of the regression spill functions [[LINEST]] / [[LOGEST]] / [[TREND]] / [[GROWTH]] (`#NAME?`), and pycel implements only `LINEST` and `TREND`, returning just the first coefficient or fitted value as a scalar rather than the full array (live probe, 2026-07-11). Matrix functions behave the same way: `=MINVERSE({1,2;2,4})` returns `#NUM!` where the function exists (Excel, Google Sheets, Lattice, `formulas` — the correct refusal for a singular matrix) but `#NAME?` on HyperFormula, IronCalc, and pycel, which never examine the matrix at all (assay: MINVERSE/minverse-singular-error; live probe, 2026-07-11). A `#NAME?` from these engines means the function is missing, not that the input was invalid.

### See Also

[[Array]]
[[Broadcasting]]
[[SEQUENCE]]
[[FLATTEN]]
[[FILTER]]
