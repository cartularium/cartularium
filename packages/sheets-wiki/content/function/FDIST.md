---
name: FDIST
category: statistical
syntax: F.DIST.RT(x, degrees_freedom1, degrees_freedom2)
status: imported
description: The F.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/6055799?hl=en).

The F.DIST.RT function calculates the right-tailed F probability distribution (degree of diversity) for two data sets with given input x. Alternately called Fisher-Snedecor distribution or Snedecor's F distribution.

### Sample Usage

```gse
F.DIST.RT(15.35, 7, 6)
F.DIST.RT(A2, B2, C2)
```

### Syntax

```gse
F.DIST.RT(x, degrees_freedom1, degrees_freedom2)
```

- `x` - The input to the F probability distribution function. The value at which to evaluate the function.

  + Must be a positive number.
- `degrees_freedom1` - The numerator of the number of degrees of freedom.
- `degrees_freedom2` - The denominator of the number of degrees of freedom.

### Notes

- Both `degrees_freedom1` and `degrees_freedom2` are truncated to an integer in the calculation if a non-integer is provided as an argument.
- Both `degrees_freedom1` and `degrees_freedom2` must be greater than `1` and may not exceed `10^10`.
- All arguments must be numeric.
- `F.DIST.RT` is synonymous with `FDIST`.

### See Also

[[F.DIST]]: Calculates the left-tailed F probability distribution (degree of diversity) for two data sets with given input x. Alternately called Fisher-Snedecor distribution or Snedecor's F distribution.

[[TDIST]]: Calculates the probability for Student's t-distribution with a given input (x).

### Examples

In this example, suppose you want to determine whether the data for hours spent studying each week have different variability for engineering majors at University A than at University B. We will evaluate the curve of F Distribution when `x` equals `15.35`, and use `7` and `6` for `degrees_freedom1` and `degrees_freedom2` respectively.

<iframe height="325" src="https://docs.google.com/spreadsheets/d/1TAcMaA9F-2WmZIvn7cZyCqewve7-bkVfSF4AH0ZTVHU/pubhtml?widget=true&amp;headers=false" width="460"></iframe>