---
name: IFERROR
category: logical
syntax: IFERROR(value, [value_if_error])
status: imported
description: Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3093304?hl=en).

Returns the first argument if it is not an error value, otherwise returns the second argument if present, or a blank if the second argument is absent.

### Examples

[Make a copy](https://docs.google.com/spreadsheets/d/1caTrAGwfvNVVS-ig0ATtUIpIYlJve59o3qorg6cJC3M/copy)

**Note**: Each example is in its own tab.

### Sample Usage

```gse
IFERROR(A1,"Error in cell A1")
IFERROR(A2)
```

### General usage

Returns a blank if `test` is an error and `value` is null; returns the `value` if `test` is an error and `value` is not null; returns the `test` if it is not an error.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHNiVURCa0IxOEREZThIV2ZreTF2SXc&amp;single=true&amp;gid=0&amp;output=html&amp;widget=true" width="500"></iframe>

### Unit price

Returns the value "0" when calculating the `unit price` where `Quantity` is null.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHNiVURCa0IxOEREZThIV2ZreTF2SXc&amp;single=true&amp;gid=2&amp;output=html&amp;widget=true" width="500"></iframe>

### Student grades

Returns the specified error message when searching the student `Grade` where `Student ID` does not exist.

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdHNiVURCa0IxOEREZThIV2ZreTF2SXc&amp;single=true&amp;gid=1&amp;output=html&amp;widget=true" width="500"></iframe>

### Syntax

```gse
IFERROR(value, [value_if_error])
```

- `value` - The value to return if `value` itself is not an error.
- `value_if_error` - **[** OPTIONAL - blank by default **]** - The value the function returns if `value` is an error.

### Notes

- `IFERROR(exp1,exp2)` is logically equivalent to `IF(NOT(ISERROR(exp1)),exp1,exp2)`. Ensure that this is the desired behavior.

### Engine compatibility

The **scalar** behavior — catch any error and return the fallback, pass a clean value through — is fully portable: `=IFERROR(1/0, "err")` is `"err"` and `=IFERROR(42, "err")` is `42` on Excel, Google Sheets, HyperFormula, IronCalc, formulas, and Lattice (assay: IFERROR/iferror-catches-div-0, iferror-passes-clean-value). The divergence is over **array arguments**. Testing `=IFERROR(10/{1,0,2}, -1)`:

| Engine | Behavior |
| --- | --- |
| Google Sheets | Scalar `10` — `IFERROR` does *not* map over the array argument without `ARRAYFORMULA`; it collapses to the first element and the error branch never surfaces (live gsheets probe, 2026-07-11). |
| Excel | Spills `{10, -1, 5}` — broadcasts element-wise, replacing only the error position (live Excel probe, 2026-07-11). |
| HyperFormula | Broadcasts element-wise, like Excel (live probe, 2026-07-11). |
| formulas | Broadcasts element-wise (live probe, 2026-07-11). |
| Lattice | Broadcasts element-wise. |
| IronCalc | `#N/IMPL!` — `IFERROR` over an array argument is not implemented (live probe, 2026-07-11). |
| pycel | Scalar `IFERROR` works, but a `/` (or any operator) inside an argument trips a front-end limitation and returns `#NAME?`, so `=IFERROR(1/0, "err")` fails there for a harness reason, not a missing function (live probe, 2026-07-11). |

> [!INFO]
> To catch errors across an array in Google Sheets, wrap the whole expression in `ARRAYFORMULA` — without it, `IFERROR` sees only the first element. This element-wise-versus-scalar difference is a silent correctness hazard when moving array formulas between Excel and Google Sheets.

### See Also

[[ISNA]]: Checks whether a value is the error `#N/A`.

[[ISERROR]]: Checks whether a value is an error.

[[ISERR]]: Checks whether a value is an error other than `#N/A`.

[[IF]]: Returns one value if a logical expression is `TRUE` and another if it is `FALSE`.