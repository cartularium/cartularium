---
name: ARRAY_LITERAL
category: uncategorized
engines:
  gsheets:
    status: available
coverage: pending-assay
syntax: ARRAY_LITERAL(row1, [row2, ...])
status: imported
description: >-
  Constructs a 2D [[Array|array]] by stacking rows vertically. `ARRAY_LITERAL` is the functional equivalent of the `{}` [[Array#Array literals|array literal]] syntax, where each argument corresponds
  to a row — typically produced by [[ARRAY_ROW]].
tags:
  - undocumented
---

Constructs a 2D [[Array|array]] by stacking rows vertically. `ARRAY_LITERAL` is the functional equivalent of the `{}` [[Array#Array literals|array literal]] syntax, where each argument corresponds to a row — typically produced by [[ARRAY_ROW]].

```
ARRAY_LITERAL(ARRAY_ROW(1, 2, 3), ARRAY_ROW(4, 5, 6))  =  {1, 2, 3; 4, 5, 6}
```

### Sample Usage

```gse
ARRAY_LITERAL(ARRAY_ROW(1, 2, 3), ARRAY_ROW(4, 5, 6))
ARRAY_LITERAL(A1:C1, A2:C2)
```

### Syntax

```gse
ARRAY_LITERAL(row1, [row2, ...])
```

- `row1` - The first row of the array. Must be a horizontal vector or scalar.
- `row2, ...` - **[** OPTIONAL **]** - Additional rows to stack vertically.

### Notes

- Each `row` must either be a [[Data type#Scalar types|scalar type]] or a horizontal vector.
- `ARRAY_LITERAL`, `ARRAY_ROW`, and `{}` are all locale-dependent. In non-North American locales, the function argument separator (and equivalently the within-row separator in `{}`) may be a semicolon rather than a comma, and the row separator in `{}` may be a backslash rather than a semicolon. A locale detection formula is documented on [Stack Overflow](https://stackoverflow.com/q/73767719/5632629).
- `ARRAY_LITERAL` and `ARRAY_ROW` are undocumented functions.

### See Also

- [[ARRAY_ROW]]
- [[ARRAY_CONSTRAIN]]
- [[HSTACK]]
- [[VSTACK]]