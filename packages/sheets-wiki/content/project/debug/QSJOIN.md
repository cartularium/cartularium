---
tags:
  - function
  - utility
---

Joins a vector of values into a single string, bypassing Google Sheets' 50,000 character limit for most string operations.

### Syntax

```gse
QSJOIN(delimiter, vector)
```

### Arguments

-   `delimiter`: The separator to place between values. Note that due to how `QUERY` works, the delimiter will have an additional space after it.
-   `vector`: A vector of values to join.

### Return Value

A single string with all values joined by the delimiter.

### Usage

Basic string joining:

```gse
=QSJOIN(",", {"apple"; "banana"; "cherry"})
```

Result: `"apple, banana, cherry"`

Joining without delimiter:

```gse
=QSJOIN(, {"Hello"; "World"})
```

Result: `"Hello World"`

Joining large strings:

```gse
=ArrayFormula(let(
  large_array, if(sequence(1000),rept("a", 1000)),
  QSJOIN(",", large_array)
))
```

This would create a string with 1000 comma-separated 1000-character strings, totaling 1001998 characters.

### See Also

- [[REPR]] - Uses QSJOIN to build string representations
