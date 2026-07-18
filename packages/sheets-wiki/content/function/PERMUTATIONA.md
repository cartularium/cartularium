---
name: PERMUTATIONA
category: statistical
syntax: PERMUTATIONA(number, number_chosen)
status: imported
description: The PERMUTATIONA function returns the number of permutations for selecting a group of objects (with replacement) from a total number of objects.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/9368324?hl=en).

The PERMUTATIONA function returns the number of permutations for selecting a group of objects (with replacement) from a total number of objects. Mathematically, it is equivalent to raising the total number of objects to the number of objects being chosen.

### Syntax
```gse
PERMUTATIONA(number, number_chosen)
```

| Part | Description |
| --- | --- |
| `number` | Required. The total number of objects to choose from. |
| `number_chosen` | Required. The number of objects to choose from number. Must be less than or equal to number. |

### Notes

- Both arguments are truncated to integers.
- If the number is zero, `PERMUTATIONA` returns a #NUM.

### Examples

Result for A1=`PERMUTATIONA(3, 2)`, A2=`PERMUTATIONA(3.2, 2)`, A3= `PERMUTATIONA(3, 2.4)`.

**Note:** All functions return the same result due to truncation.

| A | B |
| --- | --- |
| **1** | **PERMUTATIONA** | **Formula** |
| **2** | 99 | `=PERMUTATIONA(3, 2)` |
| **3** | 9 |  |
| **4** | 9 | `=PERMUTATIONA(3.2, 2.3)` |

### Related functions

- [[PERMUT]]: Returns the number of ways to choose some number of objects from a pool of a given size of objects, considering order.
- [[COMBIN]]: The COMBIN function returns the number of ways to choose some number of objects from a pool of a given size of objects.
- [[COMBINA]]: The COMBINA function returns the number of ways to choose some number of objects from a pool of a given size of objects, including ways to choose the same object multiple times (also known as choosing with replacement).