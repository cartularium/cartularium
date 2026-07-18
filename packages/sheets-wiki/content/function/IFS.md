---
name: IFS
category: logical
syntax: IFS(condition1, value1, [condition2, value2, …])
status: imported
description: Evaluates multiple conditions and returns a value that corresponds to the first true condition.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/7014145?hl=en).

Evaluates multiple conditions and returns a value that corresponds to the first true condition.

### Sample Usage

```gse
IFS(A1>90, "A", A1>80, "B", A1>70, "C")
IFS({A1:A5} > 3, "bigger", {A1:A5} = 3, "equal")
```

### Syntax

```gse
IFS(condition1, value1, [condition2, value2, …])
```

- `condition1` - The first condition to be evaluated. This can be a boolean, a number, an array, or a reference to any of those.
- `value1` - The returned value if `condition1` is `TRUE`.
- `condition2, value2, …` - Additional conditions and values if the first one is evaluated to be false.

### Notes

- If all conditions are FALSE, `#N/A` is returned.

### See Also

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.

[[SWITCH]]:

Tests an expression against a list of cases and returns the corresponding value of the first matching case, with an optional default value if nothing else is met.

[[MAXIFS]]:

Returns the maximum value in a range of cells, filtered by a set of criteria.

[[MINIFS]]:

Returns the minimum value in a range of cells, filtered by a set of criteria.

### Examples

|  | A | B | C |
| --- | --- | --- | --- |
| 1 | **Score** | **Grade** | **Formula** |
| 2 | 88 | B | =IFS(A2 > 90, "A", A2 > 80, "B") |
| 3 | 92 | A | =IFS(A3 > 90, "A", A3 > 80, "B") |
| 4 | 65 | `#N/A` | =IFS(A4 > 90, "A", A4 > 80, "B") |