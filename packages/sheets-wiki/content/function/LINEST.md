---
name: LINEST
category: array
syntax: LINEST(known_data_y, [known_data_x], [calculate_b], [verbose])
status: imported
description: Given partial data about a linear trend, calculates various parameters about the ideal linear trend using the least-squares method.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094249?hl=en).

Given partial data about a linear trend, calculates various parameters about the ideal linear trend using the least-squares method.

### Sample Usage

```gse
LINEST(B2:B10, A2:A10)
LINEST(B2:B10, A2:A10, FALSE, TRUE)
```

### Syntax

```gse
LINEST(known_data_y, [known_data_x], [calculate_b], [verbose])
```

- `known_data_y` - The array or range containing dependent (y) values that are already known, used to curve fit an ideal linear trend.

  + If `known_data_y` is a two-dimensional array or range, `known_data_x` must have the same dimensions or be omitted.
  + If `known_data_y` is a one-dimensional array or range, `known_data_x` may represent multiple independent variables in a two-dimensional array or range. I.e. if `known_data_y` is a single row, each row in `known_data_x` is interpreted as a separated independent value, and analogously if `known_data_y` is a single column.
- `known_data_x` - **[** OPTIONAL - `{1,2,3,...}` with same length as `known_data_y` by default **]** - The values of the independent variable(s) corresponding with `known_data_y`.

  + If `known_data_y` is a one-dimensional array or range, `known_data_x` may represent multiple independent variables in a two-dimensional array or range. I.e. if `known_data_y` is a single row, each row in `known_data_x` is interpreted as a separated independent value, and analogously if `known_data_y` is a single column.

    **Note**: For multiple independent variables, the order of the output parameters are corresponding to the input variables in reverse.
- `calculate_b` - **[** OPTIONAL - `TRUE` by default **]** - Given a linear form of `y = m*x+b`, calculates the y-intercept (`b`) if `TRUE`. Otherwise, forces `b` to be `0` and only calculates the `m` values if `FALSE`, i.e. forces the curve fit to pass through the origin.
- `verbose` - **[** OPTIONAL - `FALSE` by default **]** - A flag specifying whether to return additional regression statistics or only the linear coefficients and the y-intercept (default).

  + If `verbose` is `TRUE`, in addition to the set of linear coefficients for each independent variable and the `y`-intercept, `LINEST` returns

    - The standard error for each coefficient and the intercept,
    - The coefficient of determination (between 0 and 1, where 1 indicates perfect correlation),
    - Standard error for the dependent variable values,
    - The F statistic, or F-observed value indicating whether the observed relationship between dependent and independent variables is random rather than linear,
    - The degrees of freedom, useful in looking up F statistic values in a reference table to estimate a confidence level,
    - The regression sum of squares, and
    - The residual sum of squares.

### Engine compatibility

LINEST is a dynamic-array regression function and the open engines handle it unevenly. Excel, Google Sheets, and Lattice implement the full spilled output. **HyperFormula and IronCalc do not implement it at all** (`#NAME?`). pycel implements only a degenerate form: it returns the **first coefficient (the slope) as a single scalar** and drops the rest of the array — treat pycel's LINEST output as unusable for the coefficient block. Lattice supports the plain coefficient form but **not the `verbose` statistics block** (the 4th argument `TRUE`), returning `#N/A` there. Even among Excel, Google Sheets, and `formulas`, which all produce the 5-row stats block, a **perfect-fit** line is degenerate: the F-statistic cell is 0/0, and Excel returns `#NUM!` while Google Sheets and `formulas` return a meaningless finite huge number (~1e31, differing per engine). Do not rely on the F/df cells cross-engine when the fit is exact (assay: LINEST-LOGEST-TREND-GROWTH deep dive; live probe, 2026-07-11). The coefficient values themselves agree only to ~15 significant digits; compare with tolerance. See [[Array-enabled functions]] for how the spill is consumed.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full coefficient and `verbose` stats block; perfect-fit F-statistic → a huge finite number. |
| Excel | Full block; perfect-fit F-statistic → `#NUM!`. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Coefficient block matches Excel; perfect-fit F-statistic → a different huge finite number (live probe, 2026-07-11). |
| pycel | Degenerate: returns only the first coefficient (slope) as a scalar (live probe, 2026-07-11). |
| Lattice | Coefficient form supported; the `verbose` stats block returns `#N/A`. |

### See Also

[[TREND]]: Given partial data about a linear trend, fits an ideal linear trend using the least squares method and/or predicts further values.

[[LOGEST]]: Given partial data about an exponential growth curve, calculates various parameters about the best fit ideal exponential growth curve.

[[GROWTH]]: Given partial data about an exponential growth trend, fits an ideal exponential growth trend and/or predicts further values.

### Examples

<iframe height="600" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdGQ2b25TeWdsSkk3UHRVSjRlUktqQUE&amp;output=html" width="1000"></iframe>