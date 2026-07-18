---
name: ARRAY_ROW
category: uncategorized
engines:
  gsheets:
    status: available
coverage: pending-assay
syntax: ARRAY_ROW(value1, [value2, ...])
status: imported
description: Constructs a horizontal [[Array#Vectors|vector]] (a single row). `ARRAY_ROW` is the functional equivalent of comma separation within an [[Array#Array literals|array literal]] `{}`.
tags:
  - undocumented
---

Constructs a horizontal [[Array#Vectors|vector]] (a single row). `ARRAY_ROW` is the functional equivalent of comma separation within an [[Array#Array literals|array literal]] `{}`.

```
ARRAY_ROW(1, 2, 3)  =  {1, 2, 3}
```

### Sample Usage

```gse
ARRAY_ROW(1, 2, A1)
```

### Syntax

```gse
ARRAY_ROW(value1, [value2, ...])
```

- `value1` - The first value in the row.
- `value2, ...` - **[** OPTIONAL **]** - Additional values to add to the row.

### Notes

- Each `value` must either be a [[Data type#Scalar types|scalar type]] or a vertical vector.
- `ARRAY_ROW` is locale-dependent in the same way as array literals. See [[ARRAY_LITERAL]] for details.

### See Also

- [[ARRAY_LITERAL]]
- [[ARRAY_CONSTRAIN]]
- [[HSTACK]]
- [[VSTACK]]