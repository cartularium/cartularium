---
tags:
  - datatype
---

[Booleans](https://en.wikipedia.org/wiki/Boolean_data_type) represent logical values that can only be `TRUE` or `FALSE`. They are a native [[Data type|data type]] in Google Sheets and are fundamental to conditional logic.

### Coercion

Google Sheets uses a [[Type coercion|weakly typed]] system, and Booleans participate in coercion in both directions.

#### Booleans as numbers

In most arithmetic contexts, `TRUE` coerces to `1` and `FALSE` coerces to `0`:

```gse
TRUE + 1              → 2
FALSE * 5             → 0
SUM(TRUE, TRUE, FALSE) → 2
```

Some functions do not accept Booleans as numeric arguments. [[MMULT]] is a known example; others may exist.

Whether a Boolean is coerced in an aggregate depends on **how it arrives**. Passed as a direct scalar argument it coerces, but a Boolean sitting inside a range or an array literal is **skipped**, not coerced:

```gse
SUM(TRUE, TRUE, FALSE)   → 2   (direct scalar arguments — coerced)
SUM({TRUE, FALSE, TRUE}) → 0   (array literal — skipped)
```

This is the Excel and Google Sheets convention (assay: SUM/boolean-array-in-sum). It is not universal: Lattice coerces booleans inside array literals too (`SUM({TRUE,FALSE,TRUE})` → `2`), and HyperFormula's array-literal parser rejects a bare boolean literal outright, returning `#NAME?` (live probe, 2026-07-11). To sum booleans stored across a range portably, coerce them explicitly with `--`, `N()`, or `*1`.

#### Non-Booleans as Booleans

In logical contexts such as the condition argument of [[IF]], other types coerce as follows:

| Value | Result |
| --- | --- |
| `0` | `FALSE` |
| Any non-zero number | `TRUE` |
| `""` (empty string) | `FALSE` |
| Non-empty string | `#VALUE!` |
| Blank cell | `FALSE` |
| Error | Propagates |

Non-empty strings do **not** coerce to `TRUE` in logical contexts — they produce `#VALUE!`.

### Cross-type comparison

When a comparison operator (`>`, `<`, `>=`, `<=`) mixes types, Google Sheets does **not** coerce the Boolean to `1`/`0`. Instead it ranks whole types: **number < text < boolean**. Any Boolean is therefore greater than any number and any string.

```gse
TRUE > 0        → TRUE    (a boolean outranks every number)
TRUE >= 1       → TRUE    (TRUE is ranked above 1, not coerced to equal it)
"a" > TRUE      → FALSE   (text ranks below boolean)
```

That the answer is a ranking rather than a coercion is visible in `TRUE >= 1`: numeric coercion would make it `1 >= 1` (true either way), but `FALSE <= 0` is `FALSE` in Google Sheets, because `FALSE`, as a boolean, is *greater* than `0` (assay: GTE/gte-boolean, LTE/lte-boolean).

This ordering holds on Excel, Google Sheets, IronCalc, and the `formulas` engine (live probe, 2026-07-11). Lattice is the outlier: it ranks booleans *below* numbers, so `TRUE > 0` is `FALSE` there (assay: GT/gt-boolean-vs-number).

### Checkboxes

By default, checkboxes correspond directly to Boolean values: checked is `TRUE`, unchecked is `FALSE`. Custom checkbox values can override this, storing arbitrary values for each state instead.

### See Also

- [[Type coercion]] — full coercion rules across all types.
- [[Data type]] — overview of the type system.
- [[Number]], [[String]] — the other operands in cross-type comparison ordering.
- [[IF]], [[AND]], [[OR]], [[NOT]] — common logical functions.
