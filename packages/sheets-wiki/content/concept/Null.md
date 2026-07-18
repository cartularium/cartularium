---
tags:
  - datatype
---
A [null value](https://en.wikipedia.org/wiki/Nullable_type) is a distinct [[Data type|data type]] representing the absence of input. It does not belong to any of the standard scalar types used by the evaluation engine, but it participates in expressions through coercion and truth-testing rules.

### Syntax

Nulls most commonly appear in function calls when an argument position is left empty:

```gse
VLOOKUP("foo", A1:B5, 2, )
```

Here the fourth argument evaluates to null, which causes [[VLOOKUP]] to operate in its non-sorted mode because null is treated as a [[Boolean|falsy]] value.

### Properties

- **Truthiness.** Null is falsy in conditional contexts.
    
- **Coercion.** When a null is required to participate in arithmetic or string operations, it typically converts to `0` or `""` depending on the expected type.
    
- **Propagation.** Functions may return null, and those nulls can be passed to other functions. However, nulls cannot fill mandatory argument positions in functions that accept only a single argument; syntactically, there is no “blank” slot to express a null there.

```gse
ISBLANK(IF(,,))
```

The [[IF]] call returns null because its first argument is null, which is coerced to `FALSE`, and the `value_if_false` argument is null. The [[ISBLANK]] is able to detect the resulting null output.

### See Also
[[ISBLANK]]
  