---
name: COVARIANCE.P
category: statistical
syntax: COVAR(data_y, data_x)
status: imported
description: Calculates the covariance of a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093993?hl=en).

Calculates the covariance of a dataset.

### Sample Usage

```gse
COVAR(A2:A100,B2:B100)
```

### Syntax

```gse
COVAR(data_y, data_x)
```

- `data_y` - The range representing the array or matrix of dependent data.
- `data_x` - The range representing the array or matrix of independent data.

### Notes

- Any text encountered in the `value` arguments will be ignored.
- Positive covariance indicates that the independent data and dependent data tend to change together in the same direction; negative indicates that they tend to change together in the opposite direction (i.e. increase in one leads to decrease in the other). The magnitude of covariance is difficult to interpret - use `CORREL` or `PEARSON`, the normalized version of `COVAR`, to gauge strength of linear correlation.

### See Also

[[STEYX]]: Calculates the standard error of the predicted y-value for each x in the regression of a dataset.

[[SLOPE]]: Calculates the slope of the line resulting from linear regression of a dataset.

[[RSQ]]: Calculates the square of r, the Pearson product-moment correlation coefficient of a dataset.

[[INTERCEPT]]: Calculates the y-value at which the line resulting from linear regression of a dataset will intersect the y-axis (x=0).

[[FORECAST]]: Calculates the expected y-value for a specified x based on a linear regression of a dataset.

[[COVAR]]: Calculates the covariance of a dataset.

[[CORREL]]: Calculates r, the Pearson product-moment correlation coefficient of a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDBUUWt1eWhtUzZWODFTN3dGamRNZXc&amp;output=html" width="500"></iframe>