---
name: TINV
category: statistical
syntax: T.INV.2T(probability, degrees_freedom)
status: imported
description: The T.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6055811?hl=en).

The T.INV.2T function calculates the inverse of the two-tailed TDIST function.

### Sample Usage

```gse
T.INV.2T(0.35, 1)
T.INV.2T(A1, A2)
```

### Syntax

```gse
T.INV.2T(probability, degrees_freedom)
```

- `probability` - The probability associated with the two-tailed t-distribution.

  + Must be greater than `0` and less than `1`.
- `degrees_freedom` - The number of degrees of freedom.

  + Truncated to an integer in the calculation if a non-integer is provided as an argument.
  + Must be greater than or equal to `1`.

### Notes

- `T.INV.2T` is to be used for the inverse of two-tailed `TDIST` functions.
- `T.INV.2T` is synonymous with `TINV`.
- To calculate the negative inverse of the one-tailed `TDIST` function, use `T.INV`.
- Both arguments to `T.INV.2T` must be numeric or a destination cell whose value is numeric.

### See Also

[[TDIST]]: Calculates the probability for Student's t-distribution with a given input (x).

[[T.INV]]: Calculates the negative inverse of the one-tailed TDIST function.

### Examples

In this example, `T.INV.2T` uses the probability associated with a Student's two-tailed t-distribution and degrees of freedom to return its result.

<iframe height="250" src="https://docs.google.com/spreadsheets/d/1E7mau74HQb9-Zy9QYP-7Luj_MRSEECZP6THnJ3ycL8A/pubhtml?widget=true&amp;headers=false" width="425"></iframe>