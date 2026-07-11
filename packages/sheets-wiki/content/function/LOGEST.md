---
name: LOGEST
category: array
syntax: LOGEST(known_data_y, [known_data_x], [b], [verbose])
status: imported
description: Given partial data about an exponential growth curve, calculates various parameters about the best fit ideal exponential growth curve.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094251?hl=en).

Given partial data about an exponential growth curve, calculates various parameters about the best fit ideal exponential growth curve.

### Sample Usage

```gse
LOGEST(B2:B10,A2:A10)
LOGEST(B2:B10, A2:A10, TRUE, TRUE)
```

### Syntax

```gse
LOGEST(known_data_y, [known_data_x], [b], [verbose])
```

- `known_data_y` - The array or range containing dependent (y) values that are already known, used to curve fit an ideal exponential growth curve.

  + If `known_data_y` is a two-dimensional array or range, `known_data_x` must have the same dimensions or be omitted.
  + If `known_data_y` is a one-dimensional array or range, `known_data_x` may represent multiple independent variables in a two-dimensional array or range. I.e. if `known_data_y` is a single row, each row in `known_data_x` is interpreted as a separated independent value, and analogously if `known_data_y` is a single column.
- `known_data_x` - **[** OPTIONAL - `{1,2,3,...}` with same length as `known_data_y` by default **]** - The values of the independent variable(s) corresponding with `known_data_y`.

  + If `known_data_y` is a one-dimensional array or range, `known_data_x` may represent multiple independent variables in a two-dimensional array or range. I.e. if `known_data_y` is a single row, each row in `known_data_x` is interpreted as a separated independent value, and analogously if `known_data_y` is a single column.
- `b` - **[** OPTIONAL - `TRUE` by default **]** - Given a general exponential form of `y = b*m^x` for a curve fit, calculates `b` if `TRUE` or forces `b` to be `1` and only calculates the `m` values if `FALSE`.
- `verbose` - **[** OPTIONAL - `FALSE` by default **]** - A flag specifying whether to return additional regression statistics or only the calculated coefficient and exponents.

  + If `verbose` is `TRUE`, in addition to the set of exponents for each independent variable and the coefficient `b`, `LOGEST` returns

    - The standard error for each exponent and the coefficient,
    - The coefficient of determination (between 0 and 1, where 1 indicates perfect correlation),
    - Standard error for the dependent variable values,
    - The F statistic, or F-observed value indicating whether the observed relationship between dependent and independent variables is random rather than exponential,
    - The degrees of freedom, useful in looking up F statistic values in a reference table to estimate a confidence level,
    - The regression sum of squares, and
    - The residual sum of squares.

### Notes

- The statistics calculated by `LOGEST` are similar to `LINEST` but use the linear model `ln y = x1 ln m1 + ... + xn ln mn + ln b` for each independent variable `x1 ... xn`. Therefore additional statistics such as the standard error must be compared to the natural logarithms of the `m` and `b` values rather than the values themselves.

### Engine compatibility

LOGEST, the exponential-model sibling of [[LINEST]], is implemented by Excel, Google Sheets, `formulas`, and Lattice, but **not by HyperFormula, IronCalc, or pycel** (`#NAME?`). Unlike LINEST, pycel has **no** LOGEST at all — its partial regression support covers only LINEST and [[TREND]]. Where LOGEST is implemented, the coefficient block agrees to ~15 significant digits, but Lattice does **not** implement the `verbose` statistics block (the 4th argument `TRUE`) and returns `#N/A` for it (assay: LINEST-LOGEST-TREND-GROWTH deep dive; live probe, 2026-07-11). See [[Array-enabled functions]] for how the spilled block is consumed.

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full coefficient and `verbose` stats block. |
| Excel | Full coefficient and `verbose` stats block. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Coefficient and stats block supported (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Coefficient form supported; the `verbose` stats block returns `#N/A`. |

### See Also

[[TREND]]: Given partial data about a linear trend, fits an ideal linear trend using the least squares method and/or predicts further values.

[[LINEST]]: Given partial data about a linear trend, calculates various parameters about the ideal linear trend using the least-squares method.

[[GROWTH]]: Given partial data about an exponential growth trend, fits an ideal exponential growth trend and/or predicts further values.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHlndm16akszdmNuRW9NdnZsMlN6a3c&amp;output=html" width="500"></iframe>