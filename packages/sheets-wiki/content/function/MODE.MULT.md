---
name: MODE.MULT
category: statistical
syntax: MODE.MULT(value1, value2)
status: imported
description: The MODE.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368267?hl=en).

The MODE.MULT function returns the most commonly occurring values in a dataset.

### Syntax
```gse
MODE.MULT(value1, value2)
```

| Part | Description |
| --- | --- |
| `value1` | The first value or range to consider when calculating mode. |
| `value2` | [Repeatable] Additional values or ranges to consider when calculating mode. |

### Notes

- `MODE.MULT` returns an error if all values occur only once.
- `MODE.MULT` returns an array formula result.

### Examples

| A | B |
| --- | --- |
| **1** | **Raw formula** | **Output** |
| **2** | `=MODE.MULT({10, 15, 20, 30, 10, 15})` | 10 |
| **3** |  | 15 |

### Related functions

- [[MODE]]: Returns the most commonly occurring value in a dataset.