---
tags:
  - function
  - debugging
---

Returns a string representation of the value in Anduin notation.

### Syntax

```gse
REPR(val)
```

### Arguments

-   `val`: The value to represent.

### Return Value

A string representing the value in Anduin Notation.

### Anduin Notation

Anduin Notation is a human-readable format for representing data structures:

-   **Primitives**: Numbers and booleans as-is, strings are quoted.
-   **Arrays**: `[item1; item2; ...]`
-   **Lists**: `#list{item1; item2; ...}`
-   **Dicts**: `#dict{"key1", value1; "key2", value2; ...}`
-   **Records**: `#record:KIND<@trait1, @trait2>{...}` (or custom if `@repr` is defined)
-   **Protocols**: `#protocol<@trait1, @trait2, ...>`

### Examples

Numbers and booleans are represented as-is:

```gse
REPR(123)
```

Result: `123`

Strings are quoted:

```gse
REPR("hello")
```

Result: `"hello"`

Arrays use bracket notation:

```gse
REPR({1; 2; 3})
```

Result: `{ 1; 2; 3 }`

Lists show with the `#list` prefix:

```gse
REPR(LIST("a")("b")("c"))
```

Result: `#list{"a"; "b"; "c"}`

Dicts show key-value pairs:

```gse
REPR(DICT({"a", 1})({"b", 2}))
```

Result: `#dict{"a", 1; "b", 2}`

Records show their kind and traits:

```gse
=let(
  Animal, RECORD("DOG")({"name"}),
  dog, Animal("Spot"),
  REPR(dog)
)
```

Result: `#record:DOG<@kind>{"name", "Spot"}`

### See Also

- [[LIST]] - List container with `@repr` method
- [[DICT]] - Dict container with `@repr` method
- [[RECORD]] - Record type with `@repr` method
- [[PROTOCOL]] - Protocol type with `@repr` method
