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

### Checkboxes

By default, checkboxes correspond directly to Boolean values: checked is `TRUE`, unchecked is `FALSE`. Custom checkbox values can override this, storing arbitrary values for each state instead.

### See Also

- [[Type coercion]] — full coercion rules across all types.
- [[Data type]] — overview of the type system.
- [[IF]], [[AND]], [[OR]], [[NOT]] — common logical functions.
