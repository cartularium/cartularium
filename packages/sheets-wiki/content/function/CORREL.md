---
name: CORREL
category: statistical
syntax: CORREL(data_y, data_x)
status: imported
description: Calculates r, the Pearson product-moment correlation coefficient of a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093990?hl=en).

Calculates r, the Pearson product-moment correlation coefficient of a dataset.

### Sample Usage

```gse
CORREL(A2:A100,B2:B100)
```

### Syntax

```gse
CORREL(data_y, data_x)
```

- `data_y` - The range representing the array or matrix of dependent data.
- `data_x` - The range representing the array or matrix of independent data.

### Notes

- Any text encountered in the `value` arguments will be ignored.
- `CORREL` is synonymous with `PEARSON`.

### See Also

[[STEYX]]: Calculates the standard error of the predicted y-value for each x in the regression of a dataset.

[[SLOPE]]: Calculates the slope of the line resulting from linear regression of a dataset.

[[RSQ]]: Calculates the square of r, the Pearson product-moment correlation coefficient of a dataset.

[[PEARSON]]: Calculates r, the Pearson product-moment correlation coefficient of a dataset.

[[INTERCEPT]]: Calculates the y-value at which the line resulting from linear regression of a dataset will intersect the y-axis (x=0).

[[FORECAST]]: Calculates the expected y-value for a specified x based on a linear regression of a dataset.

[[FISHERINV]]: Returns the inverse Fisher transformation of a specified value.

[[FISHER]]: Returns the Fisher transformation of a specified value.

[[COVAR]]: Calculates the covariance of a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDVob1FjSXdGdWlfU3NFRWZCaUU4c2c&amp;output=html" width="500"></iframe>