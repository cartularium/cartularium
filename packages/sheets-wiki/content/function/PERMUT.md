---
name: PERMUT
category: statistical
syntax: PERMUT(n, k)
status: imported
description: Returns the number of ways to choose some number of objects from a pool of a given size of objects, considering order.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094036?hl=en).

Returns the number of ways to choose some number of objects from a pool of a given size of objects, considering order.

### Sample Usage

```gse
PERMUT(4,2)
PERMUT(A2,B2)
```

### Syntax

```gse
PERMUT(n, k)
```

- `n` - The size of the pool of objects to choose from.
- `k` - The number of objects to choose.

### Notes

- `PERMUT` is the standard combinatorics function typically notated nPk. This is similar to `COMBIN` except in permutations, the order of selection is considered rather than simply the resultant selected subset.

### See Also

[[MULTINOMIAL]]: Returns the factorial of the sum of values divided by the product of the values' factorials.

[[FACTDOUBLE]]: Returns the "double factorial" of a number.

[[FACT]]: The FACT function returns the factorial of a number.

[[COMBIN]]: The COMBIN function returns the number of ways to choose some number of objects from a pool of a given size of objects.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdE1BdEJLWmtKYlAtWUhyd29KVzA3TXc&amp;output=html" width="500"></iframe>