---
tags:
  - datatype
  - bug
---

> [!WARNING]
> Zero elements are not an officially recognized feature and may be [[unintended behavior]].

Zero elements are a type of [[Array|array]] with zero width or zero height.

### Syntax

| Dimensions | Formula               |
| ---------- | --------------------- |
| 0 x 1      | `TOCOL(,1)`           |
| 1 x 0      | `TOROW(,1)`           |
| 0 x 0      | `ARRAY_CONSTRAIN(,,)` |

The `TOCOL`/`TOROW` forms rely on the ignore-blanks argument (`1`): an empty first argument is a single blank, and ignoring blanks leaves an array with no elements (assay: TOCOL/tocol-ignore-blanks, TOROW/torow-ignore-blanks).

### Engine compatibility

Zero elements only exist where the constructing functions do, and those functions are not portable. [[TOCOL]] and [[TOROW]] are implemented by Google Sheets, Excel (365), and Lattice, plus the `formulas` JavaScript library — but they are **absent from HyperFormula, IronCalc, and pycel**, where any call returns `#NAME?` (assay: TOCOL/tocol-row, TOROW/torow-col; live probe, 2026-07-11). [[ARRAY_CONSTRAIN]] is a Google Sheets function with no Excel equivalent, narrower still.

| Engine        | `TOCOL` / `TOROW` | `ARRAY_CONSTRAIN` |
| ------------- | ----------------- | ----------------- |
| Google Sheets | available         | available         |
| Excel         | available (365)   | not available     |
| Lattice       | available         | —                 |
| formulas      | available         | —                 |
| HyperFormula  | `#NAME?`          | `#NAME?`          |
| IronCalc      | `#NAME?`          | `#NAME?`          |
| pycel         | `#NAME?`          | `#NAME?`          |

So the zero-element trick is a Google Sheets and Excel construct: on the open-source engines that lack `TOCOL`/`TOROW`, there is no zero-width or zero-height array to produce.

### Notes

- Zero elements can be used in [[REDUCE]] or [[LAMBDA recursion]] formulae to effectively skip the initial value when using [[VSTACK]] or [[Array#Array literals|array literals]] on the accumulator.
- Zero elements are distinct from a non-fitting reshape. When a source vector does not exactly fill the target grid, [[WRAPROWS]] and [[WRAPCOLS]] pad the leftover cells with `#N/A` by default (not blank or `0`); pass a `pad_with` argument to change it (assay: WRAPROWS/with-pad, WRAPCOLS/with-pad). A zero element has no cells to pad at all.
- [[TOCOL]] and [[TOROW]] scan **row-major** by default; pass the `scan_by_column` argument `TRUE` to read column-major (assay: TOCOL/tocol-2x2-scan-by-column). Scan order is moot for a zero element but governs the non-empty forms of the same functions.

### See Also

- [[Array]] — the general array model, including [[Array#Array literals|array literals]] and vectors.
- [[TOCOL]], [[TOROW]], [[ARRAY_CONSTRAIN]] — the functions that construct zero elements.
- [[REDUCE]], [[LAMBDA recursion]] — where skipping an initial accumulator value is useful.
