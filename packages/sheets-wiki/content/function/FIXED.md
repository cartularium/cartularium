---
name: FIXED
category: text
syntax: FIXED(number, [number_of_places], [suppress_separator])
status: imported
description: Formats a number with a fixed number of decimal places.
tags: [modified, undocumented]
---
> [!INFO]
> This page was originally generated from [official documentation](https://support.google.com/docs/answer/3094075?hl=en).

Formats a number with a fixed number of decimal places.

### Sample Usage

```gse
FIXED(3.141592653,2)
FIXED(966364281,4,1)
```

### Syntax

```gse
FIXED(number, [number_of_places], [suppress_separator])
```

- `number` - The number to format.
- `number_of_places` - **[** OPTIONAL **]**- The number of decimal places to display in the result.

  + If `number` has fewer than `number_of_places` significant digits, zeros will be appended. If it has greater than `number_of_places` significant digits, `number` will be rounded to the correct `number_of_places` rather than truncated.
- `suppress_separator` - **[** OPTIONAL - `0` by default **]** - Whether or not to suppress the thousands separator used in some locales (e.g. `1,000` becomes `1000`). Separators will be present if this value is 0 or omitted, and absent otherwise.

### Engine compatibility

`FIXED` returns a **text string**. The rounded value agrees among implementers; the rendering diverges at one edge — negative decimals (rounding to the left of the decimal point). Testing `=FIXED(1234.567, -1)` (round to the nearest 10 → 1230):

| Engine | Behavior |
| --- | --- |
| Google Sheets | `"1,230"` — no fractional part. |
| Excel | `"1,230"`. |
| formulas | `"1,230"` — `FIXED` is implemented here, unlike its sibling `DOLLAR` (live probe, 2026-07-11). |
| Lattice | `"1,230.0"` — appends a spurious trailing `.0` even though `number_of_places` is negative (assay: FIXED/fixed-negative-decimals). |
| HyperFormula | `#NAME?` — not implemented (live probe, 2026-07-11). |
| IronCalc | `#NAME?` — not implemented (live probe, 2026-07-11). |
| pycel | `#NAME?` — not implemented (live probe, 2026-07-11). |

> [!INFO]
> `FIXED` is unavailable in HyperFormula, IronCalc, and pycel. Lattice's trailing-`.0` on negative decimals will break a downstream string comparison against Excel/Google Sheets output.

### Examples

<iframe height="300" src="https://docs.google.com/spreadsheet/pub?key=0As3tAuweYU9QdDFDOWpRenlGRFlyS2owZjZOQ3hvNlE&amp;output=html" width="500"></iframe>