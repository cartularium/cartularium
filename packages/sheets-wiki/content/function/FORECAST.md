---
name: FORECAST
category: statistical
syntax: FORECAST(x, data_y, data_x)
status: imported
description: Calculates the expected y-value for a specified x based on a linear regression of a dataset.
tags: []
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094000?hl=en).

Calculates the expected y-value for a specified x based on a linear regression of a dataset.

### Sample Usage

```gse
FORECAST(A1,A2:A100,B2:B100)
```

### Syntax

```gse
FORECAST(x, data_y, data_x)
```

- `x` - The value on the x-axis to forecast.
- `data_y` - The range representing the array or matrix of dependent data.
- `data_x` - The range representing the array or matrix of independent data.

### Notes

- Any text encountered in the `value` arguments will be ignored.

### See Also

[[STEYX]]: Calculates the standard error of the predicted y-value for each x in the regression of a dataset.

[[SLOPE]]: Calculates the slope of the line resulting from linear regression of a dataset.

[[RSQ]]: Calculates the square of r, the Pearson product-moment correlation coefficient of a dataset.

[[PEARSON]]: Calculates r, the Pearson product-moment correlation coefficient of a dataset.

[[INTERCEPT]]: Calculates the y-value at which the line resulting from linear regression of a dataset will intersect the y-axis (x=0).

[[COVAR]]: Calculates the covariance of a dataset.

[[CORREL]]: Calculates r, the Pearson product-moment correlation coefficient of a dataset.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdF8wb1BTOXhjZHpNTHVOV2ZYbFBBZXc&amp;output=html" width="500"></iframe>