---
name: GROWTH
category: array
syntax: GROWTH(known_data_y, [known_data_x], [new_data_x], [b])
status: imported
description: Given partial data about an exponential growth trend, fits an ideal exponential growth trend and/or predicts further values.
tags:
  - modified
  - undocumented
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094287?hl=en).

Given partial data about an exponential growth trend, fits an ideal exponential growth trend and/or predicts further values.

### Sample Usage

```gse
GROWTH(B2:B10,A2:A10)
GROWTH(B2:B10,A2:A10,A11:A13)
```

### Syntax

```gse
GROWTH(known_data_y, [known_data_x], [new_data_x], [b])
```

- `known_data_y` - The array or range containing dependent (y) values that are already known, used to curve fit an ideal exponential growth curve.

  + If `known_data_y` is a two-dimensional array or range, `known_data_x` must have the same dimensions or be omitted.
  + If `known_data_y` is a one-dimensional array or range, `known_data_x` may represent multiple independent variables in a two-dimensional array or range. I.e. if `known_data_y` is a single row, each row in `known_data_x` is interpreted as a separated independent value, and analogously if `known_data_y` is a single column.
- `known_data_x` - **[** OPTIONAL - `{1,2,3,...}` with same length as `known_data_y` by default **]** - The values of the independent variable(s) corresponding with `known_data_y`.

  + If `known_data_y` is a one-dimensional array or range, `known_data_x` may represent multiple independent variables in a two-dimensional array or range. I.e. if `known_data_y` is a single row, each row in `known_data_x` is interpreted as a separated independent value, and analogously if `known_data_y` is a single column.
- `new_data_x` - **[** OPTIONAL - same as `known_data_x` by default **]** - The data points to return the `y` values for on the ideal curve fit.

  + The default behavior is to return the ideal curve fit values for the same `x` inputs as the existing data for comparison of known `y` values and their corresponding curve fit estimates.
- `b` - **[** OPTIONAL - `TRUE` by default **]** - Given a general exponential form of `y = b*m^x` for a curve fit, calculates `b` if `TRUE` or forces `b` to be `1` and only calculates the `m` values if `FALSE`.

### Engine compatibility

GROWTH, the exponential-model counterpart of [[TREND]], is implemented by Excel, Google Sheets, and Lattice, with the same orientation caveat as TREND on `formulas`. **HyperFormula, IronCalc, and pycel do not implement GROWTH** (`#NAME?`) — pycel's partial regression support covers only [[LINEST]] and TREND, not GROWTH or [[LOGEST]]. The `formulas` library returns the projected vector in **column orientation** where Excel and Google Sheets give a row, and returns `#REF!` when `new_data_x` is a separately-shaped array it cannot reconcile (assay: LINEST-LOGEST-TREND-GROWTH deep dive; live probe, 2026-07-11). See [[Array-enabled functions]].

| Engine | Behavior |
| --- | --- |
| Google Sheets | Full row of fitted/projected values. |
| Excel | Full row of fitted/projected values. |
| HyperFormula | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| IronCalc | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| formulas | Returns the vector transposed to a **column**; separately-oriented `new_data_x` → `#REF!` (live probe, 2026-07-11). |
| pycel | Not implemented; returns `#NAME?` (live probe, 2026-07-11). |
| Lattice | Matches Excel and Google Sheets. |

### See Also

[[TREND]]: Given partial data about a linear trend, fits an ideal linear trend using the least squares method and/or predicts further values.

[[LOGEST]]: Given partial data about an exponential growth curve, calculates various parameters about the best fit ideal exponential growth curve.

[[LINEST]]: Given partial data about a linear trend, calculates various parameters about the ideal linear trend using the least-squares method.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdExuMkp4OVJWejNBYzBydVA3bFlGbHc&amp;output=html" width="500"></iframe>