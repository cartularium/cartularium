---
tags:
  - function
  - datatype
---

Creates a **List**, a dynamic sequence of values.

### Syntax

```gse
LIST(item1)(item2)...
```

### Arguments

-   `item`: Values to add to the list.

### Return Value

A LIST object.

### Usage

Create lists by chaining values:

```gse
=let(
  l, LIST("a")("b")("c"),
  l(1)
)
```

Result: `"a"`

Apply functions to transform list elements:

```gse
=let(
  l, LIST("@push")(1)("@push")(2)("@push")(3),
  doubled, l("@apply")(lambda(x, x * 2)),
  doubled(2)
)
```

Result: `4`

### Methods

Lists support the following methods:

-   `@help`: Display help for LIST.
-   `@kind`: Returns `"list"`.
-   `@push(value)`: Adds a value to the end.
-   `@insert(index, value)`: Inserts a value at a specific index (1-based).
-   `@get(index)`: Gets the value at index (1-based).
-   `@size`: Returns the number of items.
-   `@remove(index)`: Removes the item at index.
-   `@update(index, value)`: Updates the item at index.
-   `@items`: Returns the raw LIST object.
-   `@prepend(list)`: Prepends another [[LIST]].
-   `@apply(fn)`: Applies a function to each element.
-   `@repr`: Returns a string representation like `#list{item1; item2; item3}`.

### See Also

- [[DICT]] - Key-value container
- [[RECORD]] - Can use LIST for ordered data
- [[REPR]] - Display list representations
