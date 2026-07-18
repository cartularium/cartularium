---
name: SINGLE
category: array
syntax: SINGLE(array)
status: imported
description: Constrains an [[Array|array]] to $1 \times 1$. Returns the upper-leftmost [[Data type#Scalar types|scalar value]].
tags:
  - undocumented
---

Constrains an [[Array|array]] to $1 \times 1$. Returns the upper-leftmost [[Data type#Scalar types|scalar value]].

### Sample Usage

```gse
SINGLE(A1:C10)
SINGLE(SORT(A1:F100, 1, TRUE))
```

### Syntax

```gse
SINGLE(array)
```

* `array` - The array to constrain.

### See Also

[[ARRAY_CONSTRAIN]]